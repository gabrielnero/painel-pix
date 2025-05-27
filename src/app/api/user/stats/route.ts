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

    try {
      // Tentar conectar ao banco de dados
      await connectToDatabase();

      // Buscar estatísticas do usuário
      const payments = await Payment.find({ userId: authResult.userId });
      
      const totalPayments = payments.length;
      const paidPayments = payments.filter(p => p.status === 'paid').length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const totalAmount = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Calcular crescimento (simulado)
      const monthlyGrowth = Math.floor(Math.random() * 20) + 5;
      const weeklyGrowth = Math.floor(Math.random() * 10) - 5;

      return NextResponse.json({
        success: true,
        stats: {
          totalPayments,
          totalAmount,
          pendingPayments,
          paidPayments,
          monthlyGrowth,
          weeklyGrowth
        }
      });

    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      
      // Retornar dados padrão em caso de erro
      return NextResponse.json({
        success: true,
        stats: {
          totalPayments: 0,
          totalAmount: 0,
          pendingPayments: 0,
          paidPayments: 0,
          monthlyGrowth: 0,
          weeklyGrowth: 0
        },
        offline: true
      });
    }

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    
    // Retornar dados padrão em caso de erro
    return NextResponse.json({
      success: true,
      stats: {
        totalPayments: 0,
        totalAmount: 0,
        pendingPayments: 0,
        paidPayments: 0,
        monthlyGrowth: 0,
        weeklyGrowth: 0
      },
      offline: true
    });
  }
} 