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

    // Testar apenas a Conta 1
    const account = 1;
    
    try {
      console.log(`=== ANALISANDO WEBHOOKS EXISTENTES CONTA ${account} ===`);
      
      // Obter configurações da conta
      const accountConfig = await getPrimepagAccountConfig(account as 1 | 2);
      if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
        return NextResponse.json({
          success: false,
          message: `Configuração da conta ${account} não encontrada`
        });
      }

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

      // Listar webhooks existentes para analisar estrutura
      console.log('\n=== LISTANDO WEBHOOKS PARA ANÁLISE ===');
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

      console.log('Resposta completa:', listResponse.data);
      console.log('Status:', listResponse.status);
      console.log('Headers:', listResponse.headers);

      // Analisar a estrutura dos webhooks
      let webhooks = [];
      let structure = {};
      
      if (listResponse.data) {
        if (Array.isArray(listResponse.data)) {
          webhooks = listResponse.data;
          structure = {
            type: 'array',
            length: webhooks.length,
            firstItem: webhooks[0] || null
          };
        } else if (listResponse.data.webhooks && Array.isArray(listResponse.data.webhooks)) {
          webhooks = listResponse.data.webhooks;
          structure = {
            type: 'object_with_webhooks_array',
            length: webhooks.length,
            firstItem: webhooks[0] || null,
            otherFields: Object.keys(listResponse.data).filter(k => k !== 'webhooks')
          };
        } else {
          structure = {
            type: 'object',
            fields: Object.keys(listResponse.data),
            data: listResponse.data
          };
        }
      }

      console.log('Estrutura analisada:', structure);
      console.log('Webhooks encontrados:', webhooks.length);

      if (webhooks.length > 0) {
        console.log('Exemplo de webhook existente:', webhooks[0]);
        
        // Analisar campos do primeiro webhook
        const firstWebhook = webhooks[0];
        const webhookFields = Object.keys(firstWebhook);
        console.log('Campos do webhook:', webhookFields);
        
        // Verificar se tem URL e tipo de notificação
        const hasUrl = webhookFields.some(field => 
          field.toLowerCase().includes('url') || 
          field.toLowerCase().includes('endpoint')
        );
        
        const hasType = webhookFields.some(field => 
          field.toLowerCase().includes('type') || 
          field.toLowerCase().includes('notification') ||
          field.toLowerCase().includes('event')
        );
        
        console.log('Tem campo de URL:', hasUrl);
        console.log('Tem campo de tipo:', hasType);
      }

      // Agora vamos tentar diferentes formatos de POST baseados na análise
      console.log('\n=== TENTANDO POST COM FORMATOS BASEADOS NA ANÁLISE ===');
      
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
      
      // Formatos baseados na estrutura encontrada
      const payloadsToTest = [
        // Formato simples
        {
          name: 'Formato Simples',
          data: {
            url: webhookUrl,
            notification_type: 'pix_payment'
          }
        },
        // Formato com array de tipos
        {
          name: 'Array de Tipos',
          data: {
            url: webhookUrl,
            notification_types: ['pix_payment', 'pix_qrcode']
          }
        },
        // Formato com webhook object
        {
          name: 'Objeto Webhook',
          data: {
            webhook: {
              url: webhookUrl,
              notification_type: 'pix_payment'
            }
          }
        },
        // Formato com endpoint
        {
          name: 'Campo Endpoint',
          data: {
            endpoint: webhookUrl,
            type: 'pix_payment'
          }
        }
      ];

      const postResults = [];

      for (const payload of payloadsToTest) {
        console.log(`\nTestando ${payload.name}:`, JSON.stringify(payload.data, null, 2));
        
        try {
          const postResponse = await axios.post(
            `${BASE_URL}/v1/webhooks`,
            payload.data,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          
          postResults.push({
            payload: payload.name,
            success: true,
            status: postResponse.status,
            data: postResponse.data,
            message: '🎉 SUCESSO!'
          });
          
          console.log(`🎉 ${payload.name}: SUCESSO!`, postResponse.data);
          break; // Se um funcionar, parar
          
        } catch (postError) {
          const status = axios.isAxiosError(postError) ? postError.response?.status : 'unknown';
          const errorData = axios.isAxiosError(postError) ? postError.response?.data : null;
          
          postResults.push({
            payload: payload.name,
            success: false,
            status,
            error: axios.isAxiosError(postError) ? postError.message : String(postError),
            errorData,
            message: 'Falhou'
          });
          
          console.log(`❌ ${payload.name}: ${status}`, errorData);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Análise de webhooks concluída',
        account,
        listResponse: {
          status: listResponse.status,
          data: listResponse.data
        },
        structure,
        webhooksCount: webhooks.length,
        webhooks: webhooks.slice(0, 3), // Primeiros 3 para não sobrecarregar
        postResults,
        successfulPost: postResults.find(r => r.success) || null
      });

    } catch (error) {
      console.error(`❌ Erro geral:`, error);
      
      return NextResponse.json({
        success: false,
        message: 'Erro geral na análise',
        error: error instanceof Error ? error.message : String(error),
        details: axios.isAxiosError(error) ? {
          status: error.response?.status,
          data: error.response?.data
        } : null
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