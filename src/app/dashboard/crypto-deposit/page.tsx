'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaBitcoin, 
  FaEthereum,
  FaCopy,
  FaQrcode,
  FaCheckCircle,
  FaClock,
  FaWallet,
  FaExternalLinkAlt
} from 'react-icons/fa';

interface CryptoOption {
  symbol: string;
  name: string;
  icon: React.ReactNode;
  address: string;
  network: string;
  minDeposit: number;
  color: string;
}

const cryptoOptions: CryptoOption[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: <FaBitcoin className="text-3xl text-orange-500" />,
    address: 'bc1qfx57hwff67re076ck4sdnzjmcvda6p85hezjaf',
    network: 'Bitcoin Network',
    minDeposit: 20,
    color: 'orange'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: <FaEthereum className="text-3xl text-blue-500" />,
    address: '0x64d874542986Aa67Df977EdeaaCA4A1777bD295f',
    network: 'Ethereum Mainnet',
    minDeposit: 20,
    color: 'blue'
  },
  {
    symbol: 'TRX',
    name: 'Tron',
    icon: <div className="text-3xl text-red-500 font-bold">⚡</div>,
    address: 'TQeR8q5Pk8MnDYurCFpf4ba7zmQKx5Dy5K',
    network: 'Tron Network',
    minDeposit: 20,
    color: 'red'
  },
  {
    symbol: 'USDT-ETH',
    name: 'USDT (Ethereum)',
    icon: <div className="text-3xl text-green-500 font-bold">₮</div>,
    address: '0x64d874542986Aa67Df977EdeaaCA4A1777bD295f',
    network: 'Ethereum (ERC-20)',
    minDeposit: 20,
    color: 'green'
  },
  {
    symbol: 'USDT-POLYGON',
    name: 'USDT (Polygon)',
    icon: <div className="text-3xl text-purple-500 font-bold">₮</div>,
    address: '0x64d874542986Aa67Df977EdeaaCA4A1777bD295f',
    network: 'Polygon Network',
    minDeposit: 20,
    color: 'purple'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: <div className="text-3xl text-yellow-500 font-bold">◎</div>,
    address: '8CdcavNNZ63Aj84W1Nt5GsaJTvTKKGx2MoU2JSJSpzrD',
    network: 'Solana Network',
    minDeposit: 20,
    color: 'yellow'
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    icon: <div className="text-3xl text-gray-500 font-bold">Ł</div>,
    address: 'ltc1qc7c3ynw48mzw6jh39ap9c5kztwgkxgh4372uwj',
    network: 'Litecoin Network',
    minDeposit: 20,
    color: 'gray'
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
}

