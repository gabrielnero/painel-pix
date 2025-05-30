import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal, User } from '@/lib/models';

export const dynamic = 'force-dynamic';

// GET - Listar saques para administradores
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filtros
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Buscar saques com informações do usuário
    const withdrawals = await Withdrawal.find(filter)
      .populate('userId', 'username email')
      .populate('reviewedBy', 'username')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Withdrawal.countDocuments(filter);

    // Estatísticas
    const stats = await Withdrawal.aggregate([
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
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('❌ Erro ao listar saques:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao listar saques',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 