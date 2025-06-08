import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User, WalletTransaction } from '@/lib/models';

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

    const { crypto, amount, address, txHash, network } = await request.json();

    // Validações básicas
    if (!crypto || !amount || !address || !txHash || !network) {
      return NextResponse.json(
        { success: false, message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    if (amount < 20) {
      return NextResponse.json(
        { success: false, message: 'Valor mínimo é R$ 20,00' },
        { status: 400 }
      );
    }

    // Conectar ao MongoDB
    await connectToDatabase();

    // Encontrar o usuário
    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o hash já foi usado
    const existingTransaction = await WalletTransaction.findOne({
      'metadata.txHash': txHash,
      'metadata.type': 'crypto_deposit'
    });
    
    if (existingTransaction) {
      return NextResponse.json(
        { success: false, message: 'Hash de transação já utilizado' },
        { status: 400 }
      );
    }

    // Carteiras válidas
    const validWallets: Record<string, string> = {
      'BTC': 'bc1qfx57hwff67re076ck4sdnzjmcvda6p85hezjaf',
      'ETH': '0x64d874542986Aa67Df977EdeaaCA4A1777bD295f',
      'TRX': 'TQeR8q5Pk8MnDYurCFpf4ba7zmQKx5Dy5K',
      'USDT-ETH': '0x64d874542986Aa67Df977EdeaaCA4A1777bD295f',
      'USDT-POLYGON': '0x64d874542986Aa67Df977EdeaaCA4A1777bD295f',
      'SOL': '8CdcavNNZ63Aj84W1Nt5GsaJTvTKKGx2MoU2JSJSpzrD',
      'LTC': 'ltc1qc7c3ynw48mzw6jh39ap9c5kztwgkxgh4372uwj'
    };

    // Verificar se o endereço está correto
    if (validWallets[crypto] !== address) {
      return NextResponse.json(
        { success: false, message: 'Endereço de depósito inválido' },
        { status: 400 }
      );
    }

    // Verificar formato básico do hash da transação
    let isValidHash = false;
    switch (crypto) {
      case 'BTC':
      case 'LTC':
        isValidHash = /^[a-fA-F0-9]{64}$/.test(txHash);
        break;
      case 'ETH':
      case 'USDT-ETH':
      case 'USDT-POLYGON':
        isValidHash = /^0x[a-fA-F0-9]{64}$/.test(txHash);
        break;
      case 'TRX':
        isValidHash = /^[a-fA-F0-9]{64}$/.test(txHash);
        break;
      case 'SOL':
        isValidHash = /^[1-9A-HJ-NP-Za-km-z]{64,}$/.test(txHash);
        break;
    }

    if (!isValidHash) {
      return NextResponse.json(
        { success: false, message: 'Formato de hash inválido para esta criptomoeda' },
        { status: 400 }
      );
    }

    // Atualizar saldo do usuário
    const balanceBefore = user.balance || 0;
    const balanceAfter = balanceBefore + amount;
    
    user.balance = balanceAfter;
    await user.save();

    // Criar transação de carteira
    const walletTransaction = new WalletTransaction({
      userId: authResult.userId,
      type: 'credit',
      amount: amount,
      description: `Depósito ${crypto} via ${network}`,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      createdAt: new Date(),
      metadata: {
        type: 'crypto_deposit',
        crypto: crypto,
        network: network,
        address: address,
        txHash: txHash,
        status: 'confirmed'
      }
    });

    await walletTransaction.save();

    // Log da transação para auditoria
    console.log(`Depósito crypto processado:`, {
      user: user.email,
      crypto,
      amount,
      txHash: txHash.substring(0, 10) + '...',
      network,
      newBalance: balanceAfter
    });

    return NextResponse.json({
      success: true,
      message: 'Depósito processado com sucesso',
      transaction: {
        id: walletTransaction._id,
        amount: amount,
        crypto: crypto,
        status: 'confirmed',
        createdAt: walletTransaction.createdAt
      },
      newBalance: balanceAfter
    });

  } catch (error) {
    console.error('Erro ao processar depósito crypto:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 