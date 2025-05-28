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

    // Recuperar saldo de ambas as contas
    const [account1Balance, account2Balance] = await Promise.all([
      primepagService.getAccountBalance(1),
      primepagService.getAccountBalance(2)
    ]);

    return NextResponse.json({
      success: true,
      accounts: [
        {
          id: 1,
          name: 'Conta Principal',
          ...account1Balance
        },
        {
          id: 2,
          name: 'Conta Secundária',
          ...account2Balance
        }
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao recuperar saldos PrimePag:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao recuperar saldos das contas',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 