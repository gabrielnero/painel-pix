'use client';

import { FaTools, FaClock, FaTelegram, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';

interface MaintenanceModeProps {
  message?: string;
  estimatedTime?: string;
  supportContact?: string;
}

export default function MaintenanceMode({ 
  message = 'Sistema em manutenção. Voltaremos em breve com melhorias!',
  estimatedTime = '',
  supportContact = 'https://t.me/watchingdaysbecomeyears'
}: MaintenanceModeProps) {
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-yellow-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFA500' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Maintenance Icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 bg-orange-500/20 rounded-full flex items-center justify-center border-4 border-orange-500/30">
            <FaTools className="text-6xl text-orange-400 animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <FaExclamationTriangle className="text-white text-sm" />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-mono">
            t0p<span className="text-orange-400">.1</span>
            <span className="text-blue-400 ml-2">X Receiver</span>
          </h1>
          
          <div className="bg-black/30 backdrop-blur-sm border border-orange-500/30 rounded-xl p-8 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4 flex items-center justify-center">
              <FaTools className="mr-3" />
              Sistema em Manutenção
            </h2>
            
            <p className="text-lg text-gray-200 mb-6 leading-relaxed">
              {message}
            </p>
            
            {estimatedTime && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center text-orange-300">
                  <FaClock className="mr-2" />
                  <span className="font-semibold">Tempo estimado: {estimatedTime}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                🔧 Estamos trabalhando para melhorar sua experiência
              </p>
              <p className="text-sm">
                ⚡ Implementando novas funcionalidades e correções
              </p>
              <p className="text-sm">
                🛡️ Atualizações de segurança em andamento
              </p>
            </div>
          </div>

          {/* Support Contact */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-blue-400 mb-4">
              Precisa de Suporte?
            </h3>
            <p className="text-gray-300 mb-4">
              Nossa equipe está disponível para ajudar durante a manutenção
            </p>
            <Link
              href={supportContact}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 font-semibold"
            >
              <FaTelegram className="mr-2" />
              Contatar Suporte
            </Link>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-300 font-semibold"
            >
              🔄 Verificar Novamente
            </button>
            
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-300 font-semibold"
            >
              🚪 Sair do Sistema
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm font-mono">
            &copy; {new Date().getFullYear()} t0p.1 X Receiver | Sistema em Manutenção
          </p>
        </div>
      </div>
    </div>
  );
} 