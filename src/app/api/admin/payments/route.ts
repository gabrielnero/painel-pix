import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e se é admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    try {
      // Tentar conectar ao banco de dados
      await connectToDatabase();

      // Construir query de busca
      let query: any = {};
      
      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { referenceCode: { $regex: search, $options: 'i' } }
        ];
      }

      // Buscar pagamentos
      const skip = (page - 1) * limit;
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email role isVip');

      const total = await Payment.countDocuments(query);

      // Calcular estatísticas
      const stats = await Payment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      return NextResponse.json({
        success: true,
        payments,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1
        }
      });

    } catch (dbError) {
      // Modo offline - retornar dados mock
      console.log('Modo offline - retornando pagamentos mock');
      
      const mockPayments = [
        {
          _id: 'payment-1',
          userId: {
            _id: 'user-1',
            username: 'admin',
            email: 'admin@t0p1.com',
            role: 'admin',
            isVip: true
          },
          amount: 100.00,
          description: 'Pagamento PIX - Teste',
          status: 'paid',
          referenceCode: 'PIX001',
          createdAt: new Date(Date.now() - 300000),
          paidAt: new Date(Date.now() - 240000)
        },
        {
          _id: 'payment-2',
          userId: {
            _id: 'user-2',
            username: 'usuario1',
            email: 'usuario1@email.com',
            role: 'user',
            isVip: false
          },
          amount: 75.50,
          description: 'Pagamento PIX - Compra',
          status: 'pending',
          referenceCode: 'PIX002',
          createdAt: new Date(Date.now() - 900000),
          paidAt: null
        },
        {
          _id: 'payment-3',
          userId: {
            _id: 'user-3',
            username: 'usuario2',
            email: 'usuario2@email.com',
            role: 'user',
            isVip: false
          },
          amount: 200.00,
          description: 'Pagamento PIX - Serviço',
          status: 'expired',
          referenceCode: 'PIX003',
          createdAt: new Date(Date.now() - 1800000),
          paidAt: null
        }
      ];

      const mockStats = [
        { _id: 'paid', count: 1, totalAmount: 100.00 },
        { _id: 'pending', count: 1, totalAmount: 75.50 },
        { _id: 'expired', count: 1, totalAmount: 200.00 }
      ];

      return NextResponse.json({
        success: true,
        payments: mockPayments,
        stats: mockStats,
        pagination: {
          page: 1,
          limit: 10,
          total: mockPayments.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        offline: true
      });
    }

  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
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