import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ShoutboxMessage, User } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Buscar mensagens da shoutbox
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Buscar mensagens mais recentes
    const messages = await ShoutboxMessage.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Reverter ordem para mostrar mais antigas primeiro
    const orderedMessages = messages.reverse();
    
    return NextResponse.json({
      success: true,
      messages: orderedMessages
    });
    
  } catch (error) {
    console.error('Erro ao buscar mensagens da shoutbox:', error);
    
    // Retornar mensagens mock em caso de erro
    const mockMessages = [
      {
        _id: 'msg1',
        userId: 'user1',
        username: 'Admin',
        message: '🎉 Bem-vindos ao sistema! O fórum está funcionando perfeitamente.',
        role: 'admin',
        createdAt: new Date(Date.now() - 300000), // 5 min atrás
      },
      {
        _id: 'msg2',
        userId: 'user2',
        username: 'Usuario1',
        message: 'Olá pessoal! Como estão? O sistema está muito bom!',
        role: 'user',
        createdAt: new Date(Date.now() - 600000), // 10 min atrás
      },
      {
        _id: 'msg3',
        userId: 'user3',
        username: 'Moderador',
        message: 'Lembrem-se de seguir as regras do fórum. Qualquer dúvida, me chamem!',
        role: 'moderator',
        createdAt: new Date(Date.now() - 900000), // 15 min atrás
      }
    ];
    
    return NextResponse.json({
      success: true,
      messages: mockMessages,
      offline: true
    });
  }
}

// POST - Enviar nova mensagem
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { message } = await request.json();
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }
    
    if (message.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Mensagem muito longa (máximo 500 caracteres)' },
        { status: 400 }
      );
    }
    
    // Buscar dados do usuário
    const user = await User.findById(authResult.userId).select('username role profilePicture');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Criar nova mensagem
    const newMessage = new ShoutboxMessage({
      userId: authResult.userId,
      username: user.username,
      message: message.trim(),
      role: user.role,
      profilePicture: user.profilePicture
    });
    
    await newMessage.save();
    
    return NextResponse.json({
      success: true,
      message: newMessage,
      messageText: 'Mensagem enviada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 