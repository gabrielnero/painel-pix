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
      await connectToDatabase();

      // Buscar todos os pagamentos do usuário
      const payments = await Payment.find({ userId: authResult.userId });

      // Calcular estatísticas
      const totalPayments = payments.length;
      const paidPayments = payments.filter(p => p.status === 'paid').length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      // Calcular crescimento mensal (mock por enquanto)
      const monthlyGrowth = 0;
      const weeklyGrowth = 0;

      const stats = {
        totalPayments,
        totalAmount,
        pendingPayments,
        paidPayments,
        monthlyGrowth,
        weeklyGrowth
      };

      return NextResponse.json({
        success: true,
        stats
      });

    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com o banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
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