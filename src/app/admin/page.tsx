'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  FaDownload,
  FaWallet,
  FaQuestionCircle,
  FaSearch
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

interface PrimepagAccount {
  id: number;
  name: string;
  data?: {
    account?: {
      value_cents: number;
    };
    account_balance?: {
      available_value_cents?: number;
      blocked_value_cents?: number;
      total_value_cents?: number;
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
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [primepagAccounts, setPrimepagAccounts] = useState<PrimepagAccount[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [testWithdrawal, setTestWithdrawal] = useState({
    pixKey: '',
    pixKeyType: 'cpf',
    receiverName: '',
    receiverDocument: '',
    amount: 0,
    notes: '',
    loading: false
  });

  // Estado para o último PIX criado
  const [lastPixPayment, setLastPixPayment] = useState<{
    id: string;
    status: string;
    value_cents: number;
    receiver_name: string;
    pix_key: string;
    created_at: string;
  } | null>(null);

  const [pixStatusCheck, setPixStatusCheck] = useState({
    loading: false,
    lastChecked: null as Date | null
  });

  // Estado para histórico de saques administrativos
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [withdrawalSummary, setWithdrawalSummary] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estado para cancelar pagamentos pendentes
  const [cancellingPayments, setCancellingPayments] = useState(false);

  // Estado para expirar pagamentos automaticamente
  const [expiringPayments, setExpiringPayments] = useState(false);
  const [eligibleForExpiration, setEligibleForExpiration] = useState(0);

  useEffect(() => {
    // Inicializar no cliente para evitar problemas de hidratação
    setCurrentTime(new Date());
    
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
      console.log('📊 Resposta completa da API:', data);

      if (data.success && Array.isArray(data.accounts)) {
        // Validar e sanitizar dados das contas com verificações mais rigorosas
        const validatedAccounts = data.accounts.map((account: any, index: number) => {
          console.log(`🔍 Processando conta ${index + 1}:`, account);
          
          // Garantir que account é um objeto válido
          if (!account || typeof account !== 'object') {
            return {
              id: index + 1,
              name: `Conta ${index + 1}`,
              data: null,
              error: 'Dados da conta inválidos'
            };
          }

          // Verificar se tem dados válidos
          const hasAccountData = account.data && 
            typeof account.data === 'object' && 
            account.data.account && 
            typeof account.data.account.value_cents === 'number';

          console.log(`💰 Conta ${index + 1} - hasAccountData:`, hasAccountData);
          console.log(`💰 Conta ${index + 1} - value_cents:`, account.data?.account?.value_cents);

          return {
            id: Number(account.id) || (index + 1),
            name: String(account.name || `Conta ${index + 1}`),
            data: hasAccountData ? account.data : null,
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

  const handleProfitWithdrawal = async () => {
    if (!testWithdrawal.pixKey) {
      toast.error('Chave PIX é obrigatória');
      return;
    }

    if (!testWithdrawal.receiverDocument) {
      toast.error('CPF do destinatário é obrigatório');
      return;
    }

    if (!testWithdrawal.receiverName) {
      toast.error('Nome do destinatário é obrigatório');
      return;
    }

    if (!testWithdrawal.amount || testWithdrawal.amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    setTestWithdrawal(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('/api/admin/withdraw-profit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: testWithdrawal.amount,
          pixKey: testWithdrawal.pixKey,
          pixKeyType: testWithdrawal.pixKeyType,
          receiverName: testWithdrawal.receiverName,
          receiverDocument: testWithdrawal.receiverDocument,
          notes: testWithdrawal.notes
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Saque de lucro processado com sucesso!');
        console.log('Saque administrativo criado:', data.withdrawal);
        console.log('PIX Payment criado:', data.pixPayment);
        
        // Salvar o último PIX criado
        if (data.pixPayment) {
          setLastPixPayment(data.pixPayment);
        }
        
        // Limpar formulário
        setTestWithdrawal(prev => ({
          ...prev,
          pixKey: '',
          receiverName: '',
          receiverDocument: '',
          amount: 0,
          notes: ''
        }));

        // Atualizar saldos
        fetchPrimepagBalance();
        
        // Atualizar histórico de saques
        fetchWithdrawalHistory();
      } else {
        toast.error(data.message || 'Erro ao processar saque');
      }
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      toast.error('Erro ao processar saque');
    } finally {
      setTestWithdrawal(prev => ({ ...prev, loading: false }));
    }
  };

  const checkPixStatus = async () => {
    if (!lastPixPayment?.id) {
      toast.error('Nenhum PIX criado para consultar');
      return;
    }

    setPixStatusCheck(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('/api/admin/check-pix-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pixId: lastPixPayment.id,
          accountNumber: 1
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('🔍 Status do PIX:', data.pix);
        
        // Atualizar o status do último PIX
        setLastPixPayment(prev => prev ? { ...prev, status: data.pix.status } : null);
        setPixStatusCheck(prev => ({ ...prev, lastChecked: new Date() }));
        
        // Mostrar notificação baseada no status
        const statusMessages: Record<string, string> = {
          'auto_authorization': '🟡 PIX autorizado automaticamente',
          'authorization_pending': '🟠 PIX aguardando autorização',
          'sent': '🔵 PIX enviado para processamento',
          'completed': '🟢 PIX concluído com sucesso!',
          'failed': '🔴 PIX falhou',
          'cancelled': '⚫ PIX cancelado'
        };
        
        const message = statusMessages[data.pix.status] || `Status: ${data.pix.status}`;
        toast.success(message);
      } else {
        toast.error(data.message || 'Erro ao consultar status do PIX');
      }
    } catch (error) {
      console.error('Erro ao consultar status do PIX:', error);
      toast.error('Erro ao processar consulta de status');
    } finally {
      setPixStatusCheck(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchWithdrawalHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/admin/withdrawal-history?limit=10');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Histórico de saques carregado:', data);

      if (data.success) {
        setWithdrawalHistory(data.withdrawals || []);
        setWithdrawalSummary(data.summary || null);
      } else {
        console.warn('⚠️ Resposta inválida da API de histórico:', data);
        toast.error(data.message || 'Erro ao carregar histórico de saques');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico de saques:', error);
      toast.error(`Erro ao carregar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const cancelAllPendingPayments = async () => {
    if (!confirm('⚠️ Tem certeza que deseja cancelar TODOS os pagamentos pendentes? Esta ação não pode ser desfeita.')) {
      return;
    }

    setCancellingPayments(true);
    try {
      const response = await fetch('/api/admin/cancel-pending-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ ${data.cancelledCount} pagamentos pendentes cancelados com sucesso!`);
        // Atualizar estatísticas
        const fetchDashboardData = async () => {
          try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            if (data.success) {
              setStats(data.stats);
            }
          } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
          }
        };
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Erro ao cancelar pagamentos');
      }
    } catch (error) {
      console.error('Erro ao cancelar pagamentos:', error);
      toast.error('Erro ao processar cancelamento');
    } finally {
      setCancellingPayments(false);
    }
  };

  const expireOldPayments = async () => {
    if (!confirm('⏰ Deseja expirar automaticamente todos os pagamentos pendentes há mais de 30 minutos?')) {
      return;
    }

    setExpiringPayments(true);
    try {
      const response = await fetch('/api/admin/expire-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`⏰ ${data.expiredCount} pagamentos expirados automaticamente!`);
        // Atualizar estatísticas
        const fetchDashboardData = async () => {
          try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            if (data.success) {
              setStats(data.stats);
            }
          } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
          }
        };
        fetchDashboardData();
        // Atualizar contagem de elegíveis
        checkEligiblePayments();
      } else {
        toast.error(data.message || 'Erro ao expirar pagamentos');
      }
    } catch (error) {
      console.error('Erro ao expirar pagamentos:', error);
      toast.error('Erro ao processar expiração');
    } finally {
      setExpiringPayments(false);
    }
  };

  const checkEligiblePayments = async () => {
    try {
      const response = await fetch('/api/admin/expire-payments');
      const data = await response.json();
      if (data.success) {
        setEligibleForExpiration(data.eligibleForExpiration || 0);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos elegíveis:', error);
    }
  };

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
    fetchWithdrawalHistory();
    checkEligiblePayments();
  }, [fetchPrimepagBalance, fetchWithdrawalHistory]);

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

  // Função para formatar valor monetário durante a digitação
  const formatMoneyInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se está vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100
    const amount = parseInt(numbers) / 100;
    
    // Retorna formatado com vírgula
    return amount.toFixed(2).replace('.', ',');
  };

  // Função para converter valor formatado para número
  const parseMoneyInput = (value: string): number => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return 0;
    const amount = parseInt(numbers) / 100;
    // Limite máximo de R$ 10.000
    return Math.min(amount, 10000);
  };

  const primepagBalanceSection = useMemo(() => {
    if (primepagAccounts.length === 0) {
      return (
        <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          {loadingBalance ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando saldos PrimePag...</p>
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
      
      // Verificar estrutura dos dados
      const hasValidBalance = account.data?.account && 
        typeof account.data.account.value_cents === 'number';
      
      const accountData = (account.data?.account || {}) as { value_cents?: number };
      const balanceData = (account.data?.account_balance || {}) as { 
        available_value_cents?: number;
        blocked_value_cents?: number;
        total_value_cents?: number;
      };
      
      // Debug adicional
      console.log(`🔍 Renderizando conta ${account.name}:`, {
        hasData: !!account.data,
        hasAccount: !!account.data?.account,
        valueCents: account.data?.account?.value_cents,
        hasValidBalance,
        error: account.error,
        fullData: account.data
      });
      
      return (
        <div key={accountKey} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                hasValidBalance ? 'bg-green-500' : account.error ? 'bg-red-500' : 'bg-gray-400'
              }`}></span>
              {account.name || `Conta ${account.id}`}
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              hasValidBalance
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : account.error
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {account.error ? '❌ Erro' : hasValidBalance ? '✅ Conectado' : '⚠️ Sem dados'}
            </div>
          </div>

          {account.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200 mb-1">Erro de Conexão</p>
                  <p className="text-sm text-red-600 dark:text-red-400 break-words">{account.error}</p>
                </div>
              </div>
            </div>
          ) : hasValidBalance ? (
            <div className="space-y-4">
              {/* Saldo Principal */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FaWallet className="text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Saldo Disponível</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        R$ {formatCurrency(accountData.value_cents || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 dark:text-green-400">em centavos</p>
                    <p className="text-sm font-mono text-green-800 dark:text-green-200">
                      {(accountData.value_cents || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              {(balanceData.available_value_cents !== undefined || 
                balanceData.blocked_value_cents !== undefined || 
                balanceData.total_value_cents !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {balanceData.available_value_cents !== undefined && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Disponível</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        R$ {formatCurrency(balanceData.available_value_cents)}
                      </p>
                    </div>
                  )}
                  
                  {balanceData.blocked_value_cents !== undefined && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">Bloqueado</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        R$ {formatCurrency(balanceData.blocked_value_cents)}
                      </p>
                    </div>
                  )}
                  
                  {balanceData.total_value_cents !== undefined && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">Total</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        R$ {formatCurrency(balanceData.total_value_cents)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status e Informações Técnicas */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Status da Conta</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {account.data?.status || 'Ativo'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Última Atualização</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date().toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Debug JSON (removível em produção) */}
              <details className="bg-gray-100 dark:bg-gray-800 rounded p-3">
                <summary className="text-xs cursor-pointer text-gray-600 dark:text-gray-400 font-mono">
                  📋 Debug: Dados Brutos da API
                </summary>
                <pre className="mt-2 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-40">
                  {JSON.stringify(account.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-600">
              <FaQuestionCircle className="mx-auto h-8 w-8 text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                Dados de saldo não disponíveis
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Verifique as configurações da API PrimePag
              </p>
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
                {currentTime?.toLocaleString('pt-BR')}
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
            {primepagBalanceSection}
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

              {/* Saque de Lucros Administrativos */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border-2 border-green-200 dark:border-green-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg">
                    <FaMoneyBillWave className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-1">
                      💰 Saque de Lucros
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Saque seus lucros administrativos via PIX
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200 mb-1">✅ Sistema de Dados Corretos</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        <strong>Nome e CPF devem corresponder exatamente ao dono da chave PIX.</strong><br/>
                        O sistema cancela automaticamente se os dados não conferirem. Use dados reais do destinatário.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Valor do Saque (R$)
                    </label>
                    <input
                      type="text"
                      value={formatMoneyInput(testWithdrawal.amount.toString())}
                      onChange={(e) => setTestWithdrawal(prev => ({ ...prev, amount: parseMoneyInput(e.target.value) || 0 }))}
                      placeholder="Ex: 100,00"
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      💰 Limite máximo: R$ 10.000,00 por transação
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Chave PIX de Destino
                    </label>
                    <input
                      type="text"
                      value={testWithdrawal.pixKey}
                      onChange={(e) => setTestWithdrawal(prev => ({ ...prev, pixKey: e.target.value }))}
                      placeholder="Digite a chave PIX (CPF, e-mail, telefone ou aleatória)"
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Tipo da Chave
                      </label>
                      <select
                        value={testWithdrawal.pixKeyType}
                        onChange={(e) => setTestWithdrawal(prev => ({ ...prev, pixKeyType: e.target.value }))}
                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
                      >
                        <option value="cpf">📄 CPF</option>
                        <option value="email">📧 E-mail</option>
                        <option value="phone">📱 Telefone</option>
                        <option value="random">🎲 Aleatória</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Nome do Beneficiário
                      </label>
                      <input
                        type="text"
                        value={testWithdrawal.receiverName}
                        onChange={(e) => setTestWithdrawal(prev => ({ ...prev, receiverName: e.target.value }))}
                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
                        placeholder="Nome completo do recebedor"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        CPF do Beneficiário
                      </label>
                      <input
                        type="text"
                        value={testWithdrawal.receiverDocument}
                        onChange={(e) => setTestWithdrawal(prev => ({ ...prev, receiverDocument: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                        className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
                        placeholder="CPF sem pontuação"
                        maxLength={11}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ⚠️ Deve ser o CPF real do dono da chave PIX
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Observações (Opcional)
                    </label>
                    <textarea
                      value={testWithdrawal.notes}
                      onChange={(e) => setTestWithdrawal(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all"
                      placeholder="Motivo do saque, projetos, etc..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleProfitWithdrawal}
                      disabled={testWithdrawal.loading || !testWithdrawal.pixKey || !testWithdrawal.receiverDocument || !testWithdrawal.receiverName || !testWithdrawal.amount}
                      className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg text-white font-bold text-lg transition-all duration-300 transform ${
                        testWithdrawal.loading || !testWithdrawal.pixKey || !testWithdrawal.receiverDocument || !testWithdrawal.receiverName || !testWithdrawal.amount
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {testWithdrawal.loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                          Processando Saque...
                        </>
                      ) : (
                        <>
                          <FaMoneyBillWave className="mr-3 h-5 w-5" />
                          Sacar R$ {testWithdrawal.amount.toFixed(2)}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={fetchPrimepagBalance}
                      disabled={loadingBalance}
                      className="px-6 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300 disabled:opacity-50"
                      title="Atualizar saldos PrimePag"
                    >
                      {loadingBalance ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <FaDownload className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                    💡 Este saque transferirá dinheiro real via PIX e será registrado no histórico administrativo
                  </div>
                </div>
              </div>

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

              {/* Cancelar Pagamentos Pendentes */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg">
                    <FaBan className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-1">
                      🚫 Cancelar Pagamentos
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Cancelar todos os pagamentos pendentes
                    </p>
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200 mb-1">⚠️ Ação Irreversível</p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Esta ação cancelará todos os pagamentos que estão com status "pendente". 
                        Use apenas em casos de emergência ou manutenção do sistema.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Pagamentos pendentes: </span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {stats.pendingPayments}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={cancelAllPendingPayments}
                  disabled={cancellingPayments || stats.pendingPayments === 0}
                  className={`w-full flex items-center justify-center px-6 py-4 rounded-lg text-white font-bold text-lg transition-all duration-300 transform ${
                    cancellingPayments || stats.pendingPayments === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {cancellingPayments ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Cancelando...
                    </>
                  ) : stats.pendingPayments === 0 ? (
                    <>
                      <FaCheckCircle className="mr-3 h-5 w-5" />
                      Nenhum Pagamento Pendente
                    </>
                  ) : (
                    <>
                      <FaBan className="mr-3 h-5 w-5" />
                      Cancelar {stats.pendingPayments} Pagamentos
                    </>
                  )}
                </button>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                  💡 Esta ação afetará apenas pagamentos com status "pending"
                </div>
              </div>

              {/* Expirar Pagamentos Antigos */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl shadow-sm border-2 border-orange-200 dark:border-orange-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 transition-all duration-300 shadow-lg">
                    <FaClock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-orange-700 dark:text-orange-300 mb-1">
                      ⏰ Expirar Pagamentos
                    </h3>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      Expirar pagamentos pendentes há mais de 30 minutos
                    </p>
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <FaClock className="text-orange-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">⏰ Expiração Automática</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Esta ação expirará automaticamente todos os pagamentos que estão pendentes há mais de 30 minutos. 
                        Isso ajuda a manter o sistema limpo e libera slots para novos pagamentos.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Elegíveis para expiração: </span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {eligibleForExpiration}
                    </span>
                  </div>
                  <button
                    onClick={checkEligiblePayments}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium"
                  >
                    🔄 Atualizar
                  </button>
                </div>
                
                <button
                  onClick={expireOldPayments}
                  disabled={expiringPayments || eligibleForExpiration === 0}
                  className={`w-full flex items-center justify-center px-6 py-4 rounded-lg text-white font-bold text-lg transition-all duration-300 transform ${
                    expiringPayments || eligibleForExpiration === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {expiringPayments ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Expirando...
                    </>
                  ) : eligibleForExpiration === 0 ? (
                    <>
                      <FaCheckCircle className="mr-3 h-5 w-5" />
                      Nenhum Pagamento para Expirar
                    </>
                  ) : (
                    <>
                      <FaClock className="mr-3 h-5 w-5" />
                      Expirar {eligibleForExpiration} Pagamentos
                    </>
                  )}
                </button>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                  ⏰ Expira automaticamente pagamentos pendentes há mais de 30 minutos
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            {/* Histórico de Saques Administrativos */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaMoneyBillWave className="mr-3 text-green-600" />
                  Histórico de Saques Administrativos
                </h2>
                <button 
                  onClick={fetchWithdrawalHistory}
                  disabled={loadingHistory}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium flex items-center"
                >
                  {loadingHistory ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                  ) : (
                    <FaDownload className="mr-2 h-4 w-4" />
                  )}
                  Atualizar
                </button>
              </div>

              {/* Resumo de Saques */}
              {withdrawalSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
                    <div className="text-sm font-medium text-green-100">Total Sacado</div>
                    <div className="text-xl font-bold">{withdrawalSummary.completedAmountFormatted}</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-4 text-white">
                    <div className="text-sm font-medium text-yellow-100">Pendente</div>
                    <div className="text-xl font-bold">{withdrawalSummary.pendingAmountFormatted}</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="text-sm font-medium text-blue-100">Total de Saques</div>
                    <div className="text-xl font-bold">{withdrawalSummary.totalWithdrawals}</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="text-sm font-medium text-indigo-100">Taxa de Sucesso</div>
                    <div className="text-xl font-bold">{withdrawalSummary.successRate}%</div>
                  </div>
                </div>
              )}

              {/* Lista de Saques */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Últimos 10 Saques</h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Carregando histórico...</p>
                    </div>
                  ) : withdrawalHistory.length === 0 ? (
                    <div className="p-6 text-center">
                      <FaMoneyBillWave className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Nenhum saque realizado ainda</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Use o formulário acima para realizar seu primeiro saque
                      </p>
                    </div>
                  ) : (
                    withdrawalHistory.map((withdrawal, index) => (
                      <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className={`p-2 rounded-lg mr-4 ${
                              withdrawal.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                              withdrawal.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/20' :
                              withdrawal.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                              'bg-red-100 dark:bg-red-900/20'
                            }`}>
                              <FaMoneyBillWave className={`h-5 w-5 ${
                                withdrawal.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                withdrawal.status === 'processing' ? 'text-blue-600 dark:text-blue-400' :
                                withdrawal.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {withdrawal.amountFormatted}
                                </p>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  withdrawal.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : withdrawal.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : withdrawal.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {withdrawal.status === 'completed' ? '✅ Concluído' :
                                   withdrawal.status === 'processing' ? '🔄 Processando' :
                                   withdrawal.status === 'pending' ? '⏳ Pendente' :
                                   '❌ Falhou'}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Destinatário:</span> {withdrawal.receiverName}
                                </div>
                                <div>
                                  <span className="font-medium">Chave PIX:</span> {withdrawal.pixKey.length > 20 ? `${withdrawal.pixKey.substring(0, 20)}...` : withdrawal.pixKey}
                                </div>
                                <div>
                                  <span className="font-medium">Data:</span> {new Date(withdrawal.createdAt).toLocaleString('pt-BR')}
                                </div>
                                {withdrawal.pixPaymentId && (
                                  <div>
                                    <span className="font-medium">PIX ID:</span> 
                                    <span className="font-mono text-xs ml-1">{withdrawal.pixPaymentId}</span>
                                  </div>
                                )}
                              </div>
                              
                              {withdrawal.notes && (
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="font-medium">Observações:</span> {withdrawal.notes}
                                </div>
                              )}
                              
                              {withdrawal.failureReason && (
                                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                  <span className="font-medium">Erro:</span> {withdrawal.failureReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

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