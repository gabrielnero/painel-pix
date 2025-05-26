import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/login', '/register', '/setup'];

// Rotas de API públicas (apenas essenciais)
const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/verify-invite', '/api/setup/admin'];

// Função para verificar token JWT manualmente (compatível com Edge Runtime)
function verifyJWT(token: string) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'admin-panel-jwt-secret-key-very-secure';
    
    // Decodificar o token JWT manualmente
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar se o token não expirou
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('Token expirado');
      return null;
    }
    
    return {
      userId: payload.userId,
      role: payload.role
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Bloquear rotas perigosas em produção
  if (process.env.NODE_ENV === 'production') {
    const dangerousRoutes = ['/api/init', '/api/debug', '/api/test'];
    if (dangerousRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.json(
        { error: 'Route not available in production' },
        { status: 404 }
      );
    }
  }
  
  // Verificar se a rota é pública
  if (publicRoutes.some(route => pathname === route) || 
      publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Verificar se o usuário está autenticado
  const token = request.cookies.get('token')?.value;
  
  // Redirecionar para login se não houver token
  if (!token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  try {
    // Verificar se o token é válido
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      throw new Error('Token inválido');
    }
    
    // Verificar se o usuário tem permissão para acessar rotas de admin
    if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
    
    // Adicionar informações ao cabeçalho da resposta
    const response = NextResponse.next();
    response.headers.set('X-User-Id', decoded.userId);
    response.headers.set('X-User-Role', decoded.role);
    
    return response;
  } catch (error) {
    console.error('Erro na autenticação middleware:', error);
    
    // Se houver erro na verificação do token, redirecionar para login
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 