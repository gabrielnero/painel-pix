import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { User, Payment, WalletTransaction } from '@/lib/models';

// Interface para Notificação de QRCode (quando QRCode é pago)
interface QRCodeWebhookMessage {
  notification_type: 'pix_qrcode' | 'pix_static_qrcode';
  message: {
    reference_code: string;
    value_cents: number;
    content: string;
    status: 'error' | 'awaiting_payment' | 'paid' | 'canceled';
    generator_name: string;
    generator_document: string;
    payer_name?: string;
    payer_document?: string;
    registration_date: string;
    payment_date?: string;
    end_to_end?: string;
  };
  md5: string;
}

// Interface para Notificação de Pagamento (alterações de status)
interface PaymentWebhookMessage {
  notification_type: 'pix_payment';
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

type WebhookMessage = QRCodeWebhookMessage | PaymentWebhookMessage;

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
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Verificar secret key
    const secretKey = process.env.PRIMEPAG_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ Webhook: PRIMEPAG_SECRET_KEY não configurada');
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Verificar assinatura MD5 baseada no tipo de notificação
    let signatureString: string;
    let expectedSignature: string;

    if (notification_type === 'pix_qrcode' || notification_type === 'pix_static_qrcode') {
      // Para QRCode: qrcode.{reference_code}.{end_to_end}.{value_cents}.{secret_key}
      const qrMessage = message as QRCodeWebhookMessage['message'];
      signatureString = `qrcode.${qrMessage.reference_code}.${qrMessage.end_to_end || ''}.${qrMessage.value_cents}.${secretKey}`;
    } else if (notification_type === 'pix_payment') {
      // Para Payment: payment.{reference_code}.{idempotent_id}.{value_cents}.{secret_key}
      const payMessage = message as PaymentWebhookMessage['message'];
      signatureString = `payment.${payMessage.reference_code}.${payMessage.idempotent_id}.${payMessage.value_cents}.${secretKey}`;
    } else {
      console.log(`ℹ️ Webhook: Tipo de notificação ${notification_type} não suportado`);
      return new NextResponse('OK', { status: 200 });
    }

    expectedSignature = crypto
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
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('✅ Webhook: Assinatura MD5 válida');

    // Processar o webhook
    console.log('📊 Processando webhook...');
    await connectToDatabase();

    // Buscar pagamento pelo reference_code
    const payment = await Payment.findOne({ referenceCode: message.reference_code });
    if (!payment) {
      console.error(`❌ Webhook: Pagamento não encontrado no banco de dados - Reference Code: ${message.reference_code}`);
      return new NextResponse('Payment Not Found', { status: 404 });
    }

    console.log(`📋 Pagamento encontrado:`, {
      id: payment._id,
      userId: payment.userId,
      amount: payment.amount,
      currentStatus: payment.status,
      referenceCode: payment.referenceCode,
      description: payment.description
    });

    // Mapear status baseado no tipo de notificação
    let normalizedStatus: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment';
    let paymentDate: string | undefined;

    if (notification_type === 'pix_qrcode' || notification_type === 'pix_static_qrcode') {
      const qrMessage = message as QRCodeWebhookMessage['message'];
      
      // Mapeamento para QRCode
      const qrStatusMapping: { [key: string]: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment' } = {
        'error': 'cancelled',
        'awaiting_payment': 'awaiting_payment',
        'paid': 'paid',
        'canceled': 'cancelled'
      };
      
      normalizedStatus = qrStatusMapping[qrMessage.status] || 'pending';
      paymentDate = qrMessage.payment_date;
      
    } else if (notification_type === 'pix_payment') {
      const payMessage = message as PaymentWebhookMessage['message'];
      
      // Mapeamento para Payment
      const payStatusMapping: { [key: string]: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment' } = {
        'pending': 'pending',
        'awaiting_payment': 'awaiting_payment',
        'paid': 'paid',
        'completed': 'paid',
        'expired': 'expired',
        'cancelled': 'cancelled'
      };
      
      normalizedStatus = payStatusMapping[payMessage.status] || 'pending';
      paymentDate = payMessage.payment_date;
    } else {
      return new NextResponse('OK', { status: 200 });
    }

    const oldStatus = payment.status;
    payment.status = normalizedStatus;
    
    if (paymentDate) {
      payment.paidAt = new Date(paymentDate);
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
          description: `Pagamento PIX aprovado via webhook (${notification_type}) - ${payment.description}`,
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

    // Retornar HTTP 200 conforme documentação PrimePag
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 