import mongoose from 'mongoose';

// Definir a URL de conexão com o MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel';

// Determinar se o modo offline deve ser forçado (apenas se explicitamente definido)
export const FORCE_OFFLINE = process.env.FORCE_OFFLINE === 'true';

// Interface para o objeto de cache de conexão
interface ConnectionCache {
  conn: mongoose.Connection | null;
  promise: Promise<typeof mongoose> | null;
  isOffline: boolean;
}

// Declarar a variável global para o mongoose
declare global {
  var mongooseCache: ConnectionCache;
}

// Inicializar a instância global
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null, isOffline: false };
}

// Verificar se estamos no modo offline
export function isOfflineMode(): boolean {
  return global.mongooseCache.isOffline || FORCE_OFFLINE;
}

/**
 * Função para conectar ao MongoDB com cache de conexão
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  // Se forçar modo offline, não tenta conectar
  if (FORCE_OFFLINE) {
    console.log('Modo offline forçado. Não tentando conectar ao MongoDB.');
    global.mongooseCache.isOffline = true;
    throw new Error('OFFLINE_MODE_FORCED');
  }

  // Se já existe uma conexão, retorna
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  // Se já marcado como offline, não tenta novamente
  if (global.mongooseCache.isOffline) {
    throw new Error('OFFLINE_MODE_ACTIVE');
  }

  // Se já existe uma promessa, aguarda e retorna
  if (global.mongooseCache.promise) {
    try {
      const mongoose = await global.mongooseCache.promise;
      global.mongooseCache.conn = mongoose.connection;
      return mongoose.connection;
    } catch (error) {
      global.mongooseCache.isOffline = true;
      throw error;
    }
  }

  try {
    // Configurações de conexão com timeout reduzido
    const options: mongoose.ConnectOptions = {
      bufferCommands: false,
      autoIndex: true,
      connectTimeoutMS: 5000, // 5 segundos de timeout para conexão
      socketTimeoutMS: 10000 // 10 segundos de timeout para operações
    };

    // Criar nova promessa de conexão
    global.mongooseCache.promise = mongoose.connect(MONGODB_URI, options);
    const mongoose_instance = await global.mongooseCache.promise;
    
    // Armazenar a conexão no cache
    global.mongooseCache.conn = mongoose_instance.connection;
    global.mongooseCache.isOffline = false;
    
    // Configurar eventos de conexão
    mongoose_instance.connection.on('connected', () => 
      console.log('MongoDB conectado com sucesso'));
    
    mongoose_instance.connection.on('error', (err) => {
      console.error('Erro na conexão com MongoDB:', err);
      global.mongooseCache.isOffline = true;
    });
    
    return mongoose_instance.connection;
  } catch (error) {
    // Limpar a promessa em caso de erro
    global.mongooseCache.promise = null;
    global.mongooseCache.isOffline = true;
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
} 