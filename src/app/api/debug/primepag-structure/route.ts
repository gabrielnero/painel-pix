import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('🔍 DEBUG: Investigando estrutura dos dados PrimePag...');

    const debugInfo = {
      account1: null as any,
      account2: null as any,
      errors: [] as string[]
    };

    // Debug conta 1
    try {
      console.log('🔍 Testando conta 1...');
      const account1Data = await primepagService.getAccountBalance(1);
      console.log('📊 Dados brutos conta 1:', JSON.stringify(account1Data, null, 2));
      
      debugInfo.account1 = {
        raw: account1Data,
        type: typeof account1Data,
        isObject: typeof account1Data === 'object',
        hasData: !!account1Data?.data,
        hasAccountBalance: !!account1Data?.account_balance,
        dataType: typeof account1Data?.data,
        accountBalanceType: typeof account1Data?.account_balance,
        keys: account1Data ? Object.keys(account1Data) : [],
        dataKeys: account1Data?.data ? Object.keys(account1Data.data) : [],
        accountBalanceKeys: account1Data?.account_balance ? Object.keys(account1Data.account_balance) : []
      };
    } catch (error) {
      const errorMsg = `Erro conta 1: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌', errorMsg);
      debugInfo.errors.push(errorMsg);
    }

    // Debug conta 2
    try {
      console.log('🔍 Testando conta 2...');
      const account2Data = await primepagService.getAccountBalance(2);
      console.log('📊 Dados brutos conta 2:', JSON.stringify(account2Data, null, 2));
      
      debugInfo.account2 = {
        raw: account2Data,
        type: typeof account2Data,
        isObject: typeof account2Data === 'object',
        hasData: !!account2Data?.data,
        hasAccountBalance: !!account2Data?.account_balance,
        dataType: typeof account2Data?.data,
        accountBalanceType: typeof account2Data?.account_balance,
        keys: account2Data ? Object.keys(account2Data) : [],
        dataKeys: account2Data?.data ? Object.keys(account2Data.data) : [],
        accountBalanceKeys: account2Data?.account_balance ? Object.keys(account2Data.account_balance) : []
      };
    } catch (error) {
      const errorMsg = `Erro conta 2: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌', errorMsg);
      debugInfo.errors.push(errorMsg);
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
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