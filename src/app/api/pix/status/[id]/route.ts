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

    // Primeiro, tentar encontrar o pagamento no banco para saber qual conta usar
    await connectToDatabase();
    let payment;
    let accountUsed = 1;
    
    try {
      const dbPayment = await Payment.findOne({
        $or: [
          { referenceCode: id },
          { _id: id },
          { idempotentId: id }
        ]
      });

      if (dbPayment && dbPayment.primepagAccount) {
        // Se encontrou no banco, usar a conta correta
        console.log(`Usando conta ${dbPayment.primepagAccount} baseada no banco de dados`);
        try {
          payment = await primepagService.getPixStatus(id, dbPayment.primepagAccount);
          accountUsed = dbPayment.primepagAccount;
        } catch (error) {
          // Se der erro na conta salva, tentar a outra conta
          const otherAccount = dbPayment.primepagAccount === 1 ? 2 : 1;
          console.log(`Erro na conta ${dbPayment.primepagAccount}, tentando conta ${otherAccount}:`, error);
          payment = await primepagService.getPixStatus(id, otherAccount);
          accountUsed = otherAccount;
        }
      } else {
        // Se não encontrou no banco, tentar ambas as contas
        console.log('Pagamento não encontrado no banco, tentando ambas as contas...');
        try {
          payment = await primepagService.getPixStatus(id, 1);
          accountUsed = 1;
        } catch (error) {
          console.log('Erro na conta 1, tentando conta 2:', error);
          payment = await primepagService.getPixStatus(id, 2);
          accountUsed = 2;
        }
      }
    } catch (error) {
      console.error('Erro ao consultar status do PIX em ambas as contas:', error);
      
      // Se não conseguiu encontrar em nenhuma conta, retornar erro mais específico
      if (error instanceof Error && error.message.includes('404')) {
        return NextResponse.json(
          { success: false, message: 'PIX não encontrado em nenhuma das contas configuradas' },
          { status: 404 }
        );
      }
      
      throw error;
    }
    
    console.log(`Status consultado com sucesso na conta ${accountUsed}`);

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
    if (process.env.NODE_ENV === 'development') {
      console.log('Status check - Payment data:', {
        referenceCode: id,
        paymentUserId: payment.external_reference,
        currentUserId: authResult.userId,
        userRole: authResult.role,
        originalStatus: payment.status,
        mappedStatus: mappedStatus,
        fullPaymentData: payment
      });
    }

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
      status: mappedStatus
    };

    return NextResponse.json({
      success: true,
      payment: normalizedPayment
    });
  } catch (error) {
    console.error('Erro ao consultar status do PIX:', error);
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