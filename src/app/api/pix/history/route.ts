import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
      await connectToDatabase();
      
      // Construir query de busca
      let query: any = { userId: authResult.userId };
      
      // Filtrar por status se especificado
      if (status && status !== 'all') {
        query.status = status;
      }

      // Filtrar por data se especificado
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      // Buscar pagamentos com paginação
      const skip = (page - 1) * limit;
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email');

      const total = await Payment.countDocuments(query);

      // Calcular estatísticas
      const allPayments = await Payment.find({ userId: authResult.userId });
      const stats = {
        total: allPayments.length,
        paid: allPayments.filter(p => p.status === 'paid').length,
        pending: allPayments.filter(p => p.status === 'pending').length,
        expired: allPayments.filter(p => p.status === 'expired').length,
        cancelled: allPayments.filter(p => p.status === 'cancelled').length,
        totalAmount: allPayments.reduce((sum, p) => sum + p.amount, 0),
        paidAmount: allPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0)
      };

      return NextResponse.json({
        success: true,
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        },
        stats
      });
    } catch (dbError) {
      console.error('Erro ao buscar pagamentos:', dbError);
      return NextResponse.json({
        success: true,
        payments: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        stats: {
          total: 0,
          paid: 0,
          pending: 0,
          expired: 0,
          cancelled: 0,
          totalAmount: 0,
          paidAmount: 0
        }
      });
    }
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao buscar histórico de pagamentos',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 