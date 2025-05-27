'use client';

import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaTimes, 
  FaCheck, 
  FaUser, 
  FaComment, 
  FaMoneyBillWave, 
  FaStar,
  FaGift,
  FaExclamationTriangle,
  FaInfo,
  FaCheckCircle
} from 'react-icons/fa';

interface Notification {
  id: string;
  type: 'comment' | 'payment' | 'badge' | 'system' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  data?: any;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simular notificações para demonstração
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'comment',
        title: 'Novo comentário',
        message: 'João comentou no seu perfil',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionUrl: '/profile/joao'
      },
      {
        id: '2',
        type: 'payment',
        title: 'Pagamento recebido',
        message: 'Você recebeu R$ 25,00',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false
      },
      {
        id: '3',
        type: 'badge',
        title: 'Nova conquista!',
        message: 'Você desbloqueou o badge "Veterano"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true
      },
      {
        id: '4',
        type: 'system',
        title: 'Manutenção programada',
        message: 'Sistema será atualizado amanhã às 02:00',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment':
        return <FaComment className="text-blue-500" />;
      case 'payment':
        return <FaMoneyBillWave className="text-green-500" />;
      case 'badge':
        return <FaStar className="text-yellow-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-orange-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'info':
        return <FaInfo className="text-blue-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificações
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title="Marcar como lida"
                            >
                              <FaCheck className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Remover notificação"
                          >
                            <FaTimes className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                      
                      {notification.actionUrl && (
                        <button
                          onClick={() => {
                            markAsRead(notification.id);
                            // Aqui você navegaria para a URL
                            console.log('Navigate to:', notification.actionUrl);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
                        >
                          Ver detalhes →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FaBell className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma notificação no momento
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-center">
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 