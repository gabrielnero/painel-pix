'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useMetaMask } from '@/hooks/useMetaMask';
import { 
  FaArrowLeft, 
  FaBitcoin, 
  FaEthereum,
  FaCopy,
  FaQrcode,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaWallet,
  FaPlug,
  FaExternalLinkAlt
} from 'react-icons/fa';

interface CryptoOption {
  symbol: string;
  name: string;
  icon: React.ReactNode;
  address: string;
  network: string;
  networkId: number;
  minDeposit: number;
  color: string;
  supportsMetaMask: boolean;
}

const cryptoOptions: CryptoOption[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: <FaBitcoin className="text-3xl text-orange-500" />,
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin Network',
    networkId: 0, // BTC não usa MetaMask
    minDeposit: 100,
    color: 'orange',
    supportsMetaMask: false
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: <FaEthereum className="text-3xl text-blue-500" />,
    address: '0x742d35Cc6635C0532925a3b8D400d5bb1e6A9A30',
    network: 'Ethereum Mainnet',
    networkId: 1,
    minDeposit: 100,
    color: 'blue',
    supportsMetaMask: true
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    icon: <div className="text-3xl text-yellow-500 font-bold">⬡</div>,
    address: '0x742d35Cc6635C0532925a3b8D400d5bb1e6A9A30',
    network: 'BSC Mainnet',
    networkId: 56,
    minDeposit: 100,
    color: 'yellow',
    supportsMetaMask: true
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    icon: <div className="text-3xl text-purple-500 font-bold">⬟</div>,
    address: '0x742d35Cc6635C0532925a3b8D400d5bb1e6A9A30',
    network: 'Polygon Mainnet',
    networkId: 137,
    minDeposit: 100,
    color: 'purple',
    supportsMetaMask: true
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: <div className="text-3xl text-green-500 font-bold">₮</div>,
    address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK',
    network: 'Tron (TRC-20)',
    networkId: 195,
    minDeposit: 100,
    color: 'green',
    supportsMetaMask: false // USDT-TRC20 não usa MetaMask
  }
];

interface Deposit {
  id: string;
  crypto: string;
  amount: number;
  address: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  method: 'manual' | 'metamask';
}

