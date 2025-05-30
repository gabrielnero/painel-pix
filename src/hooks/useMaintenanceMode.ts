'use client';

import { useState, useEffect } from 'react';

interface MaintenanceInfo {
  isActive: boolean;
  message: string;
  estimatedTime: string;
}

export function useMaintenanceMode() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo>({
    isActive: false,
    message: '',
    estimatedTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  const checkMaintenanceMode = async () => {
    try {
      // Verificar informações do usuário primeiro
      const userResponse = await fetch('/api/auth/check');
      const userData = await userResponse.json();
      
      if (userData.success && userData.user) {
        setUserRole(userData.user.role);
        
        // Se for admin, não aplicar manutenção
        if (userData.user.role === 'admin') {
          setMaintenanceInfo({
            isActive: false,
            message: '',
            estimatedTime: ''
          });
          setLoading(false);
          return;
        }
      }
      
      // Para usuários não-admin, verificar status de manutenção
      const response = await fetch('/api/maintenance/status');
      const data = await response.json();
      
      if (data.success) {
        setMaintenanceInfo(data.maintenance);
      }
    } catch (error) {
      console.error('Erro ao verificar modo manutenção:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMaintenanceMode();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...maintenanceInfo,
    loading,
    userRole,
    refresh: checkMaintenanceMode
  };
} 