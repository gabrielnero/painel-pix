import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Importar modelo
    const { Payment } = await import('@/lib/models');
    
    // Buscar pagamentos pendentes que expiraram (mais de 30 minutos)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const expiredPayments = await Payment.find({
      status: { $in: ['pending', 'awaiting_payment'] },
      createdAt: { $lt: thirtyMinutesAgo }
    });

    if (expiredPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum pagamento expirado encontrado',
        expiredCount: 0
      });
    }

    // Atualizar status para expirado
    const result = await Payment.updateMany(
      {
        status: { $in: ['pending', 'awaiting_payment'] },
        createdAt: { $lt: thirtyMinutesAgo }
      },
      {
        $set: {
          status: 'expired',
          expiredAt: new Date()
        }
      }
    );

    console.log(`🕐 ${result.modifiedCount} pagamentos expirados automaticamente`);

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} pagamentos expirados`,
      expiredCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Erro ao expirar pagamentos:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
} 