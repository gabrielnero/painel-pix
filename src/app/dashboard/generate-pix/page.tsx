'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaMoneyBillWave, 
  FaQrcode, 
  FaCopy, 
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPlus,
  FaSpinner
} from 'react-icons/fa';
import MaintenanceMode from '@/components/MaintenanceMode';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

interface PixData {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  pixKey: string;
  pixCopiaECola: string;
  qrCodeImage: string;
  expiresAt: string;
}

export default function GeneratePixPage() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const { isActive: isMaintenanceActive, message: maintenanceMessage, estimatedTime, loading: maintenanceLoading } = useMaintenanceMode();

  // Verificar se o sistema está em manutenção
  if (!maintenanceLoading && isMaintenanceActive) {
    return (
      <MaintenanceMode 
        message={maintenanceMessage}
        estimatedTime={estimatedTime}
      />
    );
  }

  // Limpar intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Formatação automática do valor
  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const cents = parseInt(numbers) || 0;
    
    // Limite máximo: R$ 1199,99 = 119999 centavos
    const maxCents = 119999;
    const limitedCents = Math.min(cents, maxCents);
    
    // Converte de volta para reais
    const reais = limitedCents / 100;
    
    // Formata com vírgula
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
  };

  const getAmountValue = () => {
    return parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const checkPaymentStatus = async (paymentId: string, silent: boolean = false) => {
    try {
      // Verificar se o pagamento já foi finalizado ANTES de fazer qualquer requisição
      if (pixData?.status === 'paid' || pixData?.status === 'expired' || pixData?.status === 'cancelled') {
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        return;
      }
      
      // Verificar se ainda temos um interval ativo - se não, não continuar
      if (!statusCheckInterval) {
        return;
      }
      
      const response = await fetch(`/api/pix/status/${paymentId}`);
      
      if (!response.ok) {
        if (!silent) {
          toast.error('Erro ao verificar status do pagamento');
        }
        return;
      }
      
      const data = await response.json();

      if (data.success && data.payment) {
        const payment = data.payment;
        
        if (payment.status === 'paid') {
          // Parar verificação automática PRIMEIRO
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }
          
          setPixData(prev => prev ? { ...prev, status: payment.status } : prev);
          
          // Calcular valor creditado (80% do valor original)
          // Usar o valor do payment ou do pixData atual
          const originalAmount = payment.value_cents ? (payment.value_cents / 100) : (pixData?.amount || 0);
          const creditedAmount = originalAmount * 0.8;
          
          toast.success(
            `🎉 Pagamento aprovado! R$ ${creditedAmount.toFixed(2).replace('.', ',')} creditados na sua carteira (Taxa: 20%)`, 
            { duration: 8000 }
          );
          
          // Garantir que não haverá mais verificações
          return;
        } else if (payment.status === 'expired' || payment.status === 'cancelled') {
          // Parar verificação automática PRIMEIRO
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
          }
          
          setPixData(prev => prev ? { ...prev, status: payment.status } : prev);
          
          if (!silent) {
            toast.error(`Pagamento ${payment.status === 'expired' ? 'expirado' : 'cancelado'}`);
          }
          
          // Garantir que não haverá mais verificações
          return;
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error('Erro ao verificar status do pagamento');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amountValue = getAmountValue();
    if (amountValue < 1) {
      toast.error('Valor mínimo é R$ 1,00');
      return;
    }

    if (amountValue > 1199.99) {
      toast.error('Valor máximo é R$ 1.199,99');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/pix/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          description,
          expiresIn: 3600, // 1 hora
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao gerar PIX');
      }

      setPixData(data.payment);

      // Iniciar verificação automática de status a cada 5 segundos usando referenceCode
      const interval = setInterval(() => {
        checkPaymentStatus(data.payment.referenceCode, true);
      }, 5000);
      setStatusCheckInterval(interval);

      toast.success('PIX gerado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.pixCopiaECola) {
      navigator.clipboard.writeText(pixData.pixCopiaECola);
      toast.success('PIX copiado para a área de transferência!');
    }
  };

  const handleNewPayment = () => {
    setPixData(null);
    setAmount('');
    setDescription('');
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'expired':
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Aguardando pagamento';
      case 'expired':
        return 'Expirado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/dashboard/pix" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
            <FaArrowLeft className="mr-2" />
            Voltar
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaMoneyBillWave className="mr-3 text-blue-600" />
            Gerar Pagamento PIX
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Crie códigos PIX para receber pagamentos de forma rápida e segura.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!pixData ? (
            /* Formulário de Geração */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Configurar Pagamento
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Preencha as informações do pagamento PIX
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">R$</span>
                      </div>
                      <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0,00"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Valor máximo: R$ 1.199,99
                    </p>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Assinatura Premium, Produto X..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Preview do Valor */}
                {amount && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 dark:text-blue-200">Valor do PIX:</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          R$ {amount}
                        </p>
                        <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                          <p>• Você receberá: R$ {(getAmountValue() * 0.8).toFixed(2).replace('.', ',')} (80%)</p>
                          <p>• Taxa da plataforma: R$ {(getAmountValue() * 0.2).toFixed(2).replace('.', ',')} (20%)</p>
                        </div>
                      </div>
                      <FaMoneyBillWave className="text-3xl text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                )}

                {/* Botão de Gerar */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !amount || !description}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Gerando PIX...
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2" />
                        Gerar PIX
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Resultado do PIX */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header do PIX */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">PIX Gerado com Sucesso!</h2>
                    <p className="text-blue-100">
                      Valor: <span className="font-semibold">R$ {pixData.amount.toFixed(2).replace('.', ',')}</span>
                    </p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(pixData.status)}
                    <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(pixData.status)}`}>
                      {getStatusText(pixData.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* QR Code */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      QR Code PIX
                    </h3>
                    {pixData.qrCodeImage ? (
                      <div className="inline-block bg-white p-4 rounded-xl shadow-md">
                        <img
                          src={pixData.qrCodeImage}
                          alt="QR Code PIX"
                          className="w-64 h-64 mx-auto"
                          onError={(e) => {
                            console.error('Erro ao carregar QR Code:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <FaQrcode className="mx-auto text-4xl text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">QR Code não disponível</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Código PIX */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Código PIX (Copia e Cola)
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <textarea
                          readOnly
                          value={pixData.pixCopiaECola}
                          className="w-full h-32 bg-transparent text-sm text-gray-900 dark:text-white resize-none border-none outline-none"
                        />
                      </div>
                      <button
                        onClick={handleCopyPix}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                      >
                        <FaCopy className="mr-2" />
                        Copiar Código PIX
                      </button>
                    </div>

                    {/* Informações */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FaCheckCircle className="text-green-500 mr-2" />
                        Pagamento será confirmado automaticamente
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FaClock className="text-yellow-500 mr-2" />
                        Este código PIX expira em 1 hora
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleNewPayment}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                    >
                      <FaPlus className="mr-2" />
                      Gerar Novo PIX
                    </button>
                    <button
                      onClick={() => checkPaymentStatus(pixData.id)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                    >
                      <FaSpinner className="mr-2" />
                      Verificar Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 