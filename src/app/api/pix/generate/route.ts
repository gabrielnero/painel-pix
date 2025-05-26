import { NextRequest, NextResponse } from 'next/server';
import { primepagService } from '@/lib/services/primepag';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      description, 
      customer,
      expiresIn,
      callbackUrl,
      metadata 
    } = body;

    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar campos obrigatórios
    if (!amount || !description) {
      return NextResponse.json(
        { success: false, message: 'Valor e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar valor mínimo
    if (amount < 1) {
      return NextResponse.json(
        { success: false, message: 'Valor mínimo é R$ 1,00' },
        { status: 400 }
      );
    }

    // Validar dados do cliente se fornecidos
    if (customer) {
      if (customer.document && !isValidDocument(customer.document)) {
        return NextResponse.json(
          { success: false, message: 'CPF/CNPJ inválido' },
          { status: 400 }
        );
      }

      if (customer.email && !isValidEmail(customer.email)) {
        return NextResponse.json(
          { success: false, message: 'Email inválido' },
          { status: 400 }
        );
      }
    }

    // Gerar QR Code PIX usando a API real do PrimePag
    const qrCodeResponse = await primepagService.generatePixQRCode({
      value_cents: Math.round(amount * 100), // Converter para centavos
      generator_name: customer?.name,
      generator_document: customer?.document,
      expiration_time: expiresIn || 1800, // Default 30 minutos
      external_reference: authResult.userId // Usar o userId para validação posterior
    });

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('QR Code Response:', JSON.stringify(qrCodeResponse, null, 2));
    }

    // Em modo de desenvolvimento, salvar no localStorage em vez do banco
    const expirationDate = new Date(Date.now() + ((expiresIn || 1800) * 1000));
    const paymentData = {
      id: qrCodeResponse.qrcode.reference_code,
      userId: authResult.userId,
      amount: amount,
      description: description,
      status: 'pending',
      pixCopiaECola: qrCodeResponse.qrcode.content,
      qrCodeImage: qrCodeResponse.qrcode.image_base64,
      referenceCode: qrCodeResponse.qrcode.reference_code,
      idempotentId: qrCodeResponse.qrcode.reference_code,
      expiresAt: expirationDate,
      createdAt: new Date()
    };

    // Em modo de desenvolvimento, apenas logar o pagamento
    if (process.env.NODE_ENV === 'development') {
      console.log('Pagamento PIX gerado (modo localhost):', {
        id: paymentData.id,
        amount: paymentData.amount,
        referenceCode: paymentData.referenceCode,
        status: paymentData.status
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentData.id,
        amount: amount,
        status: 'pending',
        pixCopiaECola: qrCodeResponse.qrcode.content,
        qrCodeImage: qrCodeResponse.qrcode.image_base64,
        expiresAt: expirationDate.toISOString(),
        referenceCode: qrCodeResponse.qrcode.reference_code,
        customer: customer,
        metadata: metadata
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao gerar pagamento PIX',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Funções auxiliares de validação
function isValidDocument(document: string): boolean {
  // Remove caracteres não numéricos
  const numbers = document.replace(/\D/g, '');
  
  // Validar CPF ou CNPJ
  return numbers.length === 11 || numbers.length === 14;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 