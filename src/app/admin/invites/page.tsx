'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaCopy, FaUser, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
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
    if (!confirm('Tem certeza de que deseja excluir este código de convite?')) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      // Se estiver no modo offline, usar mockDb
      if (mockDb && isOfflineMode) {
        const success = mockDb.deleteInvite(code);
        
        if (success) {
          setSuccessMessage('Código de convite excluído com sucesso (modo offline)!');
          setInviteCodes(mockDb.getAllInvites());
        } else {
          setError('Código de convite não encontrado');
        }
        
        return;
      }

      // Tentar via API
      try {
        const response = await fetch(`/api/invite?code=${code}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao excluir código de convite');
        }

        setSuccessMessage('Código de convite excluído com sucesso!');
        await fetchInviteCodes();
        setIsOfflineMode(false);
      } catch (err) {
        console.error('Erro na API, alternando para modo offline:', err);
        
        // Se falhar, usar modo offline
        if (mockDb) {
          setIsOfflineMode(true);
          const success = mockDb.deleteInvite(code);
          
          if (success) {
            setSuccessMessage('Código de convite excluído com sucesso (modo offline)!');
            setInviteCodes(mockDb.getAllInvites());
          } else {
            throw new Error('Código de convite não encontrado');
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir código de convite');
    }
  };

  // Função para copiar um convite para a área de transferência
  const copyInviteToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  // Formatar data usando o formatador nativo do JavaScript
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Gerenciamento de Convites</h1>

        {isOfflineMode && (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg text-yellow-800 dark:text-yellow-200">
            <FaExclamationTriangle className="inline-block mr-2" /> 
            Modo offline ativado. Os dados estão sendo armazenados localmente no navegador.
          </div>
        )}

        {/* Mensagens de erro e sucesso */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg text-red-800 dark:text-red-200">
            <FaExclamationTriangle className="inline-block mr-2" /> {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 rounded-lg text-green-800 dark:text-green-200">
            <FaCheckCircle className="inline-block mr-2" /> {successMessage}
          </div>
        )}

        {/* Formulário para gerar novo convite */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Gerar Novo Convite</h2>
          
          <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
            <div className="w-full md:w-2/3">
              <label htmlFor="expiresInDays" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Validade (dias)
              </label>
              <input
                type="number"
                id="expiresInDays"
                min="1"
                max="90"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full md:w-1/3 md:self-end">
              <button
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={generateInvite}
                disabled={generatingInvite}
                type="button"
              >
                <FaPlus /> {generatingInvite ? 'Gerando...' : 'Gerar Convite'}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de convites */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Códigos de Convite</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando códigos de convite...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-4">
                Erro ao carregar convites: {error}
              </div>
              <button 
                onClick={fetchInviteCodes} 
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-center py-8">
              <FaUser className="mx-auto text-gray-400 text-4xl mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum código de convite encontrado.</p>
            </div>
          ) : (
            <>
              {showCopiedMessage && (
                <div className="fixed top-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50">
                  Código copiado para a área de transferência!
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left text-gray-900 dark:text-white font-semibold">Código de Convite</th>
                      <th className="py-3 px-4 text-left text-gray-900 dark:text-white font-semibold">Criado Por</th>
                      <th className="py-3 px-4 text-left text-gray-900 dark:text-white font-semibold">Criado Em</th>
                      <th className="py-3 px-4 text-left text-gray-900 dark:text-white font-semibold">Expira Em</th>
                      <th className="py-3 px-4 text-left text-gray-900 dark:text-white font-semibold">Status</th>
                      <th className="py-3 px-4 text-left text-gray-900 dark:text-white font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inviteCodes.map((invite) => {
                      const isExpired = new Date(invite.expiresAt) < new Date();
                      
                      return (
                        <tr key={invite._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-gray-900 dark:text-gray-100">
                            {invite.code}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-gray-900 dark:text-gray-100">
                              <FaUser className="mr-2 text-blue-500" />
                              {invite.createdBy?.username || 'Desconhecido'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-gray-900 dark:text-gray-100">
                              <FaCalendarAlt className="mr-2 text-blue-500" />
                              {formatDate(invite.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center text-gray-900 dark:text-gray-100">
                              <FaCalendarAlt className="mr-2 text-blue-500" />
                              {formatDate(invite.expiresAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {invite.used ? (
                              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                                <FaCheckCircle className="mr-2" />
                                <span className="text-sm">Usado por {invite.usedBy?.username || 'Desconhecido'}</span>
                              </div>
                            ) : isExpired ? (
                              <div className="flex items-center text-red-600 dark:text-red-400">
                                <FaTimesCircle className="mr-2" />
                                <span className="text-sm">Expirado</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <FaCheckCircle className="mr-2" />
                                <span className="text-sm">Válido</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                onClick={() => copyInviteToClipboard(invite.code)}
                                title="Copiar código"
                              >
                                <FaCopy />
                              </button>
                              {!invite.used && (
                                <button
                                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                  onClick={() => deleteInvite(invite.code)}
                                  title="Excluir código"
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
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 