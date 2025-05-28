import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPrimepagAccountConfig, getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

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

    // Testar configurações para ambas as contas
    for (let account = 1; account <= 2; account++) {
      try {
        console.log(`=== TESTANDO CONFIGURAÇÕES CONTA ${account} ===`);
        
        // Obter configurações da conta
        const accountConfig = await getPrimepagAccountConfig(account as 1 | 2);
        
        // Obter configurações individuais para debug
        const accountKey = `primepag.account${account}`;
        const clientId = await getConfig(`${accountKey}.client_id`);
        const clientSecret = await getConfig(`${accountKey}.client_secret`);
        const enabled = await getConfig(`${accountKey}.enabled`);
        const name = await getConfig(`${accountKey}.name`);
        
        console.log(`Configurações brutas da conta ${account}:`, {
          clientId: clientId ? `${clientId.substring(0, 8)}...` : 'null',
          clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...` : 'null',
          enabled,
          name
        });
        
        console.log(`Configurações processadas da conta ${account}:`, {
          hasClientId: !!accountConfig?.clientId,
          hasClientSecret: !!accountConfig?.clientSecret,
          clientIdLength: accountConfig?.clientId?.length || 0,
          clientSecretLength: accountConfig?.clientSecret?.length || 0,
          enabled: accountConfig?.enabled,
          name: accountConfig?.name
        });

        // Verificar se as credenciais são válidas (formato UUID)
        const isValidUUID = (str: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(str);
        };

        const clientIdValid = accountConfig?.clientId ? isValidUUID(accountConfig.clientId) : false;
        const clientSecretValid = accountConfig?.clientSecret ? isValidUUID(accountConfig.clientSecret) : false;

        results.push({
          account,
          success: true,
          config: {
            hasClientId: !!accountConfig?.clientId,
            hasClientSecret: !!accountConfig?.clientSecret,
            clientIdLength: accountConfig?.clientId?.length || 0,
            clientSecretLength: accountConfig?.clientSecret?.length || 0,
            clientIdValid,
            clientSecretValid,
            enabled: accountConfig?.enabled,
            name: accountConfig?.name
          },
          rawConfig: {
            clientId: clientId ? `${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}` : 'null',
            clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...${clientSecret.substring(clientSecret.length - 4)}` : 'null',
            enabled,
            name
          },
          validation: {
            hasValidCredentials: clientIdValid && clientSecretValid,
            isEnabled: accountConfig?.enabled === true,
            isComplete: !!(accountConfig?.clientId && accountConfig?.clientSecret && accountConfig?.enabled)
          }
        });

      } catch (error) {
        console.error(`❌ Erro ao verificar configurações da conta ${account}:`, error);
        
        results.push({
          account,
          success: false,
          message: `Erro ao verificar configurações da conta ${account}`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação de configurações concluída',
      results,
      summary: {
        totalAccounts: 2,
        validAccounts: results.filter(r => r.success && r.validation?.isComplete).length,
        errors: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Erro geral na verificação de configurações:', error);
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