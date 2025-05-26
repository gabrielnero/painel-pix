import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import DynamicHeader from '@/components/DynamicHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 't0p.1',
  description: 'Painel de controle para gerenciamento de pagamentos PIX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <DynamicHeader />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p className="font-mono">&copy; {new Date().getFullYear()} t0p.1.sh | Advanced Payment Terminal</p>
            </div>
          </footer>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
          }}
        />
      </body>
    </html>
  );
} 