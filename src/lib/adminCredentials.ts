import { connectToDatabase } from './db';
import { User } from './models';
import { hashPassword } from './auth';

/**
 * Função para criar o usuário admin inicial
 * ATENÇÃO: Altere a senha padrão em produção
 */
export async function createAdminUser() {
  try {
    const conn = await connectToDatabase();
    console.log('Conectado ao MongoDB para criar usuário administrador');
    
    // Verificar se já existe usuário admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Usuário administrador já existe.');
      return {
        success: true,
        message: 'Usuário administrador já existe.',
        user: {
          username: existingAdmin.username
        }
      };
    }
    
    // Senha padrão - DEVE SER ALTERADA EM PRODUÇÃO
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    
    // Credenciais do admin
    const adminCredentials = {
      username: 'admin',
      email: 'admin@painel.com',
      password: await hashPassword(defaultPassword),
      role: 'admin',
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    // Criar usuário admin
    const admin = await User.create(adminCredentials);
    
    console.log('Usuário administrador criado com sucesso.');
    console.log('ATENÇÃO: Altere a senha padrão em produção!');
    
    return {
      success: true,
      message: 'Usuário administrador criado com sucesso.',
      user: {
        username: admin.username
      }
    };
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    return {
      success: false,
      message: 'Erro ao criar usuário administrador',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Para implementar a inicialização do admin no servidor,
 * importe e chame esta função no arquivo de inicialização da aplicação
 */ 