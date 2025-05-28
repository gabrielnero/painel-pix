import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Conectar ao banco
    await connectToDatabase();

    // Buscar o pagamento
    const payment = await Payment.findOne({
      $or: [
        { _id: id },
        { referenceCode: id },
        { idempotentId: id }
      ],
      userId: authResult.userId
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o pagamento pode ser cancelado
    if (payment.status !== 'pending') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Não é possível cancelar um pagamento ${payment.status === 'paid' ? 'já pago' : payment.status}` 
        },
        { status: 400 }
      );
    }

    // Atualizar status para cancelado
    payment.status = 'cancelled';
    payment.cancelledAt = new Date();
    await payment.save();

    console.log(`PIX cancelado: ${payment._id} pelo usuário ${authResult.userId}`);

    return NextResponse.json({
      success: true,
      message: 'PIX cancelado com sucesso',
      payment: {
        id: payment._id,
        status: payment.status,
        cancelledAt: payment.cancelledAt
      }
    });

  } catch (error) {
    console.error('Erro ao cancelar PIX:', error);
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