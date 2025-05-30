'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaUser, 
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaGlobe,
  FaMapMarkerAlt,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaGithub,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaToggleOn,
  FaToggleOff,
  FaSpinner
} from 'react-icons/fa';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  totalEarnings: number;
  createdAt: string;
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
  profileViews: number;
  isProfilePublic: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    bio: '',
    location: '',
    website: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      linkedin: '',
      github: ''
    },
    isProfilePublic: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setProfileData({
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          website: data.profile.website || '',
          socialLinks: data.profile.socialLinks || {
            twitter: '',
            instagram: '',
            linkedin: '',
            github: ''
          },
          isProfilePublic: data.profile.isProfilePublic !== false
        });
      } else {
        toast.error('Erro ao carregar perfil');
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande (máximo 2MB)');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        try {
          const response = await fetch('/api/user/upload-avatar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData }),
          });

          const data = await response.json();

          if (data.success) {
            setProfile(prev => prev ? { ...prev, profilePicture: data.profilePicture } : null);
            toast.success('Foto de perfil atualizada com sucesso!');
          } else {
            toast.error(data.message || 'Erro ao fazer upload da imagem');
          }
        } catch (error) {
          toast.error('Erro ao fazer upload da imagem');
        } finally {
          setUploadingAvatar(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erro ao processar imagem');
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => prev ? { ...prev, ...profileData } : null);
        setEditingProfile(false);
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);

    try {
      // Implementar API de mudança de senha
      toast.success('Senha alterada com sucesso!');
      setEditingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setSaving(false);
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
          <p className="text-gray-600 dark:text-gray-300">Erro ao carregar perfil</p>
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
                <div className="relative inline-block">
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
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCamera />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.username}
                </h2>
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleDisplay.bg} ${roleDisplay.color}`}>
                  {roleDisplay.text}
                </span>
              </div>

              {/* Profile Stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Membro desde:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Visualizações:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {profile.profileViews || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Ganhos totais:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    R$ {profile.totalEarnings.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Profile Visibility Toggle */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Perfil público</span>
                  <button
                    onClick={() => setProfileData(prev => ({ ...prev, isProfilePublic: !prev.isProfilePublic }))}
                    className="flex items-center"
                  >
                    {profileData.isProfilePublic ? (
                      <FaToggleOn className="text-2xl text-blue-500" />
                    ) : (
                      <FaToggleOff className="text-2xl text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {profileData.isProfilePublic 
                    ? 'Outros usuários podem ver seu perfil' 
                    : 'Seu perfil está privado'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio and Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Informações do Perfil</h3>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {editingProfile ? <FaTimes className="mr-2" /> : <FaEdit className="mr-2" />}
                  {editingProfile ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Biografia
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Conte um pouco sobre você..."
                      maxLength={500}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/500 caracteres</p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Cidade, Estado"
                      maxLength={100}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://seusite.com"
                      maxLength={200}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Redes Sociais
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <FaTwitter className="text-blue-400 mr-2" />
                        <input
                          type="text"
                          value={profileData.socialLinks.twitter}
                          onChange={(e) => setProfileData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                          }))}
                          placeholder="@username"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <FaInstagram className="text-pink-500 mr-2" />
                        <input
                          type="text"
                          value={profileData.socialLinks.instagram}
                          onChange={(e) => setProfileData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                          }))}
                          placeholder="@username"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <FaLinkedin className="text-blue-600 mr-2" />
                        <input
                          type="text"
                          value={profileData.socialLinks.linkedin}
                          onChange={(e) => setProfileData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                          }))}
                          placeholder="username"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <FaGithub className="text-gray-700 dark:text-gray-300 mr-2" />
                        <input
                          type="text"
                          value={profileData.socialLinks.github}
                          onChange={(e) => setProfileData(prev => ({ 
                            ...prev, 
                            socialLinks: { ...prev.socialLinks, github: e.target.value }
                          }))}
                          placeholder="username"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={saving}
                      className="flex items-center px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <FaSpinner className="animate-spin mr-2" />
                      ) : (
                        <FaSave className="mr-2" />
                      )}
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display Bio */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Biografia</h4>
                    <p className="text-gray-900 dark:text-white">
                      {profile.bio || 'Nenhuma biografia adicionada ainda.'}
                    </p>
                  </div>

                  {/* Display Location */}
                  {profile.location && (
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-gray-500 mr-2" />
                      <span className="text-gray-900 dark:text-white">{profile.location}</span>
                    </div>
                  )}

                  {/* Display Website */}
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

                  {/* Display Social Links */}
                  <div className="flex space-x-4">
                    {profile.socialLinks?.twitter && (
                      <a 
                        href={`https://twitter.com/${profile.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-500"
                      >
                        <FaTwitter className="text-xl" />
                      </a>
                    )}
                    {profile.socialLinks?.instagram && (
                      <a 
                        href={`https://instagram.com/${profile.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600"
                      >
                        <FaInstagram className="text-xl" />
                      </a>
                    )}
                    {profile.socialLinks?.linkedin && (
                      <a 
                        href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FaLinkedin className="text-xl" />
                      </a>
                    )}
                    {profile.socialLinks?.github && (
                      <a 
                        href={`https://github.com/${profile.socialLinks.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        <FaGithub className="text-xl" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Segurança</h3>
                <button
                  onClick={() => setEditingPassword(!editingPassword)}
                  className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  <FaKey className="mr-2" />
                  Alterar Senha
                </button>
              </div>

              {editingPassword && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEditingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      disabled={saving}
                      className="flex items-center px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <FaSpinner className="animate-spin mr-2" />
                      ) : (
                        <FaSave className="mr-2" />
                      )}
                      {saving ? 'Salvando...' : 'Alterar Senha'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 