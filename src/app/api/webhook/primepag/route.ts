import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { User, Payment, WalletTransaction } from '@/lib/models';

interface WebhookMessage {
  notification_type: string;
  message: {
    value_cents: number;
    reference_code: string;
    idempotent_id: string;
    pix_key?: string;
    pix_key_type?: string;
    status: 'completed' | 'expired' | 'cancelled' | 'pending' | 'awaiting_payment';
    end_to_end?: string | null;
    receiver_name?: string;
    receiver_document?: string;
    registration_date?: string;
    payment_date?: string;
    cancellation_date?: string | null;
    cancellation_reason?: string | null;
    receipt_url?: string | null;
  };
  md5: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WebhookMessage;
    const { notification_type, message, md5 } = body;

    console.log('=== WEBHOOK PRIMEPAG RECEBIDO ===');
    console.log('Tipo de notificação:', notification_type);
    console.log('Dados da mensagem:', JSON.stringify(message, null, 2));
    console.log('MD5 recebido:', md5);

    if (!message || !md5) {
      console.error('❌ Webhook: Dados inválidos - message ou md5 ausentes');
      return NextResponse.json(
        { error: 'Dados do webhook inválidos' },
        { status: 400 }
      );
    }

    // Verificar se é uma notificação de pagamento PIX
    if (notification_type !== 'pix_payment') {
      console.log(`ℹ️ Webhook: Tipo de notificação ${notification_type} ignorado (esperado: pix_payment)`);
      return NextResponse.json({ success: true, message: 'Tipo de notificação ignorado' });
    }

    // Verificar assinatura do webhook conforme documentação PrimePag
    const secretKey = process.env.PRIMEPAG_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ Webhook: PRIMEPAG_SECRET_KEY não configurada');
      return NextResponse.json(
        { error: 'Configuração inválida' },
        { status: 500 }
      );
    }

    // Hash MD5 conforme documentação: payment.{reference_code}.{idempotent_id}.{value_cents}.{secret_key}
    const signatureString = `payment.${message.reference_code}.${message.idempotent_id}.${message.value_cents}.${secretKey}`;
    const expectedSignature = crypto
      .createHash('md5')
      .update(signatureString)
      .digest('hex');

    console.log('🔐 Verificando assinatura MD5:');
    console.log('String para hash:', signatureString.replace(secretKey, '[SECRET_KEY]'));
    console.log('MD5 esperado:', expectedSignature);
    console.log('MD5 recebido:', md5);
    console.log('Assinatura válida:', md5 === expectedSignature);

    if (md5 !== expectedSignature) {
      console.error('❌ Webhook: Assinatura MD5 inválida');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    console.log('✅ Webhook: Assinatura MD5 válida');

    // Processar o webhook
    console.log('📊 Processando webhook...');
    await connectToDatabase();

    const payment = await Payment.findOne({ referenceCode: message.reference_code });
    if (!payment) {
      console.error(`❌ Webhook: Pagamento não encontrado no banco de dados - Reference Code: ${message.reference_code}`);
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📋 Pagamento encontrado:`, {
      id: payment._id,
      userId: payment.userId,
      amount: payment.amount,
      currentStatus: payment.status,
      referenceCode: payment.referenceCode,
      description: payment.description
    });

    // Mapear status da PrimePag para nosso sistema
    const statusMapping: { [key: string]: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment' } = {
      'pending': 'pending',
      'awaiting_payment': 'awaiting_payment',
      'paid': 'paid',
      'completed': 'paid',
      'expired': 'expired',
      'cancelled': 'cancelled'
    };

    const normalizedStatus = statusMapping[message.status] || 'pending';
    const oldStatus = payment.status;
    payment.status = normalizedStatus;
    
    if (message.payment_date) {
      payment.paidAt = new Date(message.payment_date);
    }
    
    // Salvar as alterações no pagamento
    await payment.save();
    console.log(`Pagamento ${message.reference_code} atualizado: ${oldStatus} -> ${normalizedStatus}`);

    // Se o pagamento foi aprovado e ainda não foi creditado, creditar na carteira do usuário
    if (normalizedStatus === 'paid' && oldStatus !== 'paid') {
      const user = await User.findById(payment.userId);
      if (user) {
        // Calcular valor a ser creditado (80% do valor original)
        const creditAmount = (message.value_cents / 100) * 0.8;
        const balanceBefore = user.balance;
        
        user.balance += creditAmount;
        user.totalEarnings += creditAmount;
        await user.save();

        // Criar transação na carteira
        await WalletTransaction.create({
          userId: user._id,
          type: 'credit',
          amount: creditAmount,
          description: `Pagamento PIX aprovado via webhook - ${payment.description}`,
          paymentId: payment._id,
          balanceBefore: balanceBefore,
          balanceAfter: user.balance
        });

        console.log(`✅ Webhook: Creditado R$ ${creditAmount.toFixed(2)} para usuário ${user.username} (Pagamento: ${message.reference_code})`);
      } else {
        console.error(`❌ Webhook: Usuário não encontrado para pagamento ${message.reference_code}`);
      }
    } else if (normalizedStatus === 'paid' && oldStatus === 'paid') {
      console.log(`ℹ️ Webhook: Pagamento ${message.reference_code} já estava pago, ignorando duplicação`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 