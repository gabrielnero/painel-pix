import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Photo, User } from '@/lib/models';

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

    // Verificar se o usuário é admin
    const user = await User.findById(authResult.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { files, category, ageCategory, price } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhuma foto selecionada' },
        { status: 400 }
      );
    }

    if (!ageCategory || !['18-25 anos', '26-35 anos', '36-45 anos', '46+ anos'].includes(ageCategory)) {
      return NextResponse.json(
        { success: false, message: 'Faixa etária inválida' },
        { status: 400 }
      );
    }

    const uploadedPhotos = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      const { imageData, originalName } = file;

      // Validações
      if (!imageData || !originalName) {
        continue; // Pular arquivos inválidos
      }

      // Verificar tipo de arquivo
      const allowedTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
      const isValidType = allowedTypes.some(type => imageData.startsWith(type));
      
      if (!isValidType) {
        continue; // Pular tipos inválidos
      }

      // Verificar tamanho
      const sizeInBytes = (imageData.length * 3) / 4;
      if (sizeInBytes > maxSize) {
        continue; // Pular arquivos muito grandes
      }

      // Verificar conteúdo malicioso
      if (imageData.includes('<script') || imageData.includes('javascript:') || imageData.includes('data:text/html')) {
        continue; // Pular arquivos suspeitos
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const filename = `selfie_${timestamp}_${randomId}`;

      // Extrair metadata básica
      const mimeType = imageData.split(';')[0].split(':')[1];

      try {
        // Salvar no banco de dados
        const photo = new Photo({
          filename,
          originalName,
          imageData,
          price: Number(price) || 20,
          category: 'SELFIE',
          ageCategory,
          uploadedBy: authResult.userId,
          metadata: {
            size: Math.round(sizeInBytes),
            mimeType
          }
        });

        const savedPhoto = await photo.save();
        uploadedPhotos.push({
          id: savedPhoto._id,
          filename: savedPhoto.filename,
          originalName: savedPhoto.originalName
        });

      } catch (error) {
        console.error('Erro ao salvar foto:', error);
        // Continuar com as outras fotos
      }
    }

    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhuma foto válida foi processada' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedPhotos.length} foto(s) enviada(s) com sucesso!`,
      photos: uploadedPhotos
    });

  } catch (error) {
    console.error('Erro no upload de fotos:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 