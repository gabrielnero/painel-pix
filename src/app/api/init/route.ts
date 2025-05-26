import { createAdminUser } from '@/lib/adminCredentials';
import { NextResponse } from 'next/server';

// ROTA PERIGOSA - Deve ser bloqueada em produção
export async function GET() {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Route not available in production' },
      { status: 404 }
    );
  }

  try {
    console.log('Iniciando inicialização do sistema...');
    
    // Chamar a função para criar o admin
    const result = await createAdminUser();
    
    if (!result.success) {
      console.error('Falha na inicialização:', result.message);
      return NextResponse.json(
        { 
          success: false, 
          message: result.message
        },
        { status: 500 }
      );
    }
    
    console.log('Inicialização concluída com sucesso');
    return NextResponse.json({
      success: true,
      message: 'Inicialização concluída com sucesso',
      adminExists: !!result.user
    });
  } catch (error) {
    console.error('Erro na inicialização:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro na inicialização'
      },
      { status: 500 }
    );
  }
} 