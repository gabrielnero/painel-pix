'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaLock, FaUserPlus, FaTerminal, FaCode, FaShieldAlt, FaRocket, FaStar } from 'react-icons/fa';

export default function Home() {
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  const fullText = 'root@t0p1:~$ ./access_panel.sh';

  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects Animados */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2364748b' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      </div>
      
      {/* Elementos de Background Animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Terminal Header - Melhorado */}
        <div className="w-full max-w-5xl mb-12">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-t-lg border border-gray-700/50 p-6 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-200"></div>
              <span className="ml-4 text-gray-400 text-sm font-mono">t0p1.sh - Sistema de Pagamentos Avançado</span>
            </div>
            <div className="font-mono text-green-400 text-xl md:text-2xl">
              {typedText}
              {showCursor && <span className="animate-pulse text-green-300">|</span>}
            </div>
            <div className="mt-4 text-gray-500 text-sm font-mono">
              Sistema iniciado... Aguardando autenticação...
            </div>
          </div>
        </div>

        {/* Main Content - Centralizado e Melhorado */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative mb-6">
              <FaTerminal className="text-7xl md:text-8xl text-green-400 mb-4 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-green-400 text-gray-900 rounded-full p-2">
                <FaStar className="text-sm" />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 tracking-tight">
              t0p<span className="text-green-400 animate-pulse">.1</span>
              </h1>
            <p className="text-2xl md:text-3xl text-gray-300 font-mono mb-6 tracking-wide">
                Advanced Payment Terminal
              </p>
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              <span className="text-sm font-mono">[ONLINE]</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-gray-300 text-xl md:text-2xl mb-6 leading-relaxed">
              Sistema de pagamentos PIX com tecnologia de ponta e máxima segurança
            </p>
            <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-6 backdrop-blur-sm">
              <p className="text-green-400 font-mono text-lg">
                🔒 [SECURE] Autenticação obrigatória para acesso ao sistema
            </p>
            </div>
          </div>
        </div>

        {/* Action Cards - Melhorados e Centralizados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-16">
          <Link 
            href="/login" 
            className="group relative bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 md:p-10 hover:border-green-400/50 hover:bg-gray-800/80 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-400/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-center">
              <div className="bg-green-400/20 rounded-full p-6 w-20 h-20 mx-auto mb-6 group-hover:bg-green-400/30 transition-all duration-500 group-hover:scale-110">
                <FaLock className="text-3xl text-green-400 mx-auto mt-1" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">
                Acesso Seguro
              </h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-lg leading-relaxed mb-6">
                Entre com suas credenciais autorizadas e acesse o painel de controle
              </p>
              <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm text-green-400 border border-green-400/30">
                $ ./login.sh --secure
              </div>
            </div>
          </Link>
          
          <Link 
            href="/register" 
            className="group relative bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 md:p-10 hover:border-blue-400/50 hover:bg-gray-800/80 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-center">
              <div className="bg-blue-400/20 rounded-full p-6 w-20 h-20 mx-auto mb-6 group-hover:bg-blue-400/30 transition-all duration-500 group-hover:scale-110">
                <FaUserPlus className="text-3xl text-blue-400 mx-auto mt-1" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                Novo Registro
              </h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-lg leading-relaxed mb-6">
                Crie sua conta com código de convite válido para acessar o sistema
              </p>
              <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm text-blue-400 border border-blue-400/30">
                $ ./register.sh --invite-code
              </div>
            </div>
          </Link>
        </div>

        {/* Features - Melhoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-16">
          <div className="text-center p-8 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700/50 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="bg-purple-400/20 rounded-full p-4 w-16 h-16 mx-auto mb-6">
              <FaShieldAlt className="text-3xl text-purple-400 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Máxima Segurança</h3>
            <p className="text-gray-400 leading-relaxed">
              Criptografia AES-256, autenticação multi-fator e monitoramento 24/7
            </p>
          </div>
          
          <div className="text-center p-8 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700/50 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="bg-yellow-400/20 rounded-full p-4 w-16 h-16 mx-auto mb-6">
              <FaRocket className="text-3xl text-yellow-400 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Alta Performance</h3>
            <p className="text-gray-400 leading-relaxed">
              Processamento instantâneo, 99.9% de uptime e infraestrutura escalável
            </p>
          </div>
          
          <div className="text-center p-8 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700/50 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="bg-green-400/20 rounded-full p-4 w-16 h-16 mx-auto mb-6">
              <FaCode className="text-3xl text-green-400 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">API Completa</h3>
            <p className="text-gray-400 leading-relaxed">
              Integração total com gateways PIX e documentação completa
            </p>
          </div>
        </div>

        {/* Status Bar - Novo */}
        <div className="bg-gray-800/60 backdrop-blur-lg rounded-xl border border-gray-700/50 p-6 w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-gray-400 text-sm">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400 mb-2">&lt;500ms</div>
              <div className="text-gray-400 text-sm">Latência</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 mb-2">256-bit</div>
              <div className="text-gray-400 text-sm">Criptografia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-gray-400 text-sm">Suporte</div>
            </div>
          </div>
        </div>

        {/* Footer - Melhorado */}
        <div className="mt-12 text-center">
          <div className="flex flex-col items-center justify-center text-gray-500 text-sm space-y-2">
            <div className="flex items-center space-x-4">
              <FaTerminal className="text-green-400" />
              <span className="font-mono">v2.1.0</span>
              <span>•</span>
              <span className="font-mono">Build 2024.12</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-mono text-green-400">ONLINE</span>
              </div>
            </div>
            <p className="text-gray-400 font-mono text-xs">
              &copy; {new Date().getFullYear()} t0p.1 Payment Terminal | Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 