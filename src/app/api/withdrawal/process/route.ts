import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal, User } from '@/lib/models';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { withdrawalId } = await request.json();

    if (!withdrawalId) {
      return NextResponse.json(
        { success: false, message: 'ID do saque é obrigatório' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar a solicitação de saque
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Saque não encontrado' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Saque não está aprovado para processamento' },
        { status: 400 }
      );
    }

    // Buscar dados do usuário
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para PIX
    const pixPaymentData = {
      initiation_type: 'dict' as const,
      idempotent_id: `SAQUE_${withdrawal._id}_${Date.now()}`,
      receiver_name: user.username,
      receiver_document: withdrawal.pixKey, // Assumindo que a chave PIX é o CPF
      value_cents: Math.round(withdrawal.amount * 100),
      pix_key_type: withdrawal.pixKeyType as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
      pix_key: withdrawal.pixKey,
      authorized: false, // Vai para autorização manual
      account: withdrawal.primepagAccount || 1
    };

    console.log('Processando saque via PrimePag:', {
      withdrawalId: withdrawal._id,
      amount: withdrawal.amount,
      pixKey: withdrawal.pixKey,
      pixKeyType: withdrawal.pixKeyType
    });

    // Enviar PIX via PrimePag
    const pixPayment = await primepagService.sendPixPayment(pixPaymentData);

    // Atualizar a solicitação de saque
    await Withdrawal.findByIdAndUpdate(withdrawalId, {
      status: 'processing',
      processedAt: new Date(),
      pixPaymentId: pixPayment.id,
      pixPaymentStatus: pixPayment.status,
      primepagAccount: pixPaymentData.account
    });

    console.log('Saque processado com sucesso:', {
      withdrawalId: withdrawal._id,
      pixPaymentId: pixPayment.id,
      status: pixPayment.status
    });

    return NextResponse.json({
      success: true,
      message: 'Saque processado com sucesso',
      pixPayment: {
        id: pixPayment.id,
        status: pixPayment.status,
        authorization_url: pixPayment.authorization_url
      }
    });

  } catch (error) {
    console.error('Erro ao processar saque:', error);
    
    // Se houver erro, atualizar o status do saque
    try {
      const { withdrawalId } = await request.json();
      await Withdrawal.findByIdAndUpdate(withdrawalId, {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } catch (updateError) {
      console.error('Erro ao atualizar status do saque:', updateError);
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar saque',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 