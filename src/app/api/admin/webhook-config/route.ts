import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    const config = {
      hasSecretKey: !!process.env.PRIMEPAG_SECRET_KEY,
      secretKeyLength: process.env.PRIMEPAG_SECRET_KEY?.length || 0,
      webhookUrl: `${request.nextUrl.origin}/api/webhook/primepag`,
      testWebhookUrl: `${request.nextUrl.origin}/api/webhook/primepag/test`,
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
    };

    return NextResponse.json({
      success: true,
      config,
      instructions: {
        webhook_setup: [
          "1. Configure a variável PRIMEPAG_SECRET_KEY no Vercel com a chave secreta da PrimePag",
          "2. Configure o webhook na PrimePag para: " + config.webhookUrl,
          "3. Use o endpoint de teste para verificar se está funcionando: " + config.testWebhookUrl
        ],
        primepag_webhook_config: {
          url: config.webhookUrl,
          method: "POST",
          content_type: "application/json",
          events: ["pix_payment"]
        }
      }
    });

  } catch (error) {
    console.error('Erro ao verificar configuração do webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { action, referenceCode, valueInCents } = await request.json();

    if (action === 'test_webhook') {
      if (!referenceCode || !valueInCents) {
        return NextResponse.json(
          { success: false, message: 'referenceCode e valueInCents são obrigatórios para teste' },
          { status: 400 }
        );
      }

      // Chamar o endpoint de teste
      const testUrl = `${request.nextUrl.origin}/api/webhook/primepag/test`;
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenceCode, valueInCents })
      });

      const result = await response.json();

      return NextResponse.json({
        success: true,
        message: 'Teste do webhook executado',
        result
      });
    }

    return NextResponse.json(
      { success: false, message: 'Ação não reconhecida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro na configuração do webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 