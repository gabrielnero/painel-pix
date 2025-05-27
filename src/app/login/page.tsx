'use client';

import Link from 'next/link';
import { FaUser, FaLock, FaArrowLeft, FaTerminal, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  const fullText = 'root@t0p1:~$ ./login.sh --secure';

  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Animação de login estilo hacker
    const loadingMessages = [
      'Iniciando autenticação...',
      'Verificando credenciais...',
      'Estabelecendo conexão segura...',
      'Validando permissões...',
      'Acesso autorizado!'
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        toast.loading(loadingMessages[messageIndex], { id: 'login-progress' });
        messageIndex++;
      } else {
        clearInterval(messageInterval);
      }
    }, 800);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Sucesso com animação
      toast.success('🎯 Você foi logado com sucesso!', { 
        id: 'login-progress',
        duration: 2000,
        style: {
          background: '#1f2937',
          color: '#10b981',
          border: '1px solid #10b981',
          fontFamily: 'monospace'
        }
      });

      // Redirecionar imediatamente para o dashboard
      console.log('Login bem-sucedido, redirecionando para dashboard...');
      
      // Usar window.location para garantir o redirecionamento
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (err) {
      clearInterval(messageInterval);
      toast.dismiss('login-progress');
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        style: {
          background: '#1f2937',
          color: '#ef4444',
          border: '1px solid #ef4444',
          fontFamily: 'monospace'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Back Button */}
        <div className="w-full max-w-md mb-6">
          <Link href="/" className="flex items-center text-gray-400 hover:text-green-400 transition-colors duration-300">
            <FaArrowLeft className="mr-2" />
            <span className="font-mono">cd ../</span>
          </Link>
        </div>

        {/* Terminal Header */}
        <div className="w-full max-w-md mb-8">
          <div className="bg-gray-800 rounded-t-lg border border-gray-700 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-gray-400 text-sm">login.sh - Secure Terminal</span>
            </div>
            <div className="font-mono text-green-400 text-sm">
              {typedText}
              {showCursor && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FaTerminal className="text-4xl text-green-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  t0p<span className="text-green-400">.1</span>
                </h1>
                <p className="text-gray-400 text-sm font-mono">Secure Access</p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center text-red-400">
                <span className="font-mono text-sm">[ERROR] {error}</span>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                <FaUser className="inline mr-2" /> username:
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all font-mono"
                placeholder="enter username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                <FaLock className="inline mr-2" /> password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all font-mono"
                  placeholder="enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 font-mono transform hover:scale-105 disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⚡</span>
                    AUTHENTICATING...
                  </span>
                ) : (
                  './execute --login'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm font-mono mb-2">
                [INFO] Need access credentials?
              </p>
              <Link 
                href="/register" 
                className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm hover:underline"
              >
                ./register.sh --invite-code
              </Link>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center text-gray-500 text-xs font-mono">
              <span className="animate-pulse mr-2">●</span>
              <span>Secure connection established</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 