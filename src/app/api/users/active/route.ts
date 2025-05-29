import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models';

export const dynamic = 'force-dynamic';

// GET - Buscar usuários ativos
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Considerar usuários online se fizeram login nas últimas 5 minutos
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000);
    
    // Considerar usuários recentemente ativos se fizeram login nas últimas 24 horas
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Buscar usuários ativos (não banidos)
    const activeUsers = await User.find({ 
      banned: false,
      lastLogin: { $exists: true, $gte: recentThreshold }
    })
      .select('username profilePicture role isVip lastLogin')
      .sort({ lastLogin: -1 })
      .limit(limit)
      .lean();
    
    // Classificar usuários como online ou recentemente ativos
    const usersWithStatus = activeUsers.map(user => ({
      ...user,
      isOnline: user.lastLogin && new Date(user.lastLogin) >= onlineThreshold,
      lastSeen: user.lastLogin
    }));
    
    return NextResponse.json({
      success: true,
      users: usersWithStatus,
      onlineCount: usersWithStatus.filter(u => u.isOnline).length
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários ativos:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 