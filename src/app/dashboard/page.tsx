'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaCreditCard, 
  FaHistory, 
  FaUser, 
  FaSignOutAlt, 
  FaChartLine,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaEye,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userBalance, setUserBalance] = useState(0);
  const [userInfo, setUserInfo] = useState({ username: 'Usuário', role: 'user' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Buscar dados do usuário com fallback
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar informações do usuário primeiro
        try {
          const userResponse = await fetch('/api/auth/check');
          const userData = await userResponse.json();
          
          if (userData.success && userData.user) {
            setUserInfo({
              username: userData.user.username || 'Usuário',
              role: userData.user.role || 'user'
            });
          } else {
            // Fallback para usuário não autenticado
            console.warn('Usuário não autenticado, usando dados padrão');
            setUserInfo({ username: 'Usuário', role: 'user' });
          }
        } catch (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
          setUserInfo({ username: 'Usuário', role: 'user' });
        }

        // Buscar saldo com fallback
        try {
          const balanceResponse = await fetch('/api/user/balance');
          const balanceData = await balanceResponse.json();
          
          if (balanceData.success) {
            setUserBalance(balanceData.balance || 0);
          } else {
            setUserBalance(0);
          }
        } catch (balanceError) {
          console.error('Erro ao buscar saldo:', balanceError);
          setUserBalance(0);
        }

        // Buscar estatísticas com fallback
        try {
          const statsResponse = await fetch('/api/user/stats');
          const statsData = await statsResponse.json();
          
          if (statsData.success) {
            setStats(statsData.stats);
          } else {
            // Usar dados padrão se a API falhar
            setStats({
              totalPayments: 0,
              totalAmount: 0,
              pendingPayments: 0,
              paidPayments: 0,
              monthlyGrowth: 0,
              weeklyGrowth: 0
            });
          }
        } catch (statsError) {
          console.error('Erro ao buscar estatísticas:', statsError);
          setStats({
            totalPayments: 0,
            totalAmount: 0,
            pendingPayments: 0,
            paidPayments: 0,
            monthlyGrowth: 0,
            weeklyGrowth: 0
          });
        }

      } catch (error) {
        console.error('Erro geral ao buscar dados:', error);
        setError('Erro ao carregar dados. Usando modo offline.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Atualizar saldo a cada 30 segundos (menos frequente para evitar erros)
    const balanceInterval = setInterval(() => {
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserBalance(data.balance || 0);
          }
        })
        .catch(error => {
          console.error('Erro ao atualizar saldo:', error);
        });
    }, 30000);
    
    return () => clearInterval(balanceInterval);
  }, []);

  // Dados de estatísticas (carregados da API)
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    paidPayments: 0,
    monthlyGrowth: 0,
    weeklyGrowth: 0
  });

  // Dados de pagamentos recentes (carregados da API)
  const [recentPayments, setRecentPayments] = useState<Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    time: string;
  }>>([]);

  const quickActions = [
    {
      title: 'Gerar PIX',
      description: 'Criar novo pagamento PIX',
      icon: FaPlus,
      href: '/dashboard/pix',
      color: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-white'
    },
    {
      title: 'Minha Carteira',
      description: 'Ver saldo e transações',
      icon: FaMoneyBillWave,
      href: '/dashboard/wallet',
      color: 'bg-green-500 hover:bg-green-600',
      iconColor: 'text-white'
    },
    {
      title: 'Ver Histórico',
      description: 'Consultar pagamentos anteriores',
      icon: FaHistory,
      href: '/dashboard/payment-history',
      color: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-white'
    },
    {
      title: 'Meu Perfil',
      description: 'Gerenciar conta e configurações',
      icon: FaUser,
      href: '/dashboard/profile',
      color: 'bg-purple-500 hover:bg-purple-600',
      iconColor: 'text-white'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
              <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bem-vindo de volta, {userInfo.username}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Aqui está um resumo da sua atividade hoje
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleString('pt-BR')}
              </div>
              {/* Saldo simplificado */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <FaMoneyBillWave className="h-4 w-4" />
                <span className="text-sm font-medium">
                  R$ {userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Saldo da Carteira */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Saldo da Carteira</p>
                <p className="text-2xl font-bold">
                  R$ {userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FaMoneyBillWave className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-100">
                Disponível para saque
              </span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPayments}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FaChartLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                +{stats.monthlyGrowth}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FaMoneyBillWave className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <FaArrowDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {Math.abs(stats.weeklyGrowth)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs semana anterior</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <FaClock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Aguardando confirmação
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagamentos Confirmados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.paidPayments}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FaCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Taxa de sucesso: {stats.totalPayments > 0 ? ((stats.paidPayments / stats.totalPayments) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ações Rápidas</h2>
            <div className="space-y-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${action.color} transition-colors duration-300`}>
                      <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atividade Recente</h2>
              <Link
                href="/dashboard/payment-history"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center"
              >
                Ver tudo
                <FaEye className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${
                            payment.status === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900/20' 
                              : 'bg-yellow-100 dark:bg-yellow-900/20'
                          }`}>
                            {payment.status === 'paid' ? (
                              <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <FaClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {payment.customer}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.id} • {payment.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            R$ {payment.amount.toFixed(2)}
                          </p>
                          <p className={`text-sm font-medium ${
                            payment.status === 'paid' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <FaClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma atividade recente encontrada
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* User Profile Card */}
            <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Seu Perfil</h3>
                  <div className="space-y-1 text-blue-100">
                    <p className="text-sm">Usuário: <span className="font-medium text-white">{userInfo.username}</span></p>
                    <p className="text-sm">Tipo: <span className="font-medium text-white">
                      {userInfo.role === 'admin' ? 'Administrador' : 
                       userInfo.role === 'moderator' ? 'Moderador' : 'Usuário'}
                    </span></p>
                    <p className="text-sm">Status: <span className="font-medium text-white">Ativo</span></p>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/dashboard/profile"
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors text-center"
                  >
                    Editar Perfil
                  </Link>
                  <Link
                    href="/logout"
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center"
                  >
                    <FaSignOutAlt className="mr-2 h-4 w-4" />
                    Sair
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 