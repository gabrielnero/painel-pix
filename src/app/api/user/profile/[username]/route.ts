import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User, Follow, ProfileComment } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    await connectToDatabase();

    const { username } = params;
    
    // Buscar usuário pelo username
    const user: any = await User.findOne({ username }).select('-password').lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário está logado para mostrar informações adicionais
    let isOwnProfile = false;
    let isFollowing = false;
    let canViewPrivateInfo = false;

    const authResult = await verifyAuth(request);
    if (authResult.success) {
      isOwnProfile = authResult.userId === user._id.toString();
      
      if (!isOwnProfile) {
        // Verificar se está seguindo
        const followRelation = await Follow.findOne({
          follower: authResult.userId,
          following: user._id
        });
        isFollowing = !!followRelation;
        
        // Incrementar visualizações do perfil (apenas se não for o próprio perfil)
        await User.findByIdAndUpdate(user._id, {
          $inc: { 'profile.stats.profileViews': 1 }
        });
      } else {
        canViewPrivateInfo = true;
      }
    }

    // Buscar estatísticas de seguidores
    const followersCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    // Buscar comentários recentes no perfil (se permitido)
    let recentComments: any[] = [];
    if (user.profile?.privacy?.allowComments !== false) {
      recentComments = await ProfileComment.find({ 
        profileOwner: user._id,
        isPublic: true 
      })
        .populate('author', 'username profile.avatar profile.displayName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    // Preparar dados do perfil
    const profileData = {
      _id: user._id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isOwnProfile,
      isFollowing,
      
      profile: {
        avatar: user.profile?.avatar || '',
        displayName: user.profile?.displayName || user.username,
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        website: user.profile?.website || '',
        socialLinks: user.profile?.socialLinks || {},
        stats: {
          profileViews: user.profile?.stats?.profileViews || 0,
          totalTransactions: user.profile?.stats?.totalTransactions || 0,
          reputation: user.profile?.stats?.reputation || 0,
          badges: user.profile?.stats?.badges || []
        }
      },
      
      socialStats: {
        followers: followersCount,
        following: followingCount
      },
      
      recentComments,
      
      // Informações privadas (apenas para o próprio usuário)
      ...(canViewPrivateInfo && {
        email: user.email,
        balance: user.balance,
        settings: user.settings,
        privacy: user.profile?.privacy
      })
    };

    // Remover informações privadas baseado nas configurações de privacidade
    if (!canViewPrivateInfo && user.profile?.privacy) {
      if (!user.profile.privacy.showEmail) {
        delete (profileData as any).email;
      }
      if (!user.profile.privacy.showBalance) {
        delete (profileData as any).balance;
      }
    }

    return NextResponse.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 