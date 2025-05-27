'use client';

import { useState, useEffect } from 'react';
import { FaUser, FaWallet, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';

interface UserData {
  username: string;
  profilePicture?: string;
  balance: number;
  role: 'user' | 'moderator' | 'admin';
  isVip: boolean;
}

export default function UserInfo() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser({
          username: data.user.username,
          profilePicture: data.user.profilePicture,
          balance: data.user.balance || 0,
          role: data.user.role,
          isVip: data.user.isVip || false
        });
      }
    } catch (error) {
      console.error('Erro ao buscar informações do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-500';
      case 'moderator':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ADM';
      case 'moderator':
        return 'MOD';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="hidden md:block">
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
          <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FaUser className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          {user.isVip && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">★</span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <div className="flex items-center space-x-2">
            <span className={`font-semibold text-sm ${getRoleColor(user.role)}`}>
              {user.username}
            </span>
            {getRoleBadge(user.role) && (
              <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                user.role === 'admin' 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              }`}>
                {getRoleBadge(user.role)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
            <FaWallet className="h-3 w-3" />
            <span className="font-medium text-green-600 dark:text-green-400">
              R$ {user.balance.toFixed(2)}
            </span>
          </div>
        </div>

        <FaChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`font-semibold text-sm ${getRoleColor(user.role)}`}>
                {user.username}
              </span>
              {getRoleBadge(user.role) && (
                <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                  user.role === 'admin' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {getRoleBadge(user.role)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <FaWallet className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-green-600 dark:text-green-400">
                R$ {user.balance.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="py-1">
            <Link
              href="/dashboard/profile"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowDropdown(false)}
            >
              Editar Perfil
            </Link>
            <Link
              href="/dashboard/payment-history"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowDropdown(false)}
            >
              Histórico
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowDropdown(false)}
              >
                Painel Admin
              </Link>
            )}
            <button
              onClick={async () => {
                setShowDropdown(false);
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (error) {
                  console.error('Erro ao fazer logout:', error);
                } finally {
                  // Sempre redirecionar, mesmo se houver erro
                  window.location.href = '/';
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 