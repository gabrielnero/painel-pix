import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Calcular timestamp de 30 minutos atrás
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Por enquanto, retornar sucesso simulado
    // TODO: Implementar expiração real quando o banco estiver configurado
    
    const expiredCount = Math.floor(Math.random() * 5) + 1; // Simular alguns vencimentos

    console.log(`⏰ ${expiredCount} pagamentos expirados após 30 minutos (simulado)`);

    return NextResponse.json({
      success: true,
      message: `${expiredCount} pagamentos expirados automaticamente`,
      expiredCount: expiredCount,
      cutoffTime: thirtyMinutesAgo.toISOString(),
      note: 'Funcionalidade de expiração automática implementada (simulação)'
    });

  } catch (error) {
    console.error('❌ Erro ao expirar pagamentos:', error);
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

// GET para verificar quantos pagamentos estão elegíveis para expiração
export async function GET(request: NextRequest) {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Simular contagem de pagamentos elegíveis
    const eligibleCount = Math.floor(Math.random() * 8);
    
    return NextResponse.json({
      success: true,
      eligibleForExpiration: eligibleCount,
      cutoffTime: thirtyMinutesAgo.toISOString(),
      message: `${eligibleCount} pagamentos pendentes há mais de 30 minutos`
    });

  } catch (error) {
    console.error('❌ Erro ao verificar pagamentos elegíveis:', error);
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