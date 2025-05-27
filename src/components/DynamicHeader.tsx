'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaCrown } from 'react-icons/fa';
import UserInfo from './UserInfo';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';

export default function DynamicHeader() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.success && data.user) {
          setUserRole(data.user.role);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erro ao verificar papel do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-block group">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition-colors cursor-pointer font-mono">
              t0p<span className="text-green-500 dark:text-green-400">.1</span>
              <span className="text-blue-500 dark:text-blue-400 ml-1">X Receiver</span>
              <span className="text-green-500 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">.sh</span>
            </h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <NotificationCenter />
                <UserInfo />
              </>
            )}
            
            <ThemeToggle />
            
            {!loading && userRole === 'admin' && (
              <Link 
                href="/admin" 
                className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-mono text-sm"
              >
                <FaCrown className="mr-2" />
                ADMIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 