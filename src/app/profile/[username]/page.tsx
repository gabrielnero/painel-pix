'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FaArrowLeft, 
  FaUser, 
  FaMapMarkerAlt,
  FaLink,
  FaTelegram,
  FaTwitter,
  FaInstagram,
  FaEye,
  FaHeart,
  FaComment,
  FaUserPlus,
  FaUserMinus,
  FaEnvelope,
  FaSpinner,
  FaCalendarAlt,
  FaShieldAlt,
  FaTrophy,
  FaStar
} from 'react-icons/fa';

interface ProfileData {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  isOwnProfile: boolean;
  isFollowing: boolean;
  profile: {
    avatar: string;
    displayName: string;
    bio: string;
    location: string;
    website: string;
    socialLinks: {
      telegram: string;
      twitter: string;
      instagram: string;
    };
    stats: {
      profileViews: number;
      totalTransactions: number;
      reputation: number;
      badges: string[];
    };
  };
  socialStats: {
    followers: number;
    following: number;
  };
  recentComments: Array<{
    _id: string;
    author: {
      username: string;
      profile: {
        avatar: string;
        displayName: string;
      };
    };
    content: string;
    createdAt: string;
    likes: string[];
  }>;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setFollowing(data.profile.isFollowing);
      } else {
        toast.error(data.message || 'Perfil não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/user/follow/${profile._id}`, {
        method: following ? 'DELETE' : 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setFollowing(!following);
        setProfile(prev => prev ? {
          ...prev,
          socialStats: {
            ...prev.socialStats,
            followers: prev.socialStats.followers + (following ? -1 : 1)
          }
        } : null);
        toast.success(following ? 'Deixou de seguir' : 'Agora você está seguindo');
      } else {
        toast.error(data.message || 'Erro ao seguir usuário');
      }
    } catch (error) {
      console.error('Erro ao seguir:', error);
      toast.error('Erro ao seguir usuário');
    }
  };

  const handleComment = async () => {
    if (!profile || !newComment.trim()) return;

    setCommenting(true);
    try {
      const response = await fetch(`/api/user/profile/${profile._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        fetchProfile(); // Recarregar para mostrar novo comentário
        toast.success('Comentário adicionado!');
      } else {
        toast.error(data.message || 'Erro ao comentar');
      }
    } catch (error) {
      console.error('Erro ao comentar:', error);
      toast.error('Erro ao comentar');
    } finally {
      setCommenting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaShieldAlt className="h-4 w-4 text-red-500" />;
      case 'moderator':
        return <FaStar className="h-4 w-4 text-yellow-500" />;
      default:
        return <FaUser className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      default:
        return 'Usuário';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaUser className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Perfil não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            O usuário @{username} não existe ou não está disponível.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Avatar and Basic Info */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mx-auto mb-4">
                  {profile.profile.avatar ? (
                    <img
                      src={profile.profile.avatar}
                      alt={profile.profile.displayName || profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUser className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.profile.displayName || profile.username}
                </h1>
                
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  @{profile.username}
                </p>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {getRoleIcon(profile.role)}
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {getRoleText(profile.role)}
                  </span>
                </div>

                {/* Action Buttons */}
                {!profile.isOwnProfile && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleFollow}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        following
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {following ? <FaUserMinus className="h-4 w-4" /> : <FaUserPlus className="h-4 w-4" />}
                      <span>{following ? 'Seguindo' : 'Seguir'}</span>
                    </button>
                    
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                      <FaEnvelope className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.socialStats.followers}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Seguidores</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.socialStats.following}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Seguindo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.profile.stats.profileViews}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visualizações</p>
                </div>
              </div>

              {/* Bio */}
              {profile.profile.bio && (
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {profile.profile.bio}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="space-y-3 text-sm">
                {profile.profile.location && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <FaMapMarkerAlt className="h-4 w-4" />
                    <span>{profile.profile.location}</span>
                  </div>
                )}
                
                {profile.profile.website && (
                  <div className="flex items-center space-x-2">
                    <FaLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <a
                      href={profile.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {profile.profile.website}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FaCalendarAlt className="h-4 w-4" />
                  <span>Membro desde {formatDate(profile.createdAt)}</span>
                </div>
              </div>

              {/* Social Links */}
              {(profile.profile.socialLinks.telegram || profile.profile.socialLinks.twitter || profile.profile.socialLinks.instagram) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Redes Sociais
                  </h3>
                  <div className="flex space-x-3">
                    {profile.profile.socialLinks.telegram && (
                      <a
                        href={`https://t.me/${profile.profile.socialLinks.telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FaTelegram className="h-4 w-4" />
                      </a>
                    )}
                    {profile.profile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${profile.profile.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        <FaTwitter className="h-4 w-4" />
                      </a>
                    )}
                    {profile.profile.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${profile.profile.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        <FaInstagram className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FaTrophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.profile.stats.reputation}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reputação</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <FaEye className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.profile.stats.totalTransactions}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Transações</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <FaStar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.profile.stats.badges.length}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Badges</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Comentários do Perfil
              </h2>

              {/* Add Comment */}
              {!profile.isOwnProfile && (
                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {newComment.length}/1000 caracteres
                    </span>
                    <button
                      onClick={handleComment}
                      disabled={commenting || !newComment.trim()}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {commenting ? (
                        <FaSpinner className="h-4 w-4 animate-spin" />
                      ) : (
                        <FaComment className="h-4 w-4" />
                      )}
                      <span>{commenting ? 'Enviando...' : 'Comentar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {profile.recentComments.length > 0 ? (
                  profile.recentComments.map((comment) => (
                    <div key={comment._id} className="flex space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {comment.author.profile.avatar ? (
                          <img
                            src={comment.author.profile.avatar}
                            alt={comment.author.profile.displayName || comment.author.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.author.profile.displayName || comment.author.username}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            @{comment.author.username}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                            <FaHeart className="h-3 w-3" />
                            <span className="text-xs">{comment.likes.length}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FaComment className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 