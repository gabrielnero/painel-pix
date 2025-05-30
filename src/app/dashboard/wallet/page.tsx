'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await fetch('/api/user/wallet');
        const data = await response.json();

        if (data.success) {
          setBalance(data.balance);
          setTransactions(data.transactions);
        } else {
          console.error('Erro ao carregar dados da carteira:', data.message);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da carteira:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaWallet className="mr-3 text-green-500" />
            Minha Carteira
          </h1>
          <div className="text-3xl font-bold text-green-500">
            {formatCurrency(balance)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/generate-pix')}
            className="flex items-center justify-center p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <FaArrowDown className="mr-2" />
            Depositar via PIX
          </button>
          <button
            onClick={() => router.push('/dashboard/withdraw')}
            className="flex items-center justify-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <FaArrowUp className="mr-2" />
            Realizar Saque
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Histórico de Transações
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b dark:border-gray-700">
                <th className="pb-3 px-4">Data</th>
                <th className="pb-3 px-4">Tipo</th>
                <th className="pb-3 px-4">Descrição</th>
                <th className="pb-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction._id}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4">{transaction.description}</td>
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
      </div>
    </div>
  );
} 