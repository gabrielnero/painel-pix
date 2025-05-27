'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaCog, 
  FaSave, 
  FaEye, 
  FaEyeSlash,
  FaKey,
  FaShieldAlt,
  FaMoneyBillWave,
  FaServer,
  FaSpinner,
  FaCreditCard,
  FaToggleOn,
  FaToggleOff,
  FaTools,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Config {
  key: string;
  value: string;
  description: string;
  isEncrypted: boolean;
  updatedAt: Date;
}

interface PaymentProvider {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  configs: Config[];
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState<Record<string, boolean>>({});
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.configs);
        // Inicializar valores editados
        const initialValues: Record<string, string> = {};
        data.configs.forEach((config: Config) => {
          initialValues[config.key] = config.value;
        });
        setEditedConfigs(initialValues);
      } else {
        toast.error(data.message || 'Erro ao carregar configurações');
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Preparar apenas as configurações que foram alteradas
      const changedConfigs = configs
        .filter(config => editedConfigs[config.key] !== config.value)
        .map(config => ({
          key: config.key,
          value: editedConfigs[config.key],
          description: config.description
        }));

      if (changedConfigs.length === 0) {
        toast.success('Nenhuma alteração para salvar');
        return;
      }

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configs: changedConfigs
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configurações salvas com sucesso!');
        await loadConfigs(); // Recarregar para obter valores atualizados
      } else {
        toast.error(data.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Erro:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setEditedConfigs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleShowEncrypted = (key: string) => {
    setShowEncrypted(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName) {
      case 'primepag':
        return <FaCreditCard className="text-blue-500" />;
      case 'mercadopago':
        return <FaMoneyBillWave className="text-yellow-500" />;
      case 'pagseguro':
        return <FaShieldAlt className="text-green-500" />;
      default:
        return <FaCreditCard className="text-gray-500" />;
    }
  };

  const getProviderDisplayName = (providerName: string) => {
    const names: { [key: string]: string } = {
      'primepag': 'PrimePag',
      'mercadopago': 'Mercado Pago',
      'pagseguro': 'PagSeguro'
    };
    return names[providerName] || providerName;
  };

  const groupConfigsByProvider = (): { providers: PaymentProvider[], systemConfigs: Config[] } => {
    const providers: PaymentProvider[] = [];
    const systemConfigs: Config[] = [];
    
    // Agrupar por provedor
    const providerNames = ['primepag', 'mercadopago', 'pagseguro'];
    
    providerNames.forEach(providerName => {
      const providerConfigs = configs.filter(c => c.key.startsWith(`${providerName}.`));
      if (providerConfigs.length > 0) {
        providers.push({
          name: providerName,
          displayName: getProviderDisplayName(providerName),
          icon: getProviderIcon(providerName),
          configs: providerConfigs
        });
      }
    });

    // Configurações do sistema
    configs.forEach(config => {
      if (config.key.startsWith('system.')) {
        systemConfigs.push(config);
      }
    });

    return { providers, systemConfigs };
  };

  const hasChanges = () => {
    return configs.some(config => editedConfigs[config.key] !== config.value);
  };

  const renderConfigField = (config: Config) => {
    const isToggle = config.key.endsWith('.enabled');
    const isEncrypted = config.isEncrypted && !showEncrypted[config.key];
    const displayValue = isEncrypted ? '***ENCRYPTED***' : editedConfigs[config.key];

    if (isToggle) {
      const isEnabled = editedConfigs[config.key] === 'true';
      return (
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {config.description}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Habilitar/desabilitar este método de pagamento
            </p>
          </div>
          <button
            onClick={() => handleConfigChange(config.key, isEnabled ? 'false' : 'true')}
            className={`flex items-center p-1 rounded-full transition-colors ${
              isEnabled 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
          >
            {isEnabled ? (
              <FaToggleOn className="h-6 w-6" />
            ) : (
              <FaToggleOff className="h-6 w-6" />
            )}
          </button>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {config.description}
        </label>
        <div className="relative">
          <input
            type={isEncrypted ? 'password' : 'text'}
            value={displayValue}
            onChange={(e) => handleConfigChange(config.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={config.isEncrypted ? 'Digite a nova chave...' : 'Digite o valor...'}
          />
          {config.isEncrypted && (
            <button
              type="button"
              onClick={() => toggleShowEncrypted(config.key)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showEncrypted[config.key] ? <FaEyeSlash /> : <FaEye />}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Chave: {config.key}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  const { providers, systemConfigs } = groupConfigsByProvider();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
              <FaArrowLeft className="mr-2" />
              Voltar ao Admin
            </Link>
          </div>
          
          {hasChanges() && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaCog className="mr-3 text-blue-600" />
            Configurações do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie as API keys dos provedores de pagamento e outras configurações do sistema.
          </p>
        </div>

        <div className="space-y-8">
          {/* Provedores de Pagamento */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaCreditCard className="mr-3 text-blue-600" />
              Métodos de Pagamento
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {providers.map((provider) => (
                <div key={provider.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    {provider.icon}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-3">
                      {provider.displayName}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {provider.configs.map((config) => (
                      <div key={config.key}>
                        {renderConfigField(config)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configurações de Manutenção */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaTools className="mr-3 text-orange-600" />
              Modo Manutenção
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 gap-6">
                {systemConfigs
                  .filter(config => config.key.includes('maintenance'))
                  .map((config) => {
                    if (config.key === 'system.maintenance_mode') {
                      const isEnabled = editedConfigs[config.key] === 'true';
                      return (
                        <div key={config.key} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {config.description}
                              </label>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Quando ativado, apenas administradores podem acessar o sistema
                              </p>
                            </div>
                            <button
                              onClick={() => handleConfigChange(config.key, isEnabled ? 'false' : 'true')}
                              className={`flex items-center p-2 rounded-full transition-all duration-300 ${
                                isEnabled 
                                  ? 'bg-orange-500 text-white shadow-lg' 
                                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {isEnabled ? (
                                <FaToggleOn className="h-8 w-8" />
                              ) : (
                                <FaToggleOff className="h-8 w-8" />
                              )}
                            </button>
                          </div>
                          {isEnabled && (
                            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                              <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center">
                                <FaExclamationTriangle className="mr-2" />
                                <strong>Atenção:</strong> O modo manutenção está ativo! Usuários não conseguirão acessar o dashboard.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={config.key}>
                        {renderConfigField(config)}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Configurações do Sistema */}
          {systemConfigs.filter(config => !config.key.includes('maintenance')).length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FaServer className="mr-3 text-purple-600" />
                Configurações Gerais
              </h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {systemConfigs
                    .filter(config => !config.key.includes('maintenance'))
                    .map((config) => (
                      <div key={config.key}>
                        {renderConfigField(config)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informações de Ajuda */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <FaKey className="mr-2" />
            Informações Importantes
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>API Keys:</strong> Mantenha suas chaves de API seguras e nunca as compartilhe.</p>
            <p>• <strong>Criptografia:</strong> Campos sensíveis são automaticamente criptografados no banco de dados.</p>
            <p>• <strong>Provedores:</strong> Habilite apenas os métodos de pagamento que você pretende usar.</p>
            <p>• <strong>Teste:</strong> Sempre teste as configurações em ambiente de desenvolvimento antes de usar em produção.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 