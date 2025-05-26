import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { InviteCode } from '@/lib/models';
import { verifyInviteCode } from '@/lib/auth';

// Importar mockDb para uso offline
import { mockDb } from '@/lib/mockDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Código de convite não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o código tem o formato esperado (15 caracteres)
    if (code.length !== 15) {
      return NextResponse.json(
        { success: false, message: 'Código de convite deve ter 15 caracteres' },
        { status: 400 }
      );
    }

    // Tentar verificar com MongoDB
    try {
      // Verificar se o código é válido
      const isValid = await verifyInviteCode(code);

      if (!isValid) {
        // Se o código não for válido, verificar o motivo
        await connectToDatabase();
        const inviteCode = await InviteCode.findOne({ code });

        if (!inviteCode) {
          return NextResponse.json(
            { success: false, message: 'Código de convite não encontrado' },
            { status: 404 }
          );
        }

        if (inviteCode.used) {
          return NextResponse.json(
            { success: false, message: 'Código de convite já foi utilizado' },
            { status: 400 }
          );
        }

        if (new Date() > inviteCode.expiresAt) {
          return NextResponse.json(
            { success: false, message: 'Código de convite expirado' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { success: false, message: 'Código de convite inválido' },
          { status: 400 }
        );
      }

      // Se chegou aqui, o código é válido
      return NextResponse.json({
        success: true,
        message: 'Código de convite válido'
      });
    } catch (dbError) {
      console.error('Erro de conexão com MongoDB, usando modo offline:', dbError);
      
      // Criar um convite de teste para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        // No ambiente de desenvolvimento, podemos aceitar qualquer código de 15 caracteres
        return NextResponse.json({
          success: true,
          message: 'Código de convite válido (modo desenvolvimento)',
          isOfflineMode: true,
          isDevelopment: true
        });
      }
      
      // Se não conseguir conectar ao MongoDB e não estivermos em desenvolvimento, repassar o erro
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao verificar código de convite:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao verificar código de convite',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 