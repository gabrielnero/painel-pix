import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User, Withdrawal, WalletTransaction } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, pixKey, pixKeyType } = body;

    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar campos obrigatórios
    if (!amount || !pixKey || !pixKeyType) {
      return NextResponse.json(
        { success: false, message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar valor mínimo
    if (amount < 10) {
      return NextResponse.json(
        { success: false, message: 'Valor mínimo para saque é R$ 10,00' },
        { status: 400 }
      );
    }

    // Validar tipo de chave PIX
    const validPixKeyTypes = ['cpf', 'cnpj', 'email', 'phone', 'random'];
    if (!validPixKeyTypes.includes(pixKeyType)) {
      return NextResponse.json(
        { success: false, message: 'Tipo de chave PIX inválido' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Buscar usuário e verificar saldo
    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se tem saldo suficiente
    if (user.balance < amount) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Saldo insuficiente. Saldo atual: R$ ${user.balance.toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    // Verificar se já existe saque pendente
    const existingWithdrawal = await Withdrawal.findOne({
      userId: authResult.userId,
      status: { $in: ['pending', 'approved', 'processing'] }
    });

    if (existingWithdrawal) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Você já possui um saque pendente. Aguarde a conclusão para solicitar outro.' 
        },
        { status: 409 }
      );
    }

    // Criar solicitação de saque
    const withdrawal = await Withdrawal.create({
      userId: authResult.userId,
      amount,
      pixKey,
      pixKeyType,
      status: 'pending'
    });

    console.log(`💰 Nova solicitação de saque criada:`, {
      withdrawalId: withdrawal._id,
      userId: authResult.userId,
      amount,
      pixKey: pixKey.substring(0, 5) + '***', // Mascarar chave PIX no log
      pixKeyType
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação de saque criada com sucesso. Aguarde aprovação do administrador.',
      withdrawal: {
        id: withdrawal._id,
        amount,
        pixKeyType,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao solicitar saque:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar solicitação de saque',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 