'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaTimes, FaUser } from 'react-icons/fa';

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
  const [isOpen, setIsOpen] = useState(false);
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
        message: 'Bem-vindos ao chat da plataforma!',
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
        message: 'É bem simples! Vá em "Gerar PIX" e siga as instruções.',
        timestamp: new Date(Date.now() - 180000),
        role: 'moderator'
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

  return (
    <>
      {/* Botão flutuante para abrir o chat */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'hidden' : 'block'
        }`}
      >
        <FaComments className="h-6 w-6" />
      </button>

      {/* Shoutbox */}
      <div className={`fixed bottom-6 right-6 z-50 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isOpen ? 'block' : 'hidden'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FaComments className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Chat da Comunidade</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <FaUser className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium text-sm ${getRoleColor(message.role)}`}>
                      {message.username}
                    </span>
                    {getRoleBadge(message.role) && (
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                        message.role === 'admin' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {getRoleBadge(message.role)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <FaPaperPlane className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {newMessage.length}/200 caracteres
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 