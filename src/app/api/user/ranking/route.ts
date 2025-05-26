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
      await connectToDatabase();

      // Buscar top 10 usuários por totalEarnings
      const topUsers = await User.find({ banned: false })
        .select('username totalEarnings')
        .sort({ totalEarnings: -1 })
        .limit(10);

      // Montar ranking
      const ranking = topUsers.map((user, index) => ({
        username: user.username,
        totalEarnings: user.totalEarnings || 0,
        position: index + 1,
        isCurrentUser: user._id.toString() === authResult.userId
      }));

      return NextResponse.json({
        success: true,
        ranking
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
    console.error('Erro ao buscar ranking:', error);
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