import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Limpar o cookie de autenticação
    const cookieStore = cookies();
    cookieStore.delete('token');

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao fazer logout' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Suporte para GET também (compatibilidade)
  return POST(request);
} 