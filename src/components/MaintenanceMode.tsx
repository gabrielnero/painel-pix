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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2364748b' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Maintenance Icon */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center border-4 border-blue-400/40 backdrop-blur-sm">
            <FaTools className="text-6xl text-blue-300 animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <FaExclamationTriangle className="text-white text-sm" />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-mono">
            t0p<span className="text-blue-400">.1</span>
            <span className="text-slate-300 ml-2">X Receiver</span>
          </h1>
          
          <div className="bg-slate-800/40 backdrop-blur-md border border-blue-400/30 rounded-xl p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-300 mb-4 flex items-center justify-center">
              <FaTools className="mr-3" />
              Sistema em Manutenção
            </h2>
            
            <p className="text-lg text-gray-200 mb-6 leading-relaxed">
              {message}
            </p>
            
            {estimatedTime && (
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center text-blue-300">
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔄 Verificar Novamente
            </button>
            
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
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