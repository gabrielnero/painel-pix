'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaImages, 
  FaLock,
  FaDownload,
  FaHeart,
  FaEye,
  FaFilter,
  FaSearch,
  FaBitcoin,
  FaTerminal,
  FaShieldAlt,
  FaWallet,
  FaServer,
  FaKey
} from 'react-icons/fa';

interface Photo {
  id: string;
  price: number; // Preço em BRL
  preview?: string;
  fullImage?: string;
  isPurchased: boolean;
  likes: number;
  views: number;
  category: string;
  ageCategory: string;
  uploadedAt: string;
  filename: string;
  originalName: string;
}

export default function PhotoGalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('Todas');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  const ageCategories = ['Todas', '18-25 anos', '26-35 anos', '36-45 anos', '46+ anos'];
  const categories = ['all', 'SELFIE'];

  useEffect(() => {
    loadPhotos();
    loadUserBalance();
  }, [selectedCategory, selectedAgeCategory]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory === 'all' ? 'all' : selectedCategory,
        ageCategory: selectedAgeCategory === 'Todas' ? 'all' : selectedAgeCategory,
        page: '1',
        limit: '20'
      });

      const response = await fetch(`/api/photos?${params}`);
      const data = await response.json();

      if (data.success) {
        // Mapear os dados para o formato esperado
        const mappedPhotos = data.photos.map((photo: any) => ({
          id: photo.id,
          price: photo.price, // Já em reais
          preview: `/api/photos/${photo.id}/preview`, // URL para preview
          isPurchased: photo.isPurchased,
          likes: photo.likes,
          views: photo.views,
          category: photo.category,
          ageCategory: photo.ageCategory,
          uploadedAt: photo.uploadedAt,
          filename: photo.filename,
          originalName: photo.originalName
        }));
        setPhotos(mappedPhotos);
      } else {
        toast.error(data.message || 'Erro ao carregar fotos');
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
      toast.error('Erro ao carregar galeria');
      // Se não há fotos no banco, mostrar lista vazia
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const response = await fetch('/api/user/balance');
      const data = await response.json();
      
      if (data.success) {
        setUserBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const categoryMatch = selectedCategory === 'all' || photo.category === selectedCategory;
    const ageMatch = selectedAgeCategory === 'Todas' || photo.ageCategory === selectedAgeCategory;
    return categoryMatch && ageMatch;
  });

  const purchasePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    if (userBalance < photo.price) {
      toast.error(`Saldo insuficiente. Você precisa de R$ ${photo.price.toFixed(2)}`);
      return;
    }

    setPurchasing(photoId);
    try {
      const response = await fetch('/api/photos/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar foto como comprada
        setPhotos(prev => prev.map(p => 
          p.id === photoId ? { ...p, isPurchased: true } : p
        ));

        // Atualizar saldo
        setUserBalance(prev => prev - photo.price);

        toast.success(`🔓 Foto desbloqueada por R$ ${photo.price.toFixed(2)}!`);
      } else {
        toast.error(data.message || 'Erro ao processar pagamento');
      }
    } catch (error) {
      toast.error('Erro ao processar pagamento');
    } finally {
      setPurchasing(null);
    }
  };

  const downloadPhoto = async (photo: Photo) => {
    if (!photo.isPurchased) {
      toast.error('🔒 Acesso negado - Foto não foi comprada');
      return;
    }
    
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = photo.originalName || photo.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`📥 Download autorizado: ${photo.filename}`);
      } else {
        toast.error('Erro ao baixar foto');
      }
    } catch (error) {
      toast.error('Erro ao baixar foto');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-4 md:p-6">
            <FaServer className="text-3xl md:text-4xl text-green-400 mx-auto mb-4 animate-pulse" />
            <div className="bg-black/50 p-3 rounded border border-green-500/20 mb-4">
              <pre className="text-green-400 text-xs md:text-sm">
                root@t0p1:~$ ./photos.sh{'\n'}
                [<span className="animate-pulse">▓</span>] Carregando galeria...{'\n'}
                [<span className="animate-pulse">▓</span>] Verificando acesso...
              </pre>
            </div>
            <p className="text-green-400 text-xs uppercase tracking-wide">
              ACESSANDO BASE DE DADOS
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-green-400 font-mono">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header Terminal */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-900/90 backdrop-blur border border-pink-500/30 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
              <span className="ml-3 text-pink-400 text-xs hidden md:block">photo-gallery v3.0 | pix-enabled</span>
            </div>
            <div className="bg-black/50 p-2 md:p-3 rounded border border-pink-500/20">
              <pre className="text-pink-400 text-xs md:text-sm">
                root@t0p1:~$ ./gallery.sh --mode=exclusive --payment=pix{'\n'}
                [✓] Galeria premium carregada{'\n'}
                [✓] Sistema de pagamento PIX ativo{'\n'}
                [✓] {filteredPhotos.length} fotos disponíveis
              </pre>
            </div>
          </div>

          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
            <Link 
              href="/dashboard" 
              className="flex items-center text-green-400 hover:text-green-300 transition-colors duration-300 border border-green-500/50 px-3 py-2 rounded bg-gray-900/50 backdrop-blur w-fit"
            >
              <FaArrowLeft className="mr-2" />
              <span className="text-sm">VOLTAR DASHBOARD</span>
            </Link>
            
            <div className="text-center">
              <FaShieldAlt className="text-3xl md:text-4xl text-pink-400 mx-auto mb-2 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-bold text-pink-400 mb-2 tracking-wider uppercase">
                PHOTO GALLERY t0p<span className="text-orange-400">.1</span>
              </h1>
              <p className="text-pink-300 text-xs md:text-sm uppercase tracking-wide">
                EXCLUSIVE PIX ACCESS | ENCRYPTED CONTENT
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg px-3 py-2">
                <div className="flex items-center">
                  <FaWallet className="text-green-400 mr-2" />
                  <span className="text-green-400 font-bold text-sm md:text-base">R$ {userBalance.toFixed(2)}</span>
                </div>
                <p className="text-xs text-green-300 uppercase">SALDO PIX</p>
              </div>
            </div>
          </div>
        </div>

        {/* PIX Payment Notice */}
        <div className="bg-gray-900/90 backdrop-blur border border-green-500/30 rounded-lg p-4 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-start space-y-3 md:space-y-0 md:space-x-3">
            <FaWallet className="text-green-400 text-xl md:text-2xl mt-1 mx-auto md:mx-0" />
            <div className="text-center md:text-left">
              <h3 className="font-bold text-green-400 mb-2 uppercase tracking-wide">
                🔒 PAGAMENTO VIA PIX
              </h3>
              <p className="text-green-300 text-sm mb-2">
                Esta galeria aceita pagamentos via PIX. Preço fixo: R$ 20,00 por foto.
              </p>
              <p className="text-green-200 text-xs uppercase tracking-wide">
                SEGURANÇA GARANTIDA | PROCESSAMENTO INSTANTÂNEO
              </p>
            </div>
          </div>
        </div>

        {/* Filtros - Estilo Terminal */}
        <div className="bg-gray-900/90 backdrop-blur border border-cyan-500/30 rounded-lg p-4 md:p-6 mb-6 shadow-lg">
          <h2 className="text-base md:text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wide flex items-center">
            <FaFilter className="mr-2" />
            SYSTEM FILTERS
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wide">CATEGORIA</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded border transition-all font-bold text-xs uppercase tracking-wide ${
                      selectedCategory === category
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                        : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'
                    }`}
                  >
                    {category === 'all' ? 'TODAS' : category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wide">FAIXA ETÁRIA</h3>
              <div className="flex flex-wrap gap-2">
                {ageCategories.map(ageCategory => (
                  <button
                    key={ageCategory}
                    onClick={() => setSelectedAgeCategory(ageCategory)}
                    className={`px-3 py-2 rounded border transition-all font-bold text-xs uppercase tracking-wide ${
                      selectedAgeCategory === ageCategory
                        ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                        : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-300'
                    }`}
                  >
                    {ageCategory.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Fotos - Estilo Terminal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPhotos.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <FaImages className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-400 uppercase tracking-wide">NENHUMA FOTO ENCONTRADA</p>
              <p className="text-sm text-gray-500 mt-2 uppercase">
                {photos.length === 0 ? 'AGUARDE O ADMIN CARREGAR FOTOS' : 'AJUSTE OS FILTROS DO SISTEMA'}
              </p>
            </div>
          ) : (
            filteredPhotos.map((photo) => {
              const isAffordable = userBalance >= photo.price;
              
              return (
                <div
                  key={photo.id}
                  className="bg-gray-900/90 backdrop-blur border border-gray-600 rounded-lg overflow-hidden hover:border-pink-400 transition-all shadow-lg"
                >
                  {/* Imagem com Blur */}
                  <div className="relative aspect-square overflow-hidden">
                    {photo.preview ? (
                      <img 
                        src={photo.preview}
                        alt={photo.filename}
                        className={`w-full h-full object-cover transition-all ${
                          photo.isPurchased ? 'filter-none' : 'filter blur-sm'
                        }`}
                        onError={(e) => {
                          // Fallback para caso não carregue a imagem
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <FaImages className="text-4xl text-gray-600" />
                      </div>
                    )}
                    
                    {/* Overlay com cadeado */}
                    {!photo.isPurchased && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center border border-green-500/30">
                        <div className="text-center text-green-400">
                          <FaLock className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-2 animate-pulse" />
                          <span className="text-base md:text-lg font-bold font-mono">R$ {photo.price.toFixed(2)}</span>
                          <p className="text-xs uppercase tracking-wide">LOCKED</p>
                        </div>
                      </div>
                    )}

                    {/* Badge desbloqueada */}
                    {photo.isPurchased && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-green-500/90 text-black px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                          ✓ UNLOCKED
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-1">
                      <span className="bg-black/70 text-green-400 px-2 py-1 rounded text-xs flex items-center border border-green-500/30">
                        <FaHeart className="mr-1" />
                        {photo.likes}
                      </span>
                      <span className="bg-black/70 text-blue-400 px-2 py-1 rounded text-xs flex items-center border border-blue-500/30">
                        <FaEye className="mr-1" />
                        {photo.views}
                      </span>
                    </div>
                  </div>

                  {/* Info da foto */}
                  <div className="p-3 md:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wide truncate">
                          {photo.originalName || photo.filename}
                        </h3>
                        <p className="text-xs text-gray-400 uppercase">
                          {photo.ageCategory}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(photo.uploadedAt)}
                      </span>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex space-x-2 mt-3">
                      {!photo.isPurchased ? (
                        <button
                          onClick={() => purchasePhoto(photo.id)}
                          disabled={!isAffordable || purchasing === photo.id}
                          className={`flex-1 py-2 px-3 rounded font-bold text-xs uppercase tracking-wide transition-all border ${
                            isAffordable
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-500'
                              : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                          } ${purchasing === photo.id ? 'animate-pulse' : ''}`}
                        >
                          {purchasing === photo.id ? (
                            <>
                              <FaKey className="inline mr-2" />
                              PROCESSANDO...
                            </>
                          ) : (
                            <>
                              <FaLock className="inline mr-2" />
                              COMPRAR R$ {photo.price.toFixed(2)}
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => downloadPhoto(photo)}
                          className="flex-1 py-2 px-3 rounded font-bold text-xs uppercase tracking-wide transition-all bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
                        >
                          <FaDownload className="inline mr-2" />
                          DOWNLOAD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info adicional para mobile */}
        <div className="mt-8 p-4 bg-gray-900/90 backdrop-blur border border-gray-600 rounded-lg md:hidden">
          <h3 className="text-sm font-bold text-green-400 mb-2 uppercase tracking-wide">
            📱 VERSÃO MOBILE
          </h3>
          <p className="text-xs text-gray-400">
            Interface otimizada para dispositivos móveis. Todas as funcionalidades disponíveis.
          </p>
        </div>
      </div>
    </div>
  );
} 