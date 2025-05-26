import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

// Mock data para histórico de pagamentos (em produção viria do banco de dados)
const mockPayments = [
  {
    id: 'pix_001',
    amount: 50.00,
    status: 'paid',
    description: 'Assinatura Premium - João Silva',
    customer: {
      name: 'João Silva',
      document: '123.456.789-00'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    paidAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 horas atrás
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // 22 horas no futuro
    pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    referenceCode: 'a4f5927b5b4af98771d4fe665e90bb'
  },
  {
    id: 'pix_002',
    amount: 25.00,
    status: 'pending',
    description: 'Assinatura Básica - Maria Santos',
    customer: {
      name: 'Maria Santos',
      document: '987.654.321-00'
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
    paidAt: null,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos no futuro
    pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    referenceCode: 'b5g6038c6c5bg09882e5gf776f01cc'
  },
  {
    id: 'pix_003',
    amount: 100.00,
    status: 'expired',
    description: 'Assinatura Custom - Pedro Costa',
    customer: {
      name: 'Pedro Costa',
      document: '456.789.123-00'
    },
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 horas atrás
    paidAt: null,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 horas atrás (expirado)
    pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    referenceCode: 'c6h7149d7d6ch10993f6hg887g02dd'
  },
  {
    id: 'pix_004',
    amount: 75.00,
    status: 'paid',
    description: 'Assinatura Premium - Ana Oliveira',
    customer: {
      name: 'Ana Oliveira',
      document: '789.123.456-00'
    },
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 horas atrás
    paidAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(), // 47 horas atrás
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 horas atrás
    pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    referenceCode: 'd7i8250e8e7di21004g7ih998h03ee'
  },
  {
    id: 'pix_005',
    amount: 150.00,
    status: 'cancelled',
    description: 'Assinatura Custom - Carlos Ferreira',
    customer: {
      name: 'Carlos Ferreira',
      document: '321.654.987-00'
    },
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 horas atrás
    paidAt: null,
    expiresAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 horas atrás
    pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    referenceCode: 'e8j9361f9f8ej32115h8ji009i04ff'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let filteredPayments = [...mockPayments];

    // Filtrar por status se especificado
    if (status && status !== 'all') {
      filteredPayments = filteredPayments.filter(payment => payment.status === status);
    }

    // Filtrar por data se especificado
    if (startDate) {
      const start = new Date(startDate);
      filteredPayments = filteredPayments.filter(payment => 
        new Date(payment.createdAt) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Incluir o dia inteiro
      filteredPayments = filteredPayments.filter(payment => 
        new Date(payment.createdAt) <= end
      );
    }

    // Ordenar por data de criação (mais recente primeiro)
    filteredPayments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Calcular estatísticas
    const stats = {
      total: filteredPayments.length,
      paid: filteredPayments.filter(p => p.status === 'paid').length,
      pending: filteredPayments.filter(p => p.status === 'pending').length,
      expired: filteredPayments.filter(p => p.status === 'expired').length,
      cancelled: filteredPayments.filter(p => p.status === 'cancelled').length,
      totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: filteredPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    return NextResponse.json({
      success: true,
      payments: paginatedPayments,
      pagination: {
        page,
        limit,
        total: filteredPayments.length,
        totalPages: Math.ceil(filteredPayments.length / limit),
        hasNext: endIndex < filteredPayments.length,
        hasPrev: page > 1
      },
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao buscar histórico de pagamentos',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 