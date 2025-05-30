import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAllConfigs, setConfig, initializeDefaultConfigs } from '@/lib/config';

export const dynamic = 'force-dynamic';

// GET - Obter todas as configurações
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem acessar as configurações.' },
        { status: 403 }
      );
    }

    // Inicializar configurações padrão se necessário
    await initializeDefaultConfigs(authResult.userId!);

    const configs = await getAllConfigs();

    return NextResponse.json({
      success: true,
      configs
    });

  } catch (error) {
    console.error('Erro ao obter configurações:', error);
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

// POST - Atualizar configurações
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem alterar as configurações.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { configs } = body;

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json(
        { success: false, message: 'Configurações inválidas' },
        { status: 400 }
      );
    }

    // Validar e atualizar cada configuração
    const results = [];
    for (const config of configs) {
      const { key, value, description } = config;

      if (!key || value === undefined) {
        results.push({
          key,
          success: false,
          message: 'Chave ou valor inválido'
        });
        continue;
      }

      const success = await setConfig(key, value, authResult.userId!, description);
      results.push({
        key,
        success,
        message: success ? 'Configuração atualizada com sucesso' : 'Erro ao atualizar configuração'
      });
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'Todas as configurações foram atualizadas' : 'Algumas configurações falharam',
      results
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
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