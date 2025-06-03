import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Photo } from '@/lib/models';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const ageCategory = searchParams.get('ageCategory') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const adminView = searchParams.get('admin') === 'true';

    // Construir filtros
    const filters: any = { isActive: true };
    
    if (category !== 'all') {
      filters.category = category;
    }
    
    if (ageCategory !== 'all') {
      filters.ageCategory = ageCategory;
    }

    // Campos para retornar (sem imageData para performance)
    const selectFields = adminView 
      ? 'filename originalName price category ageCategory uploadedBy uploadedAt likes views purchases revenue isActive metadata purchasedBy'
      : 'filename originalName price category ageCategory uploadedAt likes views isActive purchasedBy';

    // Buscar fotos
    const photos = await Photo.find(filters)
      .select(selectFields)
      .populate('uploadedBy', 'username')
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Contar total de fotos
    const total = await Photo.countDocuments(filters);

    const userObjectId = new mongoose.Types.ObjectId(authResult.userId);

    // Verificar quais fotos o usuário já comprou e formatar dados
    const photosWithPurchaseStatus = photos.map((photo: any) => ({
      id: photo._id.toString(),
      filename: photo.filename,
      originalName: photo.originalName,
      price: photo.price,
      category: photo.category,
      ageCategory: photo.ageCategory,
      uploadedAt: photo.uploadedAt,
      likes: photo.likes,
      views: photo.views,
      isActive: photo.isActive,
      isPurchased: photo.purchasedBy ? photo.purchasedBy.some((id: any) => id.toString() === authResult.userId) : false,
      ...(adminView && {
        uploadedBy: photo.uploadedBy?.username || 'Admin',
        purchases: photo.purchases || 0,
        revenue: photo.revenue || 0
      })
    }));

    return NextResponse.json({
      success: true,
      photos: photosWithPurchaseStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 