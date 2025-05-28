import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

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

    // Conectar ao banco
    await connectToDatabase();

    // Buscar PIX pendente ou aguardando pagamento mais recente do usuário
    const activePix = await Payment.findOne({
      userId: authResult.userId,
      status: { $in: ['pending', 'awaiting_payment'] },
      expiresAt: { $gt: new Date() } // Não expirado
    }).sort({ createdAt: -1 }); // Mais recente primeiro

    if (!activePix) {
      return NextResponse.json({
        success: true,
        payment: null,
        message: 'Nenhum PIX ativo encontrado'
      });
    }

    console.log('📋 PIX ativo encontrado:', {
      id: activePix._id,
      referenceCode: activePix.referenceCode,
      status: activePix.status,
      amount: activePix.amount
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: activePix._id,
        amount: activePix.amount,
        description: activePix.description,
        status: activePix.status,
        pixCopiaECola: activePix.pixCopiaECola,
        qrCodeImage: activePix.qrCodeImage,
        referenceCode: activePix.referenceCode,
        expiresAt: activePix.expiresAt.toISOString(),
        createdAt: activePix.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar PIX ativo:', error);
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