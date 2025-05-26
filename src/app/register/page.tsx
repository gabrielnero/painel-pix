'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaLock, FaEnvelope, FaTicketAlt, FaArrowLeft, FaTerminal, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    inviteCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  const fullText = 'root@t0p1:~$ ./register.sh --invite-required';

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

    // Resetar validação do código quando o usuário alterar o valor
    if (name === 'inviteCode') {
      setCodeValidated(false);
    }
  };

  // Verificar código de convite
  const validateInviteCode = async () => {
    if (formData.inviteCode.length !== 15) {
      setError('O código de convite deve ter 15 caracteres');
      return;
    }

    try {
      setValidatingCode(true);
      setError('');

      const response = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: formData.inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código de convite inválido');
      }

      setCodeValidated(true);
      toast.success('Código de convite válido!', {
        style: {
          background: '#1f2937',
          color: '#10b981',
          border: '1px solid #10b981',
          fontFamily: 'monospace'
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar código de convite';
      setError(errorMessage);
      setCodeValidated(false);
      toast.error(`❌ ${errorMessage}`, {
        style: {
          background: '#1f2937',
          color: '#ef4444',
          border: '1px solid #ef4444',
          fontFamily: 'monospace'
        }
      });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (!formData.username || !formData.email || !formData.password || !formData.inviteCode) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.inviteCode.length !== 15) {
      setError('O código de convite deve ter 15 caracteres');
      return;
    }

    // Se o código não foi validado, validar agora
    if (!codeValidated) {
      await validateInviteCode();
      if (!codeValidated) return;
    }

    // Realizar o registro
    try {
      setLoading(true);
      
      // Animação de registro
      const loadingMessages = [
        'Validando dados...',
        'Verificando código de convite...',
        'Criando conta...',
        'Configurando permissões...',
        'Conta criada com sucesso!'
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if (messageIndex < loadingMessages.length - 1) {
          toast.loading(loadingMessages[messageIndex], { id: 'register-progress' });
          messageIndex++;
        } else {
          clearInterval(messageInterval);
        }
      }, 800);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          inviteCode: formData.inviteCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao realizar o registro');
      }

      // Sucesso
      toast.success('🎯 Conta criada com sucesso!', { 
        id: 'register-progress',
        duration: 3000,
        style: {
          background: '#1f2937',
          color: '#10b981',
          border: '1px solid #10b981',
          fontFamily: 'monospace'
        }
      });

      // Registro bem-sucedido, redirecionar para o login
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao realizar o registro';
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
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Back Button */}
        <div className="w-full max-w-md mb-6">
          <Link href="/" className="flex items-center text-gray-400 hover:text-blue-400 transition-colors duration-300">
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
              <span className="ml-4 text-gray-400 text-sm">register.sh - Account Creation</span>
            </div>
            <div className="font-mono text-blue-400 text-sm">
              {typedText}
              {showCursor && <span className="animate-pulse">|</span>}
            </div>
          </div>
        </div>

        {/* Register Form */}
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FaTerminal className="text-4xl text-blue-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  t0p<span className="text-blue-400">.1</span>
                </h1>
                <p className="text-gray-400 text-sm font-mono">Account Registration</p>
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
        
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                <FaUser className="inline mr-2" /> username:
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-mono"
                placeholder="choose username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                <FaEnvelope className="inline mr-2" /> email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-mono"
                placeholder="enter email address"
                value={formData.email}
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
                  className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-mono"
                  placeholder="create secure password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                <FaLock className="inline mr-2" /> confirm_password:
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  id="passwordConfirm"
                  name="passwordConfirm"
                  className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-mono"
                  placeholder="confirm password"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  disabled={loading}
                >
                  {showPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                <FaTicketAlt className="inline mr-2" /> invite_code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="inviteCode"
                  name="inviteCode"
                  className={`flex-1 px-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:border-transparent transition-all font-mono ${
                    codeValidated 
                      ? 'border-green-500 focus:ring-green-400' 
                      : 'border-gray-600 focus:ring-blue-400'
                  }`}
                  placeholder="15-character invite code"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  maxLength={15}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className={`px-4 py-3 rounded-lg font-mono text-sm transition-all ${
                    codeValidated
                      ? 'bg-green-600 text-white cursor-default'
                      : validatingCode
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  onClick={validateInviteCode}
                  disabled={validatingCode || formData.inviteCode.length !== 15 || codeValidated || loading}
                >
                  {validatingCode ? (
                    <span className="animate-spin">⚡</span>
                  ) : codeValidated ? (
                    <FaCheck />
                  ) : (
                    'verify'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {codeValidated 
                  ? '[SUCCESS] Valid invite code' 
                  : '[INFO] Invite code required for registration'}
              </p>
            </div>
          
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 font-mono transform hover:scale-105 disabled:transform-none"
                disabled={loading || !codeValidated}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⚡</span>
                    CREATING ACCOUNT...
                  </span>
                ) : (
                  './execute --register'
                )}
              </button>
            </div>
          </form>
        
          <div className="mt-8 text-center">
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm font-mono mb-2">
                [INFO] Already have an account?
              </p>
              <Link 
                href="/login" 
                className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm hover:underline"
              >
                ./login.sh
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center text-gray-500 text-xs font-mono">
              <span className="animate-pulse mr-2">●</span>
              <span>Secure registration protocol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 