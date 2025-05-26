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
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com o banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
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