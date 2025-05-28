import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal, User, WalletTransaction } from '@/lib/models';
import { notificationService } from '@/lib/services/notifications';
import { primepagService } from '@/lib/services/primepag';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// PUT - Aprovar ou rejeitar saque
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, reason, account } = body; // account = conta PrimePag para usar

    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado' },
        { status: 403 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Ação inválida' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar o saque
    const withdrawal = await Withdrawal.findById(id).populate('userId', 'name email');
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Saque não encontrado' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Saque já foi processado' },
        { status: 400 }
      );
    }

    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      console.log(`💰 Processando aprovação de saque:`, {
        withdrawalId: withdrawal._id,
        userId: user._id,
        amount: withdrawal.amount,
        pixKey: withdrawal.pixKey.substring(0, 5) + '***',
        pixKeyType: withdrawal.pixKeyType,
        account: account || 1
      });

      // Verificar se o usuário tem saldo suficiente
      if (user.balance < withdrawal.amount) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Saldo insuficiente. Saldo atual: R$ ${user.balance.toFixed(2).replace('.', ',')}` 
          },
          { status: 400 }
        );
      }

      try {
        // Gerar ID único para a transação
        const idempotentId = `SAQUE_${withdrawal._id}_${Date.now()}`;
        
        // Determinar tipo de chave PIX
        const pixKeyTypeMapping: { [key: string]: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' } = {
          'cpf': 'cpf',
          'cnpj': 'cnpj',
          'email': 'email',
          'telefone': 'phone',
          'phone': 'phone',
          'aleatoria': 'random',
          'random': 'random'
        };

        const mappedPixKeyType = pixKeyTypeMapping[withdrawal.pixKeyType] || 'random';

        console.log('📤 Enviando PIX via PrimePag...');
        const pixPayment = await primepagService.sendPixPayment({
          initiation_type: 'dict',
          idempotent_id: idempotentId,
          receiver_name: user.name || user.username || 'Usuário',
          receiver_document: '11144477735', // CPF padrão - em produção, usar CPF real do usuário
          value_cents: Math.round(withdrawal.amount * 100),
          pix_key_type: mappedPixKeyType,
          pix_key: withdrawal.pixKey,
          authorized: true, // Autorizar automaticamente
          account: account || 1
        });

        console.log('✅ PIX enviado com sucesso:', {
          pixPaymentId: pixPayment.id,
          status: pixPayment.status,
          value_cents: pixPayment.value_cents
        });

        // Debitar do saldo do usuário
        user.balance -= withdrawal.amount;
        await user.save();

        // Criar transação na carteira
        await WalletTransaction.create({
          userId: user._id,
          type: 'withdrawal',
          amount: -withdrawal.amount,
          description: `Saque PIX aprovado - ${withdrawal.pixKeyType}: ${withdrawal.pixKey.substring(0, 5)}***`,
          balanceBefore: user.balance + withdrawal.amount,
          balanceAfter: user.balance,
          metadata: {
            withdrawalId: withdrawal._id,
            pixPaymentId: pixPayment.id,
            pixKeyType: withdrawal.pixKeyType,
            pixKey: withdrawal.pixKey,
            primepagAccount: account || 1
          }
        });

        // Atualizar status do saque
        withdrawal.status = 'approved';
        withdrawal.approvedBy = new mongoose.Types.ObjectId(authResult.userId);
        withdrawal.approvedAt = new Date();
        withdrawal.pixPaymentId = pixPayment.id;
        withdrawal.primepagAccount = account || 1;
        withdrawal.pixPaymentStatus = pixPayment.status;
        await withdrawal.save();

        // Criar notificação para o usuário
        await notificationService.createWithdrawalApprovedNotification(
          user._id.toString(),
          withdrawal.amount
        );

        console.log(`✅ Saque aprovado e PIX enviado:`, {
          withdrawalId: withdrawal._id,
          pixPaymentId: pixPayment.id,
          amount: withdrawal.amount,
          newBalance: user.balance
        });

        return NextResponse.json({
          success: true,
          message: 'Saque aprovado e PIX enviado com sucesso',
          withdrawal: {
            id: withdrawal._id,
            status: withdrawal.status,
            approvedAt: withdrawal.approvedAt,
            pixPaymentId: pixPayment.id,
            pixPaymentStatus: pixPayment.status
          },
          pixPayment: {
            id: pixPayment.id,
            status: pixPayment.status,
            value_cents: pixPayment.value_cents,
            created_at: pixPayment.created_at
          }
        });

      } catch (pixError) {
        console.error('❌ Erro ao enviar PIX:', pixError);
        
        // Atualizar saque como rejeitado devido a erro no PIX
        withdrawal.status = 'rejected';
        withdrawal.rejectedBy = new mongoose.Types.ObjectId(authResult.userId);
        withdrawal.rejectedAt = new Date();
        withdrawal.rejectionReason = `Erro ao enviar PIX: ${pixError instanceof Error ? pixError.message : String(pixError)}`;
        await withdrawal.save();

        // Criar notificação de erro
        await notificationService.createWithdrawalRejectedNotification(
          user._id.toString(),
          withdrawal.amount,
          withdrawal.rejectionReason
        );

        return NextResponse.json(
          { 
            success: false, 
            message: `Erro ao processar PIX: ${pixError instanceof Error ? pixError.message : String(pixError)}`,
            withdrawal: {
              id: withdrawal._id,
              status: withdrawal.status,
              rejectionReason: withdrawal.rejectionReason
            }
          },
          { status: 500 }
        );
      }

    } else if (action === 'reject') {
      // Rejeitar saque
      withdrawal.status = 'rejected';
      withdrawal.rejectedBy = new mongoose.Types.ObjectId(authResult.userId);
      withdrawal.rejectedAt = new Date();
      withdrawal.rejectionReason = reason || 'Saque rejeitado pelo administrador';
      await withdrawal.save();

      // Criar notificação para o usuário
      await notificationService.createWithdrawalRejectedNotification(
        user._id.toString(),
        withdrawal.amount,
        withdrawal.rejectionReason
      );

      console.log(`❌ Saque rejeitado:`, {
        withdrawalId: withdrawal._id,
        userId: user._id,
        reason: withdrawal.rejectionReason
      });

      return NextResponse.json({
        success: true,
        message: 'Saque rejeitado com sucesso',
        withdrawal: {
          id: withdrawal._id,
          status: withdrawal.status,
          rejectedAt: withdrawal.rejectedAt,
          rejectionReason: withdrawal.rejectionReason
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro ao processar saque:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 