import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

// GET - Listar usuários com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const vip = searchParams.get('vip') || '';
    
    // Construir filtros
    const filters: any = {
      banned: false // Não mostrar usuários banidos
    };
    
    // Filtro de busca por username
    if (search) {
      filters.username = { $regex: search, $options: 'i' };
    }
    
    // Filtro por role
    if (role && role !== 'all') {
      filters.role = role;
    }
    
    // Filtro por VIP
    if (vip && vip !== 'all') {
      filters.isVip = vip === 'true';
    }
    
    // Calcular skip para paginação
    const skip = (page - 1) * limit;
    
    // Buscar usuários
    const users = await User.find(filters)
      .select('username profilePicture role isVip createdAt lastLogin profileViews isProfilePublic totalEarnings')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Contar total de usuários
    const total = await User.countDocuments(filters);
    
    // Calcular paginação
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 