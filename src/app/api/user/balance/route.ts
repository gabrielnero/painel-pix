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
      // Se estiver em modo offline ou erro de banco, retornar dados mock
      console.log('Modo offline - retornando saldo mock');
      
      // Retornar saldo mock baseado no usuário
      const mockBalance = authResult.userId === 'local-admin-id' ? 1250.75 : 0;
      
      return NextResponse.json({
        success: true,
        balance: mockBalance,
        offline: true
      });
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