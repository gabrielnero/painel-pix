import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Usar mongoose para buscar e atualizar
    const { Payment } = await import('@/lib/models');
    
    // Buscar todos os pagamentos pendentes do usuário
    const pendingPayments = await Payment.find({
      userId: authResult.userId,
      status: 'pending'
    });

    if (pendingPayments.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum pagamento pendente encontrado'
      });
    }

    // Cancelar todos os pagamentos pendentes
    const result = await Payment.updateMany(
      {
        userId: authResult.userId,
        status: 'pending'
      },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: 'Cancelado pelo usuário - todos pendentes'
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Pagamentos cancelados com sucesso',
      canceledCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Erro ao cancelar todos os pagamentos pendentes:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 