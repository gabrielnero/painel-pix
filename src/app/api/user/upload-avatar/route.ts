import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { success: false, message: 'Dados da imagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se é uma imagem base64 válida e de tipo permitido
    const allowedTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    const isValidType = allowedTypes.some(type => imageData.startsWith(type));
    
    if (!isValidType) {
      return NextResponse.json(
        { success: false, message: 'Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }
    
    // Verificar se não contém scripts ou código malicioso
    if (imageData.includes('<script') || imageData.includes('javascript:') || imageData.includes('data:text/html')) {
      return NextResponse.json(
        { success: false, message: 'Arquivo contém conteúdo não permitido' },
        { status: 400 }
      );
    }

    // Verificar tamanho da imagem (limite de 2MB em base64)
    const sizeInBytes = (imageData.length * 3) / 4;
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Imagem muito grande (máximo 2MB)' },
        { status: 400 }
      );
    }

    // Atualizar foto de perfil do usuário
    const updatedUser = await User.findByIdAndUpdate(
      authResult.userId,
      { profilePicture: imageData },
      { new: true, select: 'profilePicture username' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso',
      profilePicture: updatedUser.profilePicture
    });

  } catch (error) {
    console.error('Erro ao fazer upload da foto de perfil:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 