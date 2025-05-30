import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Withdrawal, User, WalletTransaction, IWithdrawal, IWalletTransaction, IUser } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('🔍 DEBUG: Investigando sistema de saques...');
    await connectToDatabase();

    const debugInfo = {
      withdrawalRequests: [] as any[],
      recentTransactions: [] as any[],
      userBalances: [] as any[],
      systemStats: {} as any,
      tenRealWithdrawals: [] as any[],
      errors: [] as string[]
    };

    try {
      // 1. Buscar todas as solicitações de saque recentes (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      console.log('📋 Buscando solicitações de saque...');
      const withdrawals = await Withdrawal.find({
        requestedAt: { $gte: sevenDaysAgo }
      }).sort({ requestedAt: -1 }).limit(20);

      debugInfo.withdrawalRequests = withdrawals.map((w: IWithdrawal) => ({
        id: w._id,
        userId: w.userId,
        amount: w.amount,
        status: w.status,
        pixKey: w.pixKey ? `${w.pixKey.substring(0, 5)}***` : null,
        pixKeyType: w.pixKeyType,
        requestedAt: w.requestedAt,
        approvedAt: w.approvedAt,
        processedAt: w.processedAt,
        rejectedAt: w.rejectedAt,
        approvedBy: w.approvedBy,
        rejectionReason: w.rejectionReason,
        pixPaymentId: w.pixPaymentId,
        pixPaymentStatus: w.pixPaymentStatus,
        failureReason: w.failureReason
      }));

      console.log(`✅ Encontradas ${withdrawals.length} solicitações de saque`);

      // 2. Buscar transações relacionadas a saques
      console.log('💰 Buscando transações de saque...');
      const transactions = await WalletTransaction.find({
        type: 'withdrawal',
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).limit(20);

      debugInfo.recentTransactions = transactions.map((t: IWalletTransaction) => ({
        id: t._id,
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
        metadata: t.metadata
      }));

      console.log(`✅ Encontradas ${transactions.length} transações de saque`);

      // 3. Buscar usuários com saldos para verificar se foram debitados
      console.log('👥 Buscando saldos de usuários...');
      const users = await User.find({
        $or: [
          { balance: { $gt: 0 } },
          { _id: { $in: withdrawals.map((w: IWithdrawal) => w.userId) } }
        ]
      }).select('username balance email role createdAt').limit(10);

      debugInfo.userBalances = users.map((u: IUser) => ({
        id: u._id,
        username: u.username,
        email: u.email ? `${u.email.substring(0, 3)}***` : null,
        balance: u.balance,
        role: u.role,
        createdAt: u.createdAt
      }));

      console.log(`✅ Encontrados ${users.length} usuários`);

      // 4. Estatísticas do sistema
      const totalWithdrawals = await Withdrawal.countDocuments();
      const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
      const approvedWithdrawals = await Withdrawal.countDocuments({ status: 'approved' });
      const processedWithdrawals = await Withdrawal.countDocuments({ status: 'completed' });
      const rejectedWithdrawals = await Withdrawal.countDocuments({ status: 'rejected' });

      debugInfo.systemStats = {
        totalWithdrawals,
        pendingWithdrawals,
        approvedWithdrawals,
        processedWithdrawals,
        rejectedWithdrawals,
        totalUsers: await User.countDocuments(),
        totalTransactions: await WalletTransaction.countDocuments()
      };

      // 5. Buscar especificamente saques de R$ 10,00
      console.log('🎯 Buscando saques de R$ 10,00...');
      const tenRealWithdrawals = await Withdrawal.find({
        amount: 10
      }).sort({ requestedAt: -1 }).limit(5);

      debugInfo.tenRealWithdrawals = tenRealWithdrawals.map((w: IWithdrawal) => ({
        id: w._id,
        userId: w.userId,
        amount: w.amount,
        status: w.status,
        pixKey: w.pixKey ? `${w.pixKey.substring(0, 5)}***` : null,
        requestedAt: w.requestedAt,
        approvedAt: w.approvedAt,
        processedAt: w.processedAt,
        approvedBy: w.approvedBy,
        pixPaymentId: w.pixPaymentId,
        pixPaymentStatus: w.pixPaymentStatus,
        failureReason: w.failureReason,
        fullDetails: {
          pixKeyType: w.pixKeyType,
          primepagAccount: w.primepagAccount,
          reviewNotes: w.reviewNotes
        }
      }));

      console.log(`✅ Encontrados ${tenRealWithdrawals.length} saques de R$ 10,00`);

    } catch (error) {
      const errorMsg = `Erro na investigação: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌', errorMsg);
      debugInfo.errors.push(errorMsg);
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
      message: 'Investigação do sistema de saques concluída'
    });

  } catch (error) {
    console.error('❌ Erro geral na investigação de saques:', error);
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