import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtVerify, SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { User, InviteCode } from './models';
import { connectToDatabase, isOfflineMode } from './db';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Chave secreta para assinar tokens JWT - DEVE ser definida em produção
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.VERCEL_ENV) {
    console.warn('JWT_SECRET não definido, usando chave padrão (INSEGURO)');
  }
  return 'admin-panel-jwt-secret-key-very-secure';
})();

// Função para gerar hash de senha
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(12); // Aumentar rounds para mais segurança
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Erro ao gerar hash da senha:', error);
    throw new Error('Erro ao processar senha');
  }
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}

// Interface para payload do token
interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Função para gerar token JWT
export function generateToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Função para verificar token JWT
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return {
      userId: decoded.userId,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Função para verificar token JWT compatível com Edge Runtime
export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      role: payload.role as string
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT (Edge):', error);
    return null;
  }
}

// Função para gerar token JWT usando jose (compatível com Edge)
export async function generateJWT(userId: string, role: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    
    const token = await new SignJWT({ userId, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);
      
    return token;
  } catch (error) {
    console.error('Erro ao gerar token JWT (Edge):', error);
    throw new Error('Erro ao gerar token de autenticação');
  }
}

// Função para autenticação local em desenvolvimento (sem banco de dados)
export async function localDevAuth(username: string, password: string) {
  // Só permitir em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Credenciais fixas para desenvolvimento
  if (username === 'admin' && password === 'admin123') {
    return {
      _id: 'local-admin-id',
      username: 'admin',
      email: 'admin@painel.com',
      role: 'admin',
      lastLogin: new Date()
    };
  }
  
  return null;
}

// As funções abaixo só devem ser usadas em rotas API, não no middleware
// Função para gerar código de convite
export async function generateInviteCode(createdBy: string, expiresInDays = 7): Promise<string> {
  try {
    // A conexão ao banco agora é feita no arquivo route.ts antes de chamar esta função
    
    // Gerar código de 15 caracteres com combinação de letras maiúsculas e números
    const code = uuidv4().substring(0, 10).toUpperCase() + 
               Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Usar o método create direto, passando o createdBy como string
    // O Mongoose converterá para ObjectId internamente
    const inviteDoc = new InviteCode({
      code,
      createdBy,
      expiresAt,
    });
    
    await inviteDoc.save();
    
    return code;
  } catch (error) {
    console.error('Erro ao gerar código de convite:', error);
    throw new Error('Falha ao gerar código de convite');
  }
}

// Função para verificar se código de convite é válido
export async function verifyInviteCode(code: string): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const inviteCode = await InviteCode.findOne({ 
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    return !!inviteCode;
  } catch (error) {
    console.error('Erro ao verificar código de convite:', error);
    return false;
  }
}

// Função para usar código de convite
export async function useInviteCode(code: string, userId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const inviteCode = await InviteCode.findOneAndUpdate(
      { 
        code,
        used: false,
        expiresAt: { $gt: new Date() }
      },
      { 
        used: true,
        usedBy: userId,
        usedAt: new Date()
      }
    );
    
    return !!inviteCode;
  } catch (error) {
    console.error('Erro ao usar código de convite:', error);
    return false;
  }
}

// Função para verificar se usuário é administrador
export async function isAdmin(userId: string): Promise<boolean> {
  await connectToDatabase();
  
  const user = await User.findById(userId);
  
  return user ? user.role === 'admin' : false;
}

// Função para verificar se usuário é moderador
export async function isModerator(userId: string): Promise<boolean> {
  await connectToDatabase();
  
  const user = await User.findById(userId);
  
  return user ? (user.role === 'moderator' || user.role === 'admin') : false;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  role?: string;
  message?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Obter token do cookie
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return {
        success: false,
        message: 'Token não encontrado'
      };
    }

    // Verificar token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      
      // Conectar ao banco de dados
      try {
        await connectToDatabase();

        // Verificar se o usuário existe e não está banido
        const user = await User.findById(decoded.userId);
        if (!user || user.banned) {
          return {
            success: false,
            message: 'Usuário não encontrado ou banido'
          };
        }

        return {
          success: true,
          userId: decoded.userId,
          role: decoded.role
        };
      } catch (dbError) {
        return {
          success: false,
          message: 'Erro de conexão com banco de dados'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Token inválido'
      };
    }
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return {
      success: false,
      message: 'Erro interno'
    };
  }
} 