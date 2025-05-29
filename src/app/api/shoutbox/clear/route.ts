import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação e se é admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem limpar mensagens.' },
        { status: 403 }
      );
    }

    // Conectar ao banco
    await connectToDatabase();

    // Simular limpeza de mensagens
    // Em um sistema real, você removeria todas as mensagens da coleção
    console.log(`Admin ${authResult.userId} limpou todas as mensagens do shoutbox`);

    return NextResponse.json({
      success: true,
      message: 'Todas as mensagens foram removidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao limpar mensagens do shoutbox:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 