import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

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

      // Buscar o usuário
      const user = await User.findById(authResult.userId).select('-password');
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Montar perfil do usuário
      const profile = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance || 0,
        totalEarnings: user.totalEarnings || 0,
        inviteCodes: user.inviteCode ? [user.inviteCode] : [],
        rankingPosition: 999, // Calcular posição real depois
        showInRanking: true, // Padrão true
        createdAt: user.createdAt
      };

      return NextResponse.json({
        success: true,
        profile
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
    console.error('Erro ao buscar perfil do usuário:', error);
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