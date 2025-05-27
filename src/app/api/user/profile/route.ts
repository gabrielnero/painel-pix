import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    try {
      await connectToDatabase();

      // Buscar o usuário
      const user = await User.findById(authResult.userId).select('-password');
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Montar perfil do usuário
      const profile = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance || 0,
        totalEarnings: user.totalEarnings || 0,
        inviteCodes: user.inviteCode ? [user.inviteCode] : [],
        rankingPosition: 999, // Calcular posição real depois
        showInRanking: true, // Padrão true
        createdAt: user.createdAt,
        // Novos campos de perfil
        profilePicture: user.profilePicture,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        socialLinks: user.socialLinks || {
          twitter: '',
          instagram: '',
          linkedin: '',
          github: ''
        },
        profileViews: user.profileViews || 0,
        isProfilePublic: user.isProfilePublic !== false
      };

      return NextResponse.json({
        success: true,
        profile
      });

    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com o banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
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
    const {
      profilePicture,
      bio,
      location,
      website,
      socialLinks,
      isProfilePublic
    } = body;

    // Validações
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Biografia muito longa (máximo 500 caracteres)' },
        { status: 400 }
      );
    }

    if (location && location.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Localização muito longa (máximo 100 caracteres)' },
        { status: 400 }
      );
    }

    if (website && website.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Website muito longo (máximo 200 caracteres)' },
        { status: 400 }
      );
    }

    // Validar URL do website se fornecida
    if (website && website.trim() !== '') {
      try {
        new URL(website);
      } catch {
        return NextResponse.json(
          { success: false, message: 'URL do website inválida' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (bio !== undefined) updateData.bio = bio.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (isProfilePublic !== undefined) updateData.isProfilePublic = isProfilePublic;

    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      authResult.userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: {
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        socialLinks: updatedUser.socialLinks,
        isProfilePublic: updatedUser.isProfilePublic
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 