import Link from 'next/link';
import { FaArrowLeft, FaKey, FaPlus, FaTrash, FaCheck, FaTimes, FaCalendarAlt, FaUser } from 'react-icons/fa';

export default function AdminInviteCodes() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <Link href="/admin" className="flex items-center text-sm hover:text-theme-accent transition-colors duration-300">
          <FaArrowLeft className="mr-2" />
          Voltar ao Painel
        </Link>
      </div>

      <div className="mb-8 border-b border-theme-light pb-6">
        <h1 className="text-3xl font-bold mb-4 text-theme-primary">Códigos de Convite</h1>
        <p className="opacity-70">Gerencie os códigos de convite para novos usuários.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="panel">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaPlus className="mr-2 text-theme-primary" /> Gerar Novo Código
            </h2>
            
            <form className="space-y-5">
              <div>
                <label htmlFor="expiresIn" className="block text-sm font-medium mb-2 flex items-center">
                  <FaCalendarAlt className="mr-2" /> Expiração (dias)
                </label>
                <input
                  type="number"
                  id="expiresIn"
                  name="expiresIn"
                  className="input w-full"
                  placeholder="Dias até expirar"
                  defaultValue="7"
                  min="1"
                  max="30"
                  required
                />
              </div>
              
              <div>
                <button type="submit" className="btn w-full">
                  GERAR CÓDIGO DE CONVITE
                </button>
              </div>
            </form>
            
            <div className="mt-6 p-4 border border-theme-light rounded-md">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <FaKey className="mr-2 text-theme-primary" /> Novo Código
              </h3>
              <div className="bg-theme-dark p-3 rounded font-mono text-center">
                ABCD1234
              </div>
              <div className="mt-2 text-center">
                <button className="text-xs text-theme-accent hover:underline flex items-center justify-center mx-auto">
                  <FaCheck className="mr-1" /> Copiar Código
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="panel">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaKey className="mr-2 text-theme-primary" /> Códigos Existentes
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-light">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Criado Por</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Expira Em</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-light/30">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">ABCD1234</td>
                    <td className="px-4 py-3 whitespace-nowrap">admin</td>
                    <td className="px-4 py-3 whitespace-nowrap">30/05/2024</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300 flex items-center w-fit">
                        <FaCheck className="mr-1" /> Ativo
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="text-red-500 hover:text-red-300">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">EFGH5678</td>
                    <td className="px-4 py-3 whitespace-nowrap">admin</td>
                    <td className="px-4 py-3 whitespace-nowrap">28/05/2024</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-900 text-yellow-300 flex items-center w-fit">
                        <FaUser className="mr-1" /> Usado
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="text-red-500 hover:text-red-300">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">IJKL9012</td>
                    <td className="px-4 py-3 whitespace-nowrap">moderator</td>
                    <td className="px-4 py-3 whitespace-nowrap">15/05/2024</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-900 text-red-300 flex items-center w-fit">
                        <FaTimes className="mr-1" /> Expirado
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="text-red-500 hover:text-red-300">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm opacity-70">
                Mostrando 3 de 3 códigos
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-theme-light rounded text-sm opacity-50 cursor-not-allowed">
                  Anterior
                </button>
                <button className="px-3 py-1 border border-theme-light rounded text-sm opacity-50 cursor-not-allowed">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 