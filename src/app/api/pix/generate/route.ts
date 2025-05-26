import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';
import { generatePixCode, generatePixQrCode } from '@/lib/pix';
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

    try {
      await connectToDatabase();

      // Validar configurações do sistema antes de gerar PIX
      const configValidation = await validatePixConfig();
      if (!configValidation.valid) {
        return NextResponse.json({
          success: false,
          message: `Configurações incompletas: ${configValidation.missing.join(', ')}. Configure no painel administrativo.`,
          missingConfigs: configValidation.missing
        }, { status: 400 });
      }

      // Gerar código PIX usando configurações do sistema
      const pixCode = await generatePixCode({
        value: amount,
        description: description,
        entityType: 'individual',
        name: customer?.name,
        document: customer?.document
      });

      // Gerar QR Code
      const qrCodeImage = generatePixQrCode(pixCode);

      // Criar referência única
      const referenceCode = `PIX${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Data de expiração
      const expirationDate = new Date(Date.now() + ((expiresIn || 1800) * 1000));

      // Salvar pagamento no banco
      const payment = await Payment.create({
        userId: authResult.userId,
        amount: amount,
        description: description,
        status: 'pending',
        pixCopiaECola: pixCode,
        qrCodeImage: qrCodeImage,
        referenceCode: referenceCode,
        idempotentId: referenceCode,
        expiresAt: expirationDate
      });

      console.log('Pagamento PIX criado:', payment._id);

      return NextResponse.json({
        success: true,
        payment: {
          id: payment._id,
          amount: amount,
          status: 'pending',
          pixCopiaECola: pixCode,
          qrCodeImage: qrCodeImage,
          expiresAt: expirationDate.toISOString(),
          referenceCode: referenceCode,
          customer: customer,
          metadata: metadata
        }
      });

    } catch (dbError) {
      console.error('Erro ao salvar pagamento:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao salvar pagamento no banco de dados',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
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