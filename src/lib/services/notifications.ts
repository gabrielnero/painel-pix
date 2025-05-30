import { connectToDatabase } from '@/lib/db';
import { Notification, User } from '@/lib/models';
import mongoose from 'mongoose';

export interface CreateNotificationData {
  userId: string;
  type: 'payment_approved' | 'withdrawal_approved' | 'withdrawal_rejected' | 'system_announcement' | 'invite_used';
  title: string;
  message: string;
  data?: any;
  expiresAt?: Date;
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async createNotification(data: CreateNotificationData): Promise<boolean> {
    try {
      await connectToDatabase();

      await Notification.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        expiresAt: data.expiresAt
      });

      console.log(`📢 Notificação criada para usuário ${data.userId}: ${data.title}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      return false;
    }
  }

  async createPaymentApprovedNotification(userId: string, amount: number, creditedAmount: number): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'payment_approved',
      title: '🎉 Pagamento Aprovado!',
      message: `Seu pagamento de R$ ${amount.toFixed(2).replace('.', ',')} foi aprovado. R$ ${creditedAmount.toFixed(2).replace('.', ',')} foram creditados na sua carteira.`,
      data: {
        amount,
        creditedAmount,
        timestamp: new Date()
      }
    });
  }

  async createWithdrawalApprovedNotification(userId: string, amount: number): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'withdrawal_approved',
      title: '✅ Saque Aprovado!',
      message: `Seu saque de R$ ${amount.toFixed(2).replace('.', ',')} foi aprovado e está sendo processado.`,
      data: {
        amount,
        timestamp: new Date()
      }
    });
  }

  async createWithdrawalRejectedNotification(userId: string, amount: number, reason?: string): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'withdrawal_rejected',
      title: '❌ Saque Rejeitado',
      message: `Seu saque de R$ ${amount.toFixed(2).replace('.', ',')} foi rejeitado. ${reason ? `Motivo: ${reason}` : 'Entre em contato com o suporte para mais informações.'}`,
      data: {
        amount,
        reason,
        timestamp: new Date()
      }
    });
  }

  async createInviteUsedNotification(userId: string, invitedUsername: string): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'invite_used',
      title: '👥 Convite Utilizado!',
      message: `O usuário ${invitedUsername} se registrou usando seu código de convite.`,
      data: {
        invitedUsername,
        timestamp: new Date()
      }
    });
  }

  async createSystemAnnouncementNotification(userId: string, title: string, message: string): Promise<boolean> {
    return this.createNotification({
      userId,
      type: 'system_announcement',
      title,
      message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira em 7 dias
    });
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      await connectToDatabase();

      const notifications = await Notification.find({
        userId: new mongoose.Types.ObjectId(userId)
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return notifications.map(notification => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        data: notification.data,
        timestamp: notification.createdAt
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return [];
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      await connectToDatabase();

      await Notification.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(notificationId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        { read: true }
      );

      return true;
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await connectToDatabase();

      await Notification.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), read: false },
        { read: true }
      );

      return true;
    } catch (error) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      await connectToDatabase();

      await Notification.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId)
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error);
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      await connectToDatabase();

      const count = await Notification.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        read: false
      });

      return count;
    } catch (error) {
      console.error('❌ Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  // Método para criar notificações em massa (para anúncios do sistema)
  async createBulkNotifications(userIds: string[], title: string, message: string): Promise<boolean> {
    try {
      await connectToDatabase();

      const notifications = userIds.map(userId => ({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'system_announcement' as const,
        title,
        message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira em 7 dias
      }));

      await Notification.insertMany(notifications);

      console.log(`📢 ${notifications.length} notificações em massa criadas`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar notificações em massa:', error);
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance(); 