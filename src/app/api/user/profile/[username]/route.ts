import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, ProfileComment } from '@/lib/models';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Visualizar perfil de usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    await connectToDatabase();
    
    const { username } = params;
    
    // Buscar usuário pelo username
    const user = await User.findOne({ username }).select('-password -email');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o perfil é público
    if (!user.isProfilePublic) {
      return NextResponse.json(
        { success: false, message: 'Este perfil é privado' },
        { status: 403 }
      );
    }

    // Incrementar visualizações do perfil
    await User.findByIdAndUpdate(user._id, { 
      $inc: { profileViews: 1 } 
    });

    // Buscar comentários do perfil
    const comments = await ProfileComment.find({ profileUserId: user._id })
      .populate('authorId', 'username profilePicture role')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calcular estatísticas do usuário
    const stats = {
      memberSince: user.createdAt,
      totalEarnings: user.totalEarnings,
      profileViews: user.profileViews + 1,
      isVip: user.isVip,
      role: user.role
    };

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks,
        role: user.role,
        isVip: user.isVip,
        createdAt: user.createdAt,
        profileViews: user.profileViews + 1
      },
      comments,
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar comentário no perfil
export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
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
    
    const { username } = params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, message: 'Comentário muito longo (máximo 1000 caracteres)' },
        { status: 400 }
      );
    }

    // Buscar usuário do perfil
    const profileUser = await User.findOne({ username });
    
    if (!profileUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!profileUser.isProfilePublic) {
      return NextResponse.json(
        { success: false, message: 'Este perfil é privado' },
        { status: 403 }
      );
    }

    // Criar comentário
    const comment = new ProfileComment({
      profileUserId: profileUser._id,
      authorId: authResult.userId,
      content: content.trim()
    });

    await comment.save();

    // Buscar comentário com dados do autor
    const populatedComment = await ProfileComment.findById(comment._id)
      .populate('authorId', 'username profilePicture role');

    return NextResponse.json({
      success: true,
      comment: populatedComment,
      message: 'Comentário adicionado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 