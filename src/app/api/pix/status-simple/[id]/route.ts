import { NextRequest, NextResponse } from 'next/server';
import { primepagService } from '@/lib/services/primepag';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação básica
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    console.log('Status simples - consultando:', id);

    // Consultar status do pagamento diretamente
    const payment = await primepagService.getPixStatus(id);

    console.log('Status simples - resposta:', {
      status: payment.status,
      value_cents: payment.value_cents,
      paid_at: payment.paid_at,
      reference_code: payment.reference_code
    });

    return NextResponse.json({
      success: true,
      payment,
      timestamp: new Date().toISOString(),
      user: {
        id: authResult.userId,
        role: authResult.role
      }
    });
  } catch (error) {
    console.error('Erro ao consultar status simples do PIX:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao consultar status do pagamento',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 