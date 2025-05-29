'use client';

import { useState, useEffect } from 'react';
import { FaHistory, FaFilter, FaSearch, FaDownload } from 'react-icons/fa';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        type: filter.type,
        startDate: filter.startDate,
        endDate: filter.endDate,
        search: filter.search
      });

      const response = await fetch(`/api/user/transactions?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
      } else {
        console.error('Erro ao carregar transações:', data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/user/transactions/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar transações:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <FaHistory className="text-2xl text-green-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Histórico de Transações
            </h1>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <FaDownload className="mr-2" />
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="deposit">Depósitos</option>
              <option value="withdrawal">Saques</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder="Buscar por descrição..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 pl-10 pr-3 py-2"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Tabela de Transações */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <FaHistory className="mx-auto text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma transação encontrada
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b dark:border-gray-700">
                  <th className="pb-3 px-4 text-gray-900 dark:text-white">Data</th>
                  <th className="pb-3 px-4 text-gray-900 dark:text-white">Tipo</th>
                  <th className="pb-3 px-4 text-gray-900 dark:text-white">Descrição</th>
                  <th className="pb-3 px-4 text-gray-900 dark:text-white">Método</th>
                  <th className="pb-3 px-4 text-gray-900 dark:text-white">Status</th>
                  <th className="pb-3 px-4 text-right text-gray-900 dark:text-white">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm ${
                          transaction.type === 'deposit'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {transaction.type === 'deposit' ? 'Depósito' : 'Saque'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{transaction.description}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {transaction.paymentMethod || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {transaction.status === 'completed'
                          ? 'Concluído'
                          : transaction.status === 'pending'
                          ? 'Pendente'
                          : 'Falhou'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={
                          transaction.type === 'deposit'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}{' '}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 