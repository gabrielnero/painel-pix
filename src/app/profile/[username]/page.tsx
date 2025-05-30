'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaUser, 
  FaMapMarkerAlt,
  FaGlobe,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaCalendarAlt,
  FaEye,
  FaCrown,
  FaComment,
  FaPaperPlane,
  FaSpinner
} from 'react-icons/fa';

interface UserProfile {
  _id: string;
  username: string;
  profilePicture?: string;
  bio: string;
  location: string;
  website: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
  role: string;
  isVip: boolean;
  createdAt: string;
  profileViews: number;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  authorId: {
    username: string;
    profilePicture?: string;
    role: string;
  };
}

interface Stats {
  memberSince: string;
  totalEarnings: number;
  profileViews: number;
  isVip: boolean;
  role: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');

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
        setProfile(data.user);
        setComments(data.comments || []);
        setStats(data.stats);
      } else {
        toast.error(data.message || 'Erro ao carregar perfil');
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Digite um comentário');
      return;
    }

    if (newComment.length > 1000) {
      toast.error('Comentário muito longo (máximo 1000 caracteres)');
      return;
    }

    setCommenting(true);

    try {
      const response = await fetch(`/api/user/profile/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        toast.success('Comentário adicionado com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao adicionar comentário');
      }
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setCommenting(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { text: 'Administrador', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
      case 'moderator':
        return { text: 'Moderador', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' };
      default:
        return { text: 'Usuário', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Perfil não encontrado</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Este usuário não existe ou seu perfil é privado.
          </p>
          <Link 
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const roleDisplay = getRoleDisplay(profile.role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="flex items-center text-sm hover:text-blue-600 transition-colors duration-300 mr-4">
            <FaArrowLeft className="mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mx-auto mb-4">
                  {profile.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUser className="text-4xl text-gray-400" />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
                  {profile.username}
                  {profile.isVip && (
                    <FaCrown className="ml-2 text-yellow-500" title="Usuário VIP" />
                  )}
                </h1>
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleDisplay.bg} ${roleDisplay.color}`}>
                  {roleDisplay.text}
                </span>
              </div>

              {/* Profile Stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Membro desde:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(profile.createdAt)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Visualizações:</span>
                  <span className="text-gray-900 dark:text-white font-medium flex items-center">
                    <FaEye className="mr-1" />
                    {profile.profileViews}
                  </span>
                </div>
                
                {stats && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Ganhos totais:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      R$ {stats.totalEarnings.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio and Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sobre</h2>

              <div className="space-y-4">
                {/* Bio */}
                <div>
                  <p className="text-gray-900 dark:text-white">
                    {profile.bio || 'Este usuário ainda não adicionou uma biografia.'}
                  </p>
                </div>

                {/* Location */}
                {profile.location && (
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-gray-500 mr-2" />
                    <span className="text-gray-900 dark:text-white">{profile.location}</span>
                  </div>
                )}

                {/* Website */}
                {profile.website && (
                  <div className="flex items-center">
                    <FaGlobe className="text-gray-500 mr-2" />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}

                {/* Social Links */}
                <div className="flex space-x-4">
                  {profile.socialLinks?.twitter && (
                    <a 
                      href={`https://twitter.com/${profile.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-500 transition-colors"
                      title="Twitter"
                    >
                      <FaTwitter className="text-xl" />
                    </a>
                  )}
                  {profile.socialLinks?.instagram && (
                    <a 
                      href={`https://instagram.com/${profile.socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 transition-colors"
                      title="Instagram"
                    >
                      <FaInstagram className="text-xl" />
                    </a>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <a 
                      href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="LinkedIn"
                    >
                      <FaLinkedin className="text-xl" />
                    </a>
                  )}
                  {profile.socialLinks?.github && (
                    <a 
                      href={`https://github.com/${profile.socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <FaGithub className="text-xl" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FaComment className="mr-2" />
                Comentários ({comments.length})
              </h2>

              {/* Add Comment */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Deixe um comentário..."
                    maxLength={1000}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={commenting || !newComment.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {commenting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaPaperPlane />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{newComment.length}/1000 caracteres</p>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const commentRoleDisplay = getRoleDisplay(comment.authorId.role);
                    
                    return (
                      <div key={comment._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            {comment.authorId.profilePicture ? (
                              <img 
                                src={comment.authorId.profilePicture} 
                                alt={comment.authorId.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FaUser className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {comment.authorId.username}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${commentRoleDisplay.bg} ${commentRoleDisplay.color}`}>
                                {commentRoleDisplay.text}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-900 dark:text-white">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FaComment className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
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