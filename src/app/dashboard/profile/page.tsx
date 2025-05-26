'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaUser, 
  FaKey, 
  FaGift, 
  FaTrophy,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaEdit,
  FaSave,
  FaTimes,
  FaCrown,
  FaMedal,
  FaAward
} from 'react-icons/fa';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  totalEarnings: number;
  inviteCodes: string[];
  rankingPosition: number;
  showInRanking: boolean;
  createdAt: string;
}

interface RankingUser {
  username: string;
  totalEarnings: number;
  position: number;
  isCurrentUser: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPassword, setEditingPassword] = useState(false);
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
    fetchRanking();
  }, []);

  const fetchProfile = async () => {
    try {
      // Mock data - em produção viria da API
      const mockProfile: UserProfile = {
        id: '1',
        username: 'admin',
        email: 'admin@t0p1.com',
        role: 'admin',
        balance: 1250.75,
        totalEarnings: 5420.30,
        inviteCodes: ['HACK2024', 'TOP1INVITE'],
        rankingPosition: 3,
        showInRanking: true,
        createdAt: '2024-01-15T10:30:00Z'
      };
      setProfile(mockProfile);
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    try {
      // Mock data - em produção viria da API
      const mockRanking: RankingUser[] = [
        { username: 'CryptoKing', totalEarnings: 15420.50, position: 1, isCurrentUser: false },
        { username: 'PixMaster', totalEarnings: 12350.25, position: 2, isCurrentUser: false },
        { username: 'admin', totalEarnings: 5420.30, position: 3, isCurrentUser: true },
        { username: 'Usuário desconhecido', totalEarnings: 4200.15, position: 4, isCurrentUser: false },
        { username: 'TopTrader', totalEarnings: 3850.75, position: 5, isCurrentUser: false }
      ];
      setRanking(mockRanking);
    } catch (error) {
      toast.error('Erro ao carregar ranking');
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

    try {
      // Aqui faria a chamada para a API
      toast.success('Senha alterada com sucesso!');
      setEditingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    }
  };

  const toggleRankingVisibility = async () => {
    if (!profile) return;

    try {
      const newVisibility = !profile.showInRanking;
      setProfile({ ...profile, showInRanking: newVisibility });
      toast.success(
        newVisibility 
          ? 'Você agora aparece no ranking público' 
          : 'Você foi removido do ranking público'
      );
    } catch (error) {
      toast.error('Erro ao alterar configuração');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código de convite copiado!');
  };

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <FaCrown className="text-yellow-500" />;
      case 2:
        return <FaMedal className="text-gray-400" />;
      case 3:
        return <FaAward className="text-orange-500" />;
      default:
        return <FaTrophy className="text-blue-500" />;
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { text: 'Administrador', color: 'text-red-600 dark:text-red-400' };
      case 'moderator':
        return { text: 'Moderador', color: 'text-purple-600 dark:text-purple-400' };
      default:
        return { text: 'Usuário', color: 'text-blue-600 dark:text-blue-400' };
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
            <FaUser className="mr-3 text-blue-600" />
            Meu Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie suas informações pessoais e configurações da conta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Perfil */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Informações Básicas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Informações da Conta
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome de Usuário
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {profile.username}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {profile.email}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Conta
                  </label>
                  <div className={`px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-medium ${roleDisplay.color}`}>
                    {roleDisplay.text}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Membro desde
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Alterar Senha */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaKey className="mr-2 text-blue-600" />
                  Segurança
                </h2>
                {!editingPassword && (
                  <button
                    onClick={() => setEditingPassword(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <FaEdit className="mr-2" />
                    Alterar Senha
                  </button>
                )}
              </div>

              {editingPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Digite sua nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Confirme sua nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordChange}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <FaSave className="mr-2" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <FaTimes className="mr-2" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  Mantenha sua conta segura alterando sua senha regularmente.
                </p>
              )}
            </div>

            {/* Códigos de Convite */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FaGift className="mr-2 text-blue-600" />
                Códigos de Convite
              </h2>
              
              {profile.inviteCodes.length > 0 ? (
                <div className="space-y-3">
                  {profile.inviteCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                          {code}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Compartilhe este código para convidar novos usuários
                        </p>
                      </div>
                      <button
                        onClick={() => copyInviteCode(code)}
                        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <FaCopy className="mr-2" />
                        Copiar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  Você não possui códigos de convite no momento.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estatísticas
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Saldo Atual</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {profile.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Ganho</p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    R$ {profile.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaTrophy className="mr-2 text-yellow-500" />
                  Ranking
                </h3>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    {getRankingIcon(profile.rankingPosition)}
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      #{profile.rankingPosition}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Sua posição
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {ranking.slice(0, 5).map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      user.isCurrentUser 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-6 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                        {user.position}
                      </span>
                      <span className="ml-3 text-sm text-gray-900 dark:text-white">
                        {user.username}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      R$ {user.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Aparecer no ranking público
                  </span>
                  <button
                    onClick={toggleRankingVisibility}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profile.showInRanking ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.showInRanking ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {profile.showInRanking 
                    ? 'Seu nome aparece no ranking público' 
                    : 'Você aparece como "Usuário desconhecido"'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 