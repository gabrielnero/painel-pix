import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { User, Payment, InviteCode } from '@/lib/models';

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

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem acessar estas estatísticas.' },
        { status: 403 }
      );
    }

    try {
      await connectToDatabase();

      // Buscar estatísticas de usuários
      const totalUsers = await User.countDocuments();
      const totalModerators = await User.countDocuments({ role: 'moderator' });
      const totalAdmins = await User.countDocuments({ role: 'admin' });
      const bannedUsers = await User.countDocuments({ banned: true });
      const vipUsers = await User.countDocuments({ isVip: true });

      // Buscar estatísticas de convites
      const activeInvites = await InviteCode.countDocuments({ used: false, expiresAt: { $gt: new Date() } });

      // Buscar estatísticas de pagamentos
      const totalPayments = await Payment.countDocuments();
      const pendingPayments = await Payment.countDocuments({ status: 'pending' });
      const paidPayments = await Payment.countDocuments({ status: 'paid' });

      // Calcular receita total
      const revenueResult = await Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      // Calcular crescimento mensal (últimos 30 dias vs 30 dias anteriores)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const recentPayments = await Payment.countDocuments({
        status: 'paid',
        paidAt: { $gte: thirtyDaysAgo }
      });

      const previousPayments = await Payment.countDocuments({
        status: 'paid',
        paidAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      });

      const monthlyGrowth = previousPayments > 0 
        ? ((recentPayments - previousPayments) / previousPayments) * 100 
        : 0;

      // Calcular crescimento semanal (últimos 7 dias vs 7 dias anteriores)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const recentWeekPayments = await Payment.countDocuments({
        status: 'paid',
        paidAt: { $gte: sevenDaysAgo }
      });

      const previousWeekPayments = await Payment.countDocuments({
        status: 'paid',
        paidAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
      });

      const weeklyGrowth = previousWeekPayments > 0 
        ? ((recentWeekPayments - previousWeekPayments) / previousWeekPayments) * 100 
        : 0;

      const stats = {
        totalUsers,
        totalModerators,
        totalAdmins,
        bannedUsers,
        vipUsers,
        activeInvites,
        totalPayments,
        pendingPayments,
        paidPayments,
        totalRevenue,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        weeklyGrowth: Math.round(weeklyGrowth * 100) / 100
      };

      return NextResponse.json({
        success: true,
        stats
      });

    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com o banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro ao buscar estatísticas administrativas:', error);
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