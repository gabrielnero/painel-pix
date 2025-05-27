'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUser, FaSearch, FaFilter, FaCrown, FaEye, FaCircle, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  role: 'user' | 'moderator' | 'admin';
  isVip: boolean;
  createdAt: Date;
  lastLogin?: Date;
  profileViews: number;
  isProfilePublic: boolean;
  totalEarnings: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, roleFilter, vipFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(vipFilter !== 'all' && { vip: vipFilter })
      });

      const response = await fetch(`/api/users?${params}`);
      const data: UsersResponse = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 dark:text-red-400';
      case 'moderator':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ADM';
      case 'moderator':
        return 'MOD';
      default:
        return '';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isOnline = (lastLogin?: Date) => {
    if (!lastLogin) return false;
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffInMinutes = (now.getTime() - loginDate.getTime()) / (1000 * 60);
    return diffInMinutes < 5; // Online se fez login nos últimos 5 minutos
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-4">
              <FaArrowLeft className="mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FaUser className="mr-3 text-blue-600" />
            Comunidade
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Conheça todos os membros da nossa plataforma
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FaFilter className="mr-2" />
            Filtros
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar usuário</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome de usuário..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Função</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                <option value="user">Usuário</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">VIP</label>
              <select
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="true">Apenas VIP</option>
                <option value="false">Não VIP</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setVipFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {users.map((user) => (
            <Link
              key={user._id}
              href={`/profile/${user.username}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <FaUser className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status Online */}
                  {isOnline(user.lastLogin) && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                      <FaCircle className="text-white text-xs" />
                    </div>
                  )}
                </div>

                {/* Nome e Role */}
                <div className="mb-3">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <h3 className={`font-semibold ${getRoleColor(user.role)}`}>
                      {user.username}
                    </h3>
                    {user.isVip && (
                      <FaCrown className="text-yellow-500 h-4 w-4" title="VIP" />
                    )}
                  </div>
                  
                  {getRoleBadge(user.role) && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>
                      {getRoleBadge(user.role)}
                    </span>
                  )}
                </div>

                {/* Estatísticas */}
                <div className="w-full space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Visualizações:</span>
                    <span className="font-medium">{user.profileViews}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Ganhos:</span>
                    <span className="font-medium text-green-600">
                      R$ {user.totalEarnings.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Membro desde:</span>
                    <span className="font-medium">{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {/* Botão Ver Perfil */}
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
                    <FaEye className="mr-2" />
                    <span className="text-sm font-medium">Ver Perfil</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="text-gray-600 dark:text-gray-400">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNext}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        )}

        {/* Estado vazio */}
        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaUser className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tente ajustar os filtros de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 