import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import axios from 'axios';
import { getPrimepagAccountConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.primepag.com.br';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const results = [];

    // Verificar webhook para ambas as contas
    for (let account = 1; account <= 2; account++) {
      try {
        console.log(`Verificando webhook para conta ${account}...`);
        
        // Obter configurações da conta
        const accountConfig = await getPrimepagAccountConfig(account as 1 | 2);
        if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
          results.push({
            account,
            success: false,
            message: `Configuração da conta ${account} não encontrada ou incompleta`
          });
          continue;
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

        // Listar webhooks configurados
        const webhooksResponse = await axios.get(
          `${BASE_URL}/v1/webhooks`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const webhooks = webhooksResponse.data;
        const expectedUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
        
        // Verificar se nosso webhook está configurado
        const ourWebhook = webhooks.find((webhook: any) => 
          webhook.url === expectedUrl && webhook.notification_type === 'pix_payment'
        );

        results.push({
          account,
          success: true,
          webhooks: webhooks,
          ourWebhook: ourWebhook || null,
          isConfigured: !!ourWebhook,
          expectedUrl,
          message: ourWebhook ? 'Webhook configurado corretamente' : 'Webhook não encontrado'
        });

      } catch (error) {
        console.error(`Erro ao verificar webhook da conta ${account}:`, error);
        results.push({
          account,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          message: `Erro ao verificar webhook da conta ${account}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação de webhook concluída',
      results,
      summary: {
        totalAccounts: 2,
        configuredWebhooks: results.filter(r => r.success && r.isConfigured).length,
        errors: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status do webhook:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 