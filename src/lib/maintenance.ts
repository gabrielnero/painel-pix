import { NextRequest } from 'next/server';
import { verifyAuth } from './auth';
import { isMaintenanceMode, getMaintenanceInfo } from './config';

// Verificar se o usuário pode acessar durante a manutenção
export async function canAccessDuringMaintenance(request: NextRequest): Promise<boolean> {
  try {
    const authResult = await verifyAuth(request);
    
    // Admins podem acessar durante a manutenção
    if (authResult.success && authResult.role === 'admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Verificar se a rota deve ser bloqueada durante a manutenção
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/api/pix',
    '/api/user',
    '/api/invite'
  ];
  
  // Rotas que admins podem acessar durante manutenção
  const adminRoutes = [
    '/admin',
    '/api/admin'
  ];
  
  // Verificar se é uma rota protegida (mas não admin)
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdmin = adminRoutes.some(route => pathname.startsWith(route));
  
  return isProtected && !isAdmin;
}

// Obter dados completos do modo manutenção
export async function getMaintenanceData() {
  const maintenanceInfo = await getMaintenanceInfo();
  
  return {
    ...maintenanceInfo,
    startTime: new Date().toISOString(),
    supportContact: 'https://t.me/watchingdaysbecomeyears'
  };
} 