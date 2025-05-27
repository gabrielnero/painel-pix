'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'GET',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      } finally {
        // Independente do resultado, redireciona para a página inicial
        router.push('/');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4 text-theme-primary">Saindo do sistema...</h1>
      <p className="opacity-70">Você será redirecionado em instantes.</p>
    </div>
  );
} 