'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaHome,
  FaMoneyBillWave,
  FaHistory,
  FaUser,
  FaPlus,
  FaExclamationTriangle,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTelegram,
  FaLock,
  FaTerminal,
  FaShieldAlt,
  FaImages
} from 'react-icons/fa';
import Shoutbox from '@/components/Shoutbox';
import ActiveUsersWidget from '@/components/ActiveUsersWidget';

interface Photo {
  id: string;
  price: number;
  preview: string;
  isPurchased: boolean;
  filename: string;
  originalName: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userInfo, setUserInfo] = useState({ username: '', role: '' });
  const [userBalance, setUserBalance] = useState(0);
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>([]);

  // Dados de estatísticas
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    paidPayments: 0,
    monthlyGrowth: 0,
    weeklyGrowth: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setHasError(false);
        
        // Verificar autenticação
        const userResponse = await fetch('/api/auth/check');
        
        if (!userResponse.ok) {
          throw new Error(`HTTP ${userResponse.status}: ${userResponse.statusText}`);
        }
        
        const userData = await userResponse.json();
        
        if (!userData.success) {
          setErrorMessage(`Erro de autenticação: ${userData.message || 'Dados inválidos'}`);
          setHasError(true);
          return;
        }

        setUserInfo({
          username: userData.user?.username || 'Usuário',
          role: userData.user?.role || 'user'
        });

        // Buscar saldo
        try {
          const balanceResponse = await fetch('/api/user/balance');
          const balanceData = await balanceResponse.json();
          
          if (balanceData.success) {
            setUserBalance(balanceData.balance);
          }
        } catch (balanceError) {
          console.error('Erro ao carregar saldo:', balanceError);
        }

        // Buscar estatísticas
        try {
          const statsResponse = await fetch('/api/user/stats');
          const statsData = await statsResponse.json();
          
          if (statsData.success) {
            setStats(statsData.stats);
          } else {
            setStats({
              totalPayments: 0,
              totalAmount: 0,
              pendingPayments: 0,
              paidPayments: 0,
              monthlyGrowth: 0,
              weeklyGrowth: 0
            });
          }
        } catch (statsError) {
          console.error('Erro ao carregar estatísticas:', statsError);
        }

        // Buscar preview das fotos
        try {
          const photosResponse = await fetch('/api/photos?limit=4');
          const photosData = await photosResponse.json();
          
          if (photosData.success) {
            const mappedPhotos = photosData.photos.slice(0, 4).map((photo: any) => ({
              id: photo.id,
              price: photo.price,
              preview: `/api/photos/${photo.id}/preview`,
              isPurchased: photo.isPurchased,
              filename: photo.filename,
              originalName: photo.originalName
            }));
            setPreviewPhotos(mappedPhotos);
          }
        } catch (photosError) {
          console.error('Erro ao carregar preview das fotos:', photosError);
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setErrorMessage(`Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-6">
            <FaTerminal className="text-4xl text-green-400 mx-auto mb-4 animate-pulse" />
            <div className="bg-black/50 p-3 rounded border border-green-500/20 mb-4">
              <pre className="text-green-400 text-sm">
                root@t0p1:~$ ./dashboard.sh{'\n'}
                [<span className="animate-pulse">▓</span>] Carregando módulos...
              </pre>
            </div>
            <p className="text-green-400 text-xs uppercase tracking-wide">
              INICIALIZANDO SISTEMA
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center bg-gray-900/90 backdrop-blur border border-red-500/30 rounded-lg p-8 shadow-2xl max-w-md">
          <FaExclamationTriangle className="h-12 w-12 text-red-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-red-400 mb-2 uppercase tracking-wide">ERRO CRÍTICO</h2>
          <div className="bg-black/50 p-3 rounded border border-red-500/20 mb-4">
            <pre className="text-red-400 text-xs whitespace-pre-wrap">
              [ERROR] {errorMessage}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-black font-bold py-2 px-4 rounded transition-all duration-300 border border-red-500/50 text-sm uppercase tracking-wide"
          >
            🔄 REINICIAR SISTEMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-8">
        {/* Header Terminal */}
        <div className="mb-8">
          <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
              <span className="ml-3 text-green-400 text-xs">t0p1-dashboard v2.1 | user: {userInfo.username}</span>
            </div>
            <div className="bg-black/50 p-3 rounded border border-green-500/20">
              <pre className="text-green-400 text-sm">
                root@t0p1:~$ ./dashboard.sh --user={userInfo.username} --role={userInfo.role}{'\n'}
                [✓] Sistema carregado com sucesso{'\n'}
                [✓] Módulos de pagamento ativos{'\n'}
                [✓] Conexão segura estabelecida
              </pre>
            </div>
          </div>

          <div className="text-center mb-6">
            <FaShieldAlt className="text-4xl text-green-400 mx-auto mb-2 animate-pulse" />
            <h1 className="text-3xl font-bold text-green-400 mb-2 tracking-wider uppercase">
              DASHBOARD t0p<span className="text-orange-400">.1</span>
            </h1>
            <p className="text-green-300 text-sm uppercase tracking-wide">
              TERMINAL DE CONTROLE | USER: {userInfo.username}
            </p>
          </div>
        </div>

        {/* Banner do Telegram - Estilo Terminal */}
        <div className="bg-gray-900/90 backdrop-blur border border-blue-500/30 rounded-lg p-4 mb-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                <FaTelegram className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-400 mb-2 uppercase tracking-wide">
                  📡 CANAL DE COMUNICAÇÃO
                </h3>
                <p className="text-blue-300 mb-4 text-sm">
                  Junte-se ao nosso canal oficial no Telegram para receber atualizações em tempo real, 
                  suporte técnico e notificações importantes do sistema.
                </p>
                <a 
                  href="https://t.me/seu_canal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all duration-300 text-sm uppercase tracking-wide"
                >
                  <FaTelegram className="mr-2" />
                  ENTRAR NO CANAL
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas - Estilo Terminal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Pagamentos */}
          <div className="bg-gray-900/90 backdrop-blur border border-blue-500/30 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-300 uppercase tracking-wide">TOTAL PAYMENTS</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">{stats.totalPayments}</p>
              </div>
              <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded">
                <FaChartLine className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></span>
              <span className="text-xs text-blue-300 uppercase">ACTIVE</span>
            </div>
          </div>

          {/* Valor Total */}
          <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-300 uppercase tracking-wide">TOTAL AMOUNT</p>
                <p className="text-2xl font-bold text-green-400 font-mono">R$ {stats.totalAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded">
                <FaMoneyBillWave className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
              <span className="text-xs text-green-300 uppercase">VERIFIED</span>
            </div>
          </div>

          {/* Pagamentos Pendentes */}
          <div className="bg-gray-900/90 backdrop-blur border border-yellow-500/30 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-yellow-300 uppercase tracking-wide">PENDING</p>
                <p className="text-2xl font-bold text-yellow-400 font-mono">{stats.pendingPayments}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded">
                <FaClock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></span>
              <span className="text-xs text-yellow-300 uppercase">PROCESSING</span>
            </div>
          </div>

          {/* Pagamentos Confirmados */}
          <div className="bg-gray-900/90 backdrop-blur border border-emerald-500/30 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">CONFIRMED</p>
                <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.paidPayments}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded">
                <FaCheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></span>
              <span className="text-xs text-emerald-300 uppercase">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Navegação Principal - Estilo Terminal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/dashboard/generate-pix"
            className="bg-gray-900/90 backdrop-blur border border-blue-500/30 rounded-lg p-6 hover:border-blue-400 transition-all shadow-lg group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded group-hover:bg-blue-500/30 transition-all">
                <FaPlus className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-blue-400 uppercase tracking-wide">GERAR PIX</h3>
                <p className="text-xs text-blue-300 uppercase">CREATE PAYMENT</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/wallet"
            className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-6 hover:border-green-400 transition-all shadow-lg group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded group-hover:bg-green-500/30 transition-all">
                <FaMoneyBillWave className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-green-400 uppercase tracking-wide">CARTEIRA</h3>
                <p className="text-xs text-green-300 uppercase">R$ {userBalance.toFixed(2)}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/history"
            className="bg-gray-900/90 backdrop-blur border border-orange-500/30 rounded-lg p-6 hover:border-orange-400 transition-all shadow-lg group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-orange-500/20 border border-orange-500/50 rounded group-hover:bg-orange-500/30 transition-all">
                <FaHistory className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-orange-400 uppercase tracking-wide">HISTÓRICO</h3>
                <p className="text-xs text-orange-300 uppercase">{stats.totalPayments} LOGS</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/profile"
            className="bg-gray-900/90 backdrop-blur border border-purple-500/30 rounded-lg p-6 hover:border-purple-400 transition-all shadow-lg group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded group-hover:bg-purple-500/30 transition-all">
                <FaUser className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-purple-400 uppercase tracking-wide">PERFIL</h3>
                <p className="text-xs text-purple-300 uppercase">{userInfo.role}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Layout em 3 colunas - Estilo Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Galeria de Selfies - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/90 backdrop-blur border border-pink-500/30 rounded-lg p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-pink-400 uppercase tracking-wide">📸 PHOTO GALLERY</h2>
                <Link 
                  href="/dashboard/photos"
                  className="text-sm text-pink-400 hover:text-pink-300 font-bold uppercase tracking-wide border border-pink-500/50 px-3 py-1 rounded transition-all"
                >
                  ACCESS ALL →
                </Link>
              </div>
              
              {previewPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {previewPhotos.map((photo) => (
                    <div key={photo.id} className="aspect-square relative overflow-hidden rounded border border-gray-600">
                      <img 
                        src={photo.preview}
                        alt={photo.originalName || photo.filename}
                        className={`w-full h-full object-cover ${photo.isPurchased ? 'filter-none' : 'filter blur-sm'}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {!photo.isPurchased && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center border border-green-500/30">
                          <div className="text-center text-green-400">
                            <FaLock className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                            <span className="text-sm font-bold font-mono">R$ {photo.price.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaImages className="mx-auto text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-400 uppercase tracking-wide">NENHUMA FOTO DISPONÍVEL</p>
                  <p className="text-sm text-gray-500 mt-2 uppercase">
                    AGUARDE O ADMIN CARREGAR FOTOS
                  </p>
                </div>
              )}
              
              <p className="text-sm text-pink-300 text-center uppercase tracking-wide">
                ENCRYPTED PHOTO COLLECTION | PREMIUM ACCESS
              </p>
            </div>

            {/* Shoutbox - Estilo Terminal */}
            <div className="bg-gray-900/90 backdrop-blur border border-cyan-500/30 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wide">💬 GLOBAL CHAT</h3>
              <Shoutbox />
            </div>
          </div>

          {/* Sidebar - 1 coluna - Estilo Terminal */}
          <div className="space-y-6">
            {/* Usuários Online */}
            <div className="bg-gray-900/90 backdrop-blur border border-emerald-500/30 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-bold text-emerald-400 mb-4 uppercase tracking-wide">👥 ONLINE USERS</h3>
              <ActiveUsersWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 