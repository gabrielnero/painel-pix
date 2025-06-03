'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaTerminal, FaUser, FaLock, FaSpinner } from 'react-icons/fa';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [terminalText, setTerminalText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0);
  const router = useRouter();
  
  // Sequência reduzida e mais rápida
  const terminalSequence = [
    'root@t0p1:~$ ./initialize.sh',
    '[✓] Sistema iniciado',
    '[✓] Conexão segura estabelecida',
    'Interface de login carregada...'
  ];

  useEffect(() => {
    let currentIndex = 0;
    let currentText = '';
    
    const typeInterval = setInterval(() => {
      if (currentIndex < terminalSequence.length) {
        const currentLine = terminalSequence[currentIndex];
        
        if (currentText.length < currentLine.length) {
          currentText += currentLine[currentText.length];
          setTerminalText(prev => {
            const lines = prev.split('\n');
            lines[currentIndex] = currentText;
            return lines.join('\n');
          });
        } else {
          currentIndex++;
          currentText = '';
          setConnectionStep(currentIndex);
          
          if (currentIndex < terminalSequence.length) {
            setTerminalText(prev => prev + '\n');
          }
        }
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setShowForm(true), 300); // Reduzido de 1000ms para 300ms
      }
    }, 30); // Reduzido de 50ms para 30ms - mais rápido

    return () => clearInterval(typeInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    // Processo de autenticação mais rápido
    setTerminalText(prev => prev + '\n' + 'root@t0p1:~$ auth --login');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setTerminalText(prev => prev + '\n' + 'Validando...');
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        setTerminalText(prev => prev + '\n' + '[✓] Login autorizado!');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setTerminalText(prev => prev + '\n' + 'Redirecionando...');
        
        toast.success('🚀 Acesso liberado!');
        
        // Redirecionamento garantido com múltiplas tentativas
        setTimeout(() => {
          try {
            router.push('/dashboard');
          } catch (error) {
            // Fallback se router falhar
            window.location.href = '/dashboard';
          }
        }, 500);
        
        // Backup adicional
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            window.location.href = '/dashboard';
        }
        }, 2000);
        
      } else {
        setTerminalText(prev => prev + '\n' + '[✗] Acesso negado!');
        toast.error('❌ Credenciais inválidas');
        setTimeout(() => {
          setTerminalText('');
          setShowForm(true);
        }, 1500);
      }
    } catch (error) {
      setTerminalText(prev => prev + '\n' + '[✗] Erro de conexão');
      toast.error('Erro de conexão');
      setTimeout(() => {
        setTerminalText('');
        setShowForm(true);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-green-400 font-mono relative overflow-hidden">
      {/* Efeito Matrix mais sutil */}
      <div className="absolute inset-0 opacity-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {['>', '$', '#', '~'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header Compacto */}
        <div className="text-center mb-8">
          <FaTerminal className="text-6xl text-green-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-4xl font-bold text-green-400 mb-2 tracking-wider">
            t0p<span className="text-orange-400">.1</span>
          </h1>
          <p className="text-green-300 text-sm">SECURE ACCESS TERMINAL</p>
        </div>

        {/* Terminal Compacto */}
        <div className="w-full max-w-2xl mb-6">
          <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
              <span className="ml-3 text-green-400 text-xs">t0p1-shell v2.1</span>
            </div>
            
            <div className="bg-black/50 p-3 rounded border border-green-500/20 min-h-[100px]">
              <pre className="text-green-400 text-sm whitespace-pre-wrap">
                {terminalText}
                {connectionStep < terminalSequence.length && (
                  <span className="animate-pulse text-green-300">█</span>
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Form de Login Aprimorado */}
        {showForm && (
          <div className="w-full max-w-md">
            <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-6 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-green-400 mb-1">
                  🔐 ACESSO RESTRITO
                </h2>
                <p className="text-green-300/70 text-xs">
                  Sistema de Autenticação Militar
                </p>
          </div>
          
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
            <div>
                  <label className="block text-green-400 text-xs font-bold mb-1 uppercase tracking-wide">
                    USUÁRIO
              </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm" />
              <input
                type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 bg-black/70 border border-green-500/50 rounded text-green-400 placeholder-green-600/50 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 transition-all text-sm"
                      placeholder="nome.usuario"
                disabled={loading}
              />
                  </div>
            </div>
            
                {/* Password */}
            <div>
                  <label className="block text-green-400 text-xs font-bold mb-1 uppercase tracking-wide">
                    SENHA
              </label>
              <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm" />
                <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 bg-black/70 border border-green-500/50 rounded text-green-400 placeholder-green-600/50 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 transition-all text-sm"
                      placeholder="••••••••"
                  disabled={loading}
                />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded transition-all duration-300 flex items-center justify-center border border-green-500/50 text-sm uppercase tracking-wide"
              >
                {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      CONECTANDO...
                    </>
                ) : (
                    <>
                      🚀 ACESSAR SISTEMA
                    </>
                )}
              </button>
          </form>
          
              {/* Links */}
              <div className="mt-4 text-center space-y-1">
              <Link 
                href="/register" 
                  className="block text-green-400/70 hover:text-green-300 text-xs transition-colors"
                >
                  📝 Solicitar Credenciais
                </Link>
                <Link 
                  href="/" 
                  className="block text-green-600/70 hover:text-green-500 text-xs transition-colors"
              >
                  🏠 Terminal Principal
              </Link>
              </div>

              {/* Status */}
              <div className="mt-4 p-2 bg-green-900/20 border border-green-500/20 rounded text-xs text-green-300/70 text-center">
                <p className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
                  SISTEMA ONLINE • SSL ATIVO
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Inicial */}
        {!showForm && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-900/20 border border-green-500/30 rounded">
              <FaSpinner className="animate-spin mr-2 text-green-400" />
              <span className="text-green-400 text-sm">
                Inicializando sistema...
              </span>
            </div>
          </div>
        )}
        </div>

      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
    </div>
  );
} 