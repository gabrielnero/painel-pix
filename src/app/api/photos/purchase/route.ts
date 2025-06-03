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

    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { success: false, message: 'ID da foto é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a foto
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a foto está ativa
    if (!photo.isActive) {
      return NextResponse.json(
        { success: false, message: 'Foto não está disponível para compra' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já comprou a foto
    const alreadyPurchased = photo.purchasedBy?.some((id: any) => id.toString() === authResult.userId);
    if (alreadyPurchased) {
      return NextResponse.json(
        { success: false, message: 'Você já possui esta foto' },
        { status: 400 }
      );
    }

    // Buscar o usuário
    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar saldo
    if (user.balance < photo.price) {
      return NextResponse.json(
        { success: false, message: `Saldo insuficiente. Você precisa de R$ ${photo.price.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Processar a compra
    user.balance -= photo.price;
    await user.save();

    // Adicionar usuário à lista de compradores
    photo.purchasedBy = photo.purchasedBy || [];
    photo.purchasedBy.push(user._id);
    photo.purchases = (photo.purchases || 0) + 1;
    photo.revenue = (photo.revenue || 0) + photo.price;
    await photo.save();

    return NextResponse.json({
      success: true,
      message: `Foto comprada com sucesso por R$ ${photo.price.toFixed(2)}!`,
      newBalance: user.balance
    });

  } catch (error) {
    console.error('Erro ao processar compra:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 