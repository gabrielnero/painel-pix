import { v4 as uuidv4 } from 'uuid';

// Interface para os modelos simulados
interface MockInviteCode {
  _id: string;
  code: string;
  createdBy: {
    _id: string;
    username: string;
  };
  usedBy?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

// Verificar se estamos no lado do cliente
const isClient = typeof window !== 'undefined';

// Classe para simular o banco de dados
class MockDatabase {
  private inviteCodes: MockInviteCode[] = [];

  constructor() {
    // Carregar dados do localStorage apenas no cliente
    if (isClient) {
      this.loadFromStorage();
    }
  }

  // Carregar dados do localStorage
  private loadFromStorage() {
    try {
      const storedInvites = localStorage.getItem('mockInviteCodes');
      if (storedInvites) {
        this.inviteCodes = JSON.parse(storedInvites);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      // Usar array vazio em caso de erro
      this.inviteCodes = [];
    }
  }

  // Salvar dados no localStorage
  private saveToStorage() {
    if (!isClient) return;
    
    try {
      localStorage.setItem('mockInviteCodes', JSON.stringify(this.inviteCodes));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  // Criar um novo convite
  createInvite(userId: string, username: string, expiresInDays = 7): MockInviteCode {
    const code = uuidv4().substring(0, 10).toUpperCase() + 
                 Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const newInvite: MockInviteCode = {
      _id: uuidv4(),
      code,
      createdBy: {
        _id: userId,
        username
      },
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false
    };
    
    this.inviteCodes.push(newInvite);
    this.saveToStorage();
    
    return newInvite;
  }

  // Obter todos os convites
  getAllInvites(): MockInviteCode[] {
    // Se não estiver no cliente ou não houver dados, retornar array vazio
    if (!isClient || !this.inviteCodes.length) {
      return [];
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    return [...this.inviteCodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Encontrar convite por código
  findByCode(code: string): MockInviteCode | null {
    if (!isClient || !this.inviteCodes.length) {
      return null;
    }
    
    return this.inviteCodes.find(invite => invite.code === code) || null;
  }

  // Excluir convite
  deleteInvite(code: string): boolean {
    if (!isClient || !this.inviteCodes.length) {
      return false;
    }
    
    const initialLength = this.inviteCodes.length;
    this.inviteCodes = this.inviteCodes.filter(invite => invite.code !== code);
    
    if (this.inviteCodes.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  // Usar convite
  useInvite(code: string, userId: string, username: string): boolean {
    if (!isClient) {
      return false;
    }
    
    const invite = this.findByCode(code);
    
    if (!invite || invite.used || new Date() > new Date(invite.expiresAt)) {
      return false;
    }
    
    invite.used = true;
    invite.usedBy = {
      _id: userId,
      username
    };
    
    this.saveToStorage();
    return true;
  }

  // Limpar todos os dados (útil para testes)
  clearAll(): void {
    if (!isClient) return;
    
    this.inviteCodes = [];
    this.saveToStorage();
  }
}

// Instância única do banco de dados simulado
let mockDbInstance: MockDatabase | null = null;

// Função para obter a instância do mockDb
export function getMockDb(): MockDatabase | null {
  if (!isClient) return null;
  
  if (!mockDbInstance) {
    mockDbInstance = new MockDatabase();
  }
  
  return mockDbInstance;
}

// Exportar a instância
export const mockDb = isClient ? getMockDb() : null; 