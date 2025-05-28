import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import axios from 'axios';
import { getPrimepagAccountConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.primepag.com.br';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    const { account = 1 } = await request.json();

    // Obter configurações da conta
    const accountConfig = await getPrimepagAccountConfig(account);
    if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
      return NextResponse.json(
        { success: false, message: `Configuração da conta ${account} não encontrada ou incompleta` },
        { status: 400 }
      );
    }

    // Gerar Basic Auth
    const basicAuth = Buffer.from(`${accountConfig.clientId}:${accountConfig.clientSecret}`).toString('base64');

    // Autenticar na PrimePag
    const authResponse = await axios.post(
      `${BASE_URL}/auth/generate_token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const token = authResponse.data.access_token;

    // URL do webhook (usar a URL do Vercel)
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;

    // Configurar webhook para notificações de pagamento
    const webhookResponse = await axios.post(
      `${BASE_URL}/v1/webhooks`,
      {
        url: webhookUrl,
        notification_type: 'pix_payment',
        active: true
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Webhook configurado para conta ${account}:`, webhookResponse.data);

    return NextResponse.json({
      success: true,
      message: `Webhook configurado com sucesso para conta ${account}`,
      webhook: {
        url: webhookUrl,
        account: account,
        response: webhookResponse.data
      }
    });

  } catch (error) {
    console.error('Erro ao configurar webhook:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao configurar webhook',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 