import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { referenceCode, valueInCents } = await request.json();

    if (!referenceCode || !valueInCents) {
      return NextResponse.json(
        { error: 'referenceCode e valueInCents são obrigatórios' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PRIMEPAG_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'PRIMEPAG_SECRET_KEY não configurada' },
        { status: 500 }
      );
    }

    // Criar dados de teste conforme documentação PrimePag
    const testMessage = {
      value_cents: valueInCents,
      reference_code: referenceCode,
      idempotent_id: `TEST-${Date.now()}`,
      pix_key: "09354532454",
      pix_key_type: "cpf",
      status: "completed",
      end_to_end: null,
      receiver_name: "Usuário Teste",
      receiver_document: "00000000000",
      registration_date: new Date().toISOString(),
      payment_date: new Date().toISOString(),
      cancellation_date: null,
      cancellation_reason: null,
      receipt_url: null
    };

    // Gerar MD5 conforme documentação
    const signatureString = `payment.${testMessage.reference_code}.${testMessage.idempotent_id}.${testMessage.value_cents}.${secretKey}`;
    const md5 = crypto
      .createHash('md5')
      .update(signatureString)
      .digest('hex');

    const webhookPayload = {
      notification_type: "pix_payment",
      message: testMessage,
      md5: md5
    };

    console.log('🧪 Enviando webhook de teste:', JSON.stringify(webhookPayload, null, 2));

    // Enviar para o próprio webhook
    const webhookUrl = `${request.nextUrl.origin}/api/webhook/primepag`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Webhook de teste enviado',
      webhookResponse: {
        status: response.status,
        data: result
      },
      testPayload: webhookPayload
    });

  } catch (error) {
    console.error('Erro no teste do webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de teste do webhook PrimePag',
    usage: 'POST com { "referenceCode": "codigo_do_pix", "valueInCents": 200 }'
  });
} 