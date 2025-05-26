import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validações
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json(
        { success: false, message: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Apenas imagens são permitidas' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Diretório já existe
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `${authResult.userId}_${timestamp}${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL pública do arquivo
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Atualizar usuário no banco
    await connectToDatabase();
    await User.findByIdAndUpdate(authResult.userId, {
      'profile.avatar': avatarUrl,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      avatarUrl
    });

  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 