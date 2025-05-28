'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FaHome, 
  FaShieldAlt, 
  FaLink, 
  FaCheck, 
  FaTimes, 
  FaPlay,
  FaCog,
  FaExternalLinkAlt,
  FaClipboard
} from 'react-icons/fa';

interface WebhookConfig {
  hasSecretKey: boolean;
  secretKeyLength: number;
  webhookUrl: string;
  testWebhookUrl: string;
  environment: string;
  vercelUrl?: string;
}

interface WebhookInstructions {
  webhook_setup: string[];
  primepag_webhook_config: {
    url: string;
    method: string;
    content_type: string;
    events: string[];
  };
}

export default function AdminWebhookPage() {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [instructions, setInstructions] = useState<WebhookInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [testReferenceCode, setTestReferenceCode] = useState('');
  const [testValue, setTestValue] = useState('2.00');
  const [configuring, setConfiguring] = useState(false);
  const [configuringAccount1, setConfiguringAccount1] = useState(false);
  const [testingEndpoints, setTestingEndpoints] = useState(false);
  const [testingWebhookPost, setTestingWebhookPost] = useState(false);
  const [testingWebhookTypes, setTestingWebhookTypes] = useState(false);
  const [debuggingTypes, setDebuggingTypes] = useState(false);
  const [debuggingRegister, setDebuggingRegister] = useState(false);
  const [scanningEndpoints, setScanningEndpoints] = useState(false);

  useEffect(() => {
    fetchWebhookConfig();
  }, []);

  const fetchWebhookConfig = async () => {
    try {
      const response = await fetch('/api/admin/webhook-config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
        setInstructions(data.instructions);
      } else {
        toast.error(data.message || 'Erro ao carregar configuração');
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração do webhook');
    } finally {
      setLoading(false);
    }
  };

  const configureWebhook = async () => {
    setConfiguring(true);
    try {
      const response = await fetch('/api/admin/configure-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      console.log('Resultado completo da configuração:', data);

      if (data.success) {
        toast.success(data.message);
        
        // Mostrar detalhes dos resultados
        if (data.results) {
          data.results.forEach((result: any) => {
            if (result.success) {
              if (result.action === 'already_configured') {
                toast.success(`✅ Conta ${result.account}: Webhook já estava configurado`);
              } else {
                toast.success(`✅ Conta ${result.account}: Webhook configurado com sucesso`);
              }
            } else {
              toast.error(`❌ Conta ${result.account}: ${result.message}`);
              console.error(`Erro detalhado da conta ${result.account}:`, result);
            }
          });
        }
      } else {
        toast.error(data.message || 'Erro ao configurar webhook');
        console.error('Erro na configuração:', data);
        
        // Mostrar detalhes dos erros mesmo quando success é false
        if (data.results) {
          data.results.forEach((result: any) => {
            if (!result.success) {
              toast.error(`❌ Conta ${result.account}: ${result.message}`);
              if (result.details) {
                console.error(`Detalhes do erro da conta ${result.account}:`, result.details);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      toast.error('Erro ao configurar webhook automaticamente');
    } finally {
      setConfiguring(false);
    }
  };

  const configureWebhookAccount1 = async () => {
    setConfiguringAccount1(true);
    try {
      const response = await fetch('/api/admin/configure-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: 1 }) // Apenas conta 1
      });

      const data = await response.json();
      console.log('Resultado da configuração da Conta 1:', data);

      if (data.success) {
        toast.success('Webhook configurado com sucesso na Conta 1!');
        if (data.results && data.results[0]) {
          const result = data.results[0];
          if (result.action === 'already_configured') {
            toast.success('Webhook já estava configurado na Conta 1');
          }
        }
      } else {
        // Log detalhado do erro
        console.error('Erro na configuração da Conta 1:', data);
        if (data.results && data.results[0]) {
          const result = data.results[0];
          console.error('Detalhes do erro da Conta 1:', result);
          console.error('Mensagem de erro:', result.message);
          console.error('Erro específico:', result.error);
          if (result.details) {
            console.error('Detalhes adicionais:', result.details);
          }
          toast.error(`Erro na Conta 1: ${result.message || result.error}`);
        } else {
          toast.error(data.message || 'Erro ao configurar webhook na Conta 1');
        }
      }
    } catch (error) {
      console.error('Erro ao configurar webhook na Conta 1:', error);
      toast.error('Erro ao configurar webhook na Conta 1');
    } finally {
      setConfiguringAccount1(false);
    }
  };

  const testWebhook = async () => {
    if (!testReferenceCode) {
      toast.error('Informe o código de referência do PIX');
      return;
    }

    const valueInCents = Math.round(parseFloat(testValue) * 100);
    if (valueInCents <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      setTestLoading(true);
      const response = await fetch('/api/admin/webhook-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_webhook',
          referenceCode: testReferenceCode,
          valueInCents
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Teste do webhook executado com sucesso!');
        console.log('Resultado do teste:', data.result);
      } else {
        toast.error(data.message || 'Erro no teste do webhook');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro ao executar teste do webhook');
    } finally {
      setTestLoading(false);
    }
  };

  const testPrimepagEndpoints = async () => {
    setTestingEndpoints(true);
    try {
      const response = await fetch('/api/test/primepag-endpoints');
      const data = await response.json();

      if (data.success) {
        toast.success('Teste de endpoints concluído!');
        console.log('Resultados dos endpoints:', data);
        
        // Mostrar resultados detalhados
        data.results.forEach((result: any) => {
          if (result.success) {
            const workingCount = result.workingEndpoints?.length || 0;
            const totalCount = result.endpoints?.length || 0;
            toast.success(`Conta ${result.account}: ${workingCount}/${totalCount} endpoints funcionando`);
            
            // Log dos endpoints que funcionam
            if (result.workingEndpoints?.length > 0) {
              console.log(`Endpoints funcionando na conta ${result.account}:`, 
                result.workingEndpoints.map((e: any) => e.endpoint));
            }
          } else {
            toast.error(`Erro na conta ${result.account}: ${result.message}`);
          }
        });
      } else {
        toast.error(data.message || 'Erro ao testar endpoints');
      }
    } catch (error) {
      console.error('Erro ao testar endpoints:', error);
      toast.error('Erro ao testar endpoints da PrimePag');
    } finally {
      setTestingEndpoints(false);
    }
  };

  const testWebhookPost = async () => {
    setTestingWebhookPost(true);
    try {
      const response = await fetch('/api/test/webhook-post-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Teste de POST webhook concluído com sucesso!');
        console.log('Resultados do POST webhook:', data);
        
        // Mostrar resultados detalhados
        data.results.forEach((result: any) => {
          if (result.success) {
            toast.success(`✅ Webhook criado na Conta ${result.account} com ${result.successfulPayload}!`);
            console.log(`Payload que funcionou:`, result.successfulPayload);
            console.log(`Dados do webhook criado:`, result.testResults.find((t: any) => t.success)?.data);
          } else {
            toast.error(`❌ Falha na Conta ${result.account}`);
            console.log(`Detalhes dos testes:`, result.testResults);
          }
        });
      } else {
        toast.error(data.message || 'Erro ao testar POST webhook');
        console.error('Erro no teste:', data);
      }
    } catch (error) {
      console.error('Erro ao testar POST webhook:', error);
      toast.error('Erro ao testar POST webhook');
    } finally {
      setTestingWebhookPost(false);
    }
  };

  const testWebhookTypes = async () => {
    setTestingWebhookTypes(true);
    try {
      const response = await fetch('/api/test/webhook-types');
      const data = await response.json();

      if (data.success) {
        toast.success('Consulta de tipos de webhook concluída!');
        console.log('Tipos de webhook disponíveis:', data);
        
        // Mostrar resultados detalhados
        data.results.forEach((result: any) => {
          if (result.success) {
            const workingCount = result.endpointResults?.filter((e: any) => e.success).length || 0;
            const totalCount = result.endpointResults?.length || 0;
            toast.success(`✅ Conta ${result.account}: ${workingCount}/${totalCount} endpoints de tipos funcionando`);
            
            // Log dos tipos disponíveis
            if (result.availableTypes?.length > 0) {
              console.log(`Tipos disponíveis na conta ${result.account}:`, result.availableTypes);
            }
          } else {
            toast.error(`❌ Erro na conta ${result.account}: ${result.message}`);
          }
        });
      } else {
        toast.error(data.message || 'Erro ao consultar tipos de webhook');
      }
    } catch (error) {
      console.error('Erro ao consultar tipos de webhook:', error);
      toast.error('Erro ao consultar tipos de webhook');
    } finally {
      setTestingWebhookTypes(false);
    }
  };

  const debugWebhookTypes = async () => {
    setDebuggingTypes(true);
    try {
      const response = await fetch('/api/debug/webhook-types-detail');
      const data = await response.json();

      if (data.success) {
        toast.success('Detalhes dos tipos obtidos!');
        console.log('=== DETALHES DOS TIPOS DE WEBHOOK ===');
        console.log('Resposta completa:', data);
        console.log('Tipos disponíveis:', data.webhookTypes);
        console.log('Lista formatada:', data.typesList);
        
        // Mostrar cada tipo individualmente
        if (data.typesList && data.typesList.length > 0) {
          data.typesList.forEach((item: any) => {
            console.log(`Tipo ${item.index + 1}:`, item.type);
            console.log(`Nome: ${item.name}`);
            console.log(`Descrição: ${item.description}`);
            console.log('---');
          });
          
          toast.success(`${data.typesCount} tipos encontrados! Veja o console para detalhes.`);
        }
      } else {
        toast.error(data.message || 'Erro ao obter detalhes dos tipos');
        console.error('Erro nos detalhes:', data);
      }
    } catch (error) {
      console.error('Erro ao obter detalhes dos tipos:', error);
      toast.error('Erro ao obter detalhes dos tipos');
    } finally {
      setDebuggingTypes(false);
    }
  };

  const debugWebhookRegister = async () => {
    setDebuggingRegister(true);
    try {
      const response = await fetch('/api/debug/webhook-register-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();

      if (data.success) {
        toast.success('🎉 WEBHOOK REGISTRADO COM SUCESSO!');
        console.log('=== SUCESSO NO REGISTRO ===');
        console.log('Dados completos:', data);
        console.log('Payload que funcionou:', data.payload);
        console.log('Resposta da PrimePag:', data.response);
        
        if (data.attempt) {
          toast.success(`✅ Funcionou com payload alternativo ${data.attempt}!`);
        }
      } else {
        toast.error('❌ Falha no registro do webhook');
        console.log('=== FALHA NO REGISTRO ===');
        console.log('Erro completo:', data);
        console.log('Payload testado:', data.payload);
        console.log('Erro da API:', data.error);
      }
    } catch (error) {
      console.error('Erro no debug de registro:', error);
      toast.error('Erro no debug de registro');
    } finally {
      setDebuggingRegister(false);
    }
  };

  const scanWebhookEndpoints = async () => {
    setScanningEndpoints(true);
    try {
      const response = await fetch('/api/debug/webhook-endpoints-scan');
      const data = await response.json();

      if (data.success) {
        toast.success(`🎉 ${data.summary.working} endpoint(s) funcionando!`);
        console.log('=== ESCANEAMENTO DE ENDPOINTS ===');
        console.log('Resultados completos:', data);
        console.log('Resumo:', data.summary);
        
        if (data.summary.workingEndpoints.length > 0) {
          console.log('Endpoints que funcionam:');
          data.summary.workingEndpoints.forEach((ep: any) => {
            console.log(`  ✅ ${ep.method} ${ep.endpoint}: ${ep.status}`);
            toast.success(`✅ ${ep.method} ${ep.endpoint} funciona!`);
          });
        }
        
        if (data.summary.methodNotAllowed > 0) {
          toast.success(`ℹ️ ${data.summary.methodNotAllowed} endpoint(s) com 405 (Method Not Allowed)`);
        }
      } else {
        toast.error('❌ Nenhum endpoint funcionando');
        console.log('=== FALHA NO ESCANEAMENTO ===');
        console.log('Erro:', data);
      }
    } catch (error) {
      console.error('Erro no escaneamento de endpoints:', error);
      toast.error('Erro no escaneamento de endpoints');
    } finally {
      setScanningEndpoints(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando configuração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-4">
              <FaHome className="mr-2" />
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/admin" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mx-2">
              Admin
            </Link>
            <span className="text-gray-400">/</span>
            <span className="ml-2 text-gray-900 dark:text-white font-semibold">Webhook</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FaLink className="mr-3 text-blue-600" />
            Configuração do Webhook PrimePag
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure e teste o webhook para recebimento automático de notificações de pagamento
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Secret Key</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {config?.hasSecretKey ? 'Configurada' : 'Não configurada'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${config?.hasSecretKey ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {config?.hasSecretKey ? (
                  <FaCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <FaTimes className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            {config?.hasSecretKey && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Tamanho: {config.secretKeyLength} caracteres
                </span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ambiente</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {config?.environment}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FaCog className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {config?.hasSecretKey ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${config?.hasSecretKey ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
                <FaShieldAlt className={`h-6 w-6 ${config?.hasSecretKey ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Configuração */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            URLs do Webhook
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL do Webhook (Configure na PrimePag)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={config?.webhookUrl || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <button
                  onClick={() => copyToClipboard(config?.webhookUrl || '')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaClipboard />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de Teste
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={config?.testWebhookUrl || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
                <button
                  onClick={() => copyToClipboard(config?.testWebhookUrl || '')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaClipboard />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções */}
        {instructions && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Instruções de Configuração
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Passos para Configuração:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  {instructions.webhook_setup.map((step, index) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Configuração na PrimePag:
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200">
{JSON.stringify(instructions.primepag_webhook_config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teste do Webhook */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Testar Webhook
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Referência do PIX
              </label>
              <input
                type="text"
                value={testReferenceCode}
                onChange={(e) => setTestReferenceCode(e.target.value)}
                placeholder="Ex: P202306150000039870"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={testWebhook}
            disabled={testLoading || !config?.hasSecretKey}
            className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {testLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaPlay className="mr-2" />
                Testar Webhook
              </>
            )}
          </button>

          {!config?.hasSecretKey && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Configure a variável PRIMEPAG_SECRET_KEY no Vercel antes de testar o webhook.
              </p>
            </div>
          )}
        </div>

        {/* Botão para configurar automaticamente o webhook */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={configureWebhook}
            disabled={configuring}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {configuring ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Configurando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Configurar Webhook Automaticamente
              </>
            )}
          </button>
        </div>

        {/* Botão para configurar webhook apenas na Conta 1 */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={configureWebhookAccount1}
            disabled={configuringAccount1}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {configuringAccount1 ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Configurando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Configurar Webhook na Conta 1
              </>
            )}
          </button>
        </div>

        {/* Botão para testar endpoints da PrimePag */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={testPrimepagEndpoints}
            disabled={testingEndpoints}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {testingEndpoints ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Testar Endpoints da PrimePag
              </>
            )}
          </button>
        </div>

        {/* Botão para testar POST webhook */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={testWebhookPost}
            disabled={testingWebhookPost}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {testingWebhookPost ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Testar POST Webhook
              </>
            )}
          </button>
        </div>

        {/* Botão para testar tipos de webhook */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={testWebhookTypes}
            disabled={testingWebhookTypes}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {testingWebhookTypes ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Testar Tipos de Webhook
              </>
            )}
          </button>
        </div>

        {/* Botão para debugar tipos de webhook */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={debugWebhookTypes}
            disabled={debuggingTypes}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {debuggingTypes ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Testar Tipos de Webhook
              </>
            )}
          </button>
        </div>

        {/* Botão para debugar registro de webhook */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={debugWebhookRegister}
            disabled={debuggingRegister}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {debuggingRegister ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Testar Registro de Webhook
              </>
            )}
          </button>
        </div>

        {/* Botão para escanear endpoints */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <button
            onClick={scanWebhookEndpoints}
            disabled={scanningEndpoints}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            {scanningEndpoints ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaCog className="mr-2" />
                Testar Escaneamento de Endpoints
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 