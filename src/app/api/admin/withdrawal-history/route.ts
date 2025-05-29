import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CONSULTANDO HISTÓRICO DE SAQUES ADMINISTRATIVOS ===');
    
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Conectar ao banco de dados
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    // Obter parâmetros de consulta
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    console.log('📊 Parâmetros da consulta:', { page, limit, skip });

    // Buscar saques administrativos com paginação
    const withdrawals = await db.collection('admin_withdrawals')
      .find({})
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .skip(skip)
      .limit(limit)
      .toArray();

    // Contar total de registros
    const totalCount = await db.collection('admin_withdrawals').countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    console.log('✅ Histórico consultado:', {
      withdrawalsCount: withdrawals.length,
      totalCount,
      totalPages,
      currentPage: page
    });

    // Calcular estatísticas gerais
    const stats = await db.collection('admin_withdrawals').aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalWithdrawals: { $sum: 1 },
          completedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'processing']] }, '$amount', 0]
            }
          },
          failedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]).toArray();

    const summary = stats[0] || {
      totalAmount: 0,
      totalWithdrawals: 0,
      completedAmount: 0,
      pendingAmount: 0,
      failedCount: 0
    };

    // Formatar dados para retorno
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal._id,
      adminId: withdrawal.adminId,
      adminEmail: withdrawal.adminEmail,
      amount: withdrawal.amount,
      amountFormatted: `R$ ${(withdrawal.amount / 100).toFixed(2)}`,
      pixKey: withdrawal.pixKey,
      pixKeyType: withdrawal.pixKeyType,
      receiverName: withdrawal.receiverName,
      receiverDocument: `${withdrawal.receiverDocument.substring(0, 3)}***${withdrawal.receiverDocument.substring(8)}`,
      pixPaymentId: withdrawal.pixPaymentId,
      status: withdrawal.status,
      reason: withdrawal.reason,
      notes: withdrawal.notes,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      processedAt: withdrawal.processedAt,
      failureReason: withdrawal.failureReason
    }));

    return NextResponse.json({
      success: true,
      withdrawals: formattedWithdrawals,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalAmount: summary.totalAmount,
        totalAmountFormatted: `R$ ${(summary.totalAmount / 100).toFixed(2)}`,
        totalWithdrawals: summary.totalWithdrawals,
        completedAmount: summary.completedAmount,
        completedAmountFormatted: `R$ ${(summary.completedAmount / 100).toFixed(2)}`,
        pendingAmount: summary.pendingAmount,
        pendingAmountFormatted: `R$ ${(summary.pendingAmount / 100).toFixed(2)}`,
        failedCount: summary.failedCount,
        successRate: summary.totalWithdrawals > 0 
          ? ((summary.totalWithdrawals - summary.failedCount) / summary.totalWithdrawals * 100).toFixed(1)
          : '0'
      }
    });

  } catch (error) {
    console.error('❌ ERRO ao consultar histórico de saques:', error);
    
    return NextResponse.json({
      success: false,
      message: `Erro ao consultar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 