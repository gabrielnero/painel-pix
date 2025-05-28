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

    // Testar ambas as contas
    for (let account = 1; account <= 2; account++) {
      try {
        console.log(`=== LISTANDO TIPOS DE WEBHOOK CONTA ${account} ===`);
        
        // Obter configurações da conta
        const accountConfig = await getPrimepagAccountConfig(account as 1 | 2);
        if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
          results.push({
            account,
            success: false,
            message: `Configuração da conta ${account} não encontrada`
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

        // Endpoints para listar tipos de webhook baseados na documentação
        const endpointsToTest = [
          '/v1/webhook/types',
          '/v1/webhooks/types',
          '/webhook/types',
          '/webhooks/types'
        ];

        let typesFound = false;
        const endpointResults = [];

        for (const endpoint of endpointsToTest) {
          try {
            console.log(`Testando endpoint: ${endpoint}`);
            
            const response = await axios.get(
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
              success: true,
              status: response.status,
              data: response.data,
              types: response.data
            });

            console.log(`✅ ${endpoint}: Sucesso!`, response.data);
            typesFound = true;

          } catch (error) {
            const status = axios.isAxiosError(error) ? error.response?.status : 'unknown';
            const errorData = axios.isAxiosError(error) ? error.response?.data : null;
            
            endpointResults.push({
              endpoint,
              success: false,
              status,
              error: axios.isAxiosError(error) ? error.message : String(error),
              errorData
            });

            console.log(`❌ ${endpoint}: ${status}`, errorData);
          }
        }

        results.push({
          account,
          success: typesFound,
          name: accountConfig.name,
          endpointResults,
          availableTypes: endpointResults.filter(r => r.success).map(r => r.data).flat()
        });

      } catch (error) {
        console.error(`❌ Erro ao listar tipos de webhook da conta ${account}:`, error);
        
        results.push({
          account,
          success: false,
          message: `Erro ao listar tipos de webhook da conta ${account}`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: results.some(r => r.success),
      message: 'Consulta de tipos de webhook concluída',
      results,
      summary: {
        totalAccounts: 2,
        successfulAccounts: results.filter(r => r.success).length,
        totalEndpointsTested: results.reduce((sum, r) => sum + (r.endpointResults?.length || 0), 0),
        workingEndpoints: results.reduce((sum, r) => sum + (r.endpointResults?.filter(e => e.success).length || 0), 0)
      }
    });

  } catch (error) {
    console.error('Erro geral na consulta de tipos de webhook:', error);
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