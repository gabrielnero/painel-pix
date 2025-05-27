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

  const checkMaintenanceMode = async () => {
    try {
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
    refresh: checkMaintenanceMode
  };
} 