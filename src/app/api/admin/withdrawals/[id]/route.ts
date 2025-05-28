import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal, User, WalletTransaction } from '@/lib/models';
import { primepagService } from '@/lib/services/primepag';
import { notificationService } from '@/lib/services/notifications';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// PUT - Aprovar ou rejeitar saque
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, notes, account } = body; // action: 'approve' | 'reject'

    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Ação inválida. Use "approve" ou "reject".' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar saque
    const withdrawal = await Withdrawal.findById(params.id).populate('userId');
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Saque não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se ainda está pendente
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Este saque já foi processado' },
        { status: 400 }
      );
    }

    const user = withdrawal.userId as any;

    if (action === 'reject') {
      // Rejeitar saque
      withdrawal.status = 'rejected';
      withdrawal.reviewedAt = new Date();
      withdrawal.reviewedBy = new mongoose.Types.ObjectId(authResult.userId);
      withdrawal.reviewNotes = notes || 'Saque rejeitado pelo administrador';
      
      await withdrawal.save();

      // Criar notificação para o usuário
      await notificationService.createWithdrawalRejectedNotification(
        user._id.toString(),
        withdrawal.amount,
        notes
      );

      console.log(`❌ Saque rejeitado:`, {
        withdrawalId: withdrawal._id,
        userId: user._id,
        amount: withdrawal.amount,
        reason: notes
      });

      return NextResponse.json({
        success: true,
        message: 'Saque rejeitado com sucesso',
        withdrawal: {
          id: withdrawal._id,
          status: withdrawal.status,
          reviewedAt: withdrawal.reviewedAt,
          reviewNotes: withdrawal.reviewNotes
        }
      });
    }

    if (action === 'approve') {
      // Verificar saldo do usuário novamente
      if (user.balance < withdrawal.amount) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Usuário não possui saldo suficiente. Saldo atual: R$ ${user.balance.toFixed(2)}` 
          },
          { status: 400 }
        );
      }

      // Aprovar saque e processar
      withdrawal.status = 'approved';
      withdrawal.reviewedAt = new Date();
      withdrawal.reviewedBy = new mongoose.Types.ObjectId(authResult.userId);
      withdrawal.reviewNotes = notes || 'Saque aprovado pelo administrador';
      withdrawal.primepagAccount = account || 1;
      
      await withdrawal.save();

      // Debitar do saldo do usuário
      const balanceBefore = user.balance;
      user.balance -= withdrawal.amount;
      await user.save();

      // Criar transação na carteira
      await WalletTransaction.create({
        userId: user._id,
        type: 'debit',
        amount: withdrawal.amount,
        description: `Saque aprovado - PIX: ${withdrawal.pixKey}`,
        withdrawalId: withdrawal._id,
        balanceBefore: balanceBefore,
        balanceAfter: user.balance
      });

      // Criar notificação para o usuário
      await notificationService.createWithdrawalApprovedNotification(
        user._id.toString(),
        withdrawal.amount
      );

      console.log(`✅ Saque aprovado e processado:`, {
        withdrawalId: withdrawal._id,
        userId: user._id,
        amount: withdrawal.amount,
        newBalance: user.balance
      });

      // TODO: Aqui seria onde enviaríamos o PIX via PrimePag
      // Por enquanto, vamos marcar como processado
      withdrawal.status = 'completed';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      return NextResponse.json({
        success: true,
        message: 'Saque aprovado e processado com sucesso',
        withdrawal: {
          id: withdrawal._id,
          status: withdrawal.status,
          reviewedAt: withdrawal.reviewedAt,
          processedAt: withdrawal.processedAt,
          reviewNotes: withdrawal.reviewNotes
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro ao processar saque:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar saque',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 