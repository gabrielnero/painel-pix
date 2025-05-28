import { NextRequest, NextResponse } from 'next/server';
import { primepagService } from '@/lib/services/primepag';
import { verifyAuth } from '@/lib/auth';

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

    // Tentar consultar status do pagamento em ambas as contas
    let payment;
    let accountUsed = 1;
    
    try {
      // Tentar conta 1 primeiro
      payment = await primepagService.getPixStatus(id, 1);
      accountUsed = 1;
    } catch (error) {
      console.log('Erro na conta 1, tentando conta 2:', error);
      try {
        // Se falhar na conta 1, tentar conta 2
        payment = await primepagService.getPixStatus(id, 2);
        accountUsed = 2;
      } catch (error2) {
        console.error('Erro em ambas as contas:', { error1: error, error2 });
        throw error; // Lançar o erro original da conta 1
      }
    }
    
    console.log(`Status consultado com sucesso na conta ${accountUsed}`);

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('Status check - Payment data:', {
        referenceCode: id,
        paymentUserId: payment.external_reference,
        currentUserId: authResult.userId,
        userRole: authResult.role,
        paymentStatus: payment.status,
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
      status: payment.status || 'pending'
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