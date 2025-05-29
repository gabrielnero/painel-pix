import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ShoutboxMessage } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE - Limpar todas as mensagens da shoutbox (apenas admins)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem limpar o chat.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    // Deletar todas as mensagens
    const result = await ShoutboxMessage.deleteMany({});
    
    console.log(`🗑️ Chat limpo pelo admin ${authResult.userId}. ${result.deletedCount} mensagens removidas.`);
    
    return NextResponse.json({
      success: true,
      message: 'Chat limpo com sucesso',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Erro ao limpar chat:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 