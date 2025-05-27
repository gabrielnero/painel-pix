'use client';

import Link from 'next/link';
import { FaArrowLeft, FaCreditCard, FaCheckCircle, FaClock, FaChevronRight } from 'react-icons/fa';
import MaintenanceMode from '@/components/MaintenanceMode';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

export default function SelectPaymentGateway() {
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

  const gateways = [
    {
      id: 'primepag',
      name: 'PrimePag',
      description: 'Gateway oficial para pagamentos PIX',
      status: 'active',
      features: ['PIX instantâneo', 'QR Code automático', 'Confirmação em tempo real'],
      logo: '🏦',
      available: true,
      href: '/dashboard/generate-pix'
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Integração com Mercado Pago',
      status: 'coming-soon',
      features: ['PIX', 'Cartão de crédito', 'Boleto bancário'],
      logo: '💳',
      available: false,
      href: '#'
    },
    {
      id: 'pagseguro',
      name: 'PagSeguro',
      description: 'Integração com PagSeguro',
      status: 'coming-soon',
      features: ['PIX', 'Cartão', 'Transferência'],
      logo: '🔒',
      available: false,
      href: '#'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Gateway internacional',
      status: 'coming-soon',
      features: ['PIX', 'Cartões internacionais', 'Múltiplas moedas'],
      logo: '🌍',
      available: false,
      href: '#'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
          <FaArrowLeft className="mr-2" />
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <FaCreditCard className="mr-3 text-blue-600" />
          Selecionar Gateway de Pagamento
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Escolha o gateway de pagamento que deseja utilizar para gerar seus códigos PIX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gateways.map((gateway) => (
          <div
            key={gateway.id}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 ${
              gateway.available
                ? 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl cursor-pointer'
                : 'border-gray-200 dark:border-gray-700 opacity-75'
            }`}
          >
            {gateway.available ? (
              <Link href={gateway.href} className="block p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">{gateway.logo}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {gateway.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {gateway.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                      Ativo
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Recursos disponíveis:
                  </h4>
                  <ul className="space-y-1">
                    {gateway.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Clique para usar
                  </span>
                  <FaChevronRight className="text-blue-600 dark:text-blue-400" />
                </div>
              </Link>
            ) : (
              <div className="p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3 grayscale">{gateway.logo}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">
                        {gateway.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {gateway.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-yellow-500 mr-2" />
                    <span className="text-xs font-medium text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                      Em breve
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-500 mb-2">
                    Recursos planejados:
                  </h4>
                  <ul className="space-y-1">
                    {gateway.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500 dark:text-gray-500">
                        <FaClock className="text-yellow-500 mr-2 text-xs" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
                    Disponível em breve
                  </span>
                  <FaClock className="text-gray-400" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Dica
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Atualmente, o <strong>PrimePag</strong> é nosso gateway principal e está totalmente funcional. 
          Novos gateways serão adicionados em breve para oferecer mais opções de pagamento.
        </p>
      </div>
    </div>
  );
} 