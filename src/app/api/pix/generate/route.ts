import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';
import { primepagService } from '@/lib/services/primepag';
import { validatePixConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      description, 
      customer,
      expiresIn,
      callbackUrl,
      metadata,
      account 
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

    // Gerar PIX usando a API da PrimePag primeiro
    let primepagResponse;
    try {
      // Validar configurações do sistema antes de gerar PIX
      const configValidation = await validatePixConfig();
      if (!configValidation.valid) {
        return NextResponse.json({
          success: false,
          message: `Configurações incompletas: ${configValidation.missing.join(', ')}. Configure no painel administrativo.`,
          missingConfigs: configValidation.missing
        }, { status: 400 });
      }

      primepagResponse = await primepagService.generatePixQRCode({
        value_cents: Math.round(amount * 100), // Converter para centavos
        generator_name: customer?.name || 'Cliente',
        generator_document: customer?.document || '12345678901',
        expiration_time: expiresIn || 1800, // 30 minutos por padrão
        external_reference: authResult.userId, // Usar ID do usuário como referência
        account: account || 1 // Usar conta especificada ou conta 1 como padrão
      });

      console.log('PIX gerado via PrimePag:', primepagResponse);
    } catch (primepagError) {
      console.error('Erro ao gerar PIX na PrimePag:', primepagError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao gerar PIX na PrimePag',
        error: primepagError instanceof Error ? primepagError.message : String(primepagError)
      }, { status: 500 });
    }

    // Tentar salvar no banco de dados
    try {
      await connectToDatabase();

      // Data de expiração
      const expirationDate = new Date(Date.now() + ((expiresIn || 1800) * 1000));

      // Salvar pagamento no banco
      const payment = await Payment.create({
        userId: authResult.userId,
        amount: amount,
        description: description,
        status: 'pending',
        pixCopiaECola: primepagResponse.qrcode.content,
        qrCodeImage: primepagResponse.qrcode.image_base64 || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(primepagResponse.qrcode.content)}`,
        referenceCode: primepagResponse.qrcode.reference_code,
        idempotentId: primepagResponse.qrcode.reference_code,
        expiresAt: expirationDate
      });

      console.log('Pagamento PIX criado:', payment._id);

      return NextResponse.json({
        success: true,
        payment: {
          id: payment._id,
          amount: amount,
          status: 'pending',
          pixCopiaECola: primepagResponse.qrcode.content,
          qrCodeImage: primepagResponse.qrcode.image_base64 || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(primepagResponse.qrcode.content)}`,
          expiresAt: expirationDate.toISOString(),
          referenceCode: primepagResponse.qrcode.reference_code,
          customer: customer,
          metadata: metadata
        }
      });

    } catch (dbError) {
      console.error('Erro detalhado ao salvar pagamento:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      
      // Se falhar ao salvar no banco, ainda retornar o PIX gerado
      return NextResponse.json({
        success: true,
        payment: {
          id: 'temp_' + Date.now(),
          amount: amount,
          status: 'pending',
          pixCopiaECola: primepagResponse.qrcode.content,
          qrCodeImage: primepagResponse.qrcode.image_base64 || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(primepagResponse.qrcode.content)}`,
          expiresAt: new Date(Date.now() + ((expiresIn || 1800) * 1000)).toISOString(),
          referenceCode: primepagResponse.qrcode.reference_code,
          customer: customer,
          metadata: metadata
        },
        warning: 'PIX gerado com sucesso, mas houve problema ao salvar no banco de dados'
      });
    }
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