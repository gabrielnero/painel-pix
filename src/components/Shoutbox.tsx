'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaUser, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  userId: string;
  username: string;
  message: string;
  timestamp?: Date;
  createdAt: Date;
  role: 'user' | 'moderator' | 'admin';
  profilePicture?: string;
}

export default function Shoutbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userInfo, setUserInfo] = useState({ username: '', role: 'user', profilePicture: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserInfo();
    loadMessages();
    
    // Atualizar mensagens a cada 10 segundos
    const interval = setInterval(loadMessages, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      if (data.success && data.user) {
        setUserInfo({
          username: data.user.username,
          role: data.user.role,
          profilePicture: data.user.profilePicture || ''
        });
      }
    } catch (error) {
      console.error('Erro ao buscar informações do usuário:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/shoutbox?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        console.error('Erro ao carregar mensagens:', data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userInfo.username || sending) return;

    setSending(true);

    try {
      const response = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Adicionar a nova mensagem à lista
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        toast.success('Mensagem enviada!');
      } else {
        toast.error(data.message || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!userInfo.username || userInfo.role !== 'admin' || clearingChat) return;

    if (!confirm('Tem certeza que deseja limpar todas as mensagens do chat? Esta ação não pode ser desfeita.')) {
      return;
    }

    setClearingChat(true);

    try {
      const response = await fetch('/api/shoutbox/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessages([]);
        toast.success('Chat limpo com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao limpar chat');
      }
    } catch (error) {
      toast.error('Erro ao limpar chat');
      console.error('Erro ao limpar chat:', error);
    } finally {
      setClearingChat(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-500';
      case 'moderator':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ADM';
      case 'moderator':
        return 'MOD';
      default:
        return '';
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: Date | string) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return messageDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaComments className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Fórum da Comunidade
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Converse com outros usuários e tire suas dúvidas
              </p>
            </div>
          </div>
          {userInfo.role === 'admin' && (
            <button
              onClick={clearChat}
              disabled={clearingChat}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center"
              title="Limpar todas as mensagens do chat"
            >
              {clearingChat ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Limpando...
                </>
              ) : (
                <>
                  <FaTrash className="mr-2" />
                  Limpar Chat
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="p-6">
        <div className="h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message._id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {message.profilePicture ? (
                        <img 
                          src={message.profilePicture} 
                          alt={message.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <FaUser className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-semibold text-sm ${getRoleColor(message.role)}`}>
                        {message.username}
                      </span>
                      {getRoleBadge(message.role) && (
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          message.role === 'admin' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {getRoleBadge(message.role)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(message.createdAt)} às {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FaComments className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma mensagem ainda. Seja o primeiro a conversar!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        {userInfo.username ? (
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {userInfo.profilePicture ? (
                  <img 
                    src={userInfo.profilePicture} 
                    alt={userInfo.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                    <FaUser className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Escreva uma mensagem, ${userInfo.username}...`}
                disabled={sending}
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {newMessage.length}/500 caracteres
                </span>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <FaPaperPlane className="h-4 w-4" />
                  <span>{sending ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Faça login</strong> para participar das discussões do fórum.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 