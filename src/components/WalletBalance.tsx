'use client';

import { useState, useEffect } from 'react';
import { FaWallet, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function WalletBalance() {
  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/user/balance');
        const data = await response.json();
        if (data.success) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error('Erro ao buscar saldo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Atualizar saldo a cada 30 segundos
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBalance = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg">
        <FaWallet className="h-4 w-4" />
        <span className="text-sm font-medium">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
      <FaWallet className="h-4 w-4" />
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">
          {showBalance ? formatBalance(balance) : '••••••'}
        </span>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="text-white/80 hover:text-white transition-colors"
          title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
        >
          {showBalance ? (
            <FaEyeSlash className="h-3 w-3" />
          ) : (
            <FaEye className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
} 