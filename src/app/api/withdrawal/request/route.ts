import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal, User, WalletTransaction } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { amount, pixKey, pixKeyType } = await request.json();

    // Validações
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valor inválido' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { success: false, message: 'Valor mínimo para saque é R$ 10,00' },
        { status: 400 }
      );
    }

    if (!pixKey || !pixKeyType) {
      return NextResponse.json(
        { success: false, message: 'Chave PIX e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verificar saldo do usuário
    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { success: false, message: 'Saldo insuficiente' },
        { status: 400 }
      );
    }

    // Verificar se não há saques pendentes
    const pendingWithdrawal = await Withdrawal.findOne({
      userId: authResult.userId,
      status: { $in: ['pending', 'approved', 'processing'] }
    });

    if (pendingWithdrawal) {
      return NextResponse.json(
        { success: false, message: 'Você já possui um saque pendente' },
        { status: 400 }
      );
    }

    // Criar a solicitação de saque
    const withdrawal = new Withdrawal({
      userId: authResult.userId,
      amount,
      pixKey,
      pixKeyType,
      status: 'pending',
      requestedAt: new Date(),
      primepagAccount: 1 // Padrão para conta 1
    });

    await withdrawal.save();

    // Deduzir o valor do saldo do usuário imediatamente
    await User.findByIdAndUpdate(authResult.userId, {
      $inc: { balance: -amount }
    });

    // Registrar transação na carteira
    await WalletTransaction.create({
      userId: authResult.userId,
      type: 'withdrawal',
      amount: -amount,
      description: `Saque solicitado - Chave PIX: ${pixKey.substring(0, 5)}***`,
      balanceBefore: user.balance,
      balanceAfter: user.balance - amount,
      metadata: {
        withdrawalId: withdrawal._id,
        pixKey: pixKey.substring(0, 5) + '***',
        pixKeyType
      }
    });

    console.log('Solicitação de saque criada:', {
      withdrawalId: withdrawal._id,
      userId: authResult.userId,
      amount,
      pixKey: pixKey.substring(0, 5) + '***'
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação de saque enviada com sucesso. Aguarde aprovação.',
      withdrawal: {
        id: withdrawal._id,
        amount,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt,
        pixKey: pixKey.substring(0, 5) + '***',
        pixKeyType
      }
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de saque:', error);
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