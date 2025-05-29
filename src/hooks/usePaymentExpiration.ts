import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export function usePaymentExpiration() {
  const checkExpiredPayments = useCallback(async () => {
    try {
      const response = await fetch('/api/pix/check-expired');
      const data = await response.json();

      if (data.success && data.expiredCount > 0) {
        toast.error(`${data.expiredCount} pagamento(s) expirado(s) automaticamente após 30 minutos`);
        console.log('💸 Pagamentos expirados:', data);
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos expirados:', error);
    }
  }, []);

  useEffect(() => {
    // Verificar imediatamente ao carregar
    checkExpiredPayments();

    // Verificar a cada 5 minutos
    const interval = setInterval(checkExpiredPayments, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkExpiredPayments]);

  return { checkExpiredPayments };
} 