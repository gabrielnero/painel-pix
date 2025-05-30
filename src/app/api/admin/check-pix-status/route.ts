import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { pixId, accountNumber = 1 } = await request.json();

    if (!pixId) {
      return NextResponse.json(
        { success: false, message: 'ID do PIX é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🔍 Consultando status do PIX: ${pixId} na conta ${accountNumber}`);

    // Consultar status do PIX
    const pixStatus = await primepagService.getPixPaymentStatus(pixId, accountNumber);

    console.log('📊 Status do PIX:', pixStatus);

    return NextResponse.json({
      success: true,
      pix: pixStatus,
      message: 'Status do PIX consultado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao consultar status do PIX:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao consultar status do PIX',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 