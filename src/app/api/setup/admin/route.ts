import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Verificar se já existe algum usuário admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Usuário administrador já existe'
      }, { status: 400 });
    }
    
    // Obter dados do corpo da requisição
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({
        success: false,
        message: 'Senha é obrigatória'
      }, { status: 400 });
    }
    
    // Usar senha do ambiente ou a fornecida
    const adminPassword = password || process.env.ADMIN_DEFAULT_PASSWORD || '695948741gs';
    
    // Criar hash da senha
    const hashedPassword = await hashPassword(adminPassword);
    
    // Criar usuário admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@painel.com',
      password: hashedPassword,
      role: 'admin',
      balance: 0,
      isVip: true,
      banned: false,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    console.log('Usuário administrador criado com sucesso em produção');
    
    return NextResponse.json({
      success: true,
      message: 'Usuário administrador criado com sucesso',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar usuário administrador',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 