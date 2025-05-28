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

    const { account } = await request.json();
    const results = [];

    // Se uma conta específica foi solicitada, configurar apenas ela
    // Caso contrário, configurar ambas as contas
    const accountsToConfig = account ? [account] : [1, 2];

    for (const accountNumber of accountsToConfig) {
      try {
        console.log(`=== CONFIGURANDO WEBHOOK CONTA ${accountNumber} ===`);
        
        // Obter configurações da conta
        const accountConfig = await getPrimepagAccountConfig(accountNumber as 1 | 2);
        if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
          results.push({
            account: accountNumber,
            success: false,
            message: `Configuração da conta ${accountNumber} não encontrada ou incompleta`
          });
          continue;
        }

        console.log(`Configurações da conta ${accountNumber}:`, {
          hasClientId: !!accountConfig.clientId,
          hasClientSecret: !!accountConfig.clientSecret,
          enabled: accountConfig.enabled,
          name: accountConfig.name
        });

        // Gerar Basic Auth
        const basicAuth = Buffer.from(`${accountConfig.clientId}:${accountConfig.clientSecret}`).toString('base64');

        // Autenticar na PrimePag
        console.log(`Autenticando na PrimePag - Conta ${accountNumber}...`);
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
        console.log(`✅ Autenticação bem-sucedida - Conta ${accountNumber}`);

        // URL do webhook
        const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
        
        console.log(`Configurando webhook para: ${webhookUrl}`);

        // Primeiro, listar webhooks existentes para verificar se já existe
        let existingWebhooks = [];
        try {
          const listResponse = await axios.get(
            `${BASE_URL}/v1/webhooks`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          existingWebhooks = listResponse.data || [];
          console.log(`Webhooks existentes na conta ${accountNumber}:`, existingWebhooks.length);
        } catch (listError) {
          console.log(`Não foi possível listar webhooks existentes:`, listError);
        }

        // Verificar se já existe um webhook para nossa URL
        const existingWebhook = existingWebhooks.find((webhook: any) => 
          webhook.url === webhookUrl && webhook.notification_type === 'pix_payment'
        );

        if (existingWebhook) {
          console.log(`✅ Webhook já configurado na conta ${accountNumber}:`, existingWebhook);
          results.push({
            account: accountNumber,
            success: true,
            message: `Webhook já estava configurado na conta ${accountNumber}`,
            webhook: existingWebhook,
            action: 'already_configured'
          });
          continue;
        }

        // Configurar webhook para notificações de pagamento PIX
        console.log(`Registrando novo webhook na conta ${accountNumber}...`);
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

        console.log(`✅ Webhook configurado com sucesso - Conta ${accountNumber}:`, webhookResponse.data);

        results.push({
          account: accountNumber,
          success: true,
          message: `Webhook configurado com sucesso na conta ${accountNumber}`,
          webhook: webhookResponse.data,
          action: 'configured'
        });

      } catch (error) {
        console.error(`❌ Erro ao configurar webhook da conta ${accountNumber}:`, error);
        
        let errorMessage = 'Erro desconhecido';
        if (axios.isAxiosError(error)) {
          errorMessage = error.response?.data?.message || error.message;
          console.error(`Detalhes do erro:`, error.response?.data);
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        results.push({
          account: accountNumber,
          success: false,
          message: `Erro ao configurar webhook da conta ${accountNumber}: ${errorMessage}`,
          error: errorMessage
        });
      }
    }

    // Resumo dos resultados
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      errors: results.filter(r => !r.success).length,
      alreadyConfigured: results.filter(r => r.success && r.action === 'already_configured').length,
      newlyConfigured: results.filter(r => r.success && r.action === 'configured').length
    };

    console.log('=== RESUMO DA CONFIGURAÇÃO ===');
    console.log('Total de contas:', summary.total);
    console.log('Sucessos:', summary.success);
    console.log('Erros:', summary.errors);
    console.log('Já configurados:', summary.alreadyConfigured);
    console.log('Recém configurados:', summary.newlyConfigured);

    return NextResponse.json({
      success: summary.errors === 0,
      message: summary.errors === 0 
        ? `Webhook configurado com sucesso em ${summary.success} conta(s)`
        : `Configuração concluída com ${summary.errors} erro(s)`,
      results,
      summary
    });

  } catch (error) {
    console.error('❌ Erro geral na configuração do webhook:', error);
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