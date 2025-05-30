'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [password, setPassword] = useState('695948741gs');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createAdmin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro na requisição: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Setup Administrador
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Senha do Administrador:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a senha do admin"
            />
          </div>

          <button
            onClick={createAdmin}
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Criando...' : 'Criar Usuário Admin'}
          </button>

          {result && (
            <div className={`p-4 rounded-md ${
              result.success 
                ? 'bg-green-900 border border-green-700' 
                : 'bg-red-900 border border-red-700'
            }`}>
              <p className={`text-sm ${
                result.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {result.message}
              </p>
              
              {result.success && (
                <div className="mt-3 p-3 bg-gray-800 rounded border">
                  <p className="text-white text-sm font-medium">Credenciais de Login:</p>
                  <p className="text-gray-300 text-sm">Usuário: <span className="text-white font-mono">admin</span></p>
                  <p className="text-gray-300 text-sm">Senha: <span className="text-white font-mono">{password}</span></p>
                  <a 
                    href="/login" 
                    className="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition-colors"
                  >
                    Ir para Login
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <a 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Já tem conta? Fazer Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 