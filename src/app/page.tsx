'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaLock, FaUserPlus, FaTerminal, FaCode, FaShieldAlt, FaRocket } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Terminal Header */}
        <div className="w-full max-w-4xl mb-8">
          <div className="bg-gray-800 rounded-t-lg border border-gray-700 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-gray-400 text-sm">t0p1.sh - Terminal</span>
            </div>
            <div className="font-mono text-green-400 text-lg">
              {typedText}
              {showCursor && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <FaTerminal className="text-6xl text-green-400 mr-4" />
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                t0p<span className="text-green-400">.1</span>
              </h1>
              <p className="text-xl text-gray-300 font-mono">
                Advanced Payment Terminal
              </p>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-gray-300 text-lg mb-4">
              Sistema de pagamentos PIX com tecnologia avançada
            </p>
            <p className="text-green-400 font-mono text-sm">
              [SECURE] Autenticação requerida para acesso
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mb-12">
          <Link 
            href="/login" 
            className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="bg-green-400/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-green-400/30 transition-colors">
                <FaLock className="text-2xl text-green-400 mx-auto mt-1" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Acesso</h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Faça login com suas credenciais autorizadas
              </p>
              <div className="mt-4 font-mono text-sm text-green-400">
                ./login.sh
              </div>
            </div>
          </Link>
          
          <Link 
            href="/register" 
            className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-blue-400 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="bg-blue-400/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-blue-400/30 transition-colors">
                <FaUserPlus className="text-2xl text-blue-400 mx-auto mt-1" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Registro</h2>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Crie sua conta com código de convite válido
              </p>
              <div className="mt-4 font-mono text-sm text-blue-400">
                ./register.sh --invite
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
          <div className="text-center p-6 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700">
            <FaShieldAlt className="text-3xl text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Segurança</h3>
            <p className="text-gray-400 text-sm">Criptografia de ponta e autenticação robusta</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700">
            <FaRocket className="text-3xl text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Performance</h3>
            <p className="text-gray-400 text-sm">Processamento em tempo real e alta disponibilidade</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700">
            <FaCode className="text-3xl text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">API</h3>
            <p className="text-gray-400 text-sm">Integração completa com gateways de pagamento</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center text-gray-500 text-sm">
            <FaTerminal className="mr-2" />
            <span className="font-mono">v2.1.0 | Build 2024.12 | Status: ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
} 