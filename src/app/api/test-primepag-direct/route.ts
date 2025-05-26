import { NextRequest, NextResponse } from 'next/server';
import { primepagService } from '@/lib/services/primepag';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceCode } = body;

    if (!referenceCode) {
      return NextResponse.json(
        { success: false, message: 'Reference code é obrigatório' },
        { status: 400 }
      );
    }

    console.log('Teste direto - consultando status para:', referenceCode);

    // Chamar diretamente o serviço PrimePag sem validações
    const payment = await primepagService.getPixStatus(referenceCode);

    console.log('Teste direto - resposta da API:', payment);

    return NextResponse.json({
      success: true,
      payment,
      timestamp: new Date().toISOString(),
      referenceCode
    });
  } catch (error) {
    console.error('Erro no teste direto da API PrimePag:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao consultar status diretamente',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 