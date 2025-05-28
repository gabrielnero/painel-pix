'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
  }, []);

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