import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { referenceCode, valueInCents, notificationType = 'pix_qrcode' } = await request.json();

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

    let webhookPayload;
    let signatureString;

    if (notificationType === 'pix_qrcode' || notificationType === 'pix_static_qrcode') {
      // Criar dados de teste para QRCode conforme documentação PrimePag
      const endToEnd = `E18236120${Date.now().toString().slice(-10)}`;
      
      const testMessage = {
        reference_code: referenceCode,
        value_cents: valueInCents,
        content: "00020101021126580014br.gov.bcb.pix0136d5091c68-5056-481b-88ad-95eb340a1a2152040000530398654040.025802BR5925Primepag Solucoes em Paga6009SAO PAULO62220518PRIMEPAGPIXQRCODE263044FC9",
        status: "paid",
        generator_name: "Usuário Teste",
        generator_document: "11144477735",
        payer_name: "Pagador Teste",
        payer_document: "12345678901",
        registration_date: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        end_to_end: endToEnd
      };

      // Gerar MD5 conforme documentação QRCode: qrcode.{reference_code}.{end_to_end}.{value_cents}.{secret_key}
      signatureString = `qrcode.${testMessage.reference_code}.${testMessage.end_to_end}.${testMessage.value_cents}.${secretKey}`;
      
      webhookPayload = {
        notification_type: notificationType,
        message: testMessage,
        md5: crypto.createHash('md5').update(signatureString).digest('hex')
      };
      
    } else if (notificationType === 'pix_payment') {
      // Criar dados de teste para Payment conforme documentação PrimePag
      const testMessage = {
        value_cents: valueInCents,
        reference_code: referenceCode,
        idempotent_id: `TEST-${Date.now()}`,
        pix_key: "09354532454",
        pix_key_type: "cpf",
        status: "completed",
        end_to_end: null,
        receiver_name: "Usuário Teste",
        receiver_document: "11144477735",
        registration_date: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        cancellation_date: null,
        cancellation_reason: null,
        receipt_url: null
      };

      // Gerar MD5 conforme documentação Payment: payment.{reference_code}.{idempotent_id}.{value_cents}.{secret_key}
      signatureString = `payment.${testMessage.reference_code}.${testMessage.idempotent_id}.${testMessage.value_cents}.${secretKey}`;
      
      webhookPayload = {
        notification_type: notificationType,
        message: testMessage,
        md5: crypto.createHash('md5').update(signatureString).digest('hex')
      };
    } else {
      return NextResponse.json(
        { error: 'Tipo de notificação não suportado. Use: pix_qrcode, pix_static_qrcode ou pix_payment' },
        { status: 400 }
      );
    }

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

    const responseText = await response.text();
    
    return NextResponse.json({
      success: true,
      message: `Webhook de teste enviado (${notificationType})`,
      webhookResponse: {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      },
      testPayload: webhookPayload,
      signatureString: signatureString.replace(secretKey, '[SECRET_KEY]')
    });

  } catch (error) {
    console.error('Erro no teste do webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de teste do webhook PrimePag',
    usage: {
      method: 'POST',
      body: {
        referenceCode: 'codigo_do_pix (obrigatório)',
        valueInCents: 200,
        notificationType: 'pix_qrcode | pix_static_qrcode | pix_payment (opcional, padrão: pix_qrcode)'
      }
    },
    examples: {
      qrcode: {
        referenceCode: "88003793-c4bc-4769-823b-299ebb84a98b",
        valueInCents: 200,
        notificationType: "pix_qrcode"
      },
      payment: {
        referenceCode: "88003793-c4bc-4769-823b-299ebb84a98b", 
        valueInCents: 200,
        notificationType: "pix_payment"
      }
    }
  });
} 