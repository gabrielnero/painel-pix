'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner, FaSignOutAlt } from 'react-icons/fa';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        // Fazer logout via API
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      } finally {
        // Limpar localStorage se houver
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // Redirecionar para login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    };

    logout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <FaSignOutAlt className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <FaSpinner className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Fazendo logout...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Você será redirecionado em instantes.
        </p>
      </div>
    </div>
  );
} 