'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaWallet, FaArrowUp, FaArrowDown, FaBitcoin, FaQrcode, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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
  const [showCryptoWithdrawModal, setShowCryptoWithdrawModal] = useState(false);
  const [cryptoWithdrawAmount, setCryptoWithdrawAmount] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
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

  const cryptoOptions = [
    { symbol: 'BTC', name: 'Bitcoin', rate: 98000 },
    { symbol: 'ETH', name: 'Ethereum', rate: 3500 },
    { symbol: 'TRX', name: 'Tron', rate: 0.20 },
    { symbol: 'USDT-ETH', name: 'USDT (Ethereum)', rate: 5.5 },
    { symbol: 'USDT-POLYGON', name: 'USDT (Polygon)', rate: 5.5 },
    { symbol: 'SOL', name: 'Solana', rate: 200 },
    { symbol: 'LTC', name: 'Litecoin', rate: 120 }
  ];

  const calculateCryptoAmount = () => {
    if (!cryptoWithdrawAmount) return 0;
    const amount = parseFloat(cryptoWithdrawAmount);
    const fee = amount * 0.1; // 10% de taxa
    const netAmount = amount - fee;
    const crypto = cryptoOptions.find(c => c.symbol === selectedCrypto);
    return crypto ? netAmount / crypto.rate : 0;
  };

  const handleCryptoWithdraw = async () => {
    const amount = parseFloat(cryptoWithdrawAmount);
    if (!amount || amount < 50) {
      toast.error('Valor mínimo para saque crypto: R$ 50,00');
      return;
    }

    if (amount > balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!cryptoAddress) {
      toast.error('Digite o endereço da carteira');
      return;
    }

    setProcessingWithdraw(true);
    try {
      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Saque crypto de R$ ${amount.toFixed(2)} solicitado com sucesso!`);
      setShowCryptoWithdrawModal(false);
      setCryptoWithdrawAmount('');
      setCryptoAddress('');
      
      // Atualizar saldo (simulação)
      setBalance(prev => prev - amount);
    } catch (error) {
      toast.error('Erro ao processar saque crypto');
    } finally {
      setProcessingWithdraw(false);
    }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Depósito Crypto */}
          <button
            onClick={() => router.push('/dashboard/crypto-deposit')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            <FaBitcoin className="mr-2" />
            Depositar Crypto
          </button>

          {/* Saque PIX */}
          <button
            onClick={() => router.push('/dashboard/withdraw')}
            className="flex items-center justify-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <FaQrcode className="mr-2" />
            Saque PIX
          </button>

          {/* Saque Crypto */}
          <button
            onClick={() => setShowCryptoWithdrawModal(true)}
            className="flex items-center justify-center p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <FaBitcoin className="mr-2" />
            Saque Crypto
          </button>
        </div>

        {/* Alerta sobre taxa crypto */}
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Saques em criptomoedas possuem taxa de 10%. Saques PIX são gratuitos.
            </p>
          </div>
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

      {/* Modal de Saque Crypto */}
      {showCryptoWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  💰 Saque Crypto
                </h3>
                <button
                  onClick={() => setShowCryptoWithdrawModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Criptomoeda
                  </label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {cryptoOptions.map(crypto => (
                      <option key={crypto.symbol} value={crypto.symbol}>
                        {crypto.name} ({crypto.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor em Reais (R$)
                  </label>
                  <input
                    type="number"
                    value={cryptoWithdrawAmount}
                    onChange={(e) => setCryptoWithdrawAmount(e.target.value)}
                    min="50"
                    max={balance}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Mínimo: R$ 50,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço da Carteira
                  </label>
                  <input
                    type="text"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Digite o endereço da sua carteira"
                  />
                </div>

                {cryptoWithdrawAmount && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Resumo do Saque:</h4>
                    <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                      <div className="flex justify-between">
                        <span>Valor solicitado:</span>
                        <span>R$ {parseFloat(cryptoWithdrawAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa (10%):</span>
                        <span>- R$ {(parseFloat(cryptoWithdrawAmount) * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-yellow-300 pt-1">
                        <span>Você receberá:</span>
                        <span>{calculateCryptoAmount().toFixed(8)} {selectedCrypto}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCryptoWithdrawModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCryptoWithdraw}
                    disabled={processingWithdraw || !cryptoWithdrawAmount || !cryptoAddress}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {processingWithdraw ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      'Confirmar Saque'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 