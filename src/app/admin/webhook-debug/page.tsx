'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FaHome, 
  FaLink, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner,
  FaExclamationTriangle,
  FaSync,
  FaBug
} from 'react-icons/fa';

interface WebhookResult {
  account: number;
  success: boolean;
  webhooks?: any[];
  ourWebhook?: any;
  isConfigured?: boolean;
  expectedUrl?: string;
  message: string;
  error?: string;
}

interface WebhookStatus {
  success: boolean;
  message: string;
  results: WebhookResult[];
  summary: {
    totalAccounts: number;
    configuredWebhooks: number;
    errors: number;
  };
}

export default function WebhookDebugPage() {
  const [status, setStatus] = useState<WebhookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [authTestLoading, setAuthTestLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [authResults, setAuthResults] = useState<any>(null);

  const checkWebhookStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test/webhook-status');
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        setStatus(data);
        toast.success('Status do webhook verificado');
      } else {
        toast.error(data.message || 'Erro ao verificar webhook');
      }
    } catch (error) {
      console.error('Erro ao verificar webhook:', error);
      toast.error('Erro ao verificar status do webhook');
    } finally {
      setLoading(false);
    }
  };

  const testAuthentication = async () => {
    try {
      setAuthTestLoading(true);
      const response = await fetch('/api/test/auth-primepag');
      const data = await response.json();
      
      if (data.success) {
        console.log('Resultado do teste de autenticação:', data);
        setAuthResults(data);
        toast.success('Teste de autenticação concluído');
        
        // Mostrar resultados específicos
        data.results.forEach((result: any) => {
          if (result.success) {
            toast.success(`✅ Conta ${result.account}: Autenticação OK`);
          } else {
            toast.error(`❌ Conta ${result.account}: ${result.message}`);
          }
        });
      } else {
        toast.error(data.message || 'Erro no teste de autenticação');
      }
    } catch (error) {
      console.error('Erro no teste de autenticação:', error);
      toast.error('Erro ao testar autenticação');
    } finally {
      setAuthTestLoading(false);
    }
  };

  useEffect(() => {
    checkWebhookStatus();
  }, []);

  const getStatusIcon = (isConfigured: boolean, hasError: boolean) => {
    if (hasError) {
      return <FaTimesCircle className="text-red-500" />;
    }
    return isConfigured ? (
      <FaCheckCircle className="text-green-500" />
    ) : (
      <FaExclamationTriangle className="text-yellow-500" />
    );
  };

  const getStatusColor = (isConfigured: boolean, hasError: boolean) => {
    if (hasError) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    return isConfigured ? 
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

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
            <span className="ml-2 text-gray-900 dark:text-white font-semibold">Debug Webhook</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FaBug className="mr-3 text-red-600" />
            Debug do Webhook PrimePag
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Diagnosticar problemas com o webhook e verificar configurações
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={checkWebhookStatus}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verificando...
              </>
            ) : (
              <>
                <FaSync className="mr-2" />
                Verificar Status
              </>
            )}
          </button>

          <button
            onClick={testAuthentication}
            disabled={authTestLoading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-300 flex items-center"
          >
            {authTestLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              <>
                <FaBug className="mr-2" />
                Testar Autenticação
              </>
            )}
          </button>
        </div>

        {/* Resumo */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Contas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.summary.totalAccounts}</p>
                </div>
                <FaLink className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Webhooks Configurados</p>
                  <p className="text-2xl font-bold text-green-600">{status.summary.configuredWebhooks}</p>
                </div>
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Erros</p>
                  <p className="text-2xl font-bold text-red-600">{status.summary.errors}</p>
                </div>
                <FaTimesCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Detalhes por Conta */}
        {status && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📋 Resultados do Teste de Webhook
            </h2>
            {status.results.map((result) => (
              <div key={result.account} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Conta {result.account}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.isConfigured || false, !result.success)}
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(result.isConfigured || false, !result.success)}`}>
                        {result.message}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {result.success ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          URL Esperada:
                        </h4>
                        <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 break-all">
                          {result.expectedUrl}
                        </code>
                      </div>

                      {result.ourWebhook ? (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Webhook Configurado:
                          </h4>
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <pre className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                              {JSON.stringify(result.ourWebhook, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Webhook não encontrado para esta conta. Configure o webhook na PrimePag.
                          </p>
                        </div>
                      )}

                      {result.webhooks && result.webhooks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Todos os Webhooks ({result.webhooks.length}):
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {JSON.stringify(result.webhooks, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                        ❌ Erro ao verificar webhook:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {result.error || result.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultados do Teste de Autenticação */}
        {authResults && (
          <div className="space-y-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔐 Resultados do Teste de Autenticação
            </h2>
            {authResults.results.map((result: any) => (
              <div key={`auth-${result.account}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Conta {result.account} - Autenticação
                    </h3>
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : (
                        <FaTimesCircle className="text-red-500" />
                      )}
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        result.success 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {result.success ? 'Sucesso' : 'Erro'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mensagem:
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {result.message}
                      </p>
                    </div>

                    {result.success && result.auth && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Detalhes da Autenticação:
                        </h4>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <pre className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                            {JSON.stringify(result.auth, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {result.apiTest && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Teste de API:
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <pre className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                            {JSON.stringify(result.apiTest, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {result.apiError && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Erro na API:
                        </h4>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                            {JSON.stringify(result.apiError, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {!result.success && result.error && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Erro:
                        </h4>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {result.error}
                          </p>
                          {result.errorDetails && (
                            <pre className="text-sm text-red-700 dark:text-red-300 mt-2 whitespace-pre-wrap">
                              {JSON.stringify(result.errorDetails, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instruções */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            💡 Como Resolver Problemas
          </h3>
          <div className="space-y-3 text-blue-800 dark:text-blue-200 text-sm">
            <p><strong>1. Webhook não configurado:</strong> Use a página de configuração do webhook para configurar automaticamente.</p>
            <p><strong>2. URL incorreta:</strong> Verifique se a URL do webhook na PrimePag está correta.</p>
            <p><strong>3. Erro de autenticação:</strong> Verifique se as credenciais da PrimePag estão corretas.</p>
            <p><strong>4. Webhook não recebendo notificações:</strong> Verifique se o PRIMEPAG_SECRET_KEY está configurado corretamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 