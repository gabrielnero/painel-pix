import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Payment, User } from '@/lib/models';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount = 100, description = 'Teste de pagamento' } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Conectar ao banco
    await connectToDatabase();

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log(`Iniciando teste para usuário: ${user.username} (${userId})`);
    console.log(`Saldo inicial: R$ ${user.balance.toFixed(2)}`);

    // 1. Criar um pagamento simulado no banco
    const referenceCode = `TEST_${Date.now()}`;
    const idempotentId = `TEST_${userId}_${Date.now()}`;
    
    const payment = new Payment({
      userId: userId,
      amount: amount,
      description: description,
      status: 'pending',
      pixCopiaECola: 'teste_pix_code',
      qrCodeImage: 'teste_qr_image',
      referenceCode: referenceCode,
      idempotentId: idempotentId,
      expiresAt: new Date(Date.now() + 3600000), // 1 hora
      createdAt: new Date()
    });

    await payment.save();
    console.log(`Pagamento criado: ${payment._id} - Ref: ${referenceCode}`);

    // 2. Simular webhook do PrimePag
    const secretKey = 'b2c2a2b5-96ac-4c14-83fb-f3474501a84f';
    const valueCents = Math.round(amount * 100);

    const md5Hash = crypto
      .createHash('md5')
      .update(`payment.${referenceCode}.${idempotentId}.${valueCents}.${secretKey}`)
      .digest('hex');

    const webhookPayload = {
      notification_type: 'pix_payment',
      message: {
        value_cents: valueCents,
        reference_code: referenceCode,
        idempotent_id: idempotentId,
        pix_key: '11999999999',
        pix_key_type: 'phone',
        status: 'completed',
        end_to_end: null,
        receiver_name: user.username,
        receiver_document: '12345678901',
        registration_date: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        cancellation_date: null,
        cancellation_reason: null,
        receipt_url: null
      },
      md5: md5Hash
    };

    console.log('Enviando webhook simulado...');

    // 3. Enviar webhook para nosso endpoint
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/webhook/primepag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResult = await webhookResponse.json();
    console.log('Resultado do webhook:', webhookResult);

    // 4. Verificar estado final
    const updatedUser = await User.findById(userId);
    const updatedPayment = await Payment.findById(payment._id);

    const creditAmount = amount * 0.8;
    const feeAmount = amount * 0.2;

    return NextResponse.json({
      success: true,
      message: 'Teste completo executado',
      results: {
        user: {
          id: userId,
          username: user.username,
          balanceBefore: user.balance,
          balanceAfter: updatedUser?.balance || 0,
          creditExpected: creditAmount,
          creditReceived: (updatedUser?.balance || 0) - user.balance
        },
        payment: {
          id: payment._id,
          referenceCode: referenceCode,
          amount: amount,
          statusBefore: 'pending',
          statusAfter: updatedPayment?.status || 'pending',
          fee: feeAmount
        },
        webhook: {
          sent: webhookPayload,
          response: webhookResult
        }
      }
    });

  } catch (error) {
    console.error('Erro no teste completo:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 