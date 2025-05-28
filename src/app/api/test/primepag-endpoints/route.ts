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

    // Testar endpoints para ambas as contas
    for (let account = 1; account <= 2; account++) {
      try {
        console.log(`=== TESTANDO ENDPOINTS CONTA ${account} ===`);
        
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

        // Lista de endpoints para testar
        const endpointsToTest = [
          '/v1/webhooks',
          '/v1/webhook',
          '/webhooks',
          '/webhook',
          '/v1/webhooks/types',
          '/v1/webhook/types',
          '/webhooks/types',
          '/webhook/types'
        ];

        const endpointResults = [];

        for (const endpoint of endpointsToTest) {
          try {
            console.log(`Testando endpoint: ${endpoint}`);
            const testResponse = await axios.get(
              `${BASE_URL}${endpoint}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );

            endpointResults.push({
              endpoint,
              status: testResponse.status,
              success: true,
              method: 'GET',
              responseSize: JSON.stringify(testResponse.data).length,
              hasData: !!testResponse.data,
              dataType: Array.isArray(testResponse.data) ? 'array' : typeof testResponse.data
            });

            console.log(`✅ ${endpoint}: ${testResponse.status}`);

          } catch (error) {
            const status = axios.isAxiosError(error) ? error.response?.status : 'unknown';
            endpointResults.push({
              endpoint,
              status,
              success: false,
              method: 'GET',
              error: axios.isAxiosError(error) ? error.message : String(error)
            });

            console.log(`❌ ${endpoint}: ${status}`);
          }
        }

        results.push({
          account,
          success: true,
          name: accountConfig.name,
          endpoints: endpointResults,
          workingEndpoints: endpointResults.filter(e => e.success),
          failedEndpoints: endpointResults.filter(e => !e.success)
        });

      } catch (error) {
        console.error(`❌ Erro ao testar endpoints da conta ${account}:`, error);
        
        results.push({
          account,
          success: false,
          message: `Erro ao testar endpoints da conta ${account}`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de endpoints concluído',
      results,
      summary: {
        totalAccounts: 2,
        successfulAccounts: results.filter(r => r.success).length,
        totalEndpointsTested: results.reduce((sum, r) => sum + (r.endpoints?.length || 0), 0),
        workingEndpoints: results.reduce((sum, r) => sum + (r.workingEndpoints?.length || 0), 0)
      }
    });

  } catch (error) {
    console.error('Erro geral no teste de endpoints:', error);
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