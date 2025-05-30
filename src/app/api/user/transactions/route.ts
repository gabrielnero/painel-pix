import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { WalletTransaction, Payment, Withdrawal } from '@/lib/models';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';

    await connectToDatabase();

    // Construir filtros
    const filters: any = {
      userId: authResult.userId
    };

    // Filtro por tipo
    if (type !== 'all') {
      if (type === 'deposit') {
        filters.type = 'credit';
      } else if (type === 'withdrawal') {
        filters.type = 'debit';
      }
    }

    // Filtros de data
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) {
        filters.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filters.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Filtro de busca na descrição
    if (search) {
      filters.description = { $regex: search, $options: 'i' };
    }

    // Buscar transações
    const transactions = await WalletTransaction.find(filters)
      .sort({ createdAt: -1 })
      .limit(100)
      .select('type amount description createdAt metadata');

    // Mapear transações para formato da interface
    const mappedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        let status = 'completed';
        let paymentMethod = 'PIX';

        // Tentar obter mais detalhes baseado no tipo e metadata
        if (transaction.metadata && typeof transaction.metadata === 'object' && 'paymentId' in transaction.metadata) {
          const payment = await Payment.findById(transaction.metadata.paymentId);
          if (payment) {
            status = payment.status === 'paid' ? 'completed' : 'pending';
          }
        }

        if (transaction.metadata && typeof transaction.metadata === 'object' && 'withdrawalId' in transaction.metadata) {
          const withdrawal = await Withdrawal.findById(transaction.metadata.withdrawalId);
          if (withdrawal) {
            switch (withdrawal.status) {
              case 'completed':
                status = 'completed';
                break;
              case 'pending':
              case 'approved':
              case 'processing':
                status = 'pending';
                break;
              default:
                status = 'failed';
            }
          }
        }

        return {
          _id: transaction._id,
          type: transaction.type === 'credit' ? 'deposit' : 'withdrawal',
          amount: Math.abs(transaction.amount),
          description: transaction.description,
          createdAt: transaction.createdAt,
          status,
          paymentMethod
        };
      })
    );

    return NextResponse.json({
      success: true,
      transactions: mappedTransactions
    });

  } catch (error) {
    console.error('Erro ao carregar transações:', error);
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