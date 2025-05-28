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

    // Testar autenticação para ambas as contas
    for (let account = 1; account <= 2; account++) {
      try {
        console.log(`=== TESTANDO AUTENTICAÇÃO CONTA ${account} ===`);
        
        // Obter configurações da conta
        const accountConfig = await getPrimepagAccountConfig(account as 1 | 2);
        
        console.log(`Configuração da conta ${account}:`, {
          hasClientId: !!accountConfig?.clientId,
          hasClientSecret: !!accountConfig?.clientSecret,
          clientIdLength: accountConfig?.clientId?.length || 0,
          clientSecretLength: accountConfig?.clientSecret?.length || 0,
          enabled: accountConfig?.enabled,
          name: accountConfig?.name
        });

        if (!accountConfig || !accountConfig.clientId || !accountConfig.clientSecret) {
          results.push({
            account,
            success: false,
            message: `Configuração da conta ${account} não encontrada ou incompleta`,
            config: {
              hasClientId: !!accountConfig?.clientId,
              hasClientSecret: !!accountConfig?.clientSecret,
              enabled: accountConfig?.enabled
            }
          });
          continue;
        }

        // Gerar Basic Auth
        const basicAuth = Buffer.from(`${accountConfig.clientId}:${accountConfig.clientSecret}`).toString('base64');
        console.log(`Basic Auth gerado para conta ${account} (primeiros 20 chars): ${basicAuth.substring(0, 20)}...`);

        // Tentar autenticar na PrimePag
        console.log(`Fazendo requisição de autenticação para conta ${account}...`);
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

        console.log(`Resposta de autenticação da conta ${account}:`, {
          status: authResponse.status,
          hasAccessToken: !!authResponse.data?.access_token,
          tokenType: authResponse.data?.token_type,
          expiresIn: authResponse.data?.expires_in
        });

        if (!authResponse.data || !authResponse.data.access_token) {
          throw new Error(`Resposta de autenticação inválida: ${JSON.stringify(authResponse.data)}`);
        }

        const token = authResponse.data.access_token;
        console.log(`✅ Autenticação bem-sucedida - Conta ${account}`);
        console.log(`Token obtido (primeiros 20 chars): ${token.substring(0, 20)}...`);

        // Testar uma chamada simples para verificar se o token funciona
        try {
          const testResponse = await axios.get(
            `${BASE_URL}/v1/webhooks`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          console.log(`Teste de API bem-sucedido para conta ${account}:`, {
            status: testResponse.status,
            dataType: typeof testResponse.data,
            isArray: Array.isArray(testResponse.data)
          });

          results.push({
            account,
            success: true,
            message: `Autenticação e teste de API bem-sucedidos para conta ${account}`,
            auth: {
              tokenObtained: true,
              tokenLength: token.length,
              tokenType: authResponse.data.token_type,
              expiresIn: authResponse.data.expires_in
            },
            apiTest: {
              status: testResponse.status,
              dataType: typeof testResponse.data,
              isArray: Array.isArray(testResponse.data)
            }
          });

        } catch (apiError) {
          console.error(`Erro no teste de API para conta ${account}:`, apiError);
          results.push({
            account,
            success: false,
            message: `Autenticação OK, mas erro no teste de API para conta ${account}`,
            auth: {
              tokenObtained: true,
              tokenLength: token.length
            },
            apiError: axios.isAxiosError(apiError) ? {
              status: apiError.response?.status,
              statusText: apiError.response?.statusText,
              data: apiError.response?.data
            } : apiError instanceof Error ? apiError.message : String(apiError)
          });
        }

      } catch (error) {
        console.error(`❌ Erro na autenticação da conta ${account}:`, error);
        
        let errorDetails = {};
        if (axios.isAxiosError(error)) {
          errorDetails = {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
          };
          console.error(`Detalhes do erro HTTP:`, errorDetails);
        }

        results.push({
          account,
          success: false,
          message: `Erro na autenticação da conta ${account}`,
          error: error instanceof Error ? error.message : String(error),
          errorDetails
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de autenticação concluído',
      results,
      summary: {
        totalAccounts: 2,
        successfulAuths: results.filter(r => r.success).length,
        errors: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Erro geral no teste de autenticação:', error);
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