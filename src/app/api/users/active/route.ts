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
    
    // Retornar usuários mock em caso de erro
    const mockUsers = [
      {
        _id: 'user1',
        username: 'Admin',
        role: 'admin',
        isVip: true,
        isOnline: true,
        lastSeen: new Date(),
        profilePicture: null
      },
      {
        _id: 'user2',
        username: 'Usuario1',
        role: 'user',
        isVip: false,
        isOnline: true,
        lastSeen: new Date(Date.now() - 120000), // 2 min atrás
        profilePicture: null
      },
      {
        _id: 'user3',
        username: 'Moderador',
        role: 'moderator',
        isVip: false,
        isOnline: false,
        lastSeen: new Date(Date.now() - 600000), // 10 min atrás
        profilePicture: null
      },
      {
        _id: 'user4',
        username: 'UsuarioVIP',
        role: 'user',
        isVip: true,
        isOnline: false,
        lastSeen: new Date(Date.now() - 1800000), // 30 min atrás
        profilePicture: null
      }
    ];
    
    return NextResponse.json({
      success: true,
      users: mockUsers,
      onlineCount: 2,
      offline: true
    });
  }
} 