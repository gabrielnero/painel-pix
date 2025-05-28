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
      console.log(`=== SOLUÇÃO FINAL WEBHOOK CONTA ${account} ===`);
      
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

      // Primeiro, buscar os tipos de webhook para obter os IDs
      console.log('\n=== BUSCANDO TIPOS DE WEBHOOK ===');
      const typesResponse = await axios.get(
        `${BASE_URL}/v1/webhooks/types`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Tipos disponíveis:', JSON.stringify(typesResponse.data, null, 2));

      // Extrair IDs dos tipos PIX baseado na documentação
      let pixQrcodeId = null;
      let pixPaymentId = null;

      if (typesResponse.data && typesResponse.data.webhook_types) {
        const types = typesResponse.data.webhook_types;
        
        types.forEach((type: any) => {
          console.log('Analisando tipo:', type);
          
          // Baseado na documentação: "pix_qrcodes" e "pix_payments"
          if (type.name === 'pix_qrcodes' || type.name === 'pix_qrcode') {
            pixQrcodeId = type.id;
            console.log('PIX QRCode ID encontrado:', pixQrcodeId);
          }
          
          if (type.name === 'pix_payments' || type.name === 'pix_payment') {
            pixPaymentId = type.id;
            console.log('PIX Payment ID encontrado:', pixPaymentId);
          }
        });
      }

      if (!pixQrcodeId && !pixPaymentId) {
        return NextResponse.json({
          success: false,
          message: 'Não foi possível encontrar IDs dos tipos PIX',
          availableTypes: typesResponse.data
        });
      }

      // Agora tentar criar webhook com o formato CORRETO da documentação
      console.log('\n=== CRIANDO WEBHOOK COM FORMATO CORRETO DA DOCUMENTAÇÃO ===');
      
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
      
      // Payload correto baseado na documentação oficial
      const correctPayload = {
        url: webhookUrl,
        authorization: process.env.PRIMEPAG_SECRET_KEY || 'webhook-auth-token'
      };

      console.log('Payload correto (baseado na documentação):', JSON.stringify(correctPayload, null, 2));

      // Testar com os tipos PIX encontrados usando o endpoint correto
      const typesToTest = [
        { id: pixQrcodeId, name: 'pix_qrcodes' },
        { id: pixPaymentId, name: 'pix_payments' }
      ].filter(type => type.id !== null);

      for (const webhookType of typesToTest) {
        console.log(`\nTentando criar webhook para tipo: ${webhookType.name} (ID: ${webhookType.id})`);
        
        // Endpoint correto da documentação: /v1/webhooks/{webhook_type_id}
        const endpoint = `/v1/webhooks/${webhookType.id}`;
        
        try {
          const createResponse = await axios.post(
            `${BASE_URL}${endpoint}`,
            correctPayload,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );

          console.log(`🎉 SUCESSO em ${endpoint}!`);
          console.log('Status:', createResponse.status);
          console.log('Data:', JSON.stringify(createResponse.data, null, 2));

          return NextResponse.json({
            success: true,
            message: `Webhook criado com sucesso para ${webhookType.name}!`,
            endpoint,
            webhookType: webhookType.name,
            webhookTypeId: webhookType.id,
            payload: correctPayload,
            response: {
              status: createResponse.status,
              data: createResponse.data
            },
            availableTypes: typesResponse.data
          });

        } catch (endpointError) {
          const status = axios.isAxiosError(endpointError) ? endpointError.response?.status : 'unknown';
          const errorData = axios.isAxiosError(endpointError) ? endpointError.response?.data : null;
          
          console.log(`❌ ${endpoint}: ${status}`, errorData);
          
          // Log detalhado do erro
          if (status === 400) {
            console.log('Erro 400: Payload inválido ou dados incorretos');
          } else if (status === 401) {
            console.log('Erro 401: Token inválido ou expirado');
          } else if (status === 403) {
            console.log('Erro 403: Sem permissão para criar webhook');
          } else if (status === 404) {
            console.log('Erro 404: Endpoint ou tipo de webhook não encontrado');
          } else if (status === 409) {
            console.log('Erro 409: Webhook já existe para este tipo');
          }
        }
      }

      // Se chegou aqui, nenhum tipo funcionou
      return NextResponse.json({
        success: false,
        message: 'Nenhum tipo de webhook funcionou',
        payload: correctPayload,
        testedTypes: typesToTest,
        availableTypes: typesResponse.data
      });

    } catch (error) {
      console.error(`❌ Erro geral:`, error);
      
      return NextResponse.json({
        success: false,
        message: 'Erro geral na solução final',
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