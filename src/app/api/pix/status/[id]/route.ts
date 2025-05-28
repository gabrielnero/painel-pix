import { NextRequest, NextResponse } from 'next/server';
import { primepagService } from '@/lib/services/primepag';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`=== CONSULTANDO STATUS PIX: ${id} ===`);

    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Primeiro, tentar encontrar o pagamento no banco para saber qual conta usar
    const dbPayment = await Payment.findOne({
      $or: [
        { referenceCode: id },
        { _id: id },
        { idempotentId: id }
      ]
    });

    let payment;
    let accountUsed = 1;
    let lastError;

    if (dbPayment && dbPayment.primepagAccount) {
      // Se encontrou no banco, usar a conta correta primeiro
      console.log(`Pagamento encontrado no banco, tentando conta ${dbPayment.primepagAccount} primeiro`);
      
      try {
        payment = await primepagService.getPixStatus(id, dbPayment.primepagAccount);
        accountUsed = dbPayment.primepagAccount;
        console.log(`✅ Status consultado com sucesso na conta ${accountUsed}`);
      } catch (error) {
        console.log(`❌ Erro na conta ${dbPayment.primepagAccount}:`, error instanceof Error ? error.message : error);
        lastError = error;
        
        // Se der erro na conta salva, tentar a outra conta
        const otherAccount = dbPayment.primepagAccount === 1 ? 2 : 1;
        console.log(`Tentando conta ${otherAccount}...`);
        
        try {
          payment = await primepagService.getPixStatus(id, otherAccount);
          accountUsed = otherAccount;
          console.log(`✅ Status consultado com sucesso na conta ${accountUsed} (fallback)`);
          
          // Atualizar a conta no banco de dados para próximas consultas
          dbPayment.primepagAccount = otherAccount;
          await dbPayment.save();
          console.log(`Conta atualizada no banco para ${otherAccount}`);
        } catch (secondError) {
          console.log(`❌ Erro também na conta ${otherAccount}:`, secondError instanceof Error ? secondError.message : secondError);
          throw lastError; // Lançar o primeiro erro
        }
      }
    } else {
      // Se não encontrou no banco, tentar ambas as contas
      console.log('Pagamento não encontrado no banco, tentando ambas as contas...');
      
      // Tentar conta 1 primeiro
      try {
        console.log('Tentando conta 1...');
        payment = await primepagService.getPixStatus(id, 1);
        accountUsed = 1;
        console.log(`✅ Status consultado com sucesso na conta ${accountUsed}`);
      } catch (error) {
        console.log(`❌ Erro na conta 1:`, error instanceof Error ? error.message : error);
        lastError = error;
        
        // Tentar conta 2
        try {
          console.log('Tentando conta 2...');
          payment = await primepagService.getPixStatus(id, 2);
          accountUsed = 2;
          console.log(`✅ Status consultado com sucesso na conta ${accountUsed}`);
        } catch (secondError) {
          console.log(`❌ Erro também na conta 2:`, secondError instanceof Error ? secondError.message : secondError);
          
          // Se ambas as contas falharam, verificar se é 404 (PIX não encontrado)
          if (lastError instanceof Error && lastError.message.includes('404')) {
            return NextResponse.json(
              { success: false, message: 'PIX não encontrado em nenhuma das contas configuradas' },
              { status: 404 }
            );
          }
          
          throw lastError; // Lançar o primeiro erro se não for 404
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
      'cancelled': 'cancelled'
    };

    const mappedStatus = payment.status ? (statusMapping[payment.status] || 'pending') : 'pending';

    // Log para debug
    console.log('Status check - Payment data:', {
      referenceCode: id,
      accountUsed: accountUsed,
      paymentUserId: payment.external_reference,
      currentUserId: authResult.userId,
      userRole: authResult.role,
      originalStatus: payment.status,
      mappedStatus: mappedStatus
    });

    // Verificar se o pagamento pertence ao usuário atual (usando external_reference)
    const paymentUserId = payment.external_reference;
    if (paymentUserId && paymentUserId !== authResult.userId && authResult.role !== 'admin') {
      console.log('Acesso negado - Payment userId:', paymentUserId, 'Current userId:', authResult.userId);
      return NextResponse.json(
        { success: false, message: 'Não autorizado a visualizar este pagamento' },
        { status: 403 }
      );
    }

    // Normalizar o status para garantir consistência
    const normalizedPayment = {
      ...payment,
      status: mappedStatus,
      accountUsed: accountUsed
    };

    return NextResponse.json({
      success: true,
      payment: normalizedPayment
    });
  } catch (error) {
    console.error('Erro ao consultar status do PIX:', error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, message: 'PIX não encontrado' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { success: false, message: 'Erro de autenticação com PrimePag' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao consultar status do pagamento',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Rota para cancelar um pagamento PIX
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar status atual do pagamento
    const currentStatus = await primepagService.getPixStatus(id);

    // Verificar se o pagamento pertence ao usuário atual
    const paymentUserId = currentStatus.external_reference;
    if (paymentUserId && paymentUserId !== authResult.userId && authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado a cancelar este pagamento' },
        { status: 403 }
      );
    }

    // Verificar se o pagamento pode ser cancelado
    if (currentStatus.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Pagamento não pode ser cancelado no status atual' },
        { status: 400 }
      );
    }

    // Funcionalidade de cancelamento não disponível na API Primepag
    return NextResponse.json({
      success: false,
      message: 'Funcionalidade de cancelamento não disponível'
    }, { status: 501 });
  } catch (error) {
    console.error('Erro ao cancelar PIX:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao cancelar pagamento',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 