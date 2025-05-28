import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { User, Payment } from '@/lib/models';

interface WebhookMessage {
  notification_type: string;
  message: {
    reference_code: string;
    idempotent_id: string;
    value_cents: number;
    status: 'completed' | 'expired' | 'cancelled';
    paid_at?: string;
    payment_date?: string;
  };
  md5: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WebhookMessage;
    const { notification_type, message, md5 } = body;

    console.log('Webhook recebido:', { notification_type, message, md5 });

    if (!message || !md5) {
      return NextResponse.json(
        { error: 'Dados do webhook inválidos' },
        { status: 400 }
      );
    }

    // Verificar assinatura do webhook conforme documentação PrimePag
    const secretKey = process.env.PRIMEPAG_SECRET_KEY;
    if (!secretKey) {
      console.error('PRIMEPAG_SECRET_KEY não configurada');
      return NextResponse.json(
        { error: 'Configuração inválida' },
        { status: 500 }
      );
    }

    // Hash MD5 conforme documentação: payment.{reference_code}.{idempotent_id}.{value_cents}.{secret_key}
    const expectedSignature = crypto
      .createHash('md5')
      .update(`payment.${message.reference_code}.${message.idempotent_id}.${message.value_cents}.${secretKey}`)
      .digest('hex');

    console.log('Verificando assinatura:', {
      received: md5,
      expected: expectedSignature,
      string: `payment.${message.reference_code}.${message.idempotent_id}.${message.value_cents}.${secretKey}`
    });

    if (md5 !== expectedSignature) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    // Processar o webhook
    await connectToDatabase();

    const payment = await Payment.findOne({ referenceCode: message.reference_code });
    if (!payment) {
      console.error('Pagamento não encontrado:', message.reference_code);
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status do pagamento (converter 'completed' para 'paid')
    const normalizedStatus = message.status === 'completed' ? 'paid' : message.status;
    payment.status = normalizedStatus;
    
    if (message.paid_at || message.payment_date) {
      payment.paidAt = new Date(message.paid_at || message.payment_date!);
    }
    await payment.save();

    // Se o pagamento foi aprovado, creditar na carteira do usuário
    if (normalizedStatus === 'paid') {
      const user = await User.findById(payment.userId);
      if (user) {
        // Calcular valor a ser creditado (80% do valor original)
        const creditAmount = (message.value_cents / 100) * 0.8;
        
        user.balance += creditAmount;
        user.totalEarnings += creditAmount;
        await user.save();

        console.log(`Creditado R$ ${creditAmount.toFixed(2)} para usuário ${user.username}`);
      }
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