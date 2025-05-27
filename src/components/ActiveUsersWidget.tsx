'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUser, FaCircle, FaCrown, FaEye } from 'react-icons/fa';

interface ActiveUser {
  username: string;
  profilePicture?: string;
  role: 'user' | 'moderator' | 'admin';
  isVip: boolean;
  lastSeen: Date;
  isOnline: boolean;
}

export default function ActiveUsersWidget() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular usuários ativos para demonstração
    const mockActiveUsers: ActiveUser[] = [
      {
        username: 'admin',
        role: 'admin',
        isVip: false,
        lastSeen: new Date(),
        isOnline: true
      },
      {
        username: 'moderador1',
        role: 'moderator',
        isVip: true,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000),
        isOnline: true
      },
      {
        username: 'joao123',
        role: 'user',
        isVip: false,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        isOnline: true
      },
      {
        username: 'maria_vip',
        role: 'user',
        isVip: true,
        lastSeen: new Date(Date.now() - 10 * 60 * 1000),
        isOnline: false
      },
      {
        username: 'pedro_dev',
        role: 'user',
        isVip: false,
        lastSeen: new Date(Date.now() - 15 * 60 * 1000),
        isOnline: false
      }
    ];

    setActiveUsers(mockActiveUsers);
    setLoading(false);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 dark:text-red-400';
      case 'moderator':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Usuários Ativos
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const onlineUsers = activeUsers.filter(user => user.isOnline);
  const recentUsers = activeUsers.filter(user => !user.isOnline);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Usuários Ativos
        </h3>
        <div className="flex items-center space-x-2">
          <FaCircle className="text-green-500 h-2 w-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {/* Online Users */}
        {onlineUsers.map((user) => (
          <Link
            key={`online-${user.username}`}
            href={`/profile/${user.username}`}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-sm" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className={`text-sm font-medium truncate ${getRoleColor(user.role)}`}>
                  {user.username}
                </p>
                {user.isVip && (
                  <FaCrown className="text-yellow-500 h-3 w-3" title="VIP" />
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Online agora
              </p>
            </div>
            
            <FaEye className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}

        {/* Divider */}
        {onlineUsers.length > 0 && recentUsers.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
        )}

        {/* Recently Active Users */}
        {recentUsers.slice(0, 3).map((user) => (
          <Link
            key={`recent-${user.username}`}
            href={`/profile/${user.username}`}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-sm" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.username}
                </p>
                {user.isVip && (
                  <FaCrown className="text-yellow-500 h-3 w-3" title="VIP" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Visto {formatLastSeen(user.lastSeen)}
              </p>
            </div>
            
            <FaEye className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {activeUsers.length === 0 && (
        <div className="text-center py-8">
          <FaUser className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhum usuário ativo no momento
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/users"
          className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          Ver todos os usuários →
        </Link>
      </div>
    </div>
  );
} 