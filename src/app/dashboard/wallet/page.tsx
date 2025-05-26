'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
  FaEye
} from 'react-icons/fa';

interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  paymentId?: {
    _id: string;
    description: string;
    amount: number;
  };
}

interface WalletData {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/user/balance');
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
    }
  };

  const fetchTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/transactions?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setWalletData(data);
        setCurrentPage(page);
      } else {
        toast.error(data.message || 'Erro ao carregar transações');
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar histórico de transações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1);

    // Atualizar saldo a cada 10 segundos
    const balanceInterval = setInterval(fetchBalance, 10000);
    
    return () => clearInterval(balanceInterval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <FaArrowUp className="text-green-500" />
    ) : (
      <FaArrowDown className="text-red-500" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  // Calcular estatísticas
  const totalCredits = walletData?.transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalDebits = walletData?.transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
            <FaArrowLeft className="mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaWallet className="mr-3 text-blue-600" />
            Minha Carteira
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie seu saldo e visualize o histórico de transações.
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Saldo Atual */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Saldo Atual</p>
                <p className="text-3xl font-bold">
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FaMoneyBillWave className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-100">
                Disponível para saque
              </span>
            </div>
          </div>

          {/* Total de Créditos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  R$ {totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FaArrowUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Créditos totais
              </span>
            </div>
          </div>

          {/* Total de Débitos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Gasto</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  R$ {totalDebits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <FaArrowDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Débitos totais
              </span>
            </div>
          </div>
        </div>

        {/* Histórico de Transações */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FaChartLine className="mr-2 text-blue-600" />
              Histórico de Transações
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando transações...</p>
            </div>
          ) : walletData?.transactions.length === 0 ? (
            <div className="p-8 text-center">
              <FaWallet className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Suas transações aparecerão aqui quando você receber pagamentos
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {walletData?.transactions.map((transaction) => (
                <div key={transaction._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <FaCalendarAlt className="mr-1" />
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}R$ {transaction.amount.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Saldo: R$ {(transaction.balanceAfter || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {walletData && walletData.pagination.totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando {((currentPage - 1) * 10) + 1} até {Math.min(currentPage * 10, walletData.pagination.total)} de {walletData.pagination.total} transações
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchTransactions(currentPage - 1)}
                    disabled={!walletData.pagination.hasPrev}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentPage} de {walletData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchTransactions(currentPage + 1)}
                    disabled={!walletData.pagination.hasNext}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informações sobre Taxas */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Informações sobre Taxas
          </h3>
          <div className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
            <p>• <strong>Taxa da plataforma:</strong> 20% sobre cada pagamento recebido</p>
            <p>• <strong>Crédito na carteira:</strong> 80% do valor do pagamento é creditado automaticamente</p>
            <p>• <strong>Processamento:</strong> Os créditos são processados em tempo real após confirmação do pagamento</p>
          </div>
        </div>
      </div>
    </div>
  );
} 