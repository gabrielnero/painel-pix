'use client';

import { useEffect, useState } from 'react';
import MaintenanceMode from '@/components/MaintenanceMode';

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState({
    message: 'Sistema em manutenção. Voltaremos em breve com melhorias!',
    estimatedTime: ''
  });

  useEffect(() => {
    // Tentar buscar informações de manutenção
    const fetchMaintenanceInfo = async () => {
      try {
        const response = await fetch('/api/maintenance/status');
        const data = await response.json();
        
        if (data.success && data.maintenance) {
          setMaintenanceInfo({
            message: data.maintenance.message || 'Sistema em manutenção. Voltaremos em breve com melhorias!',
            estimatedTime: data.maintenance.estimatedTime || ''
          });
        }
      } catch (error) {
        console.error('Erro ao buscar informações de manutenção:', error);
        // Manter valores padrão
      }
    };

    fetchMaintenanceInfo();
  }, []);

  return (
    <MaintenanceMode 
      message={maintenanceInfo.message}
      estimatedTime={maintenanceInfo.estimatedTime}
    />
  );
} 