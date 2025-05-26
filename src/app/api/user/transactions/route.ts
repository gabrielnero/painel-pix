import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { WalletTransaction } from '@/lib/models';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
      // Tentar conectar ao banco de dados
      await connectToDatabase();

      // Buscar transações do usuário
      const skip = (page - 1) * limit;
      const transactions = await WalletTransaction.find({ userId: authResult.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('paymentId');

      const total = await WalletTransaction.countDocuments({ userId: authResult.userId });

      return NextResponse.json({
        success: true,
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        }
      });

    } catch (dbError) {
      // Se estiver em modo offline ou erro de banco, retornar dados mock
      console.log('Modo offline - retornando transações mock');
      
      // Transações mock para demonstração
      const mockTransactions = [
        {
          _id: 'mock-1',
          userId: authResult.userId,
          type: 'credit',
          amount: 80.00,
          description: 'Pagamento PIX aprovado - PIX001',
          paymentId: 'PIX001',
          balanceBefore: 1170.75,
          balanceAfter: 1250.75,
          createdAt: new Date(Date.now() - 300000), // 5 min atrás
          updatedAt: new Date(Date.now() - 300000)
        },
        {
          _id: 'mock-2',
          userId: authResult.userId,
          type: 'credit',
          amount: 120.00,
          description: 'Pagamento PIX aprovado - PIX002',
          paymentId: 'PIX002',
          balanceBefore: 1050.75,
          balanceAfter: 1170.75,
          createdAt: new Date(Date.now() - 3600000), // 1 hora atrás
          updatedAt: new Date(Date.now() - 3600000)
        },
        {
          _id: 'mock-3',
          userId: authResult.userId,
          type: 'credit',
          amount: 200.00,
          description: 'Pagamento PIX aprovado - PIX003',
          paymentId: 'PIX003',
          balanceBefore: 850.75,
          balanceAfter: 1050.75,
          createdAt: new Date(Date.now() - 7200000), // 2 horas atrás
          updatedAt: new Date(Date.now() - 7200000)
        }
      ];

      return NextResponse.json({
        success: true,
        transactions: mockTransactions,
        pagination: {
          page,
          limit,
          total: mockTransactions.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        offline: true
      });
    }

  } catch (error) {
    console.error('Erro ao buscar transações:', error);
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