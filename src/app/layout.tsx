import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import DynamicHeader from '@/components/DynamicHeader';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 't0p.1 - Sistema de Pagamentos PIX',
  description: 'Sistema seguro de pagamentos PIX com interface hacker',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMDAwMDAwIi8+CjxsaW5lIHgxPSI4IiB5MT0iOCIgeDI9IjI0IiB5Mj0iMjQiIHN0cm9rZT0iIzAwRkYwMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGxpbmUgeDE9IjI0IiB5MT0iOCIgeDI9IjgiIHkyPSIyNCIgc3Ryb2tlPSIjMDBGRjAwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cmVjdCB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGNjYwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIyIDIiLz4KPC9zdmc+',
    shortcut: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMDAwMDAwIi8+CjxsaW5lIHgxPSI4IiB5MT0iOCIgeDI9IjI0IiB5Mj0iMjQiIHN0cm9rZT0iIzAwRkYwMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGxpbmUgeDE9IjI0IiB5MT0iOCIgeDI9IjgiIHkyPSIyNCIgc3Ryb2tlPSIjMDBGRjAwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cmVjdCB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGNjYwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIyIDIiLz4KPC9zdmc+',
    apple: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMDAwMDAwIi8+CjxsaW5lIHgxPSI4IiB5MT0iOCIgeDI9IjI0IiB5Mj0iMjQiIHN0cm9rZT0iIzAwRkYwMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGxpbmUgeDE9IjI0IiB5MT0iOCIgeDI9IjgiIHkyPSIyNCIgc3Ryb2tlPSIjMDBGRjAwIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cmVjdCB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGNjYwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIyIDIiLz4KPC9zdmc+'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-slate-900 to-black text-green-400 font-mono min-h-screen overflow-x-hidden`}>
        <ThemeProvider>
          <div className="relative min-h-screen">
            {/* Efeito Matrix de fundo */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce text-green-500"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 3}s`,
                    fontSize: `${8 + Math.random() * 8}px`
                  }}
                >
                  {['>', '$', '#', '~', '0', '1'][Math.floor(Math.random() * 6)]}
                </div>
              ))}
            </div>

            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-5">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
            </div>

            {/* Conteúdo principal */}
            <div className="relative z-10">
              <div className="fixed top-0 left-0 right-0 z-50">
                <DynamicHeader />
              </div>
              <main className="flex-grow container mx-auto px-4 py-8 pt-20 md:pt-24">
                {children}
              </main>
              <footer className="border-t border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-mono">&copy; {new Date().getFullYear()} t0p.1 X Receiver | Advanced Payment Terminal</p>
                </div>
              </footer>
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#00ff00',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                fontFamily: 'monospace',
                fontSize: '14px'
              },
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
} 