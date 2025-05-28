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

      // Extrair IDs dos tipos PIX
      let pixPaymentId = null;
      let pixQrcodeId = null;

      if (typesResponse.data && typesResponse.data.webhook_types) {
        const types = typesResponse.data.webhook_types;
        
        types.forEach((type: any) => {
          console.log('Analisando tipo:', type);
          
          if (type.name === 'pix_payment' || type.type === 'pix_payment') {
            pixPaymentId = type.id;
            console.log('PIX Payment ID encontrado:', pixPaymentId);
          }
          
          if (type.name === 'pix_qrcode' || type.type === 'pix_qrcode') {
            pixQrcodeId = type.id;
            console.log('PIX QRCode ID encontrado:', pixQrcodeId);
          }
        });
      }

      if (!pixPaymentId && !pixQrcodeId) {
        return NextResponse.json({
          success: false,
          message: 'Não foi possível encontrar IDs dos tipos PIX',
          availableTypes: typesResponse.data
        });
      }

      // Agora tentar criar webhook com o formato correto
      console.log('\n=== CRIANDO WEBHOOK COM FORMATO CORRETO ===');
      
      const webhookUrl = `${process.env.NEXTAUTH_URL || 'https://www.top1xreceiver.org'}/api/webhook/primepag`;
      
      // Usar o ID do tipo PIX Payment (preferencial)
      const webhookTypeId = pixPaymentId || pixQrcodeId;
      
      const correctPayload = {
        url: webhookUrl,
        webhook_type_id: webhookTypeId,
        authorization_header: true
      };

      console.log('Payload correto:', JSON.stringify(correctPayload, null, 2));

      // Testar diferentes endpoints de criação
      const endpointsToTry = [
        '/v1/webhook',           // Singular
        '/v1/webhook/create',    // Com create
        '/v1/webhooks/create',   // Plural com create
        '/webhook',              // Sem versão
        '/webhook/create',       // Sem versão com create
        '/v1/webhook/register',  // Com register
        '/v1/webhooks/register'  // Plural com register
      ];

      for (const endpoint of endpointsToTry) {
        console.log(`\nTentando endpoint: ${endpoint}`);
        
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
            message: `Webhook criado com sucesso em ${endpoint}!`,
            endpoint,
            payload: correctPayload,
            response: {
              status: createResponse.status,
              data: createResponse.data
            },
            webhookTypeId,
            availableTypes: typesResponse.data
          });

        } catch (endpointError) {
          const status = axios.isAxiosError(endpointError) ? endpointError.response?.status : 'unknown';
          const errorData = axios.isAxiosError(endpointError) ? endpointError.response?.data : null;
          
          console.log(`❌ ${endpoint}: ${status}`, errorData);
          
          // Se não for 404, pode ser um erro de formato, então continuar tentando
          if (status !== 404) {
            console.log(`Endpoint ${endpoint} existe mas deu erro ${status}`);
          }
        }
      }

      // Se chegou aqui, nenhum endpoint funcionou
      return NextResponse.json({
        success: false,
        message: 'Nenhum endpoint de criação funcionou',
        payload: correctPayload,
        webhookTypeId,
        availableTypes: typesResponse.data,
        testedEndpoints: endpointsToTry
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