'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaUser } from 'react-icons/fa';

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  role: 'user' | 'moderator' | 'admin';
}

export default function Shoutbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userInfo, setUserInfo] = useState({ username: '', role: 'user' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Buscar informações do usuário
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (data.success && data.user) {
          setUserInfo({
            username: data.user.username,
            role: data.user.role
          });
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
      }
    };

    fetchUserInfo();
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = () => {
    // Por enquanto, usar mensagens mock
    // Em produção, isso seria uma API real com WebSocket
    const mockMessages: Message[] = [
      {
        id: '1',
        username: 'admin',
        message: 'Bem-vindos ao fórum da plataforma! 🎉',
        timestamp: new Date(Date.now() - 300000),
        role: 'admin'
      },
      {
        id: '2',
        username: 'usuario1',
        message: 'Olá pessoal! Como funciona o sistema de PIX?',
        timestamp: new Date(Date.now() - 240000),
        role: 'user'
      },
      {
        id: '3',
        username: 'moderador',
        message: 'É bem simples! Vá em "Gerar PIX" e siga as instruções. Qualquer dúvida, estamos aqui para ajudar!',
        timestamp: new Date(Date.now() - 180000),
        role: 'moderator'
      },
      {
        id: '4',
        username: 'usuario2',
        message: 'Acabei de fazer meu primeiro PIX! Muito fácil mesmo 👍',
        timestamp: new Date(Date.now() - 120000),
        role: 'user'
      },
      {
        id: '5',
        username: 'admin',
        message: 'Ótimo! Lembrem-se de sempre verificar os dados antes de confirmar o pagamento.',
        timestamp: new Date(Date.now() - 60000),
        role: 'admin'
      }
    ];
    setMessages(mockMessages);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !userInfo.username) return;

    const message: Message = {
      id: Date.now().toString(),
      username: userInfo.username,
      message: newMessage.trim(),
      timestamp: new Date(),
      role: userInfo.role as 'user' | 'moderator' | 'admin'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Em produção, enviar para API/WebSocket
    // await fetch('/api/shoutbox/send', { method: 'POST', body: JSON.stringify(message) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: Date) => {
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
      </div>

      {/* Messages */}
      <div className="p-6">
        <div className="h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FaUser className="h-5 w-5 text-white" />
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
                      {formatDate(message.timestamp)} às {formatTime(message.timestamp)}
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
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <FaUser className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={userInfo.username ? `Escreva uma mensagem, ${userInfo.username}...` : "Faça login para participar do fórum..."}
                disabled={!userInfo.username}
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {newMessage.length}/500 caracteres
                </span>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !userInfo.username}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <FaPaperPlane className="h-4 w-4" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          </div>
          
          {!userInfo.username && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Faça login</strong> para participar das discussões do fórum.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 