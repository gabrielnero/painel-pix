'use client';

import { Badge, getBadgeRarityColor } from '@/lib/badges';

interface BadgeDisplayProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function BadgeDisplay({ 
  badges, 
  maxDisplay = 5, 
  size = 'md',
  showTooltip = true 
}: BadgeDisplayProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  if (badges.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        Nenhum badge conquistado ainda
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {displayBadges.map((badge) => {
        const IconComponent = badge.icon;
        const rarityBorder = getBadgeRarityColor(badge.rarity);
        
        return (
          <div
            key={badge.id}
            className={`
              relative group flex items-center justify-center rounded-full border-2 
              ${sizeClasses[size]} ${badge.bgColor} ${rarityBorder}
              transition-transform hover:scale-110 cursor-pointer
            `}
            title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
          >
            <IconComponent className={`${badge.color}`} />
            
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                <div className="font-semibold">{badge.name}</div>
                <div className="text-gray-300">{badge.description}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            )}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div className={`
          flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 
          text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600
          ${sizeClasses[size]} font-semibold
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
} 