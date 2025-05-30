import { NextRequest, NextResponse } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/login', '/register', '/setup', '/maintenance'];

// Rotas de API públicas (apenas essenciais)
const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/verify-invite', '/api/setup/admin', '/api/maintenance/status'];

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
  
  // Verificar se o usuário está autenticado
  const token = request.cookies.get('token')?.value;
  
  // Se o usuário está autenticado e tenta acessar páginas públicas, redirecionar para dashboard
  if (token) {
    try {
      const decoded = verifyJWT(token);
      if (decoded && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
        const url = new URL('/dashboard', request.url);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // Se o token é inválido, limpar e continuar
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }
  
  // Verificar se a rota é pública
  if (publicRoutes.some(route => pathname === route) || 
      publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
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
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/pix/:path*',
    '/api/user/:path*',
    '/api/invite/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 