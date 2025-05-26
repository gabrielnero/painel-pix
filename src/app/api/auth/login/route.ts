import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, isOfflineMode } from '@/lib/db';
import { User } from '@/lib/models';
import { verifyPassword, generateToken, localDevAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar primeiro a autenticação local para desenvolvimento
    // Priorizar modo offline/local para desenvolvimento
    if (process.env.NODE_ENV === 'development' || isOfflineMode()) {
      const localUser = await localDevAuth(username, password);
      
      if (localUser) {
        console.log('Usando autenticação local para desenvolvimento');
        
        // Gerar token JWT para o usuário local
        const token = generateToken(localUser._id.toString(), localUser.role);
        
        // Configurar o cookie com o token
        const cookieStore = cookies();
        cookieStore.set('token', token, {
          httpOnly: true,
          secure: false, // Em dev pode ser false
          maxAge: 60 * 60, // 1 hora
          path: '/',
        });
        
        // Retornar as informações do usuário local
        return NextResponse.json({
          success: true,
          user: {
            id: localUser._id,
            username: localUser.username,
            email: localUser.email,
            role: localUser.role
          },
          isOfflineMode: true
        });
      }
      
      // Para dev, se as credenciais não forem admin/admin123, criar usuário local temporário
      if (process.env.NODE_ENV === 'development') {
        const userId = `local-user-${username}`;
        const userRole = username.includes('admin') ? 'admin' : 'user';
        
        const tempUser = {
          _id: userId,
          username: username,
          email: `${username}@local.dev`,
          role: userRole,
          lastLogin: new Date()
        };
        
        console.log('Criando usuário temporário no modo offline:', tempUser);
        
        // Gerar token JWT para o usuário local
        const token = generateToken(tempUser._id.toString(), tempUser.role);
        
        // Configurar o cookie com o token
        const cookieStore = cookies();
        cookieStore.set('token', token, {
          httpOnly: true,
          secure: false, // Em dev pode ser false
          maxAge: 60 * 60, // 1 hora
          path: '/',
        });
        
        // Retornar as informações do usuário local
        return NextResponse.json({
          success: true,
          user: {
            id: tempUser._id,
            username: tempUser.username,
            email: tempUser.email,
            role: tempUser.role
          },
          isOfflineMode: true,
          message: 'Usuário temporário criado no modo offline'
        });
      }
    }

    try {
      // Tentativa de conexão com o banco de dados
      await connectToDatabase();
    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      
      // Se o erro for devido ao modo offline forçado, tentar criar um usuário fictício
      if (dbError instanceof Error && 
          (dbError.message === 'OFFLINE_MODE_FORCED' || dbError.message === 'OFFLINE_MODE_ACTIVE')) {
        const userId = `offline-user-${username}`;
        const userRole = username.includes('admin') ? 'admin' : 'user';
        
        const offlineUser = {
          _id: userId,
          username: username,
          email: `${username}@offline.dev`,
          role: userRole,
          lastLogin: new Date()
        };
        
        // Gerar token JWT para o usuário offline
        const token = generateToken(offlineUser._id.toString(), offlineUser.role);
        
        // Configurar o cookie com o token
        const cookieStore = cookies();
        cookieStore.set('token', token, {
          httpOnly: true,
          secure: false,
          maxAge: 60 * 60, // 1 hora
          path: '/',
        });
        
        // Retornar as informações do usuário offline
        return NextResponse.json({
          success: true,
          user: {
            id: offlineUser._id,
            username: offlineUser.username,
            email: offlineUser.email,
            role: offlineUser.role
          },
          isOfflineMode: true,
          message: 'Utilizando modo offline devido a erro de conexão'
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro de conexão com o banco de dados',
          error: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }

    // Se chegou aqui, tentar com o MongoDB
    // Busca o usuário
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verifica a senha
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verifica se o usuário está banido
    if (user.banned) {
      return NextResponse.json(
        { success: false, message: 'Usuário está banido do sistema' },
        { status: 403 }
      );
    }

    // Atualiza o último login
    user.lastLogin = new Date();
    await user.save();

    // Gera o token de autenticação
    const token = generateToken(user._id.toString(), user.role);

    // Configura o cookie com o token
    const cookieStore = cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hora
      path: '/',
    });

    // Retorna as informações do usuário
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro durante login:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 