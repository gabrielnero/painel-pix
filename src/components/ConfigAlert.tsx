'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaExclamationTriangle, FaCog, FaTimes } from 'react-icons/fa';

interface ConfigAlertProps {
  userRole?: string;
}

export function ConfigAlert({ userRole }: ConfigAlertProps) {
  const [missingConfigs, setMissingConfigs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Só verificar se for admin
    if (userRole !== 'admin') return;

    // Verificar se já foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem('config-alert-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    checkConfigurations();
  }, [userRole]);

  const checkConfigurations = async () => {
    try {
      // Fazer uma tentativa de gerar PIX para verificar configurações
      const response = await fetch('/api/pix/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1,
          description: 'Teste de configuração'
        }),
      });

      const data = await response.json();

      if (!data.success && data.missingConfigs) {
        setMissingConfigs(data.missingConfigs);
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Erro ao verificar configurações:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('config-alert-dismissed', 'true');
  };

  if (!isVisible || isDismissed || missingConfigs.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Configurações Incompletas
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p className="mb-2">
              As seguintes configurações precisam ser definidas para o funcionamento completo do sistema PIX:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {missingConfigs.map((config, index) => (
                <li key={index}>{config}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <Link
                href="/admin/config"
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center"
              >
                <FaCog className="mr-2 h-4 w-4" />
                Configurar Agora
              </Link>
              <button
                onClick={handleDismiss}
                className="bg-transparent hover:bg-yellow-100 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200"
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={handleDismiss}
            className="text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-200 transition-colors duration-200"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 