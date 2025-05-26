import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

// ROTA PERIGOSA - Deve ser bloqueada em produção
export async function GET() {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Route not available in production' },
      { status: 404 }
    );
  }

  try {
    // Verificar conexão com MongoDB
    console.log('Verificando conexão com MongoDB...');
    let dbStatus = 'Desconectado';
    let error: Error | null = null;
    let models: string[] = [];
    
    try {
      // Tentar conectar ao MongoDB
      const connection = await connectToDatabase();
      dbStatus = mongoose.connection.readyState === 1 ? 'Conectado' : 'Erro na conexão';
      
      // Listar modelos disponíveis
      models = Object.keys(mongoose.models);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      dbStatus = 'Erro na conexão';
    }
    
    // Obter configurações de ambiente (sem expor segredos)
    const envConfig = {
      nodeEnv: process.env.NODE_ENV || 'não definido',
      mongoDbUri: process.env.MONGODB_URI ? '[CONFIGURADO]' : 'não definido',
      jwtSecret: process.env.JWT_SECRET ? '[CONFIGURADO]' : 'não definido'
    };
    
    // Retornar informações de diagnóstico
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        mongooseVersion: mongoose.version,
      },
      database: {
        status: dbStatus,
        models,
        connectionError: error ? 'Erro de conexão' : null
      },
      environment: envConfig
    });
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao executar diagnóstico'
      },
      { status: 500 }
    );
  }
} 