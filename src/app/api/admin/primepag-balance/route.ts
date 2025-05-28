import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    console.log('🏦 Recuperando saldos das contas PrimePag...');

    const accounts = [];

    // Recuperar saldo da conta 1
    try {
      console.log('Consultando saldo da conta 1...');
      const account1Balance = await primepagService.getAccountBalance(1);
      accounts.push({
        id: 1,
        name: 'Conta Principal',
        data: account1Balance,
        error: null
      });
      console.log('✅ Saldo da conta 1 recuperado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao recuperar saldo da conta 1:', error);
      accounts.push({
        id: 1,
        name: 'Conta Principal',
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Recuperar saldo da conta 2
    try {
      console.log('Consultando saldo da conta 2...');
      const account2Balance = await primepagService.getAccountBalance(2);
      accounts.push({
        id: 2,
        name: 'Conta Secundária',
        data: account2Balance,
        error: null
      });
      console.log('✅ Saldo da conta 2 recuperado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao recuperar saldo da conta 2:', error);
      accounts.push({
        id: 2,
        name: 'Conta Secundária',
        data: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Verificar se pelo menos uma conta foi recuperada com sucesso
    const hasSuccessfulAccount = accounts.some(account => account.data && !account.error);

    return NextResponse.json({
      success: true,
      accounts,
      timestamp: new Date().toISOString(),
      message: hasSuccessfulAccount 
        ? 'Saldos recuperados com sucesso' 
        : 'Erro ao recuperar saldos de todas as contas'
    });

  } catch (error) {
    console.error('❌ Erro geral ao recuperar saldos PrimePag:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor ao recuperar saldos',
        error: error instanceof Error ? error.message : String(error),
        accounts: []
      },
      { status: 500 }
    );
  }
} 