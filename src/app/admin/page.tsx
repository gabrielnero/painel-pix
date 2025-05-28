'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  FaUsers, 
  FaUserShield, 
  FaTicketAlt, 
  FaMoneyBillWave,
  FaChartLine,
  FaCrown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaUserPlus,
  FaBan,
  FaShieldAlt,
  FaGem,
  FaHome,
  FaCog,
  FaDownload
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Componente que só renderiza no cliente para evitar hidratação
const ClientOnlyWrapper = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), {
  ssr: false
});

interface DashboardStats {
  totalUsers: number;
  totalModerators: number;
  totalAdmins: number;
  bannedUsers: number;
  vipUsers: number;
  activeInvites: number;
  totalPayments: number;
  pendingPayments: number;
  paidPayments: number;
  totalRevenue: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
}

interface PrimepagAccount {
  id: number;
  name: string;
  data?: {
    account_balance?: {
      available_value_cents: number;
      blocked_value_cents: number;
      total_value_cents: number;
    };
    status?: string;
  };
  error?: string;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'payment_received' | 'user_banned' | 'user_promoted';
  description: string;
  timestamp: Date;
  user?: string;
  amount?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalModerators: 0,
    totalAdmins: 0,
    bannedUsers: 0,
    vipUsers: 0,
    activeInvites: 0,
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    weeklyGrowth: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [primepagAccounts, setPrimepagAccounts] = useState<PrimepagAccount[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchPrimepagBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch('/api/admin/primepag-balance');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success && Array.isArray(data.accounts)) {
        // Validar e sanitizar dados das contas com verificações mais rigorosas
        const validatedAccounts = data.accounts.map((account: any, index: number) => {
          // Garantir que account é um objeto válido
          if (!account || typeof account !== 'object') {
            return {
              id: index + 1,
              name: `Conta ${index + 1}`,
              data: null,
              error: 'Dados da conta inválidos'
            };
          }

          return {
            id: Number(account.id) || (index + 1),
            name: String(account.name || `Conta ${index + 1}`),
            data: account.data && typeof account.data === 'object' ? {
              ...account.data,
              account_balance: account.data.account_balance && typeof account.data.account_balance === 'object' ? {
                available_value_cents: Number(account.data.account_balance.available_value_cents) || 0,
                blocked_value_cents: Number(account.data.account_balance.blocked_value_cents) || 0,
                total_value_cents: Number(account.data.account_balance.total_value_cents) || 0
              } : null,
              status: String(account.data.status || 'unknown')
            } : null,
            error: account.error ? String(account.error) : null
          };
        });
        
        setPrimepagAccounts(validatedAccounts);
        console.log('✅ Saldos PrimePag carregados:', validatedAccounts);
      } else {
        console.warn('⚠️ Resposta inválida da API:', data);
        toast.error(data.message || 'Erro ao carregar saldos PrimePag');
        setPrimepagAccounts([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar saldos PrimePag:', error);
      toast.error(`Erro ao carregar saldos PrimePag: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setPrimepagAccounts([]);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Buscar estatísticas reais do banco de dados
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        } else {
          toast.error(data.message || 'Erro ao carregar estatísticas');
        }

        // Por enquanto, manter atividades recentes como mock até implementarmos um sistema de logs
        setRecentActivity([
          {
            id: '1',
            type: 'payment_received',
            description: 'Sistema carregado com sucesso',
            timestamp: new Date(),
            user: 'sistema'
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard');
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchPrimepagBalance();
  }, [fetchPrimepagBalance]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return <FaMoneyBillWave className="text-green-500" />;
      case 'user_registered':
        return <FaUserPlus className="text-blue-500" />;
      case 'user_banned':
        return <FaBan className="text-red-500" />;
      case 'user_promoted':
        return <FaCrown className="text-yellow-500" />;
      default:
        return <FaCheckCircle className="text-gray-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    return `${hours}h atrás`;
  };

  const formatCurrency = useCallback((cents: number): string => {
    try {
      const value = (cents || 0) / 100;
      return value.toFixed(2).replace('.', ',');
    } catch (error) {
      console.error('Erro ao formatar moeda:', error);
      return '0,00';
    }
  }, []);

  const primepagBalanceSection = useMemo(() => {
    if (primepagAccounts.length === 0) {
      return (
        <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          {loadingBalance ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando saldos...</p>
            </div>
          ) : (
            <>
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma conta PrimePag configurada ou erro ao carregar saldos
              </p>
            </>
          )}
        </div>
      );
    }

    return primepagAccounts.map((account) => {
      const accountKey = `account-${account.id}-${account.name}`;
      
      // Verificar se os dados da conta são válidos
      const hasValidBalance = account.data?.account_balance && 
        typeof account.data.account_balance === 'object' &&
        typeof account.data.account_balance.available_value_cents === 'number';
      
      return (
        <div key={accountKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" suppressHydrationWarning>
              {account.name || `Conta ${account.id}`}
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              account.data?.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : account.error
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`} suppressHydrationWarning>
              {account.error ? 'Erro' : account.data?.status || 'Desconhecido'}
            </div>
          </div>

          {account.error ? (
            <div className="text-red-600 dark:text-red-400 text-sm">
              <p className="font-medium">Erro ao carregar saldo:</p>
              <p className="mt-1 break-words" suppressHydrationWarning>{account.error}</p>
            </div>
          ) : hasValidBalance ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Disponível:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400" suppressHydrationWarning>
                  R$ {formatCurrency(account.data?.account_balance?.available_value_cents || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Bloqueado:</span>
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400" suppressHydrationWarning>
                  R$ {formatCurrency(account.data?.account_balance?.blocked_value_cents || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Saldo Total:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400" suppressHydrationWarning>
                  R$ {formatCurrency(account.data?.account_balance?.total_value_cents || 0)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm" suppressHydrationWarning>
              Dados de saldo não disponíveis
            </div>
          )}
        </div>
      );
    });
  }, [primepagAccounts, loadingBalance, formatCurrency]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Link href="/dashboard" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-4">
                  <FaHome className="mr-2" />
                  Dashboard
                </Link>
                <span className="text-gray-400">/</span>
                <span className="ml-2 text-gray-900 dark:text-white font-semibold">Admin Panel</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <FaShieldAlt className="mr-3 text-red-600" />
                Painel Administrativo
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Controle total da plataforma t0p.1
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {currentTime.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Receita Total */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Receita Total</p>
                <p className="text-2xl font-bold">
                  R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FaMoneyBillWave className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <FaArrowUp className="h-4 w-4 text-green-200 mr-1" />
              <span className="text-sm text-green-100 font-medium">
                +{stats.monthlyGrowth}%
              </span>
              <span className="text-sm text-green-200 ml-2">vs mês anterior</span>
            </div>
          </div>

          {/* Total de Usuários */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-sm">
                <FaCrown className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-gray-600 dark:text-gray-400">{stats.vipUsers} VIPs</span>
              </div>
              <div className="flex items-center text-sm">
                <FaBan className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-gray-600 dark:text-gray-400">{stats.bannedUsers} banidos</span>
              </div>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPayments}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FaChartLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-sm">
                <FaCheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600 dark:text-gray-400">{stats.paidPayments} pagos</span>
              </div>
              <div className="flex items-center text-sm">
                <FaClock className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-gray-600 dark:text-gray-400">{stats.pendingPayments} pendentes</span>
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Equipe</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalAdmins + stats.totalModerators}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <FaUserShield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-sm">
                <FaShieldAlt className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-gray-600 dark:text-gray-400">{stats.totalAdmins} admins</span>
              </div>
              <div className="flex items-center text-sm">
                <FaUserShield className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-gray-600 dark:text-gray-400">{stats.totalModerators} mods</span>
              </div>
            </div>
          </div>
        </div>

        {/* PrimePag Balance Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saldos PrimePag</h2>
            <button
              onClick={fetchPrimepagBalance}
              disabled={loadingBalance}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300"
            >
              {loadingBalance ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FaMoneyBillWave className="mr-2" />
              )}
              Atualizar Saldos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClientOnlyWrapper>
              {primepagBalanceSection}
            </ClientOnlyWrapper>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ações Rápidas</h2>
            <div className="space-y-4">
              <Link
                href="/admin/users"
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
                    <FaUsers className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Gerenciar Usuários
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Banir, promover e gerenciar contas
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/payments"
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors duration-300">
                    <FaMoneyBillWave className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Ver Pagamentos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monitorar todas as transações
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/withdrawals"
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 transition-colors duration-300">
                    <FaDownload className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                      Gerenciar Saques
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aprovar e processar saques
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/invites"
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors duration-300">
                    <FaTicketAlt className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Códigos de Convite
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerar e gerenciar convites
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/config"
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors duration-300">
                    <FaCog className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Configurações
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      API keys, PIX e sistema
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Atividade Recente</h2>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center">
                Ver tudo
                <FaEye className="ml-1 h-4 w-4" />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Carregando atividades...</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.user && `Usuário: ${activity.user}`} • {formatTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        {activity.amount && (
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              R$ {activity.amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Info */}
            <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informações do Sistema</h3>
                  <div className="space-y-1 text-blue-100">
                    <p className="text-sm">Versão: <span className="font-medium text-white">t0p.1 v2.1.0</span></p>
                    <p className="text-sm">Uptime: <span className="font-medium text-white">99.9%</span></p>
                    <p className="text-sm">Status: <span className="font-medium text-white">Online</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stats.activeInvites}</div>
                  <div className="text-sm text-blue-200">Convites Ativos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 