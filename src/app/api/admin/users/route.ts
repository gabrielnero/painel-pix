import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';
import mongoose from 'mongoose';

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
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || '';

    try {
      // Tentar conectar ao banco de dados
      await connectToDatabase();

      // Construir query de busca
      let query: any = {};
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (filter) {
        if (filter === 'banned') {
          query.banned = true;
        } else if (filter === 'vip') {
          query.isVip = true;
        } else if (filter === 'admin') {
          query.role = 'admin';
        } else if (filter === 'moderator') {
          query.role = 'moderator';
        }
      }

      // Buscar usuários
      const skip = (page - 1) * limit;
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('invitedBy', 'username')
        .populate('bannedBy', 'username');

      const total = await User.countDocuments(query);

      return NextResponse.json({
        success: true,
        users,
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
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com o banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
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

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação e se é admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { userId, action, reason } = await request.json();

    try {
      await connectToDatabase();

      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      switch (action) {
        case 'ban':
          user.banned = true;
          user.bannedBy = authResult.userId ? new mongoose.Types.ObjectId(authResult.userId) : undefined;
          user.bannedAt = new Date();
          user.banReason = reason;
          break;
        
        case 'unban':
          user.banned = false;
          user.bannedBy = undefined;
          user.bannedAt = undefined;
          user.banReason = undefined;
          break;
        
        case 'makeVip':
          user.isVip = true;
          break;
        
        case 'removeVip':
          user.isVip = false;
          break;
        
        case 'makeAdmin':
          user.role = 'admin';
          break;
        
        case 'makeModerator':
          user.role = 'moderator';
          break;
        
        case 'makeUser':
          user.role = 'user';
          break;
        
        default:
          return NextResponse.json(
            { success: false, message: 'Ação inválida' },
            { status: 400 }
          );
      }

      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          banned: user.banned,
          isVip: user.isVip
        }
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
    console.error('Erro ao atualizar usuário:', error);
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