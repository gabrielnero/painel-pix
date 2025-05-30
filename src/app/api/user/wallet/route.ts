import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User, WalletTransaction } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Buscar dados do usuário
    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar transações recentes (últimas 10)
    const transactions = await WalletTransaction.find({
      userId: authResult.userId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('type amount description createdAt');

    return NextResponse.json({
      success: true,
      balance: user.balance,
      transactions: transactions.map(transaction => ({
        _id: transaction._id,
        type: transaction.type === 'credit' ? 'deposit' : 'withdrawal',
        amount: Math.abs(transaction.amount),
        description: transaction.description,
        createdAt: transaction.createdAt
      }))
    });

  } catch (error) {
    console.error('Erro ao carregar dados da carteira:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 