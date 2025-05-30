'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCreditCard, FaCheckCircle, FaSpinner, FaUniversity } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import MaintenanceMode from '@/components/MaintenanceMode';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

interface PrimepagAccount {
  id: number;
  name: string;
  clientId: string;
  clientSecret: string;
}

export default function SelectPrimepagAccountPage() {
  const router = useRouter();
  const { isActive: isMaintenanceActive, message: maintenanceMessage, estimatedTime, loading: maintenanceLoading } = useMaintenanceMode();
  const [accounts, setAccounts] = useState<PrimepagAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se o sistema está em manutenção
  if (!maintenanceLoading && isMaintenanceActive) {
    return (
      <MaintenanceMode 
        message={maintenanceMessage}
        estimatedTime={estimatedTime}
      />
    );
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/primepag/accounts');
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
      } else {
        toast.error('Erro ao carregar contas da Primepag');
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao carregar contas da Primepag');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (accountId: number) => {
    // Redirecionar para a página de geração de PIX com a conta selecionada
    router.push(`/dashboard/generate-pix?account=${accountId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Carregando contas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/pix" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
          <FaArrowLeft className="mr-2" />
          Voltar
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <FaUniversity className="mr-3 text-blue-600" />
          Selecionar Conta PrimePag
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Escolha qual conta da PrimePag deseja utilizar para gerar seu código PIX.
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Nenhuma conta disponível
          </h3>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Não há contas da PrimePag configuradas ou habilitadas no momento. 
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountSelect(account.id)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl cursor-pointer transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mr-4">
                    <FaCreditCard className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {account.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Conta {account.id} - PrimePag
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                    Ativa
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Recursos disponíveis:
                </h4>
                <ul className="space-y-1">
                  <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                    PIX instantâneo
                  </li>
                  <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                    QR Code automático
                  </li>
                  <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                    Confirmação em tempo real
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Clique para usar esta conta
                </span>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Selecionar
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Informação
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Cada conta da PrimePag possui suas próprias configurações e limites. 
          Selecione a conta que melhor atende às suas necessidades no momento.
        </p>
      </div>
    </div>
  );
} 