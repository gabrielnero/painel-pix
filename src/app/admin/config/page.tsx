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
  FaSpinner
} from 'react-icons/fa';

interface Config {
  key: string;
  value: string;
  description: string;
  isEncrypted: boolean;
  updatedAt: Date;
}

interface ConfigGroup {
  title: string;
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

  const groupConfigs = (): ConfigGroup[] => {
    const groups: ConfigGroup[] = [
      {
        title: 'API de Pagamento',
        icon: <FaKey className="text-blue-500" />,
        configs: configs.filter(c => c.key.startsWith('payment.'))
      },
      {
        title: 'Configurações do Sistema',
        icon: <FaServer className="text-purple-500" />,
        configs: configs.filter(c => c.key.startsWith('system.'))
      }
    ];

    return groups.filter(group => group.configs.length > 0);
  };

  const hasChanges = () => {
    return configs.some(config => editedConfigs[config.key] !== config.value);
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
            Gerencie as configurações de API keys, PIX e outras configurações do sistema.
          </p>
        </div>

        {/* Grupos de Configurações */}
        <div className="space-y-8">
          {groupConfigs().map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  {group.icon}
                  <span className="ml-3">{group.title}</span>
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {group.configs.map((config) => (
                    <div key={config.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            {config.isEncrypted && (
                              <FaShieldAlt className="text-yellow-500 mr-2" title="Campo criptografado" />
                            )}
                            {config.key}
                          </div>
                        </label>
                        {config.isEncrypted && (
                          <button
                            type="button"
                            onClick={() => toggleShowEncrypted(config.key)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showEncrypted[config.key] ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        )}
                      </div>

                      {config.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {config.description}
                        </p>
                      )}

                      <div className="relative">
                        {config.isEncrypted && !showEncrypted[config.key] ? (
                          <input
                            type="password"
                            value={editedConfigs[config.key] === '***ENCRYPTED***' ? '' : editedConfigs[config.key] || ''}
                            onChange={(e) => handleConfigChange(config.key, e.target.value)}
                            placeholder="Digite o novo valor para alterar"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editedConfigs[config.key] === '***ENCRYPTED***' ? '' : editedConfigs[config.key] || ''}
                            onChange={(e) => handleConfigChange(config.key, e.target.value)}
                            placeholder={config.isEncrypted ? "Digite o novo valor para alterar" : "Valor da configuração"}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        )}
                      </div>

                      {editedConfigs[config.key] !== config.value && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          ✓ Valor alterado (será salvo quando clicar em "Salvar Alterações")
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informações de Segurança */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <FaShieldAlt className="text-yellow-600 dark:text-yellow-400 mt-1 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Informações de Segurança
              </h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <p>• Campos marcados com <FaShieldAlt className="inline text-yellow-500" /> são criptografados automaticamente</p>
                <p>• API keys e tokens são armazenados de forma segura no banco de dados</p>
                <p>• Apenas administradores podem visualizar e alterar essas configurações</p>
                <p>• Todas as alterações são registradas com data/hora e usuário responsável</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar Fixo */}
        {hasChanges() && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-colors duration-300 flex items-center"
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
          </div>
        )}
      </div>
    </div>
  );
} 