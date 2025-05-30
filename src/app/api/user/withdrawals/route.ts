import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal } from '@/lib/models';

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

    await connectToDatabase();

    // Buscar saques do usuário
    const withdrawals = await Withdrawal.find({
      userId: authResult.userId
    })
    .sort({ requestedAt: -1 })
    .limit(20);

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w._id,
        amount: w.amount,
        pixKey: w.pixKey,
        pixKeyType: w.pixKeyType,
        status: w.status,
        requestedAt: w.requestedAt,
        reviewedAt: w.reviewedAt,
        processedAt: w.processedAt,
        reviewNotes: w.reviewNotes
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao listar saques do usuário:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao listar saques',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 