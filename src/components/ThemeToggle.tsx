'use client';

import { useState } from 'react';
import { FaSun, FaMoon, FaCog } from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Configurações de tema"
      >
        <FaCog className="h-5 w-5" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              Tema
            </div>
            
            <button
              onClick={() => toggleTheme('light')}
              className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                theme === 'light' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <FaSun className="mr-3 h-4 w-4" />
              Modo Claro
            </button>
            
            <button
              onClick={() => toggleTheme('dark')}
              className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <FaMoon className="mr-3 h-4 w-4" />
              Modo Escuro
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 