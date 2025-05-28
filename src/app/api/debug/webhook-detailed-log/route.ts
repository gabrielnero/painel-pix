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
      console.log(`=== LOG DETALHADO WEBHOOKS CONTA ${account} ===`);
      
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

      // Listar webhooks existentes
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

      console.log('\n=== RESPOSTA COMPLETA DO GET ===');
      console.log('Status:', listResponse.status);
      console.log('Headers:', JSON.stringify(listResponse.headers, null, 2));
      console.log('Data:', JSON.stringify(listResponse.data, null, 2));

      // Analisar estrutura
      let webhooks: any[] = [];
      let structure: any = {};
      
      if (listResponse.data) {
        if (Array.isArray(listResponse.data)) {
          webhooks = listResponse.data;
          structure = { type: 'array', length: webhooks.length };
        } else if (listResponse.data.webhooks && Array.isArray(listResponse.data.webhooks)) {
          webhooks = listResponse.data.webhooks;
          structure = { 
            type: 'object_with_webhooks_array', 
            length: webhooks.length,
            otherFields: Object.keys(listResponse.data).filter(k => k !== 'webhooks')
          };
        } else {
          structure = { 
            type: 'object', 
            fields: Object.keys(listResponse.data) 
          };
        }
      }

      console.log('\n=== ESTRUTURA ANALISADA ===');
      console.log('Tipo:', structure.type);
      console.log('Estrutura completa:', JSON.stringify(structure, null, 2));

      if (webhooks.length > 0) {
        console.log('\n=== WEBHOOK EXISTENTE DETALHADO ===');
        webhooks.forEach((webhook: any, index: number) => {
          console.log(`Webhook ${index + 1}:`);
          console.log(JSON.stringify(webhook, null, 2));
          console.log('Campos:', Object.keys(webhook));
          console.log('---');
        });
      }

      // Testar POST com logs detalhados
      console.log('\n=== TESTE DE POST DETALHADO ===');
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
      
      const testPayload = {
        url: webhookUrl,
        notification_type: 'pix_payment'
      };

      console.log('Payload de teste:', JSON.stringify(testPayload, null, 2));
      console.log('URL completa:', `${BASE_URL}/v1/webhooks`);
      console.log('Token (primeiros 30 chars):', token.substring(0, 30) + '...');

      try {
        const postResponse = await axios.post(
          `${BASE_URL}/v1/webhooks`,
          testPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        console.log('\n🎉 POST SUCESSO!');
        console.log('Status:', postResponse.status);
        console.log('Headers:', JSON.stringify(postResponse.headers, null, 2));
        console.log('Data:', JSON.stringify(postResponse.data, null, 2));

        return NextResponse.json({
          success: true,
          message: 'POST funcionou!',
          webhooks,
          structure,
          postSuccess: true,
          postResponse: {
            status: postResponse.status,
            data: postResponse.data
          }
        });

      } catch (postError) {
        console.log('\n❌ POST ERRO DETALHADO:');
        
        if (axios.isAxiosError(postError)) {
          console.log('Status:', postError.response?.status);
          console.log('Status Text:', postError.response?.statusText);
          console.log('Headers:', JSON.stringify(postError.response?.headers, null, 2));
          console.log('Data:', JSON.stringify(postError.response?.data, null, 2));
          console.log('Message:', postError.message);
          console.log('Code:', postError.code);
          
          // Log específico para diferentes tipos de erro
          if (postError.response?.status === 400) {
            console.log('🔍 ERRO 400 - Bad Request:');
            console.log('Provavelmente formato do payload incorreto');
          } else if (postError.response?.status === 401) {
            console.log('🔍 ERRO 401 - Unauthorized:');
            console.log('Problema de autenticação');
          } else if (postError.response?.status === 403) {
            console.log('🔍 ERRO 403 - Forbidden:');
            console.log('Sem permissão para criar webhooks');
          } else if (postError.response?.status === 404) {
            console.log('🔍 ERRO 404 - Not Found:');
            console.log('Endpoint não existe para POST');
          } else if (postError.response?.status === 405) {
            console.log('🔍 ERRO 405 - Method Not Allowed:');
            console.log('POST não permitido neste endpoint');
          } else if (postError.response?.status === 422) {
            console.log('🔍 ERRO 422 - Unprocessable Entity:');
            console.log('Dados válidos mas não processáveis');
          }
        } else {
          console.log('Erro não-axios:', postError);
        }

        return NextResponse.json({
          success: true,
          message: 'Análise detalhada concluída',
          webhooks,
          structure,
          postSuccess: false,
          postError: axios.isAxiosError(postError) ? {
            status: postError.response?.status,
            statusText: postError.response?.statusText,
            data: postError.response?.data,
            message: postError.message,
            code: postError.code
          } : String(postError)
        });
      }

    } catch (error) {
      console.error(`❌ Erro geral:`, error);
      
      return NextResponse.json({
        success: false,
        message: 'Erro geral na análise detalhada',
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