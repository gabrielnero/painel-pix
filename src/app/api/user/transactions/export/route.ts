import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { WalletTransaction } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Buscar todas as transações do usuário
    const transactions = await WalletTransaction.find({
      userId: authResult.userId
    })
    .sort({ createdAt: -1 })
    .select('type amount description createdAt');

    // Gerar CSV
    const csvHeader = 'Data,Tipo,Descrição,Valor\n';
    const csvRows = transactions.map(transaction => {
      const date = new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const type = transaction.type === 'credit' ? 'Depósito' : 'Saque';
      const description = `"${transaction.description.replace(/"/g, '""')}"`;
      const amount = `"R$ ${Math.abs(transaction.amount).toFixed(2).replace('.', ',')}"`;
      
      return `${date},${type},${description},${amount}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="historico_transacoes_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 