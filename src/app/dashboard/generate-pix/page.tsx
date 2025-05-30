'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment';
  pixKey: string;
  pixCopiaECola: string;
  qrCodeImage: string;
  expiresAt: string;
}

function GeneratePixContent() {
  const searchParams = useSearchParams();
  const selectedAccount = searchParams.get('account') ? parseInt(searchParams.get('account')!) : 1;
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [cancelingPix, setCancelingPix] = useState(false);
  const [hasActivePix, setHasActivePix] = useState(false);
  const [syncingStatus, setSyncingStatus] = useState(false);
  const { isActive: isMaintenanceActive, message: maintenanceMessage, estimatedTime, loading: maintenanceLoading } = useMaintenanceMode();

  // Debug: Monitorar mudanças no pixData
  useEffect(() => {
    if (pixData) {
      console.log('🔄 Estado pixData atualizado:', {
        id: pixData.id,
        status: pixData.status,
        amount: pixData.amount,
        hasButtons: pixData.status === 'pending' || pixData.status === 'awaiting_payment'
      });
    } else {
      console.log('🔄 Estado pixData limpo (null)');
    }
  }, [pixData]);

  // Verificar se o sistema está em manutenção
  if (!maintenanceLoading && isMaintenanceActive) {
    return (
      <MaintenanceMode 
        message={maintenanceMessage}
        estimatedTime={estimatedTime}
      />
    );
  }

  // Verificar PIX ativo ao carregar
  useEffect(() => {
    checkActivePix();
  }, []);

  // Limpar intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  const checkActivePix = async () => {
    try {
      console.log('🔍 Verificando PIX ativo...');
      const response = await fetch('/api/pix/active');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Resposta da API de PIX ativo:', data);
        
        if (data.success && data.payment) {
          console.log('📋 PIX ativo encontrado:', data.payment);
          
          // Se já temos um pixData sendo exibido, não sobrescrever
          // Isso evita que os botões desapareçam durante a verificação automática
          if (!pixData) {
            setPixData(data.payment);
            setHasActivePix(true);
            
            // Iniciar verificação automática se o PIX estiver pendente
            if (data.payment.status === 'pending' || data.payment.status === 'awaiting_payment') {
              console.log('🔄 Iniciando verificação automática para PIX ativo...');
              
              const interval = setInterval(() => {
                console.log('⏰ Executando verificação automática (PIX ativo)...');
                autoSyncStatus(true);
              }, 5000);
              setStatusCheckInterval(interval);
              console.log('📊 Interval ID (PIX ativo):', interval);
            } else {
              console.log(`ℹ️ PIX ativo com status final: ${data.payment.status}`);
            }
          } else {
            // Se já temos pixData, apenas atualizar hasActivePix se necessário
            setHasActivePix(true);
            console.log('ℹ️ PIX já sendo exibido, não sobrescrever estado');
          }
        } else {
          console.log('ℹ️ Nenhum PIX ativo encontrado');
          // Só limpar o estado se não estivermos exibindo um PIX
          if (!pixData) {
            setHasActivePix(false);
          }
        }
      } else {
        console.error('❌ Erro ao verificar PIX ativo:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar PIX ativo:', error);
    }
  };

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

    // SEGURANÇA: Verificar se já existe PIX pendente antes de gerar novo
    if (hasActivePix) {
      toast.error('⚠️ Você já possui um PIX pendente. Aguarde o pagamento ou cancele para gerar um novo.');
      return;
    }

    setLoading(true);
    try {
      // Verificação adicional no servidor para garantir segurança
      const checkResponse = await fetch('/api/pix/active');
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.success && checkData.payment && 
            (checkData.payment.status === 'pending' || checkData.payment.status === 'awaiting_payment')) {
          toast.error('⚠️ SEGURANÇA: Já existe um PIX pendente. Não é possível gerar outro.');
          setHasActivePix(true);
          setPixData(checkData.payment);
          return;
        }
      }

      const response = await fetch('/api/pix/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          description,
          expiresIn: 3600, // 1 hora
          account: selectedAccount, // Usar conta selecionada
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao gerar PIX');
      }

      console.log('✅ PIX gerado com sucesso:', data.payment);
      
      setPixData(data.payment);
      setHasActivePix(true);

      // Iniciar verificação automática de status a cada 5 segundos usando referenceCode
      console.log('🔄 Iniciando verificação automática de status...');
      
      const interval = setInterval(() => {
        console.log('⏰ Executando verificação automática de status...');
        autoSyncStatus(true);
      }, 5000); // Verificar a cada 5 segundos
      setStatusCheckInterval(interval);
      
      console.log('📊 Interval ID configurado:', interval);

      toast.success('PIX gerado com sucesso! Verificação automática iniciada.');
      
      // Mostrar toast informativo sobre a verificação automática
      setTimeout(() => {
        toast.success('🔄 Verificando pagamento automaticamente...', {
          duration: 3000,
          style: {
            background: '#3B82F6',
            color: 'white'
          }
        });
      }, 1000);
    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);
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

  const handleCancelPix = async () => {
    if (!pixData) return;
    
    setCancelingPix(true);
    try {
      const response = await fetch(`/api/pix/cancel/${pixData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Parar verificação automática
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }
        
        // Atualizar status para cancelado
        setPixData(prev => prev ? { ...prev, status: 'cancelled' } : prev);
        setHasActivePix(false);
        
        toast.success('PIX cancelado com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao cancelar PIX');
      }
    } catch (error) {
      console.error('Erro ao cancelar PIX:', error);
      toast.error('Erro ao cancelar PIX');
    } finally {
      setCancelingPix(false);
    }
  };

  const handleSyncStatus = async () => {
    setSyncingStatus(true);
    try {
      const response = await fetch('/api/pix/sync-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Se algum pagamento foi aprovado, mostrar notificação especial
        if (data.stats.paid > 0) {
          // Calcular total creditado (assumindo 80% de cada pagamento)
          const paidPayments = data.results.filter((result: any) => result.newStatus === 'paid');
          
          toast.success(
            `🎉 ${data.stats.paid} pagamento(s) aprovado(s)!\n💰 Saldo atualizado na sua carteira\n🔄 Redirecionando em 3 segundos...`, 
            { 
              duration: 3000,
              style: {
                background: '#10B981',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
              }
            }
          );
          
          // Disparar evento para atualizar saldo no header
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
          
          // Redirecionamento automático após 3 segundos
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else {
          toast.success(data.message);
        }
        
        // Verificar PIX ativo novamente
        checkActivePix();
      } else {
        toast.error(data.message || 'Erro ao sincronizar status');
      }
    } catch (error) {
      console.error('Erro ao sincronizar status:', error);
      toast.error('Erro ao sincronizar status dos pagamentos');
    } finally {
      setSyncingStatus(false);
    }
  };

  const handleNewPayment = () => {
    setPixData(null);
    setAmount('');
    setDescription('');
    setHasActivePix(false);
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
      case 'awaiting_payment':
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
      case 'awaiting_payment':
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
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Função de verificação automática baseada na lógica do sync-status (que funciona)
  const autoSyncStatus = async (silent: boolean = true) => {
    try {
      // Verificar se o pagamento já foi finalizado ANTES de fazer qualquer requisição
      if (pixData?.status === 'paid' || pixData?.status === 'expired' || pixData?.status === 'cancelled') {
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
          console.log('🛑 Verificação automática parada - pagamento já finalizado');
        }
        return;
      }

      if (!silent) {
        console.log('🔄 Executando verificação automática via sync-status...');
      }

      const response = await fetch('/api/pix/sync-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Se algum pagamento foi aprovado, processar
        if (data.stats.paid > 0) {
          // Parar verificação automática PRIMEIRO
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
            console.log('🛑 Verificação automática parada - pagamento aprovado via sync');
          }

          console.log('✅ Pagamento aprovado via sync! Processando...');
          
          // Calcular valor creditado (assumindo 80% de cada pagamento)
          const paidPayments = data.results.filter((result: any) => result.newStatus === 'paid');
          const totalAmount = paidPayments.reduce((sum: number, payment: any) => {
            return sum + (payment.amount || 0);
          }, 0);
          const creditedAmount = totalAmount * 0.8;

          console.log(`💰 Valor creditado via sync: R$ ${creditedAmount.toFixed(2)}`);
          
          // Notificação de sucesso
          toast.success(
            `🎉 PAGAMENTO APROVADO!\n💰 R$ ${creditedAmount.toFixed(2).replace('.', ',')} creditados na sua carteira\n📊 Taxa aplicada: 20%\n🔄 Redirecionando em 5 segundos...`, 
            { 
              duration: 5000,
              style: {
                background: '#10B981',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
              }
            }
          );
          
          // Disparar evento para atualizar saldo no header
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
          
          // Atualizar estado local
          setPixData(prev => prev ? { ...prev, status: 'paid' } : prev);
          setHasActivePix(false);
          
          // Redirecionamento automático após 5 segundos
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 5000);
          
          return;
        } else {
          // Nenhum pagamento aprovado, continuar verificando
          if (!silent) {
            console.log('⏳ Nenhum pagamento aprovado ainda via sync');
          }
        }
      } else {
        if (!silent) {
          console.error('❌ Erro na resposta do sync-status:', data.message);
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('❌ Erro na verificação automática via sync:', error);
      }
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
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <FaCheckCircle className="mr-2" />
            Usando Conta {selectedAccount} da PrimePag
          </div>
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
                    disabled={loading || !amount || !description || hasActivePix}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Gerando PIX...
                      </>
                    ) : hasActivePix ? (
                      <>
                        <FaClock className="mr-2" />
                        PIX Ativo - Aguarde conclusão
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2" />
                        Gerar PIX
                      </>
                    )}
                  </button>
                  
                  {hasActivePix && (
                    <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                            ⚠️ <strong>Você já possui um PIX pendente.</strong>
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Aguarde o pagamento ser concluído ou cancele para gerar um novo.
                          </p>
                        </div>
                        <button
                          onClick={handleCancelPix}
                          disabled={cancelingPix}
                          className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors duration-300 flex items-center"
                        >
                          {cancelingPix ? (
                            <>
                              <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                              Cancelando...
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="mr-1 h-3 w-3" />
                              Cancelar PIX
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
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
                    {pixData.qrCodeImage && pixData.qrCodeImage !== 'null' ? (
                      <div className="inline-block bg-white p-4 rounded-xl shadow-md">
                        <img
                          src={pixData.qrCodeImage.startsWith('data:') ? pixData.qrCodeImage : `data:image/png;base64,${pixData.qrCodeImage}`}
                          alt="QR Code PIX"
                          className="w-64 h-64 mx-auto"
                          onError={(e) => {
                            console.error('Erro ao carregar QR Code:', e);
                            console.log('QR Code URL:', pixData.qrCodeImage);
                            // Tentar gerar QR Code alternativo
                            const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.pixCopiaECola)}`;
                            e.currentTarget.src = fallbackUrl;
                          }}
                          onLoad={() => {
                            console.log('QR Code carregado com sucesso');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="inline-block bg-white p-4 rounded-xl shadow-md">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixData.pixCopiaECola)}`}
                          alt="QR Code PIX"
                          className="w-64 h-64 mx-auto"
                          onError={(e) => {
                            console.error('Erro ao carregar QR Code alternativo:', e);
                            e.currentTarget.parentElement!.innerHTML = `
                              <div class="w-64 h-64 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center">
                                <div class="text-center">
                                  <div class="mx-auto text-4xl text-gray-400 mb-2">📱</div>
                                  <p class="text-sm text-gray-500">Use o código PIX abaixo</p>
                                </div>
                              </div>
                            `;
                          }}
                        />
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
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FaCheckCircle className="text-green-500 mr-2" />
                        Pagamento será confirmado automaticamente
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FaClock className="text-yellow-500 mr-2" />
                        Este código PIX expira em 30 minutos
                      </div>
                      <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                        <FaTimesCircle className="text-red-500 mr-2" />
                        ⚠️ Pagamentos após 30 minutos serão perdidos
                      </div>
                      {statusCheckInterval && pixData.status === 'pending' && (
                        <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                          <div className="animate-pulse mr-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          Verificando pagamento automaticamente
                        </div>
                      )}
                      {pixData.status === 'pending' && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 <strong>Pagou e não foi creditado?</strong><br />
                            Use o botão "Sincronizar Status" para verificar manualmente se o pagamento foi aprovado.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {(pixData.status === 'pending' || pixData.status === 'awaiting_payment') ? (
                      <>
                        <button
                          onClick={handleCancelPix}
                          disabled={cancelingPix}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                        >
                          {cancelingPix ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Cancelando...
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="mr-2" />
                              Cancelar PIX
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleSyncStatus}
                          disabled={syncingStatus}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                        >
                          {syncingStatus ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Sincronizando...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="mr-2" />
                              Sincronizar Status
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleNewPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                      >
                        <FaPlus className="mr-2" />
                        Gerar Novo PIX
                      </button>
                    )}
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

export default function GeneratePixPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    }>
      <GeneratePixContent />
    </Suspense>
  );
} 