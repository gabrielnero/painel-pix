import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, status = 'completed' } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 });
    }

    // Simular dados do webhook do PrimePag
    const secretKey = 'b2c2a2b5-96ac-4c14-83fb-f3474501a84f';
    const referenceCode = `P${Date.now()}`;
    const idempotentId = paymentId;
    const valueCents = 10000; // R$ 100,00 em centavos

    // Gerar hash MD5
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
        status: status,
        end_to_end: null,
        receiver_name: 'Teste Usuario',
        receiver_document: '12345678901',
        registration_date: new Date().toISOString(),
        payment_date: status === 'completed' ? new Date().toISOString() : null,
        cancellation_date: null,
        cancellation_reason: null,
        receipt_url: null
      },
      md5: md5Hash
    };

    console.log('Enviando webhook de teste:', webhookPayload);

    // Enviar para o endpoint do webhook
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/webhook/primepag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Webhook de teste enviado',
      payload: webhookPayload,
      webhookResponse: webhookResult
    });

  } catch (error) {
    console.error('Erro no teste de webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 