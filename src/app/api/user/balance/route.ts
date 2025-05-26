import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

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

      // Buscar o usuário
      const user = await User.findById(authResult.userId);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        balance: user.balance || 0
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
    console.error('Erro ao buscar saldo do usuário:', error);
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