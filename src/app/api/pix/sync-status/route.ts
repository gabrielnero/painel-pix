import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment, User, WalletTransaction } from '@/lib/models';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIANDO SINCRONIZAÇÃO DE STATUS PIX ===');
    
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log(`Usuário autenticado: ${authResult.userId} (${authResult.role})`);

    await connectToDatabase();

    // Buscar todos os pagamentos pendentes do usuário
    const pendingPayments = await Payment.find({
      userId: authResult.userId,
      status: { $in: ['pending', 'awaiting_payment'] },
      expiresAt: { $gt: new Date() } // Não expirados
    });

    console.log(`Encontrados ${pendingPayments.length} pagamentos pendentes para sincronizar`);

    if (pendingPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum pagamento pendente encontrado para sincronizar',
        stats: {
          totalChecked: 0,
          updated: 0,
          paid: 0
        },
        results: []
      });
    }

    let updatedCount = 0;
    let paidCount = 0;
    const results = [];

    for (const payment of pendingPayments) {
      console.log(`\n--- Processando PIX: ${payment.referenceCode} ---`);
      
      try {
        let primepagStatus;
        let accountUsed = 1;
        let lastError;
        
        // Primeiro tentar a conta salva no pagamento, se disponível
        if (payment.primepagAccount) {
          console.log(`Tentando conta salva: ${payment.primepagAccount}`);
          try {
            primepagStatus = await primepagService.getPixStatus(payment.referenceCode || '', payment.primepagAccount);
            accountUsed = payment.primepagAccount;
            console.log(`✅ Status obtido da conta ${accountUsed}: ${primepagStatus.status}`);
          } catch (error) {
            console.log(`❌ Erro na conta ${payment.primepagAccount}:`, error instanceof Error ? error.message : error);
            lastError = error;
            
            // Se der erro na conta salva, tentar a outra conta
            const otherAccount = payment.primepagAccount === 1 ? 2 : 1;
            console.log(`Tentando conta alternativa: ${otherAccount}`);
            try {
              primepagStatus = await primepagService.getPixStatus(payment.referenceCode || '', otherAccount);
              accountUsed = otherAccount;
              console.log(`✅ Status obtido da conta ${accountUsed} (fallback): ${primepagStatus.status}`);
              
              // Atualizar a conta no pagamento
              payment.primepagAccount = otherAccount;
            } catch (error2) {
              console.log(`❌ Erro também na conta ${otherAccount}:`, error2 instanceof Error ? error2.message : error2);
              throw lastError;
            }
          }
        } else {
          // Se não tem conta salva, tentar ambas as contas
          console.log('Nenhuma conta salva, tentando ambas...');
          try {
            console.log('Tentando conta 1...');
            primepagStatus = await primepagService.getPixStatus(payment.referenceCode || '', 1);
            accountUsed = 1;
            console.log(`✅ Status obtido da conta ${accountUsed}: ${primepagStatus.status}`);
            
            // Salvar a conta que funcionou
            payment.primepagAccount = 1;
          } catch (error) {
            console.log(`❌ Erro na conta 1:`, error instanceof Error ? error.message : error);
            lastError = error;
            
            try {
              console.log('Tentando conta 2...');
              primepagStatus = await primepagService.getPixStatus(payment.referenceCode || '', 2);
              accountUsed = 2;
              console.log(`✅ Status obtido da conta ${accountUsed}: ${primepagStatus.status}`);
              
              // Salvar a conta que funcionou
              payment.primepagAccount = 2;
            } catch (error2) {
              console.log(`❌ Erro também na conta 2:`, error2 instanceof Error ? error2.message : error2);
              throw lastError;
            }
          }
        }

        // Mapear status da PrimePag para nosso sistema
        const statusMapping: { [key: string]: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment' } = {
          'pending': 'pending',
          'awaiting_payment': 'awaiting_payment',
          'paid': 'paid',
          'completed': 'paid',
          'expired': 'expired',
          'cancelled': 'cancelled',
          'canceled': 'cancelled',
          'error': 'cancelled'
        };

        const mappedStatus = primepagStatus.status ? (statusMapping[primepagStatus.status] || 'pending') : 'pending';
        console.log(`Status mapeado: ${primepagStatus.status} -> ${mappedStatus}`);

        // Se o status mudou, atualizar
        if (mappedStatus !== payment.status) {
          const oldStatus = payment.status;
          payment.status = mappedStatus;
          
          console.log(`Atualizando status: ${oldStatus} -> ${mappedStatus}`);
          
          if (mappedStatus === 'paid') {
            if (primepagStatus.paid_at) {
              payment.paidAt = new Date(primepagStatus.paid_at);
            }
            
            // Creditar na carteira do usuário apenas se ainda não foi creditado
            if (oldStatus !== 'paid') {
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
                  description: `Pagamento PIX aprovado (sync) - ${payment.description}`,
                  paymentId: payment._id,
                  balanceBefore: balanceBefore,
                  balanceAfter: user.balance
                });

                console.log(`💰 Creditado R$ ${creditAmount.toFixed(2)} para usuário ${user.username}`);
                paidCount++;
              } else {
                console.error(`❌ Usuário não encontrado: ${payment.userId}`);
              }
            }
          }
          
          await payment.save();
          updatedCount++;
          
          results.push({
            referenceCode: payment.referenceCode,
            oldStatus,
            newStatus: mappedStatus,
            accountUsed,
            updated: true
          });
        } else {
          console.log(`Status já atualizado: ${mappedStatus}`);
          results.push({
            referenceCode: payment.referenceCode,
            status: mappedStatus,
            accountUsed,
            updated: false,
            message: 'Status já atualizado'
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar pagamento ${payment.referenceCode}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        results.push({
          referenceCode: payment.referenceCode,
          error: errorMessage,
          updated: false
        });
        
        // Se o erro indica que o PIX não foi encontrado, pode ter expirado
        if (errorMessage.includes('404') || errorMessage.includes('não encontrado')) {
          console.log(`PIX ${payment.referenceCode} pode ter expirado, marcando como expirado`);
          try {
            payment.status = 'expired';
            await payment.save();
            updatedCount++;
            
            results[results.length - 1] = {
              referenceCode: payment.referenceCode,
              oldStatus: payment.status,
              newStatus: 'expired',
              updated: true,
              message: 'Marcado como expirado (não encontrado na PrimePag)'
            };
          } catch (saveError) {
            console.error(`Erro ao marcar PIX como expirado:`, saveError);
          }
        }
      }
    }

    console.log(`\n=== SINCRONIZAÇÃO CONCLUÍDA ===`);
    console.log(`Total verificado: ${pendingPayments.length}`);
    console.log(`Atualizados: ${updatedCount}`);
    console.log(`Pagos: ${paidCount}`);

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
    console.error('❌ Erro na sincronização de status:', error);
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