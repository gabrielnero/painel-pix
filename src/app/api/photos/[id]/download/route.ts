import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Photo } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Buscar a foto
    const photo = await Photo.findById(params.id).select('imageData originalName filename purchasedBy');
    
    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário comprou a foto
    const hasPurchased = photo.purchasedBy?.some((id: any) => id.toString() === authResult.userId);

    if (!hasPurchased) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado - Foto não foi comprada' },
        { status: 403 }
      );
    }

    // Extrair o tipo MIME da imageData
    const mimeTypeMatch = photo.imageData.match(/^data:([^;]+);base64,/);
    if (!mimeTypeMatch) {
      return NextResponse.json(
        { success: false, message: 'Formato de imagem inválido' },
        { status: 400 }
      );
    }

    const mimeType = mimeTypeMatch[1];
    const base64Data = photo.imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determinar extensão do arquivo
    const extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' : 
                     mimeType.includes('png') ? '.png' : 
                     mimeType.includes('webp') ? '.webp' : '.jpg';

    const filename = photo.originalName || `${photo.filename}${extension}`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0',
      },
    });

  } catch (error) {
    console.error('Erro ao baixar foto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 