import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { notificationService } from '@/lib/services/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const notifications = await notificationService.getUserNotifications(authResult.userId);
    const unreadCount = await notificationService.getUnreadCount(authResult.userId);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notificationId } = body;

    switch (action) {
      case 'mark_read':
        if (!notificationId) {
          return NextResponse.json(
            { success: false, message: 'ID da notificação é obrigatório' },
            { status: 400 }
          );
        }
        
        const marked = await notificationService.markAsRead(authResult.userId, notificationId);
        if (!marked) {
          return NextResponse.json(
            { success: false, message: 'Erro ao marcar notificação como lida' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Notificação marcada como lida'
        });

      case 'mark_all_read':
        const markedAll = await notificationService.markAllAsRead(authResult.userId);
        if (!markedAll) {
          return NextResponse.json(
            { success: false, message: 'Erro ao marcar todas as notificações como lidas' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Todas as notificações foram marcadas como lidas'
        });

      case 'delete':
        if (!notificationId) {
          return NextResponse.json(
            { success: false, message: 'ID da notificação é obrigatório' },
            { status: 400 }
          );
        }
        
        const deleted = await notificationService.deleteNotification(authResult.userId, notificationId);
        if (!deleted) {
          return NextResponse.json(
            { success: false, message: 'Erro ao deletar notificação' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Notificação deletada'
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Ação inválida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 