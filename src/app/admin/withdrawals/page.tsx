'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaEye,
  FaCheck,
  FaTimes,
  FaFilter,
  FaSearch,
  FaWallet,
  FaChartLine
} from 'react-icons/fa';

interface WithdrawalData {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    username: string;
  };
  reviewNotes?: string;
  processedAt?: string;
}

interface WithdrawalStats {
  _id: string;
  count: number;
  totalAmount: number;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [stats, setStats] = useState<WithdrawalStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(1);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    fetchWithdrawals();
    fetchPrimepagBalances();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/withdrawals?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWithdrawals(data.withdrawals);
        setStats(data.stats);
      } else {
        toast.error(data.message || 'Erro ao carregar saques');
      }
    } catch (error) {
      console.error('Erro ao carregar saques:', error);
      toast.error('Erro ao carregar saques');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrimepagBalances = async () => {
    try {
      const response = await fetch('/api/admin/primepag-balance');
      const data = await response.json();
      if (data.success) {
        setBalances(data.accounts);
      }
    } catch (error) {
      console.error('Erro ao carregar saldos PrimePag:', error);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: reviewNotes,
          account: selectedAccount
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          action === 'approve' 
            ? 'Saque aprovado e processado com sucesso!' 
            : 'Saque rejeitado com sucesso!'
        );
        setShowModal(false);
        setSelectedWithdrawal(null);
        setReviewNotes('');
        fetchWithdrawals();
        fetchPrimepagBalances();
      } else {
        toast.error(data.message || `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} saque`);
      }
    } catch (error) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} saque:`, error);
      toast.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} saque`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
      case 'approved':
      case 'processing':
        return <FaClock className="text-yellow-500" />;
      case 'rejected':
      case 'failed':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatByStatus = (status: string) => {
    return stats.find(s => s._id === status) || { count: 0, totalAmount: 0 };
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.pixKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatBalance = (balance: any) => {
    if (!balance) return 'R$ 0,00';
    const totalCents = balance.available_value_cents || 0;
    const totalReais = totalCents / 100;
    return `R$ ${totalReais.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/admin" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
            <FaArrowLeft className="mr-2" />
            Voltar ao Admin
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaDownload className="mr-3 text-blue-600" />
            Gerenciar Saques
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Aprove ou rejeite solicitações de saque dos usuários.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Pendentes</p>
                <p className="text-2xl font-bold">{getStatByStatus('pending').count}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FaClock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-yellow-100">
                R$ {getStatByStatus('pending').totalAmount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatByStatus('completed').count}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FaCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                R$ {getStatByStatus('completed').totalAmount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejeitados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getStatByStatus('rejected').count}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <FaTimesCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                R$ {getStatByStatus('rejected').totalAmount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo PrimePag</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {balances.length > 0 ? formatBalance(balances[0].balance) : 'Carregando...'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FaWallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Conta 1
              </span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, email ou chave PIX..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
                <option value="processing">Processando</option>
                <option value="completed">Concluídos</option>
                <option value="failed">Falharam</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Saques */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-2xl text-gray-400" />
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <FaDownload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum saque encontrado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Chave PIX
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Solicitado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(withdrawal.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                            {getStatusText(withdrawal.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {withdrawal.userId.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {withdrawal.userId.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          R$ {withdrawal.amount.toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {withdrawal.pixKey.substring(0, 15)}***
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {withdrawal.pixKeyType.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(withdrawal.requestedAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {showModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detalhes do Saque
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedWithdrawal.userId.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedWithdrawal.userId.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
                      <p className="text-lg font-bold text-green-600">
                        R$ {selectedWithdrawal.amount.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chave PIX</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedWithdrawal.pixKey}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedWithdrawal.pixKeyType.toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <div className="flex items-center">
                        {getStatusIcon(selectedWithdrawal.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedWithdrawal.status)}`}>
                          {getStatusText(selectedWithdrawal.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Solicitado em</label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedWithdrawal.requestedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {selectedWithdrawal.reviewedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Revisado em</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedWithdrawal.reviewedAt).toLocaleString('pt-BR')}
                      </p>
                      {selectedWithdrawal.reviewedBy && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          por {selectedWithdrawal.reviewedBy.username}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedWithdrawal.reviewNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedWithdrawal.reviewNotes}</p>
                    </div>
                  )}
                </div>

                {selectedWithdrawal.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Conta PrimePag para processamento
                      </label>
                      <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>Conta 1 - {balances[0] ? formatBalance(balances[0].balance) : 'Carregando...'}</option>
                        <option value={2}>Conta 2 - {balances[1] ? formatBalance(balances[1].balance) : 'Carregando...'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações (opcional)
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Adicione observações sobre esta decisão..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAction('approve')}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                      >
                        {actionLoading ? (
                          <FaSpinner className="animate-spin mr-2" />
                        ) : (
                          <FaCheck className="mr-2" />
                        )}
                        Aprovar e Processar
                      </button>
                      <button
                        onClick={() => handleAction('reject')}
                        disabled={actionLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                      >
                        {actionLoading ? (
                          <FaSpinner className="animate-spin mr-2" />
                        ) : (
                          <FaTimes className="mr-2" />
                        )}
                        Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 