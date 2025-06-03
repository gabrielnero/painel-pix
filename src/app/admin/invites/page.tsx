'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCopy, FaUser, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCode, FaUserPlus, FaClock, FaEye, FaShieldAlt } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { mockDb } from '@/lib/mockDb';
import { v4 as uuidv4 } from 'uuid';

interface InviteCode {
  _id: string;
  code: string;
  createdBy: {
    _id: string;
    username: string;
  };
  usedBy?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export default function InvitesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Buscar os convites existentes
  const fetchInviteCodes = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar se está no modo offline
      if (mockDb && isOfflineMode) {
        // Usar mockDb para obter convites
        const localInvites = mockDb.getAllInvites();
        console.log('Obtendo convites do mockDb (local):', localInvites.length);
        setInviteCodes(localInvites);
        setLoading(false);
        return;
      }

      // Tentar obter via API com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

      try {
        console.log('Iniciando busca de convites via API...');
        const response = await fetch('/api/invite', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        console.log('Resposta da API:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao buscar códigos de convite');
        }

        if (data.isOfflineMode) {
          console.log('API está em modo offline');
          setIsOfflineMode(true);
        } else {
          setIsOfflineMode(false);
        }

        setInviteCodes(data.inviteCodes);
      } catch (err) {
        console.error('Erro na API, alternando para modo offline:', err);
        
        // Se falhar, usar modo offline
        if (mockDb) {
          setIsOfflineMode(true);
          const localInvites = mockDb.getAllInvites();
          console.log('Obtendo convites do mockDb após erro:', localInvites.length);
          setInviteCodes(localInvites);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar códigos de convite');
      console.error('Erro final:', err);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar os convites na inicialização
  useEffect(() => {
    fetchInviteCodes();
  }, []);

  // Função para gerar um novo convite
  const generateInvite = async () => {
    try {
      // Previne múltiplos cliques
      if (generatingInvite) return;
      
      setGeneratingInvite(true);
      setError('');
      setSuccessMessage('');

      // Verificar se estamos no modo offline
      if (mockDb && isOfflineMode) {
        // Gerar convite com mockDb
        const newInvite = mockDb.createInvite(
          'offline-admin-id', 
          'admin',
          expiresInDays
        );
        
        setSuccessMessage(`Código de convite gerado com sucesso: ${newInvite.code}`);
        setInviteCodes(mockDb.getAllInvites());
        setGeneratingInvite(false);
        return;
      }

      // Tentar via API com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout

      try {
        console.log('Gerando convite via API...');
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresInDays }),
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        console.log('Resposta da API (gerar convite):', data);

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao gerar código de convite');
        }

        // Verificar se temos o código para exibir diretamente
        if (data.code) {
          setSuccessMessage(`Código de convite gerado com sucesso: ${data.code}`);
        } else if (data.inviteCode?.code) {
          setSuccessMessage(`Código de convite gerado com sucesso: ${data.inviteCode.code}`);
        } else {
          setSuccessMessage('Código de convite gerado com sucesso!');
        }

        // Adicionar o novo convite à lista se estiver disponível
        if (data.inviteCode) {
          setInviteCodes(prevCodes => [data.inviteCode, ...prevCodes]);
        } else {
          // Se não tivermos os detalhes do convite, recarregar todos
          await fetchInviteCodes();
        }

        if (data.isOfflineMode) {
          setIsOfflineMode(true);
        } else {
          setIsOfflineMode(false);
        }
      } catch (err) {
        console.error('Erro na API, alternando para modo offline:', err);
        
        // Se falhar, usar modo offline
        if (mockDb) {
          setIsOfflineMode(true);
          const newInvite = mockDb.createInvite(
            'offline-admin-id', 
            'admin',
            expiresInDays
          );
          setSuccessMessage(`Código de convite gerado com sucesso (modo offline): ${newInvite.code}`);
          setInviteCodes(mockDb.getAllInvites());
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar código de convite');
      console.error('Erro ao gerar convite:', err);
    } finally {
      setGeneratingInvite(false);
    }
  };

  // Função para deletar um convite
  const deleteInvite = async (code: string) => {
    if (!confirm('Tem certeza que deseja deletar este código de convite?')) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      // Verificar se estamos no modo offline
      if (mockDb && isOfflineMode) {
        // Deletar com mockDb
        mockDb.deleteInvite(code);
        setSuccessMessage('Código de convite deletado com sucesso!');
        setInviteCodes(mockDb.getAllInvites());
        return;
      }

      // Tentar via API
      const response = await fetch('/api/invite', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao deletar código de convite');
      }

      setSuccessMessage('Código de convite deletado com sucesso!');
      
      // Remover da lista local
      setInviteCodes(prevCodes => prevCodes.filter(invite => invite.code !== code));

      if (data.isOfflineMode) {
        setIsOfflineMode(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar código de convite');
      console.error('Erro ao deletar convite:', err);
    }
  };

  // Função para copiar convite para a área de transferência
  const copyInviteToClipboard = (code: string) => {
    const inviteUrl = `${window.location.origin}/register?invite=${code}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatusIcon = (invite: InviteCode) => {
    if (invite.used) {
      return <FaCheckCircle className="text-green-500" />;
    } else if (isExpired(invite.expiresAt)) {
      return <FaTimesCircle className="text-red-500" />;
    } else {
      return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusText = (invite: InviteCode) => {
    if (invite.used) {
      return { text: 'Usado', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    } else if (isExpired(invite.expiresAt)) {
      return { text: 'Expirado', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    } else {
      return { text: 'Ativo', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
  };

  const activeInvites = inviteCodes.filter(invite => !invite.used && !isExpired(invite.expiresAt));
  const usedInvites = inviteCodes.filter(invite => invite.used);
  const expiredInvites = inviteCodes.filter(invite => !invite.used && isExpired(invite.expiresAt));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                  <FaUserPlus className="mr-3 text-red-600" />
                  Sistema de Convites
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Gerencie códigos de convite para novos usuários
                </p>
                {isOfflineMode && (
                  <div className="mt-2 flex items-center text-yellow-600 dark:text-yellow-400">
                    <FaExclamationTriangle className="mr-2" />
                    <span className="text-sm">Modo Offline Ativo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Total</h3>
                  <p className="text-3xl font-bold">{inviteCodes.length}</p>
                </div>
                <FaCode className="text-4xl opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ativos</h3>
                  <p className="text-3xl font-bold">{activeInvites.length}</p>
                </div>
                <FaShieldAlt className="text-4xl opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Usados</h3>
                  <p className="text-3xl font-bold">{usedInvites.length}</p>
                </div>
                <FaCheckCircle className="text-4xl opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Expirados</h3>
                  <p className="text-3xl font-bold">{expiredInvites.length}</p>
                </div>
                <FaTimesCircle className="text-4xl opacity-80" />
              </div>
            </div>
          </div>

          {/* Área de Geração de Convites */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaPlus className="mr-2 text-red-600" />
              Gerar Novo Convite
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Validade (dias)
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value={1}>1 dia</option>
                  <option value={3}>3 dias</option>
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                </select>
              </div>

              <div>
                <button
                  onClick={generateInvite}
                  disabled={generatingInvite}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  {generatingInvite ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Gerar Convite
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                {showCopiedMessage && (
                  <div className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center">
                    <FaCheckCircle className="mr-2" />
                    Copiado!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensagens de Status */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <FaTimesCircle className="text-red-500 mr-3" />
                <span className="text-red-700 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-3" />
                <span className="text-green-700 dark:text-green-200">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Lista de Convites */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaEye className="mr-2 text-red-600" />
                Códigos de Convite
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Carregando convites...</span>
              </div>
            ) : inviteCodes.length === 0 ? (
              <div className="text-center py-12">
                <FaUserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum código de convite encontrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Gere seu primeiro convite para começar
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Criado por
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Usado por
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Expira em
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {inviteCodes.map((invite) => {
                      const status = getStatusText(invite);
                      return (
                        <tr key={invite._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(invite)}
                              <span className="ml-3 font-mono text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                                {invite.code}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.class}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <FaUser className="mr-2 text-gray-400" />
                              {invite.createdBy.username}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {invite.usedBy ? (
                              <div className="flex items-center">
                                <FaUser className="mr-2 text-green-500" />
                                {invite.usedBy.username}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-2" />
                              {formatDate(invite.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <FaClock className="mr-2" />
                              {formatDate(invite.expiresAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => copyInviteToClipboard(invite.code)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                title="Copiar link de convite"
                              >
                                <FaCopy />
                              </button>
                              {!invite.used && (
                                <button
                                  onClick={() => deleteInvite(invite.code)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                  title="Deletar convite"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 