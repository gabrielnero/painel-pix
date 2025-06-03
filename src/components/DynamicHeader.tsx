'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FaBars, 
  FaTimes, 
  FaQrcode, 
  FaMoneyBillWave, 
  FaHistory, 
  FaWallet, 
  FaCrown,
  FaStore,
  FaBitcoin,
  FaArrowRight
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import UserInfo from './UserInfo';
import NotificationCenter from './NotificationCenter';

export default function DynamicHeader() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.success && data.user) {
          setUserRole(data.user.role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Páginas onde não deve mostrar a navegação
  const hiddenPages = ['/login', '/register', '/', '/maintenance'];
  const shouldShowNavigation = !loading && userRole && !hiddenPages.includes(pathname);

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={userRole ? "/dashboard" : "/"} className="flex items-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 transition-colors cursor-pointer font-mono flex items-center">
              <span className="hover:text-red-700 transition-colors">t</span>
              <span className="hover:text-red-500 transition-colors">0</span>
              <span className="hover:text-red-700 transition-colors">p</span>
              <span className="hover:text-red-500 transition-colors">.</span>
              <span className="hover:text-red-700 transition-colors">1</span>
              <span className="mx-2 text-red-700 dark:text-red-400 hover:text-red-500 transition-colors">X</span>
              <span className="hover:text-red-700 transition-colors">R</span>
              <span className="hover:text-red-500 transition-colors">e</span>
              <span className="hover:text-red-700 transition-colors">c</span>
              <span className="hover:text-red-500 transition-colors">e</span>
              <span className="hover:text-red-700 transition-colors">i</span>
              <span className="hover:text-red-500 transition-colors">v</span>
              <span className="hover:text-red-700 transition-colors">e</span>
              <span className="hover:text-red-500 transition-colors">r</span>
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
                  href="/dashboard/store" 
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <FaStore className="h-4 w-4" />
                  <span>Store</span>
                </Link>
                <Link 
                  href="/dashboard/history" 
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
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

              {/* Botão destacado para depósito crypto */}
              <div className="hidden lg:flex">
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <FaBitcoin className="h-4 w-4" />
                  <span>Depositar</span>
                </button>
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
                href="/dashboard/store" 
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaStore className="h-4 w-4" />
                <span>Store</span>
              </Link>
              <Link 
                href="/dashboard/history" 
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
              <button 
                onClick={() => {
                  setShowDepositModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors px-2 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <FaBitcoin className="h-4 w-4" />
                <span>Depositar Crypto</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Modal de Depósito Crypto */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  🚀 Depósito Crypto
                </h3>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Deposite criptomoedas para usar em nossos serviços
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <div className="text-center">
                      <FaBitcoin className="text-3xl text-orange-500 mx-auto mb-2" />
                      <span className="text-sm font-medium">Bitcoin</span>
                      <p className="text-xs text-gray-500">BTC</p>
                    </div>
                  </div>
                  <div className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-center">
                      <div className="text-3xl text-blue-500 mx-auto mb-2">Ξ</div>
                      <span className="text-sm font-medium">Ethereum</span>
                      <p className="text-xs text-gray-500">ETH</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ✨ <strong>Vantagens do Crypto:</strong> Transações rápidas, seguras e globais. 
                    Valor mínimo: $100 USD
                  </p>
                </div>

                <Link 
                  href="/dashboard/crypto-deposit"
                  onClick={() => setShowDepositModal(false)}
                  className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  <FaBitcoin className="mr-2" />
                  Iniciar Depósito Crypto
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 