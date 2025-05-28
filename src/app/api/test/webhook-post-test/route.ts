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

    const results = [];

    // Testar apenas a Conta 1 que sabemos que tem endpoints funcionando
    const account = 1;
    
    try {
      console.log(`=== TESTANDO POST WEBHOOK CONTA ${account} ===`);
      
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
      console.log(`✅ Autenticação bem-sucedida - Conta ${account}`);

      // URL do webhook
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
      
      // Diferentes payloads para testar
      const payloadsToTest = [
        {
          name: 'Payload Padrão',
          data: {
            url: webhookUrl,
            notification_type: 'pix_payment',
            active: true
          }
        },
        {
          name: 'Payload Simples',
          data: {
            url: webhookUrl,
            events: ['pix_payment']
          }
        },
        {
          name: 'Payload com Event Types',
          data: {
            url: webhookUrl,
            event_types: ['pix_payment', 'pix_qrcode']
          }
        },
        {
          name: 'Payload Mínimo',
          data: {
            url: webhookUrl
          }
        }
      ];

      const testResults = [];

      for (const payload of payloadsToTest) {
        try {
          console.log(`Testando ${payload.name}:`, payload.data);
          
          const response = await axios.post(
            `${BASE_URL}/v1/webhooks`,
            payload.data,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );

          testResults.push({
            payload: payload.name,
            success: true,
            status: response.status,
            data: response.data,
            message: 'Webhook criado com sucesso!'
          });

          console.log(`✅ ${payload.name}: Sucesso!`, response.data);
          break; // Se um funcionar, parar de testar

        } catch (error) {
          const status = axios.isAxiosError(error) ? error.response?.status : 'unknown';
          const errorData = axios.isAxiosError(error) ? error.response?.data : null;
          
          testResults.push({
            payload: payload.name,
            success: false,
            status,
            error: axios.isAxiosError(error) ? error.message : String(error),
            errorData,
            details: errorData
          });

          console.log(`❌ ${payload.name}: ${status}`, errorData);
        }
      }

      results.push({
        account,
        success: testResults.some(r => r.success),
        name: accountConfig.name,
        testResults,
        successfulPayload: testResults.find(r => r.success)?.payload,
        webhookUrl
      });

    } catch (error) {
      console.error(`❌ Erro ao testar webhook da conta ${account}:`, error);
      
      results.push({
        account,
        success: false,
        message: `Erro ao testar webhook da conta ${account}`,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return NextResponse.json({
      success: results.some(r => r.success),
      message: results.some(r => r.success) 
        ? 'Teste de webhook concluído com sucesso!' 
        : 'Todos os testes falharam',
      results,
      summary: {
        totalTests: results.reduce((sum, r) => sum + (r.testResults?.length || 0), 0),
        successfulTests: results.reduce((sum, r) => sum + (r.testResults?.filter(t => t.success).length || 0), 0)
      }
    });

  } catch (error) {
    console.error('Erro geral no teste de webhook:', error);
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