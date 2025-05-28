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

    // Testar apenas a Conta 1 que sabemos que funciona
    const account = 1;
    
    try {
      console.log(`=== DETALHANDO TIPOS DE WEBHOOK CONTA ${account} ===`);
      
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

      // Buscar tipos de webhook no endpoint que funciona
      const response = await axios.get(
        `${BASE_URL}/v1/webhooks/types`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Resposta completa dos tipos:', response.data);

      // Extrair os tipos de webhook
      let webhookTypes = [];
      if (response.data && response.data.webhook_types) {
        webhookTypes = response.data.webhook_types;
      } else if (Array.isArray(response.data)) {
        webhookTypes = response.data;
      }

      console.log('Tipos de webhook extraídos:', webhookTypes);

      return NextResponse.json({
        success: true,
        message: 'Tipos de webhook obtidos com sucesso',
        account,
        rawResponse: response.data,
        webhookTypes,
        typesCount: webhookTypes.length,
        typesList: webhookTypes.map((type: any, index: number) => ({
          index,
          type,
          name: type.name || type.type || type,
          description: type.description || 'Sem descrição'
        }))
      });

    } catch (error) {
      console.error(`❌ Erro ao obter tipos de webhook:`, error);
      
      return NextResponse.json({
        success: false,
        message: 'Erro ao obter tipos de webhook',
        error: error instanceof Error ? error.message : String(error),
        details: axios.isAxiosError(error) ? {
          status: error.response?.status,
          data: error.response?.data
        } : null
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
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