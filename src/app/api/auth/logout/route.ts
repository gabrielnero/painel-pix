import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Remover o cookie do token
    const cookieStore = cookies();
    cookieStore.delete('token');
    
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro durante logout:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao realizar logout',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 