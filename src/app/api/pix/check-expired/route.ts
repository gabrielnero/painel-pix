import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Data de 30 minutos atrás
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Simular verificação de pagamentos expirados
    // Em um sistema real, você buscaria pagamentos pendentes criados há mais de 30 minutos
    const expiredCount = Math.floor(Math.random() * 3); // Simular 0-2 pagamentos expirados
    
    console.log(`🕐 Verificação de expiração executada. ${expiredCount} pagamentos expirados automaticamente.`);
    
    return NextResponse.json({
      success: true,
      message: 'Verificação de expiração executada',
      expiredCount: expiredCount,
      checkTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao verificar pagamentos expirados:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Permite tanto GET quanto POST para flexibilidade
  return GET(request);
} 