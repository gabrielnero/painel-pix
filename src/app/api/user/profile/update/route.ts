import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

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
      displayName, 
      bio, 
      location, 
      website, 
      avatar,
      socialLinks,
      privacy,
      settings 
    } = body;

    // Validações
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Biografia não pode ter mais de 500 caracteres' },
        { status: 400 }
      );
    }

    if (displayName && displayName.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Nome de exibição não pode ter mais de 50 caracteres' },
        { status: 400 }
      );
    }

    // Atualizar perfil
    const updateData: any = {
      updatedAt: new Date()
    };

    if (displayName !== undefined) updateData['profile.displayName'] = displayName;
    if (bio !== undefined) updateData['profile.bio'] = bio;
    if (location !== undefined) updateData['profile.location'] = location;
    if (website !== undefined) updateData['profile.website'] = website;
    if (avatar !== undefined) updateData['profile.avatar'] = avatar;

    if (socialLinks) {
      if (socialLinks.telegram !== undefined) updateData['profile.socialLinks.telegram'] = socialLinks.telegram;
      if (socialLinks.twitter !== undefined) updateData['profile.socialLinks.twitter'] = socialLinks.twitter;
      if (socialLinks.instagram !== undefined) updateData['profile.socialLinks.instagram'] = socialLinks.instagram;
    }

    if (privacy) {
      if (privacy.showEmail !== undefined) updateData['profile.privacy.showEmail'] = privacy.showEmail;
      if (privacy.showBalance !== undefined) updateData['profile.privacy.showBalance'] = privacy.showBalance;
      if (privacy.allowComments !== undefined) updateData['profile.privacy.allowComments'] = privacy.allowComments;
      if (privacy.allowMessages !== undefined) updateData['profile.privacy.allowMessages'] = privacy.allowMessages;
    }

    if (settings) {
      if (settings.theme !== undefined) updateData['settings.theme'] = settings.theme;
      if (settings.language !== undefined) updateData['settings.language'] = settings.language;
      if (settings.notifications) {
        if (settings.notifications.email !== undefined) updateData['settings.notifications.email'] = settings.notifications.email;
        if (settings.notifications.push !== undefined) updateData['settings.notifications.push'] = settings.notifications.push;
        if (settings.notifications.payments !== undefined) updateData['settings.notifications.payments'] = settings.notifications.payments;
        if (settings.notifications.comments !== undefined) updateData['settings.notifications.comments'] = settings.notifications.comments;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      authResult.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 