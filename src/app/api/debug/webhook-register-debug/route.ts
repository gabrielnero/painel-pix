import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import axios from 'axios';
import { getPrimepagAccountConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.primepag.com.br';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Testar apenas a Conta 1
    const account = 1;
    
    try {
      console.log(`=== DEBUG REGISTRO WEBHOOK CONTA ${account} ===`);
      
      // Obter configurações da conta
      const accountConfig = await getPrimepagAccountConfig(account as 1 | 2);
      if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
        return NextResponse.json({
          success: false,
          message: `Configuração da conta ${account} não encontrada`
        });
      }

      console.log(`Configuração da conta ${account}:`, {
        clientId: accountConfig.clientId.substring(0, 8) + '...',
        clientSecret: accountConfig.clientSecret.substring(0, 8) + '...',
        name: accountConfig.name
      });

      // Gerar Basic Auth
      const basicAuth = Buffer.from(`${accountConfig.clientId}:${accountConfig.clientSecret}`).toString('base64');

      // Autenticar na PrimePag
      console.log(`Autenticando na PrimePag - Conta ${account}...`);
      const authResponse = await axios.post(
        `${BASE_URL}/auth/generate_token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      const token = authResponse.data.access_token;
      console.log(`✅ Token obtido: ${token.substring(0, 20)}...`);

      // URL do webhook
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
      console.log(`URL do webhook: ${webhookUrl}`);

      // Primeiro, vamos listar webhooks existentes
      console.log('\n=== LISTANDO WEBHOOKS EXISTENTES ===');
      try {
        const listResponse = await axios.get(
          `${BASE_URL}/v1/webhooks`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        console.log('Webhooks existentes:', listResponse.data);
      } catch (listError) {
        console.log('Erro ao listar webhooks:', axios.isAxiosError(listError) ? {
          status: listError.response?.status,
          data: listError.response?.data
        } : listError);
      }

      // Agora vamos tentar registrar um webhook simples
      console.log('\n=== TENTANDO REGISTRAR WEBHOOK ===');
      
      const payload = {
        url: webhookUrl,
        notification_type: 'pix_payment'
      };
      
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Endpoint:', `${BASE_URL}/v1/webhooks`);
      console.log('Headers:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });

      try {
        const registerResponse = await axios.post(
          `${BASE_URL}/v1/webhooks`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        console.log('✅ SUCESSO! Webhook registrado:', registerResponse.data);
        
        return NextResponse.json({
          success: true,
          message: 'Webhook registrado com sucesso!',
          account,
          payload,
          response: registerResponse.data,
          status: registerResponse.status
        });

      } catch (registerError) {
        console.log('❌ ERRO no registro:', registerError);
        
        if (axios.isAxiosError(registerError)) {
          console.log('Status:', registerError.response?.status);
          console.log('Headers da resposta:', registerError.response?.headers);
          console.log('Dados da resposta:', registerError.response?.data);
          console.log('Mensagem do erro:', registerError.message);
          
          // Tentar diferentes formatos de payload
          console.log('\n=== TENTANDO FORMATOS ALTERNATIVOS ===');
          
          const alternativePayloads = [
            { url: webhookUrl, type: 'pix_payment' },
            { webhook_url: webhookUrl, notification_type: 'pix_payment' },
            { webhook_url: webhookUrl, type: 'pix_payment' },
            { url: webhookUrl, event_type: 'pix_payment' },
            { url: webhookUrl, events: ['pix_payment'] },
            { url: webhookUrl, notification_types: ['pix_payment'] }
          ];

          for (let i = 0; i < alternativePayloads.length; i++) {
            const altPayload = alternativePayloads[i];
            console.log(`\nTentativa ${i + 1}:`, JSON.stringify(altPayload, null, 2));
            
            try {
              const altResponse = await axios.post(
                `${BASE_URL}/v1/webhooks`,
                altPayload,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 10000
                }
              );
              
              console.log(`✅ SUCESSO com payload alternativo ${i + 1}:`, altResponse.data);
              
              return NextResponse.json({
                success: true,
                message: `Webhook registrado com payload alternativo ${i + 1}!`,
                account,
                payload: altPayload,
                response: altResponse.data,
                status: altResponse.status,
                attempt: i + 1
              });
              
            } catch (altError) {
              console.log(`❌ Falha na tentativa ${i + 1}:`, axios.isAxiosError(altError) ? {
                status: altError.response?.status,
                data: altError.response?.data
              } : altError);
            }
          }
        }

        return NextResponse.json({
          success: false,
          message: 'Falha no registro do webhook',
          account,
          payload,
          error: axios.isAxiosError(registerError) ? {
            status: registerError.response?.status,
            data: registerError.response?.data,
            message: registerError.message
          } : String(registerError)
        });
      }

    } catch (error) {
      console.error(`❌ Erro geral:`, error);
      
      return NextResponse.json({
        success: false,
        message: 'Erro geral no debug',
        error: error instanceof Error ? error.message : String(error)
      });
    }

  } catch (error) {
    console.error('Erro na API:', error);
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