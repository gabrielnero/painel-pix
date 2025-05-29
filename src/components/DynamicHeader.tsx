'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaCrown, FaBars, FaTimes, FaWallet, FaMoneyBillWave, FaHistory, FaQrcode } from 'react-icons/fa';
import UserInfo from './UserInfo';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';

export default function DynamicHeader() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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
        // Se falhar a verificação, ainda assim mostrar os botões se estivermos em uma página do dashboard
        if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
          setIsAuthenticated(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Verificar se estamos em páginas que deveriam mostrar navegação - após montar
  const shouldShowNavigation = mounted && 
    (isAuthenticated || (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')));

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-block group">
            <h1 className="text-2xl font-bold font-mono cursor-pointer flex items-center">
              <span className="text-red-600 dark:text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                t
              </span>
              <span className="text-red-500 dark:text-red-600 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                0
              </span>
              <span className="text-red-600 dark:text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                p
              </span>
              <span className="text-red-500 dark:text-red-600 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                .
              </span>
              <span className="text-red-600 dark:text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                1
              </span>
              <span className="mx-2 text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300 transition-colors">
                X
              </span>
              <span className="text-red-500 dark:text-red-600 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                Receiver
              </span>
              <span className="text-red-600 dark:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                .sh
              </span>
            </h1>
          </Link>

          {shouldShowNavigation && (
            <>
              <nav className="hidden md:flex items-center space-x-6 ml-8">
                <Link 
                  href="/dashboard/generate-pix" 
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <FaQrcode className="h-4 w-4" />
                  <span>Gerar PIX</span>
                </Link>
                <Link 
                  href="/dashboard/withdraw" 
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <FaMoneyBillWave className="h-4 w-4" />
                  <span>Saque</span>
                </Link>
                <Link 
                  href="/dashboard/history" 
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <FaHistory className="h-4 w-4" />
                  <span>Histórico</span>
                </Link>
                <Link 
                  href="/dashboard/wallet" 
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <FaWallet className="h-4 w-4" />
                  <span>Carteira</span>
                </Link>
              </nav>

              {/* Botão destacado para depósito */}
              <div className="hidden lg:flex">
                <Link 
                  href="/dashboard/generate-pix" 
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <FaQrcode className="h-4 w-4" />
                  <span>Depositar</span>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400"
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </>
          )}
          
          <div className="flex items-center space-x-4">
            {shouldShowNavigation && (
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

        {/* Mobile Menu Dropdown */}
        {shouldShowNavigation && isMobileMenuOpen && (
          <nav className="md:hidden mt-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/dashboard/generate-pix" 
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaQrcode className="h-4 w-4" />
                <span>Gerar PIX</span>
              </Link>
              <Link 
                href="/dashboard/withdraw" 
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaMoneyBillWave className="h-4 w-4" />
                <span>Saque</span>
              </Link>
              <Link 
                href="/dashboard/history" 
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaHistory className="h-4 w-4" />
                <span>Histórico</span>
              </Link>
              <Link 
                href="/dashboard/wallet" 
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaWallet className="h-4 w-4" />
                <span>Carteira</span>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
} 