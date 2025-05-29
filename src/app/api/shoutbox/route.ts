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
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
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