export default function CryptoDepositPage() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>(cryptoOptions[1]); // Inicia com ETH
  const [amount, setAmount] = useState(100);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [sendingMetaMask, setSendingMetaMask] = useState(false);

  // Hook do MetaMask
  const {
    isConnected,
    account,
    chainId,
    balance,
    isInstalled,
    connect,
    disconnect,
    switchNetwork,
    sendNativeTransaction,
    supportedNetworks
  } = useMetaMask();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Endereço copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar endereço');
    }
  };

  const generateQRCode = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
  };

  const handleManualDeposit = () => {
    if (amount < selectedCrypto.minDeposit) {
      toast.error(`Valor mínimo de depósito é $${selectedCrypto.minDeposit}`);
      return;
    }

    const newDeposit: Deposit = {
      id: Math.random().toString(36).substr(2, 9),
      crypto: selectedCrypto.symbol,
      amount: amount,
      address: selectedCrypto.address,
      txHash: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      method: 'manual'
    };

    setDeposits(prev => [newDeposit, ...prev]);
    toast.success('Depósito manual iniciado! Envie a transação para o endereço fornecido.');
    
    // Simular confirmação após 2 minutos
    setTimeout(() => {
      setDeposits(prev => prev.map(dep => 
        dep.id === newDeposit.id 
          ? { ...dep, status: 'confirmed' as const, txHash: `0x${Math.random().toString(36).substr(2, 64)}` }
          : dep
      ));
      toast.success('Depósito confirmado! Saldo creditado na sua conta.');
    }, 120000);
  };

  const handleMetaMaskDeposit = async () => {
    if (!isConnected) {
      toast.error('Conecte sua carteira MetaMask primeiro!');
      return;
    }

    if (amount < selectedCrypto.minDeposit) {
      toast.error(`Valor mínimo de depósito é $${selectedCrypto.minDeposit}`);
      return;
    }

    if (!selectedCrypto.supportsMetaMask) {
      toast.error('Esta criptomoeda não suporta MetaMask');
      return;
    }

    setSendingMetaMask(true);

    try {
      // Converter USD para valor aproximado em crypto (simulação)
      let cryptoAmount = '';
      switch (selectedCrypto.symbol) {
        case 'ETH':
          cryptoAmount = (amount / 2000).toFixed(6); // $2000 por ETH (estimativa)
          break;
        case 'BNB':
          cryptoAmount = (amount / 300).toFixed(6); // $300 por BNB (estimativa)
          break;
        case 'MATIC':
          cryptoAmount = (amount / 0.8).toFixed(6); // $0.8 por MATIC (estimativa)
          break;
        default:
          cryptoAmount = '0.1';
      }

      const result = await sendNativeTransaction(cryptoAmount, selectedCrypto.networkId);

      if (result) {
        const newDeposit: Deposit = {
          id: Math.random().toString(36).substr(2, 9),
          crypto: selectedCrypto.symbol,
          amount: amount,
          address: selectedCrypto.address,
          txHash: result.hash,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          method: 'metamask'
        };

        setDeposits(prev => [newDeposit, ...prev]);
        toast.success(`💰 Depósito de $${amount} realizado com sucesso via MetaMask!`);
      }
    } catch (error) {
      console.error('Erro no depósito MetaMask:', error);
      toast.error('Erro ao processar depósito via MetaMask');
    } finally {
      setSendingMetaMask(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <FaCheckCircle className="text-green-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'failed': return <FaExclamationTriangle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/photos" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
          <FaArrowLeft className="mr-2" />
          Voltar para Fotos
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <FaBitcoin className="mr-3 text-orange-500" />
          Depósito Crypto
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Deposite criptomoedas para utilizar em nossos serviços. Valor mínimo: $100 USD.
        </p>
      </div>

      {/* Status MetaMask */}
      {isInstalled && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaWallet className="text-2xl text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                  🦊 MetaMask Status
                </h3>
                {isConnected ? (
                  <div className="text-sm text-purple-600 dark:text-purple-300">
                    <p>✅ Conectado: {account?.substring(0, 8)}...{account?.substring(account.length - 6)}</p>
                    <p>🌐 Rede: {supportedNetworks[chainId || 1]?.name || 'Desconhecida'}</p>
                    <p>💰 Saldo: {parseFloat(balance).toFixed(4)} {supportedNetworks[chainId || 1]?.symbol}</p>
                  </div>
                ) : (
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    🔌 Não conectado - Clique para conectar
                  </p>
                )}
              </div>
            </div>
            <div>
              {isConnected ? (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={connect}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm flex items-center"
                >
                  <FaPlug className="mr-2" />
                  Conectar MetaMask
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aviso da Fintech */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
        <div className="flex items-start">
          <FaExclamationTriangle className="text-yellow-400 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ AVISO IMPORTANTE - FINTECH</h3>
            <p className="text-yellow-700 mb-3">
              Nossa fintech é <strong>APENAS para recebimento de pagamentos de fotos</strong>. 
              Caso precise de outro tipo de serviço, entre em contato com o suporte.
            </p>
            <p className="text-yellow-700 mb-3">
              <strong>⚠️ ATENÇÃO:</strong> Qualquer valor enviado sem ser para compra de fotos será 
              <span className="font-bold text-red-600"> bloqueado automaticamente</span>.
            </p>
            <p className="text-yellow-700">
              Fizemos este sistema para facilitar para todos. Agradecemos a compreensão!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Depósito */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Realizar Depósito
          </h2>

          {/* Seleção de Crypto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Escolha a Criptomoeda
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cryptoOptions.map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`p-3 rounded-lg border-2 transition-all relative ${
                    selectedCrypto.symbol === crypto.symbol
                      ? `border-${crypto.color}-500 bg-${crypto.color}-50 dark:bg-${crypto.color}-900/20`
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    {crypto.icon}
                    <span className="text-sm font-medium mt-2">{crypto.symbol}</span>
                    <span className="text-xs text-gray-500">{crypto.network}</span>
                    {crypto.supportsMetaMask && (
                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        🦊
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Valor do Depósito */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor do Depósito (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={selectedCrypto.minDeposit}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={`Mínimo $${selectedCrypto.minDeposit}`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valor mínimo: ${selectedCrypto.minDeposit} USD
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-4">
            {/* MetaMask (se disponível) */}
            {selectedCrypto.supportsMetaMask && (
              <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                  🦊 Envio via MetaMask (Recomendado)
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Pagamento instantâneo e seguro através da sua carteira MetaMask
                </p>
                <button
                  onClick={handleMetaMaskDeposit}
                  disabled={!isConnected || sendingMetaMask}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center"
                >
                  {sendingMetaMask ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <FaWallet className="mr-2" />
                      Pagar com MetaMask - ${amount}
                    </>
                  )}
                </button>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Conecte sua carteira MetaMask primeiro
                  </p>
                )}
              </div>
            )}

            {/* Depósito Manual */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                📋 Envio Manual
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Copie o endereço e envie manualmente através da sua carteira
              </p>
              <button
                onClick={handleManualDeposit}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center"
              >
                <FaQrcode className="mr-2" />
                Gerar Endereço de Depósito
              </button>
            </div>
          </div>

          {/* Endereço e QR Code */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Endereço de Depósito ({selectedCrypto.symbol})
              </h3>
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
              >
                <FaQrcode className="mr-1" />
                {showQR ? 'Ocultar' : 'QR Code'}
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
                {selectedCrypto.address}
              </code>
              <button
                onClick={() => copyToClipboard(selectedCrypto.address)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaCopy />
              </button>
            </div>

            {showQR && (
              <div className="mt-4 text-center">
                <img
                  src={generateQRCode(selectedCrypto.address)}
                  alt="QR Code"
                  className="mx-auto border rounded"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Escaneie com sua carteira móvel
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              <strong>Rede:</strong> {selectedCrypto.network}
            </p>
          </div>
        </div>

        {/* Histórico de Depósitos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Histórico de Depósitos
          </h2>

          {deposits.length === 0 ? (
            <div className="text-center py-8">
              <FaClock className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum depósito realizado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">{deposit.crypto}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                        {getStatusIcon(deposit.status)}
                        {deposit.status === 'confirmed' ? 'Confirmado' : 
                         deposit.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                      {deposit.method === 'metamask' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          🦊 MetaMask
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${deposit.amount}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Data: {formatDate(deposit.createdAt)}</p>
                    {deposit.txHash && (
                      <p className="flex items-center">
                        Hash: {deposit.txHash.substring(0, 10)}...
                        <button className="ml-2 text-blue-500 hover:text-blue-600">
                          <FaExternalLinkAlt className="text-xs" />
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tutorial MetaMask */}
      {isInstalled && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            📚 Como usar MetaMask para depósitos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaPlug className="text-blue-600 dark:text-blue-300" />
              </div>
              <h4 className="font-medium mb-1">1. Conectar</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Clique em "Conectar MetaMask" e autorize a conexão
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaEthereum className="text-purple-600 dark:text-purple-300" />
              </div>
              <h4 className="font-medium mb-1">2. Escolher Crypto</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Selecione uma criptomoeda compatível (ETH, BNB, MATIC)
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaWallet className="text-green-600 dark:text-green-300" />
              </div>
              <h4 className="font-medium mb-1">3. Confirmar</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Confirme a transação no MetaMask e aguarde a confirmação
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instalar MetaMask */}
      {!isInstalled && (
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <FaExclamationTriangle className="text-orange-500 text-3xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            MetaMask não detectado
          </h3>
          <p className="text-orange-700 mb-4">
            Para usar pagamentos instantâneos, instale a extensão MetaMask
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            <FaExternalLinkAlt className="mr-2" />
            Instalar MetaMask
          </a>
        </div>
      )}
    </div>
  );
} 