export default function CryptoDepositPage() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>(cryptoOptions[0]); // Inicia com BTC
  const [amount, setAmount] = useState(20);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    // Carregar depósitos salvos do localStorage
    const savedDeposits = localStorage.getItem('crypto-deposits');
    if (savedDeposits) {
      setDeposits(JSON.parse(savedDeposits));
    }
  }, []);

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

  const handleManualDeposit = async () => {
    if (amount < selectedCrypto.minDeposit) {
      toast.error(`Valor mínimo de depósito é R$ ${selectedCrypto.minDeposit}`);
      return;
    }

    if (!txHash.trim()) {
      toast.error('Por favor, insira o hash da transação');
      return;
    }

    const newDeposit: Deposit = {
      id: Math.random().toString(36).substr(2, 9),
      crypto: selectedCrypto.symbol,
      amount: amount,
      address: selectedCrypto.address,
      txHash: txHash.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedDeposits = [newDeposit, ...deposits];
    setDeposits(updatedDeposits);
    localStorage.setItem('crypto-deposits', JSON.stringify(updatedDeposits));

    // Simular processamento automático do depósito
    setTimeout(async () => {
      try {
        const response = await fetch('/api/crypto/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            crypto: selectedCrypto.symbol,
            amount: amount,
            address: selectedCrypto.address,
            txHash: txHash.trim(),
            network: selectedCrypto.network
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Atualizar status do depósito
          const finalDeposits = updatedDeposits.map(d => 
            d.id === newDeposit.id 
              ? { ...d, status: 'confirmed' as const }
              : d
          );
          setDeposits(finalDeposits);
          localStorage.setItem('crypto-deposits', JSON.stringify(finalDeposits));
          
          toast.success(`💰 Depósito de R$ ${amount} confirmado automaticamente!`);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Erro no processamento automático:', error);
        toast.error('Depósito será verificado manualmente pelos administradores');
      }
    }, 3000); // 3 segundos para simular verificação automática

    toast.success('Depósito registrado! Verificando transação automaticamente...');
    setTxHash('');
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
      case 'failed': return <FaCheckCircle className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/photos" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
          <FaArrowLeft className="mr-2" />
          Voltar para Fotos
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <FaBitcoin className="mr-3 text-orange-500" />
          Depósito Crypto
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
          Deposite criptomoedas para utilizar em nossos serviços. Valor mínimo: R$ 20,00.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Formulário de Depósito */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Realizar Depósito
          </h2>

          {/* Seleção de Crypto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Escolha a Criptomoeda
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {cryptoOptions.map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedCrypto.symbol === crypto.symbol
                      ? `border-${crypto.color}-500 bg-${crypto.color}-50 dark:bg-${crypto.color}-900/20`
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    {crypto.icon}
                    <span className="text-xs md:text-sm font-medium mt-2">{crypto.symbol}</span>
                    <span className="text-xs text-gray-500 text-center">{crypto.network}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Valor do Depósito */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor em Reais (R$)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={selectedCrypto.minDeposit}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder={`Mínimo: R$ ${selectedCrypto.minDeposit}`}
            />
          </div>

          {/* Endereço de Depósito */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              💰 Endereço para Depósito - {selectedCrypto.name}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 break-all flex-1">
                  {selectedCrypto.address}
                </span>
                <button
                  onClick={() => copyToClipboard(selectedCrypto.address)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Copiar endereço"
                >
                  <FaCopy className="text-sm" />
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  <FaQrcode className="mr-2" />
                  {showQR ? 'Ocultar QR' : 'Mostrar QR'}
                </button>
              </div>
              {showQR && (
                <div className="text-center pt-3">
                  <img
                    src={generateQRCode(selectedCrypto.address)}
                    alt="QR Code"
                    className="mx-auto border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hash da Transação */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hash da Transação (após o envio)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Cole aqui o hash da sua transação"
            />
          </div>

          {/* Botão de Confirmação */}
          <button
            onClick={handleManualDeposit}
            disabled={!txHash.trim() || amount < selectedCrypto.minDeposit}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center text-sm md:text-base"
          >
            <FaWallet className="mr-2" />
            Confirmar Depósito - R$ {amount}
          </button>

          <div className="mt-4 text-xs text-gray-500 text-center">
            ⚡ Processamento automático em poucos minutos
          </div>
        </div>

        {/* Histórico de Depósitos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Histórico de Depósitos
          </h2>
          
          {deposits.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FaWallet className="text-4xl mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhum depósito realizado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {deposit.crypto}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        R$ {deposit.amount}
                      </span>
                    </div>
                    <div className={`flex items-center space-x-1 ${getStatusColor(deposit.status)}`}>
                      {getStatusIcon(deposit.status)}
                      <span className="text-sm font-medium">{getStatusText(deposit.status)}</span>
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 space-y-1">
                    <p>Data: {formatDate(deposit.createdAt)}</p>
                    {deposit.txHash && (
                      <p className="flex items-center">
                        Hash: {deposit.txHash.substring(0, 10)}...
                        <button 
                          onClick={() => copyToClipboard(deposit.txHash)}
                          className="ml-2 text-blue-500 hover:text-blue-600"
                        >
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

      {/* Instruções */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          📚 Como fazer um depósito crypto
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 dark:text-blue-300 font-bold">1</span>
            </div>
            <h4 className="font-medium mb-1 text-sm md:text-base">Escolha a Crypto</h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
              Selecione a criptomoeda e copie o endereço de depósito
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 dark:bg-purple-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 dark:text-purple-300 font-bold">2</span>
            </div>
            <h4 className="font-medium mb-1 text-sm md:text-base">Envie a Transação</h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
              Use sua carteira para enviar o valor para o endereço fornecido
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 dark:text-green-300 font-bold">3</span>
            </div>
            <h4 className="font-medium mb-1 text-sm md:text-base">Confirme Aqui</h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">
              Cole o hash da transação para processamento automático
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 