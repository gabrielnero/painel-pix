import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Photo, User } from '@/lib/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID da foto inválido' },
        { status: 400 }
      );
    }

    const photo = await Photo.findById(id)
      .populate('uploadedBy', 'username')
      .lean();

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é admin ou se comprou a foto
    const user = await User.findById(authResult.userId);
    const isAdmin = user?.role === 'admin';
    const userObjectId = new mongoose.Types.ObjectId(authResult.userId);
    const hasPurchased = photo.purchasedBy?.some((id: any) => id.toString() === authResult.userId);

    // Incrementar views apenas se não for admin
    if (!isAdmin) {
      await Photo.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    // Preparar resposta baseada no acesso
    const responseData: any = {
      id: photo._id.toString(),
      filename: photo.filename,
      originalName: photo.originalName,
      price: photo.price,
      category: photo.category,
      ageCategory: photo.ageCategory,
      uploadedAt: photo.uploadedAt,
      likes: photo.likes,
      views: photo.views + (isAdmin ? 0 : 1), // Atualizar view count local
      isActive: photo.isActive,
      isPurchased: hasPurchased || isAdmin,
      uploadedBy: (photo.uploadedBy as any)?.username || 'Admin'
    };

    // Incluir imagem completa apenas se o usuário tem acesso
    if (isAdmin || hasPurchased) {
      responseData.imageData = photo.imageData;
      responseData.fullAccess = true;
    } else {
      // Criar preview borrado (apenas placeholder)
      responseData.preview = '/images/blurred-preview.jpg';
      responseData.fullAccess = false;
    }

    // Dados extras para admin
    if (isAdmin) {
      responseData.purchases = photo.purchases;
      responseData.revenue = photo.revenue;
      responseData.metadata = photo.metadata;
    }

    return NextResponse.json({
      success: true,
      photo: responseData
    });

  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar foto (apenas admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Verificar se é admin
    const user = await User.findById(authResult.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { price, ageCategory, isActive } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID da foto inválido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (price !== undefined) updateData.price = Number(price);
    if (ageCategory !== undefined) updateData.ageCategory = ageCategory;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedPhoto = await Photo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: 'filename price ageCategory isActive' }
    );

    if (!updatedPhoto) {
      return NextResponse.json(
        { success: false, message: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Foto atualizada com sucesso',
      photo: updatedPhoto
    });

  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover foto (apenas admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Verificar se é admin
    const user = await User.findById(authResult.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID da foto inválido' },
        { status: 400 }
      );
    }

    const deletedPhoto = await Photo.findByIdAndDelete(id);

    if (!deletedPhoto) {
      return NextResponse.json(
        { success: false, message: 'Foto não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Foto removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 