import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Conectar ao banco
    await connectToDatabase();

    // Buscar usuário admin
    const adminUser = await User.findOne({ username: 'admin' });

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuário admin não encontrado',
        suggestion: 'Execute o sistema em modo desenvolvimento para criar o usuário admin automaticamente'
      });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        balance: adminUser.balance,
        createdAt: adminUser.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao buscar admin:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 