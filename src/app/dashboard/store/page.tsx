'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaStore, 
  FaImages, 
  FaIdCard, 
  FaShieldAlt, 
  FaClock,
  FaArrowRight,
  FaLock,
  FaStar,
  FaCheckCircle
} from 'react-icons/fa';

type StoreTab = 'photos' | 'cpfs';

export default function StorePage() {
  const [activeTab, setActiveTab] = useState<StoreTab>('photos');

  const tabs = [
    {
      id: 'photos' as StoreTab,
      name: 'Photos',
      icon: <FaImages className="h-5 w-5" />,
      description: 'Galeria Premium de Selfies',
      available: true
    },
    {
      id: 'cpfs' as StoreTab,
      name: 'CPFs Batidos',
      icon: <FaIdCard className="h-5 w-5" />,
      description: 'CPFs com garantia de saldo na VPN',
      available: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
          <FaArrowLeft className="mr-2" />
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <FaStore className="mr-3 text-purple-600" />
          Store Premium
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Explore nossos produtos e serviços exclusivos.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.name}</span>
                  {!tab.available && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2">
                      Em Breve
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        {activeTab === 'photos' && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaImages className="text-3xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Galeria Premium de Selfies
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Acesse nossa coleção exclusiva de selfies profissionais organizadas por categoria e faixa etária. 
                Compre e baixe instantaneamente com pagamento via PIX ou criptomoedas.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FaStar className="text-3xl text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Qualidade Premium</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Todas as fotos são cuidadosamente selecionadas e verificadas
                </p>
              </div>
              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FaCheckCircle className="text-3xl text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download Instantâneo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Baixe suas fotos imediatamente após a compra
                </p>
              </div>
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FaShieldAlt className="text-3xl text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pagamento Seguro</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  PIX e criptomoedas aceitas com total segurança
                </p>
              </div>
            </div>

            {/* Categorias Disponíveis */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categorias Disponíveis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['18-25 anos', '26-35 anos', '36-45 anos', '46+ anos'].map((category) => (
                  <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link 
              href="/dashboard/photos"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <FaImages className="mr-3" />
              Acessar Galeria de Fotos
              <FaArrowRight className="ml-3" />
            </Link>
          </div>
        )}

        {activeTab === 'cpfs' && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-3xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                CPFs Batidos na VPN
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Em breve teremos disponível nossa base exclusiva de CPFs verificados e batidos na VPN com garantia de saldo.
              </p>
            </div>

            {/* Em Breve Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <FaShieldAlt className="text-3xl text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Garantia de Saldo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Todos os CPFs vêm com garantia comprovada de saldo
                </p>
              </div>
              <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <FaIdCard className="text-3xl text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Base Atualizada</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Base constantemente atualizada e verificada
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <FaClock className="text-4xl text-yellow-600 mr-3" />
                <span className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">EM BREVE</span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-center">
                Este serviço estará disponível muito em breve. Fique atento às atualizações!
              </p>
            </div>

            <button
              disabled
              className="inline-flex items-center bg-gray-400 cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg"
            >
              <FaLock className="mr-3" />
              Serviço Indisponível
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 