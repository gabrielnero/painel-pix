import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { InviteCode } from '@/lib/models';
import { generateInviteCode, isAdmin, isModerator } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { getMockDb } from '@/lib/mockDb';

// Obter todos os convites (apenas admin/moderador)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Tentar com MongoDB
    try {
      // Verificar se o usuário tem permissão
      const hasPermission = await isModerator(decoded.userId);
      if (!hasPermission && process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { success: false, message: 'Acesso negado' },
          { status: 403 }
        );
      }

      // Conectar ao banco de dados
      await connectToDatabase();

      // Obter todos os convites, com o mais recente primeiro
      const inviteCodes = await InviteCode.find({})
        .sort({ createdAt: -1 })
        .populate('createdBy', 'username')
        .populate('usedBy', 'username')
        .lean();

      return NextResponse.json({
        success: true,
        inviteCodes
      });
    } catch (dbError) {
      console.error('Erro ao conectar ao MongoDB, usando modo desenvolvimento:', dbError);
      
      // Em modo de desenvolvimento, verificar se temos convites no mockDb
      if (process.env.NODE_ENV === 'development') {
        // Tentar obter convites do mockDb primeiro
        const mockDbInstance = getMockDb();
        let mockInviteCodes: Array<{
          _id: string;
          code: string;
          createdBy: { _id: string; username: string };
          usedBy?: { _id: string; username: string };
          createdAt: string;
          expiresAt: string;
          used: boolean;
        }> = [];
        
        if (mockDbInstance) {
          mockInviteCodes = mockDbInstance.getAllInvites();
          console.log('Obtendo convites do mockDb:', mockInviteCodes.length);
        }
        
        // Se não houver convites no mockDb, criar alguns simulados
        if (mockInviteCodes.length === 0) {
          const createdAt = new Date();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          
          mockInviteCodes = [
            {
              _id: uuidv4(),
              code: uuidv4().substring(0, 10).toUpperCase() + 'ABC12',
              createdBy: {
                _id: decoded.userId,
                username: 'admin'
              },
              createdAt: createdAt.toISOString(),
              expiresAt: expiresAt.toISOString(),
              used: false
            },
            {
              _id: uuidv4(),
              code: uuidv4().substring(0, 10).toUpperCase() + 'XYZ45',
              createdBy: {
                _id: decoded.userId,
                username: 'admin'
              },
              createdAt: new Date(createdAt.getTime() - 86400000).toISOString(), // 1 dia atrás
              expiresAt: new Date(expiresAt.getTime() - 86400000).toISOString(),
              used: true,
              usedBy: {
                _id: uuidv4(),
                username: 'testuser'
              }
            }
          ];
          
          // Se temos mockDb, salvar esses convites
          if (mockDbInstance) {
            try {
              // Limpar e adicionar novos
              mockDbInstance.clearAll();
              mockInviteCodes.forEach(invite => {
                mockDbInstance.createInvite(
                  invite.createdBy._id,
                  invite.createdBy.username,
                  7
                );
              });
            } catch (mockError) {
              console.error('Erro ao salvar no mockDb:', mockError);
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          inviteCodes: mockInviteCodes,
          isOfflineMode: true,
          isDevelopment: true
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao obter códigos de convite:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao obter códigos de convite',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Criar novo convite (apenas admin/moderador)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { expiresInDays = 7 } = body;

    // Validar expiresInDays
    if (expiresInDays < 1 || expiresInDays > 90) {
      return NextResponse.json(
        { success: false, message: 'Validade deve ser entre 1 e 90 dias' },
        { status: 400 }
      );
    }

    // Tentar o modo com MongoDB
    try {
      // Verificar se o usuário tem permissão
      const hasPermission = await isModerator(decoded.userId);
      if (!hasPermission) {
        // No modo desenvolvimento, permitir para qualquer usuário
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json(
            { success: false, message: 'Acesso negado' },
            { status: 403 }
          );
        }
      }

      // Conectar ao banco de dados
      await connectToDatabase();
      
      // Gerar código de 15 caracteres com combinação de letras maiúsculas e números
      const code = uuidv4().substring(0, 10).toUpperCase() + 
                  Math.random().toString(36).substring(2, 7).toUpperCase();
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      // Criar convite diretamente
      const newInvite = await InviteCode.create({
        code,
        createdBy: decoded.userId,
        expiresAt,
      });

      // Obter os detalhes do convite criado
      const inviteCode = await InviteCode.findOne({ code })
        .populate('createdBy', 'username')
        .lean();

      return NextResponse.json({
        success: true,
        message: 'Código de convite gerado com sucesso',
        inviteCode
      });
    } catch (dbError) {
      console.error('Erro ao conectar ao MongoDB, usando modo desenvolvimento:', dbError);
      
      // Em modo de desenvolvimento, retornar um convite simulado
      if (process.env.NODE_ENV === 'development') {
        // Gerar código de 15 caracteres
        const code = uuidv4().substring(0, 10).toUpperCase() + 
                    Math.random().toString(36).substring(2, 7).toUpperCase();
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        
        const mockInviteCode = {
          _id: uuidv4(),
          code,
          createdBy: {
            _id: decoded.userId,
            username: 'admin'
          },
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          used: false
        };
        
        // Se o mockDb estiver disponível, salvar o convite
        const mockDbInstance = getMockDb();
        if (mockDbInstance) {
          try {
            mockDbInstance.createInvite(decoded.userId, 'admin', expiresInDays);
            console.log('Convite salvo no mockDb');
          } catch (mockError) {
            console.error('Erro ao salvar no mockDb:', mockError);
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Código de convite gerado com sucesso (modo desenvolvimento)',
          inviteCode: mockInviteCode,
          code: code, // Incluir o código para fácil cópia
          isOfflineMode: true,
          isDevelopment: true
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao gerar código de convite:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao gerar código de convite',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Excluir convite (apenas admin)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    try {
      // Verificar se o usuário é admin
      const isAdminUser = await isAdmin(decoded.userId);
      if (!isAdminUser) {
        return NextResponse.json(
          { success: false, message: 'Acesso negado' },
          { status: 403 }
        );
      }

      // Obter o código do convite da URL
      const { searchParams } = new URL(request.url);
      const code = searchParams.get('code');

      if (!code) {
        return NextResponse.json(
          { success: false, message: 'Código de convite não fornecido' },
          { status: 400 }
        );
      }

      // Conectar ao banco de dados
      await connectToDatabase();

      // Excluir o convite
      const result = await InviteCode.deleteOne({ code });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Código de convite não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Código de convite excluído com sucesso'
      });
    } catch (dbError) {
      console.error('Erro ao conectar ao MongoDB, usando modo desenvolvimento:', dbError);
      
      // Em modo de desenvolvimento, simular exclusão bem-sucedida
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Código de convite excluído com sucesso (modo desenvolvimento)',
          isOfflineMode: true,
          isDevelopment: true
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao excluir código de convite:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao excluir código de convite',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 