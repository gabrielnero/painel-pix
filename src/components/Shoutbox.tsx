'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaUser, FaImage, FaTrash, FaTimes } from 'react-icons/fa';
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
  imageUrl?: string;
}

export default function Shoutbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userInfo, setUserInfo] = useState({ username: '', role: 'user', profilePicture: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!newMessage.trim() && !selectedImage) || !userInfo.username || sending) return;

    setSending(true);

    try {
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append('message', newMessage.trim());
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('/api/shoutbox', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Adicionar a nova mensagem à lista
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setSelectedImage(null);
        setImagePreview(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.');
        return;
      }

      // Verificar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas.');
        return;
      }

      setSelectedImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAllMessages = async () => {
    if (userInfo.role !== 'admin') {
      toast.error('Apenas administradores podem limpar mensagens');
      return;
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja limpar TODAS as mensagens do fórum?\n\nEsta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    setClearing(true);
    try {
      const response = await fetch('/api/shoutbox/clear', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessages([]);
        toast.success('Todas as mensagens foram removidas');
      } else {
        toast.error(data.message || 'Erro ao limpar mensagens');
      }
    } catch (error) {
      toast.error('Erro ao limpar mensagens');
      console.error('Erro ao limpar mensagens:', error);
    } finally {
      setClearing(false);
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
          <button
            onClick={clearAllMessages}
            disabled={userInfo.role !== 'admin' || clearing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <FaTrash className="h-4 w-4" />
            <span>{clearing ? 'Limpando...' : 'Limpar todas as mensagens'}</span>
          </button>
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
                      {message.message && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed mb-2">
                          {message.message}
                        </p>
                      )}
                      {message.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={message.imageUrl} 
                            alt="Imagem compartilhada"
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '300px' }}
                            onClick={() => window.open(message.imageUrl, '_blank')}
                          />
                        </div>
                      )}
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
              {imagePreview && (
                <div className="mb-3 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview"
                    className="max-w-32 h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                  >
                    <FaTimes className="h-3 w-3" />
                  </button>
                </div>
              )}
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {newMessage.length}/500 caracteres
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    <FaImage className="h-3 w-3" />
                    <span>Imagem</span>
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !selectedImage) || sending}
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