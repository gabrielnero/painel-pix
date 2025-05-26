import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, isOfflineMode, FORCE_OFFLINE } from '@/lib/db';
import { User } from '@/lib/models';
import { hashPassword, verifyInviteCode, useInviteCode } from '@/lib/auth';
import { mockDb } from '@/lib/mockDb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, inviteCode } = body;

    // Validações básicas
    if (!username || !email || !password || !inviteCode) {
      return NextResponse.json(
        { success: false, message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar se a senha tem pelo menos 6 caracteres
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar formato do código de convite
    if (inviteCode.length !== 15) {
      return NextResponse.json(
        { success: false, message: 'Código de convite deve ter 15 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se estamos no modo offline/desenvolvimento
    if (isOfflineMode() || FORCE_OFFLINE) {
      console.log('Registro em modo offline/desenvolvimento');
      
      // Verificar o código se temos mockDb disponível
      if (mockDb) {
        const inviteFound = mockDb.findByCode(inviteCode);
        
        // Se o código não existe e estamos no modo desenvolvimento, aceitar qualquer código
        if (!inviteFound && process.env.NODE_ENV === 'development') {
          console.log('Código não encontrado, mas aceitando em modo dev:', inviteCode);
        }
        // Se o código existe, verificar se já foi usado
        else if (inviteFound && inviteFound.used) {
          return NextResponse.json(
            { success: false, message: 'Código de convite já utilizado' },
            { status: 400 }
          );
        }
      } else {
        // Se não temos mockDb, aceitar qualquer código no desenvolvimento
        console.log('mockDb não disponível, aceitando código em modo dev');
      }
      
      // Gerar ID para o usuário offline
      const userId = uuidv4();
      
      // Se temos mockDb, marcar o código como usado
      if (mockDb) {
        try {
          mockDb.useInvite(inviteCode, userId, username);
        } catch (err) {
          console.error('Erro ao marcar convite como usado no mockDb:', err);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Usuário registrado com sucesso (modo offline)',
        user: {
          id: userId,
          username,
          email,
          role: 'user'
        },
        isOfflineMode: true
      });
    }

    // Se não estiver em modo offline, tentar com MongoDB
    try {
      // Conectar ao banco de dados
      await connectToDatabase();

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${username}$`, 'i') } },
          { email: { $regex: new RegExp(`^${email}$`, 'i') } }
        ]
      });

      if (existingUser) {
        if (existingUser.username.toLowerCase() === username.toLowerCase()) {
          return NextResponse.json(
            { success: false, message: 'Nome de usuário já está em uso' },
            { status: 400 }
          );
        }
        
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          return NextResponse.json(
            { success: false, message: 'Email já está em uso' },
            { status: 400 }
          );
        }
      }

      // Verificar o código de convite
      const isValidInvite = await verifyInviteCode(inviteCode);
      if (!isValidInvite) {
        return NextResponse.json(
          { success: false, message: 'Código de convite inválido, expirado ou já utilizado' },
          { status: 400 }
        );
      }

      // Criar hash da senha
      const hashedPassword = await hashPassword(password);

      // Criar o novo usuário
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        banned: false
      });

      // Marcar o código de convite como usado
      await useInviteCode(inviteCode, newUser._id.toString());

      return NextResponse.json({
        success: true,
        message: 'Usuário registrado com sucesso',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (dbError) {
      console.error('Erro de conexão com MongoDB, usando modo desenvolvimento:', dbError);
      
      // Em modo de desenvolvimento, permitir o registro sem banco de dados
      if (process.env.NODE_ENV === 'development') {
        // Gerar um ID simulado
        const userId = uuidv4();
        
        return NextResponse.json({
          success: true,
          message: 'Usuário registrado com sucesso (modo desenvolvimento)',
          user: {
            id: userId,
            username,
            email,
            role: 'user'
          },
          isOfflineMode: true,
          isDevelopment: true
        });
      } else {
        // Se não estiver em desenvolvimento, repassar o erro
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Erro durante o registro:', error);
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