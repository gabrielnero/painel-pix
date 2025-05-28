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
      console.log(`=== ESCANEANDO ENDPOINTS WEBHOOK CONTA ${account} ===`);
      
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

      // Lista de endpoints para testar (baseado na documentação)
      const endpointsToTest = [
        // Endpoints da documentação
        '/v1/webhooks',
        '/v1/webhook',
        '/webhooks',
        '/webhook',
        
        // Endpoints baseados na documentação específica
        '/v1/webhook/register',
        '/v1/webhooks/register',
        '/webhook/register',
        '/webhooks/register',
        
        // Endpoints alternativos
        '/v1/webhook/create',
        '/v1/webhooks/create',
        '/webhook/create',
        '/webhooks/create',
        
        // Endpoints sem versão
        '/api/webhook',
        '/api/webhooks',
        '/api/v1/webhook',
        '/api/v1/webhooks',
        
        // Endpoints baseados em outros padrões
        '/v1/notification/webhook',
        '/v1/notifications/webhook',
        '/notification/webhook',
        '/notifications/webhook'
      ];

      const results = [];

      for (const endpoint of endpointsToTest) {
        console.log(`\n=== TESTANDO ENDPOINT: ${endpoint} ===`);
        
        // Testar GET primeiro (para ver se existe)
        try {
          const getResponse = await axios.get(
            `${BASE_URL}${endpoint}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            }
          );
          
          results.push({
            endpoint,
            method: 'GET',
            success: true,
            status: getResponse.status,
            data: getResponse.data,
            message: 'Endpoint existe e responde ao GET'
          });
          
          console.log(`✅ GET ${endpoint}: ${getResponse.status}`, getResponse.data);
          
        } catch (getError) {
          const status = axios.isAxiosError(getError) ? getError.response?.status : 'unknown';
          const errorData = axios.isAxiosError(getError) ? getError.response?.data : null;
          
          results.push({
            endpoint,
            method: 'GET',
            success: false,
            status,
            error: axios.isAxiosError(getError) ? getError.message : String(getError),
            errorData,
            message: status === 405 ? 'Endpoint existe mas não aceita GET' : 'Endpoint não encontrado ou erro'
          });
          
          console.log(`❌ GET ${endpoint}: ${status}`, errorData);
        }

        // Se GET deu 405 (Method Not Allowed), o endpoint existe mas só aceita POST
        // Vamos testar POST também
        const lastResult = results[results.length - 1];
        if (lastResult.status === 405) {
          console.log(`🔄 Testando POST em ${endpoint} (GET deu 405)...`);
          
          const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
          const testPayload = {
            url: webhookUrl,
            notification_type: 'pix_payment'
          };
          
          try {
            const postResponse = await axios.post(
              `${BASE_URL}${endpoint}`,
              testPayload,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );
            
            results.push({
              endpoint,
              method: 'POST',
              success: true,
              status: postResponse.status,
              data: postResponse.data,
              payload: testPayload,
              message: '🎉 ENDPOINT FUNCIONA PARA REGISTRO!'
            });
            
            console.log(`🎉 POST ${endpoint}: SUCESSO!`, postResponse.data);
            
          } catch (postError) {
            const status = axios.isAxiosError(postError) ? postError.response?.status : 'unknown';
            const errorData = axios.isAxiosError(postError) ? postError.response?.data : null;
            
            results.push({
              endpoint,
              method: 'POST',
              success: false,
              status,
              error: axios.isAxiosError(postError) ? postError.message : String(postError),
              errorData,
              payload: testPayload,
              message: 'POST falhou'
            });
            
            console.log(`❌ POST ${endpoint}: ${status}`, errorData);
          }
        }
      }

      // Resumo dos resultados
      const workingEndpoints = results.filter(r => r.success);
      const methodNotAllowed = results.filter(r => r.status === 405);
      
      console.log('\n=== RESUMO DOS RESULTADOS ===');
      console.log(`Total de endpoints testados: ${endpointsToTest.length}`);
      console.log(`Endpoints funcionando: ${workingEndpoints.length}`);
      console.log(`Endpoints com 405 (Method Not Allowed): ${methodNotAllowed.length}`);
      
      if (workingEndpoints.length > 0) {
        console.log('Endpoints que funcionam:');
        workingEndpoints.forEach(r => {
          console.log(`  ✅ ${r.method} ${r.endpoint}: ${r.status}`);
        });
      }

      return NextResponse.json({
        success: workingEndpoints.length > 0,
        message: workingEndpoints.length > 0 
          ? `${workingEndpoints.length} endpoint(s) funcionando!` 
          : 'Nenhum endpoint funcionando',
        account,
        results,
        summary: {
          totalTested: endpointsToTest.length,
          working: workingEndpoints.length,
          methodNotAllowed: methodNotAllowed.length,
          workingEndpoints: workingEndpoints.map(r => ({
            endpoint: r.endpoint,
            method: r.method,
            status: r.status
          }))
        }
      });

    } catch (error) {
      console.error(`❌ Erro geral:`, error);
      
      return NextResponse.json({
        success: false,
        message: 'Erro geral no escaneamento',
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