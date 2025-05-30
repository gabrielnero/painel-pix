'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaUsersCog, 
  FaTicketAlt, 
  FaMoneyBillWave, 
  FaTachometerAlt, 
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fechar a sidebar em telas pequenas quando mudar de rota
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lista de itens do menu
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/admin', icon: <FaTachometerAlt /> },
    { name: 'Usuários', path: '/admin/users', icon: <FaUsersCog /> },
    { name: 'Convites', path: '/admin/invites', icon: <FaTicketAlt /> },
    { name: 'Pagamentos', path: '/admin/payments', icon: <FaMoneyBillWave /> },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar para mobile (overlay) */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-50 block' : 'opacity-0 hidden'
        } lg:hidden`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="absolute inset-0 bg-black"></div>
      </div>

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 bg-gray-900">
            <Link href="/admin" className="text-lg font-bold text-theme-primary">
              Painel Admin
            </Link>
            <button 
              className="p-1 focus:outline-none focus:bg-gray-700 lg:hidden" 
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes size={24} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="px-2 py-4">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path}
                      className={`flex items-center px-4 py-3 text-sm rounded-md ${
                        pathname === item.path 
                          ? 'bg-theme-primary/20 text-theme-primary'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="p-4 border-t border-gray-700">
            <Link 
              href="/logout"
              className="flex items-center px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700"
            >
              <FaSignOutAlt className="mr-3" />
              Sair
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Cabeçalho */}
        <div className="bg-gray-800 shadow h-16 flex items-center justify-between px-6">
          <button 
            className="lg:hidden text-gray-300 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars size={24} />
          </button>
          
          <div className="text-right">
            <Link href="/admin/profile" className="text-theme-primary hover:underline">
              Perfil Admin
            </Link>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="container mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 