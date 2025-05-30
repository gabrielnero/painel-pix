import { FaCrown, FaFire, FaStar, FaGem, FaRocket, FaHeart, FaComments, FaEye, FaCalendarAlt, FaTrophy } from 'react-icons/fa';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  requirement: {
    type: 'earnings' | 'days' | 'comments' | 'profile_views' | 'payments' | 'special';
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGES: Badge[] = [
  // Badges de ganhos
  {
    id: 'first_earning',
    name: 'Primeiro Ganho',
    description: 'Ganhou seus primeiros R$ 1,00',
    icon: FaStar,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    requirement: { type: 'earnings', value: 1 },
    rarity: 'common'
  },
  {
    id: 'big_earner',
    name: 'Grande Ganhador',
    description: 'Ganhou mais de R$ 100,00',
    icon: FaGem,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    requirement: { type: 'earnings', value: 100 },
    rarity: 'rare'
  },
  {
    id: 'millionaire',
    name: 'Milionário',
    description: 'Ganhou mais de R$ 1.000,00',
    icon: FaCrown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    requirement: { type: 'earnings', value: 1000 },
    rarity: 'legendary'
  },

  // Badges de tempo
  {
    id: 'veteran',
    name: 'Veterano',
    description: 'Membro há mais de 30 dias',
    icon: FaCalendarAlt,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    requirement: { type: 'days', value: 30 },
    rarity: 'common'
  },
  {
    id: 'old_timer',
    name: 'Veterano Experiente',
    description: 'Membro há mais de 365 dias',
    icon: FaTrophy,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    requirement: { type: 'days', value: 365 },
    rarity: 'epic'
  },

  // Badges sociais
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    description: 'Fez mais de 10 comentários',
    icon: FaComments,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    requirement: { type: 'comments', value: 10 },
    rarity: 'common'
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Perfil visualizado mais de 100 vezes',
    icon: FaEye,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    requirement: { type: 'profile_views', value: 100 },
    rarity: 'rare'
  },
  {
    id: 'influencer',
    name: 'Influenciador',
    description: 'Perfil visualizado mais de 1000 vezes',
    icon: FaFire,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    requirement: { type: 'profile_views', value: 1000 },
    rarity: 'legendary'
  },

  // Badges de atividade
  {
    id: 'active_user',
    name: 'Usuário Ativo',
    description: 'Fez mais de 10 pagamentos',
    icon: FaRocket,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    requirement: { type: 'payments', value: 10 },
    rarity: 'common'
  },
  {
    id: 'power_user',
    name: 'Super Usuário',
    description: 'Fez mais de 100 pagamentos',
    icon: FaHeart,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    requirement: { type: 'payments', value: 100 },
    rarity: 'epic'
  }
];

export function calculateUserBadges(userStats: {
  totalEarnings: number;
  memberSince: Date;
  profileViews: number;
  totalPayments: number;
  totalComments: number;
}): Badge[] {
  const earnedBadges: Badge[] = [];
  const daysSinceMember = Math.floor((Date.now() - userStats.memberSince.getTime()) / (1000 * 60 * 60 * 24));

  for (const badge of BADGES) {
    let hasEarned = false;

    switch (badge.requirement.type) {
      case 'earnings':
        hasEarned = userStats.totalEarnings >= badge.requirement.value;
        break;
      case 'days':
        hasEarned = daysSinceMember >= badge.requirement.value;
        break;
      case 'profile_views':
        hasEarned = userStats.profileViews >= badge.requirement.value;
        break;
      case 'payments':
        hasEarned = userStats.totalPayments >= badge.requirement.value;
        break;
      case 'comments':
        hasEarned = userStats.totalComments >= badge.requirement.value;
        break;
    }

    if (hasEarned) {
      earnedBadges.push(badge);
    }
  }

  return earnedBadges;
}

export function getBadgeRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'border-gray-300 dark:border-gray-600';
    case 'rare':
      return 'border-blue-400 dark:border-blue-500';
    case 'epic':
      return 'border-purple-400 dark:border-purple-500';
    case 'legendary':
      return 'border-yellow-400 dark:border-yellow-500';
    default:
      return 'border-gray-300 dark:border-gray-600';
  }
} 