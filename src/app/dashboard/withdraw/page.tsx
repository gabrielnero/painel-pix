'use client';

import { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface WithdrawalFormData {
  amount: number;
  pixKey: string;
  pixKeyType: string;
  receiverName: string;
  receiverDocument: string;
}

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    pixKey: '',
    pixKeyType: 'cpf',
    receiverName: '',
    receiverDocument: ''
  });

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/user/balance');
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
      } else {
        toast.error('Erro ao carregar saldo');
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
      toast.error('Erro ao carregar saldo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error('O valor do saque deve ser maior que zero');
      return;
    }

    if (formData.amount > balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!formData.pixKey) {
      toast.error('Chave PIX é obrigatória');
      return;
    }

    if (!formData.receiverName) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    if (!formData.receiverDocument) {
      toast.error('CPF é obrigatório');
      return;
    }

    // Validar CPF
    const cpfClean = formData.receiverDocument.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/withdrawal/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Solicitação de saque enviada com sucesso!');
        fetchBalance(); // Atualiza o saldo
        setFormData({ amount: 0, pixKey: '', pixKeyType: 'cpf', receiverName: '', receiverDocument: '' }); // Limpa o formulário
      } else {
        toast.error(data.message || 'Erro ao solicitar saque');
      }
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      toast.error('Erro ao processar sua solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar valor monetário durante a digitação
  const formatMoneyInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se está vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100
    const amount = parseInt(numbers) / 100;
    
    // Retorna formatado com vírgula
    return amount.toFixed(2).replace('.', ',');
  };

  // Função para converter valor formatado para número
  const parseMoneyInput = (value: string): number => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return 0;
    const amount = parseInt(numbers) / 100;
    // Limite máximo de R$ 10.000
    return Math.min(amount, 10000);
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-2xl text-green-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Solicitar Saque
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Disponível</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor do Saque
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatMoneyInput(formData.amount.toString())}
                  onChange={(e) => setFormData({ ...formData, amount: parseMoneyInput(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
                  placeholder="Ex: 100,00"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💰 Limite máximo: R$ 10.000,00 por transação
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Chave PIX
              </label>
              <select
                value={formData.pixKeyType}
                onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
              >
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
                placeholder="Digite sua chave PIX"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
                  placeholder="Nome conforme cadastrado na chave PIX"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ⚠️ Deve ser exatamente igual ao nome do dono da chave PIX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seu CPF
                </label>
                <input
                  type="text"
                  value={formData.receiverDocument}
                  onChange={(e) => setFormData({ ...formData, receiverDocument: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2"
                  placeholder="CPF sem pontuação"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ⚠️ Deve ser o CPF real do dono da chave PIX
                </p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-green-500 mt-1 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✅ Dados Obrigatórios Atualizados
                  </h4>
                  <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                    Agora solicitamos nome e CPF para evitar cancelamentos. O PIX só funciona quando os dados conferem com o dono da chave.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mt-1 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Informações Importantes
                  </h4>
                  <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Valor mínimo para saque: R$ 10,00</li>
                    <li>• Saques são processados em até 24 horas úteis</li>
                    <li>• Verifique cuidadosamente sua chave PIX antes de enviar</li>
                    <li>• Em caso de problemas, entre em contato com o suporte</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || balance <= 0}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium transition-colors ${
                submitting || balance <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Processando...
                </>
              ) : (
                'Solicitar Saque'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 