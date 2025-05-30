'use client';

import { ReactNode } from 'react';
import MaintenanceMode from '@/components/MaintenanceMode';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export default function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const { isActive: isMaintenanceActive, message: maintenanceMessage, estimatedTime, loading: maintenanceLoading } = useMaintenanceMode();

  // Verificar se o sistema está em manutenção
  if (!maintenanceLoading && isMaintenanceActive) {
    return (
      <MaintenanceMode 
        message={maintenanceMessage}
        estimatedTime={estimatedTime}
      />
    );
  }

  // Se não está em manutenção ou ainda carregando, renderizar children
  return <>{children}</>;
} 