import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { User } from '@/lib/models';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Não autenticado'
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Token inválido'
      });
    }

    // Verificação especial para ambiente de desenvolvimento (apenas para admin local)
    if (process.env.NODE_ENV === 'development' && decoded.userId === 'local-admin-id') {
      console.log('Usando autenticação local para desenvolvimento');
      
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: 'local-admin-id',
          username: 'admin',
          email: 'admin@painel.com',
          role: 'admin',
          profilePicture: null,
          balance: 0 // Saldo padrão para admin local
        },
        devMode: true
      });
    }

    try {
      // Verificar se o usuário existe
      await connectToDatabase();
    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      
      // Em produção, retornar erro se não conseguir conectar ao banco
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Erro de conexão com o banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
    
    // Buscar usuário incluindo o saldo
    const user = await User.findById(decoded.userId).select('username email role profilePicture balance');

    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar lastLogin
    await User.findByIdAndUpdate(decoded.userId, { lastLogin: new Date() });

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        balance: user.balance || 0 // Incluir saldo na resposta
      }
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: 'Erro ao verificar autenticação',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 