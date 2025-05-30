'use client';

import { useState, useEffect } from 'react';
import { FaBullhorn, FaTelegram, FaTimes } from 'react-icons/fa';
import { getSystemConfig } from '@/lib/config';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadAnnouncement();
    
    // Verificar se foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem('announcement-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const loadAnnouncement = async () => {
    try {
      const config = await getSystemConfig();
      setAnnouncement(config.announcement);
      setTelegramLink(config.supportTelegram);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Fallback para valores padrão
      setAnnouncement('Bem-vindo ao painel PIX! Para suporte, entre em nosso canal do Telegram.');
      setTelegramLink('https://t.me/watchingdaysbecomeyears');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('announcement-dismissed', 'true');
  };

  const openTelegram = () => {
    window.open(telegramLink, '_blank', 'noopener,noreferrer');
  };

  if (!isVisible || isDismissed || !announcement) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            <FaBullhorn className="h-5 w-5 text-blue-100" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Anúncio Importante</h3>
            <p className="text-blue-100 mb-4 leading-relaxed">
              {announcement}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openTelegram}
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <FaTelegram className="mr-2 h-4 w-4" />
                Entrar no Telegram
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-4 py-2 bg-transparent hover:bg-white/10 border border-white/30 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Dispensar
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-100 hover:text-white transition-colors duration-200 ml-4"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 