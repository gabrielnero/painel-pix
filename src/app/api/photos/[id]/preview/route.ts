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
    const photo = await Photo.findById(params.id).select('imageData isPurchased purchasedBy');
    
    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário comprou a foto
    const hasPurchased = photo.purchasedBy?.some((id: any) => id.toString() === authResult.userId);

    // Se a foto não foi comprada, retornar versão borrada
    let imageData = photo.imageData;
    
    if (!hasPurchased) {
      // Para preview, sempre retornar a imagem (o blur será aplicado via CSS no frontend)
      // Isso é mais eficiente que processar a imagem no servidor
    }

    // Extrair o tipo MIME da imageData
    const mimeTypeMatch = imageData.match(/^data:([^;]+);base64,/);
    if (!mimeTypeMatch) {
      return NextResponse.json(
        { success: false, message: 'Formato de imagem inválido' },
        { status: 400 }
      );
    }

    const mimeType = mimeTypeMatch[1];
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
        'X-Purchased': hasPurchased ? 'true' : 'false'
      },
    });

  } catch (error) {
    console.error('Erro ao buscar preview da foto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 