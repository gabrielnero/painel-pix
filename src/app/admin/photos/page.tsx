'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaImages, 
  FaPlus, 
  FaEdit,
  FaTrash,
  FaUpload,
  FaEye,
  FaDownload
} from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';

interface Photo {
  id: string;
  price: number;
  category: string;
  ageCategory: string;
  uploadedAt: string;
  uploadedBy: string;
  likes: number;
  views: number;
  purchases: number;
  revenue: number;
  isActive: boolean;
  filename: string;
}

const ageCategories = ['18-25 anos', '26-35 anos', '36-45 anos', '46+ anos'];
const categories = ['SELFIE']; // Apenas uma categoria

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('18-25 anos');

  // Upload múltiplo
  const [uploadData, setUploadData] = useState({
    category: 'SELFIE',
    ageCategory: '18-25 anos',
    price: 20.00,
    files: [] as File[]
  });

  // Sistema de Revenda
  const [resaleConfig, setResaleConfig] = useState({
    username: '',
    discount: 50,
    photos: [] as string[]
  });

  const [users, setUsers] = useState<{ id: string; username: string; email: string }[]>([]);

  // Carregar fotos do servidor
  useEffect(() => {
    loadPhotos();
    loadUsers();
  }, [selectedAgeCategory]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        admin: 'true',
        ageCategory: selectedAgeCategory === 'Todas' ? 'all' : selectedAgeCategory,
        category: 'SELFIE'
      });

      const response = await fetch(`/api/photos?${params}`);
      const data = await response.json();

      if (data.success) {
        setPhotos(data.photos);
      } else {
        toast.error(data.message || 'Erro ao carregar fotos');
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
      toast.error('Erro ao carregar fotos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=50');
      const data = await response.json();
      
      if (data.success) {
        const mappedUsers = data.users.map((user: any) => ({
          id: user._id,
          username: user.username,
          email: user.email
        }));
        setUsers(mappedUsers);
      } else {
        console.error('Erro ao carregar usuários:', data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleMultipleUpload = async () => {
    if (uploadData.files.length === 0) {
      toast.error('Selecione pelo menos uma foto');
      return;
    }

    setUploading(true);
    try {
      const filePromises = uploadData.files.map(async (file) => {
        const imageData = await convertFileToBase64(file);
        return {
          imageData,
          originalName: file.name
        };
      });

      const files = await Promise.all(filePromises);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          category: uploadData.category,
          ageCategory: uploadData.ageCategory,
          price: uploadData.price
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setUploadData({ 
          category: 'SELFIE', 
          ageCategory: '18-25 anos', 
          price: 20.00, 
          files: [] 
        });
        setShowUploadModal(false);
        loadPhotos(); // Recarregar lista
      } else {
        toast.error(data.message || 'Erro ao enviar fotos');
      }
    } catch (error) {
      console.error('Erro ao enviar fotos:', error);
      toast.error('Erro ao enviar fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPhoto) return;

    try {
      const response = await fetch(`/api/photos/${selectedPhoto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: selectedPhoto.price,
          ageCategory: selectedPhoto.ageCategory,
          isActive: selectedPhoto.isActive
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Foto atualizada com sucesso!');
        setShowEditModal(false);
        setSelectedPhoto(null);
        loadPhotos(); // Recarregar lista
      } else {
        toast.error(data.message || 'Erro ao editar foto');
      }
    } catch (error) {
      console.error('Erro ao editar foto:', error);
      toast.error('Erro ao editar foto');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Foto removida com sucesso!');
        loadPhotos(); // Recarregar lista
      } else {
        toast.error(data.message || 'Erro ao remover foto');
      }
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto');
    }
  };

  const configureResale = async () => {
    if (!resaleConfig.username || resaleConfig.photos.length === 0) {
      toast.error('Selecione um usuário e pelo menos uma foto');
      return;
    }

    try {
      // Simular configuração de revenda
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Revenda configurada para ${resaleConfig.username} com ${resaleConfig.discount}% de desconto em ${resaleConfig.photos.length} fotos`);
      setShowResaleModal(false);
      setResaleConfig({ username: '', discount: 50, photos: [] });
    } catch (error) {
      console.error('Erro ao configurar revenda:', error);
      toast.error('Erro ao configurar revenda');
    }
  };

  const filteredPhotos = photos.filter(photo => 
    selectedAgeCategory === 'Todas' || photo.ageCategory === selectedAgeCategory
  );

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
              <FaImages className="mr-3 text-purple-600" />
              Gerenciar Fotos SELFIE
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie o catálogo de selfies disponíveis para venda.
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowResaleModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center"
            >
              💰 Configurar Revenda
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center"
            >
              <FaPlus className="mr-2" />
              Upload Múltiplo
            </button>
          </div>
        </div>

        {/* Filtro por Faixa Etária */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Filtrar por Faixa Etária
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAgeCategory('Todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAgeCategory === 'Todas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            {ageCategories.map(ageCategory => (
              <button
                key={ageCategory}
                onClick={() => setSelectedAgeCategory(ageCategory)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedAgeCategory === ageCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {ageCategory}
              </button>
            ))}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <FaImages className="text-3xl mr-4" />
              <div>
                <h3 className="text-lg font-semibold">Total de Selfies</h3>
                <p className="text-2xl font-bold">{photos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <FaEye className="text-3xl mr-4" />
              <div>
                <h3 className="text-lg font-semibold">Total de Views</h3>
                <p className="text-2xl font-bold">{photos.reduce((sum, photo) => sum + photo.views, 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <FaDownload className="text-3xl mr-4" />
              <div>
                <h3 className="text-lg font-semibold">Total de Vendas</h3>
                <p className="text-2xl font-bold">{photos.reduce((sum, photo) => sum + photo.purchases, 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <span className="text-3xl mr-4">💰</span>
              <div>
                <h3 className="text-lg font-semibold">Receita Total</h3>
                <p className="text-2xl font-bold">R$ {photos.reduce((sum, photo) => sum + photo.revenue, 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Fotos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Foto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Faixa Etária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estatísticas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPhotos.map((photo) => (
                  <tr key={photo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mr-4"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {photo.filename || `Selfie ${photo.id}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(photo.uploadedAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {photo.ageCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {photo.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div>👁️ {photo.views} views</div>
                        <div>❤️ {photo.likes} likes</div>
                        <div>💰 {photo.purchases} vendas</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        photo.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {photo.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredPhotos.length === 0 && (
              <div className="text-center py-8">
                <FaImages className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhuma selfie encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Upload Múltiplo */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Upload Múltiplo de Selfies
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selecionar Múltiplas Fotos *
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setUploadData(prev => ({ 
                        ...prev, 
                        files: Array.from(e.target.files || []) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadData.files.length} arquivo(s) selecionado(s)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoria
                      </label>
                      <select
                        value={uploadData.category}
                        onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Faixa Etária
                      </label>
                      <select
                        value={uploadData.ageCategory}
                        onChange={(e) => setUploadData(prev => ({ ...prev, ageCategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {ageCategories.map(ageCategory => (
                          <option key={ageCategory} value={ageCategory}>{ageCategory}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        value={uploadData.price}
                        onChange={(e) => setUploadData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">ℹ️ Upload Simplificado</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      As fotos serão enviadas sem título ou descrição individual. 
                      Elas serão categorizadas automaticamente como <strong>{uploadData.category}</strong> 
                      na faixa etária <strong>{uploadData.ageCategory}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMultipleUpload}
                    disabled={uploading || uploadData.files.length === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando... ({uploadData.files.length} fotos)
                      </>
                    ) : (
                      <>
                        <FaUpload className="mr-2" />
                        Enviar {uploadData.files.length} Foto(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {showEditModal && selectedPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Editar Selfie
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Faixa Etária
                      </label>
                      <select
                        value={selectedPhoto.ageCategory}
                        onChange={(e) => setSelectedPhoto(prev => prev ? { ...prev, ageCategory: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {ageCategories.map(ageCategory => (
                          <option key={ageCategory} value={ageCategory}>{ageCategory}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        value={selectedPhoto.price}
                        onChange={(e) => setSelectedPhoto(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={selectedPhoto.isActive}
                          onChange={() => setSelectedPhoto(prev => prev ? { ...prev, isActive: true } : null)}
                          className="mr-2"
                        />
                        Ativa
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={!selectedPhoto.isActive}
                          onChange={() => setSelectedPhoto(prev => prev ? { ...prev, isActive: false } : null)}
                          className="mr-2"
                        />
                        Inativa
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Revenda */}
        {showResaleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    💰 Configurar Sistema de Revenda
                  </h3>
                  <button
                    onClick={() => setShowResaleModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Usuário para Revenda
                      </label>
                      <select
                        value={resaleConfig.username}
                        onChange={(e) => setResaleConfig(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione um usuário</option>
                        {users.map(user => (
                          <option key={user.id} value={user.username}>{user.username} ({user.email})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Desconto (%)
                      </label>
                      <input
                        type="number"
                        value={resaleConfig.discount}
                        onChange={(e) => setResaleConfig(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Selecionar Fotos para Revenda ({resaleConfig.photos.length} selecionadas)
                    </h4>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {photos.map(photo => (
                        <div
                          key={photo.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            resaleConfig.photos.includes(photo.id)
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setResaleConfig(prev => ({
                              ...prev,
                              photos: prev.photos.includes(photo.id)
                                ? prev.photos.filter(id => id !== photo.id)
                                : [...prev.photos, photo.id]
                            }));
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {photo.filename || `Selfie ${photo.id}`}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{photo.ageCategory}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">R$ {photo.price.toFixed(2)}</p>
                              {resaleConfig.photos.includes(photo.id) && (
                                <p className="text-sm text-green-600">
                                  Com desconto: R$ {(photo.price * (1 - resaleConfig.discount / 100)).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowResaleModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={configureResale}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    Configurar Revenda
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 