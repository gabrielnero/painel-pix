import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface PixPaymentProps {
  onSuccess?: (paymentId: string) => void;
  onCancel?: (paymentId: string) => void;
}

interface Customer {
  name?: string;
  document?: string;
  email?: string;
}

interface PixData {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  pixKey: string;
  pixCopiaECola: string;
  qrCodeImage: string;
  expiresAt: string;
  customer?: Customer;
}

export function PixPayment({ onSuccess, onCancel }: PixPaymentProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Limpar intervalo de verificação ao desmontar
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

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
      
      if (!silent) {
        toast.loading('Verificando status do pagamento...', { id: 'status-check' });
      }
      
      const response = await fetch(`/api/pix/status/${paymentId}`);
      
      if (!response.ok) {
        if (!silent) {
          toast.error('Erro ao verificar status do pagamento', { id: 'status-check' });
        }
        console.error('Erro na resposta da API:', response.status);
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
          const originalAmount = payment.value_cents ? (payment.value_cents / 100) : (pixData?.amount || 0);
          const creditedAmount = originalAmount * 0.8;
          
          toast.success(
            `🎉 Pagamento aprovado! R$ ${creditedAmount.toFixed(2).replace('.', ',')} creditados na sua carteira (Taxa: 20%)`, 
            { id: 'status-check', duration: 8000 }
          );
          
          if (onSuccess) {
            onSuccess(paymentId);
          }
          
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
            toast.error(`Pagamento ${payment.status === 'expired' ? 'expirado' : 'cancelado'}`, { id: 'status-check' });
          }
          
          // Garantir que não haverá mais verificações
          return;
        } else if (payment.status === 'pending') {
          if (!silent) {
            toast.success('Pagamento ainda pendente', { id: 'status-check' });
          }
        } else {
          if (!silent) {
            toast.dismiss('status-check');
          }
        }
      } else {
        if (!silent) {
          toast.error('Erro ao verificar status do pagamento', { id: 'status-check' });
        }
        console.error('Resposta da API sem sucesso:', data);
      }
    } catch (error) {
      if (!silent) {
        toast.error('Erro ao verificar status do pagamento', { id: 'status-check' });
      }
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < 1) {
      toast.error('Valor mínimo é R$ 1,00');
      return;
    }

    setLoading(true);
    try {
      const customer: Customer = {};
      if (customerName) customer.name = customerName;
      if (customerDocument) customer.document = customerDocument;
      if (customerEmail) customer.email = customerEmail;

      const response = await fetch('/api/pix/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          description,
          customer: Object.keys(customer).length > 0 ? customer : undefined,
          expiresIn: 3600, // 1 hora
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao gerar PIX');
      }

      setPixData(data.payment);

      if (onSuccess) {
        onSuccess(data.payment.id);
      }

      // Iniciar verificação automática de status (mais robusta)
      const interval = setInterval(() => {
        checkPaymentStatus(data.payment.id, true); // true = verificação silenciosa
      }, 10000); // Verificar a cada 10 segundos
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

  const handleCancel = async () => {
    if (!pixData?.id) return;

    try {
      const response = await fetch(`/api/pix/status/${pixData.id}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao cancelar PIX');
      }

      setPixData(data.payment);
      
      if (onCancel) {
        onCancel(pixData.id);
      }

      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }

      toast.success('PIX cancelado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar PIX');
    }
  };

  const handleNewPayment = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    setPixData(null);
    setAmount('');
    setDescription('');
    setCustomerName('');
    setCustomerDocument('');
    setCustomerEmail('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {!pixData ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Valor (R$)
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Descrição
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Descrição do pagamento"
              required
            />
          </div>

          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nome do Cliente (opcional)
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label htmlFor="customerDocument" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              CPF/CNPJ (opcional)
            </label>
            <input
              type="text"
              id="customerDocument"
              value={customerDocument}
              onChange={(e) => setCustomerDocument(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="CPF ou CNPJ"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email (opcional)
            </label>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="email@exemplo.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Gerar PIX'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            {pixData.status === 'pending' && (
              <>
                {pixData.qrCodeImage ? (
                  <div className="w-full max-w-sm mx-auto bg-white p-4 rounded-lg shadow-sm">
                    <img
                      src={`data:image/png;base64,${pixData.qrCodeImage}`}
                      alt="QR Code PIX"
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-sm mx-auto h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="mx-auto text-4xl text-gray-400 mb-2 w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h4.01M12 12v4.01M12 12v4.01" />
                      </svg>
                      <p className="text-sm text-gray-500">QR Code não disponível</p>
                      <p className="text-xs text-gray-400">Use o código PIX abaixo</p>
                    </div>
                  </div>
                )}
                <div className="mt-2 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aguardando pagamento...
                    </p>
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Verificando automaticamente a cada 10 segundos
                  </p>
                </div>
              </>
            )}
            {pixData.status === 'paid' && (
              <div className="text-green-500 bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="animate-bounce">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-4 text-xl font-bold">Pagamento confirmado!</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  R$ {pixData.amount.toFixed(2)} recebido com sucesso
                </p>
              </div>
            )}
            {(pixData.status === 'expired' || pixData.status === 'cancelled') && (
              <div className="text-red-500">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="mt-2">
                  {pixData.status === 'expired' ? 'Pagamento expirado' : 'Pagamento cancelado'}
                </p>
              </div>
            )}
          </div>

          {pixData.status === 'pending' && (
            <>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor:</span>
                    <span className="text-lg font-bold text-green-600">R$ {pixData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                    <span className="text-sm font-medium text-yellow-600 capitalize">{pixData.status}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Código PIX (Copia e Cola):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.pixCopiaECola}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
                    />
                    <button
                      onClick={handleCopyPix}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => checkPaymentStatus(pixData.id)}
                  className="w-full py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Verificar Status do Pagamento
                </button>
                
                <button
                  onClick={handleCancel}
                  className="w-full py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancelar PIX
                </button>
              </div>
            </>
          )}

          <button
            onClick={handleNewPayment}
            className="w-full mt-4 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Gerar novo PIX
          </button>
        </div>
      )}
    </div>
  );
} 