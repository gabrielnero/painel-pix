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
      console.log('=== INICIANDO GERAÇÃO DE PIX (v2) ===');
      console.log('Dados recebidos:', { amount, description, account: account || 1 });
      
      // Validar configurações do sistema antes de gerar PIX
      console.log('Validando configurações do sistema...');
      const configValidation = await validatePixConfig();
      console.log('Resultado da validação:', configValidation);
      
      if (!configValidation.valid) {
        console.log('Configurações inválidas:', configValidation.missing);
        return NextResponse.json({
          success: false,
          message: `Configurações incompletas: ${configValidation.missing.join(', ')}. Configure no painel administrativo.`,
          missingConfigs: configValidation.missing
        }, { status: 400 });
      }

      console.log('Preparando dados para PrimePag...');
      const pixData = {
        value_cents: Math.round(amount * 100), // Converter para centavos
        generator_name: customer?.name || 'Cliente',
        generator_document: customer?.document || '11144477735', // CPF válido como padrão
        expiration_time: expiresIn || 1800, // 30 minutos por padrão
        external_reference: authResult.userId, // Usar ID do usuário como referência
        account: account || 1 // Usar conta especificada ou conta 1 como padrão
      };
      console.log('Dados para PrimePag:', pixData);

      console.log('Chamando PrimePag service...');
      primepagResponse = await primepagService.generatePixQRCode(pixData);

      console.log('PIX gerado via PrimePag com sucesso:', {
        hasQrcode: !!primepagResponse?.qrcode,
        hasContent: !!primepagResponse?.qrcode?.content,
        hasImage: !!primepagResponse?.qrcode?.image_base64,
        referenceCode: primepagResponse?.qrcode?.reference_code
      });
    } catch (primepagError) {
      console.error('=== ERRO DETALHADO NA PRIMEPAG ===');
      console.error('Tipo do erro:', typeof primepagError);
      console.error('Erro completo:', primepagError);
      console.error('Message:', primepagError instanceof Error ? primepagError.message : String(primepagError));
      console.error('Stack:', primepagError instanceof Error ? primepagError.stack : 'N/A');
      
      return NextResponse.json({
        success: false,
        message: 'Erro ao gerar PIX na PrimePag',
        error: primepagError instanceof Error ? primepagError.message : String(primepagError),
        details: {
          type: typeof primepagError,
          stack: primepagError instanceof Error ? primepagError.stack : undefined
        }
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
  
  // Validar CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (numbers.length === 11) {
    return isValidCPF(numbers);
  } else if (numbers.length === 14) {
    return isValidCNPJ(numbers);
  }
  
  return false;
}

function isValidCPF(cpf: string): boolean {
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  if (parseInt(cpf[9]) !== digit1) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(cpf[10]) === digit2;
}

function isValidCNPJ(cnpj: string): boolean {
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  // Validar primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  if (parseInt(cnpj[12]) !== digit1) return false;
  
  // Validar segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(cnpj[13]) === digit2;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 