import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment, User, WalletTransaction } from '@/lib/models';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Buscar todos os pagamentos pendentes do usuário
    const pendingPayments = await Payment.find({
      userId: authResult.userId,
      status: 'pending',
      expiresAt: { $gt: new Date() } // Não expirados
    });

    console.log(`Encontrados ${pendingPayments.length} pagamentos pendentes para sincronizar`);

    let updatedCount = 0;
    let paidCount = 0;
    const results = [];

    for (const payment of pendingPayments) {
      try {
        // Consultar status na PrimePag
        let primepagStatus;
        let accountUsed = 1;
        
                 try {
           primepagStatus = await primepagService.getPixStatus(payment.referenceCode || '', 1);
           accountUsed = 1;
         } catch (error) {
           try {
             primepagStatus = await primepagService.getPixStatus(payment.referenceCode || '', 2);
             accountUsed = 2;
           } catch (error2) {
            console.error(`Erro ao consultar status do PIX ${payment.referenceCode}:`, error);
            results.push({
              referenceCode: payment.referenceCode,
              error: 'Erro ao consultar status na PrimePag'
            });
            continue;
          }
        }

        console.log(`PIX ${payment.referenceCode} - Status na PrimePag (conta ${accountUsed}):`, primepagStatus.status);

        // Se o status mudou, atualizar
        if (primepagStatus.status && primepagStatus.status !== payment.status) {
          const oldStatus = payment.status;
          payment.status = primepagStatus.status;
          
          if (primepagStatus.status === 'paid' && primepagStatus.paid_at) {
            payment.paidAt = new Date(primepagStatus.paid_at);
            
            // Creditar na carteira do usuário
            const user = await User.findById(payment.userId);
            if (user) {
              const creditAmount = payment.amount * 0.8; // 80% do valor
              const balanceBefore = user.balance;
              
              user.balance += creditAmount;
              user.totalEarnings += creditAmount;
              await user.save();

              // Criar transação na carteira
              await WalletTransaction.create({
                userId: user._id,
                type: 'credit',
                amount: creditAmount,
                description: `Pagamento PIX aprovado - ${payment.description}`,
                paymentId: payment._id,
                balanceBefore: balanceBefore,
                balanceAfter: user.balance
              });

              console.log(`Creditado R$ ${creditAmount.toFixed(2)} para usuário ${user.username}`);
              paidCount++;
            }
          }
          
          await payment.save();
          updatedCount++;
          
          results.push({
            referenceCode: payment.referenceCode,
            oldStatus,
            newStatus: primepagStatus.status,
            updated: true
          });
        } else {
          results.push({
            referenceCode: payment.referenceCode,
            status: primepagStatus.status,
            updated: false,
            message: 'Status já atualizado'
          });
        }
      } catch (error) {
        console.error(`Erro ao processar pagamento ${payment.referenceCode}:`, error);
        results.push({
          referenceCode: payment.referenceCode,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída. ${updatedCount} pagamentos atualizados, ${paidCount} pagamentos aprovados.`,
      stats: {
        totalChecked: pendingPayments.length,
        updated: updatedCount,
        paid: paidCount
      },
      results
    });

  } catch (error) {
    console.error('Erro na sincronização de status:', error);
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