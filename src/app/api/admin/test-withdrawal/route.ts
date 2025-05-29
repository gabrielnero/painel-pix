import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { primepagService } from '@/lib/services/primepag';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIANDO TESTE DE SAQUE ===');
    
    const body = await request.json();
    console.log('📋 Dados recebidos:', {
      pixKey: body.pixKey ? `${body.pixKey.substring(0, 5)}***` : 'VAZIO',
      pixKeyType: body.pixKeyType,
      receiverName: body.receiverName,
      hasPixKey: !!body.pixKey,
      pixKeyLength: body.pixKey?.length || 0
    });
    
    const { pixKey, pixKeyType, receiverName, receiverDocument } = body;
    
    // Validações básicas
    if (!pixKey || !pixKeyType || !receiverName || !receiverDocument) {
      console.error('❌ Dados obrigatórios em falta:', {
        hasPixKey: !!pixKey,
        hasPixKeyType: !!pixKeyType,
        hasReceiverName: !!receiverName,
        hasReceiverDocument: !!receiverDocument
      });
      return NextResponse.json({
        success: false,
        message: 'PIX key, tipo, nome e CPF do destinatário são obrigatórios'
      }, { status: 400 });
    }
    
    // Validar formato da chave PIX baseado no tipo
    console.log('🔍 Validando formato da chave PIX...');
    let pixKeyValid = true;
    let validationMessage = '';
    
    switch (pixKeyType) {
      case 'cpf':
        // Remover pontuação e validar se tem 11 dígitos
        const cpfClean = pixKey.replace(/\D/g, '');
        pixKeyValid = cpfClean.length === 11 && /^\d{11}$/.test(cpfClean);
        validationMessage = pixKeyValid ? 'CPF válido' : 'CPF deve ter 11 dígitos numéricos';
        console.log(`📄 Validação CPF: ${cpfClean} - ${validationMessage}`);
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        pixKeyValid = emailRegex.test(pixKey);
        validationMessage = pixKeyValid ? 'E-mail válido' : 'Formato de e-mail inválido';
        console.log(`📧 Validação E-mail: ${validationMessage}`);
        break;
        
      case 'phone':
        // Validar telefone brasileiro
        const phoneClean = pixKey.replace(/\D/g, '');
        pixKeyValid = phoneClean.length >= 10 && phoneClean.length <= 11;
        validationMessage = pixKeyValid ? 'Telefone válido' : 'Telefone deve ter 10-11 dígitos';
        console.log(`📱 Validação Telefone: ${phoneClean} - ${validationMessage}`);
        break;
        
      case 'random':
        // Chave aleatória deve ter formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        pixKeyValid = uuidRegex.test(pixKey);
        validationMessage = pixKeyValid ? 'Chave aleatória válida' : 'Chave aleatória deve ser um UUID válido';
        console.log(`🎲 Validação Chave Aleatória: ${validationMessage}`);
        break;
        
      default:
        pixKeyValid = false;
        validationMessage = 'Tipo de chave PIX inválido';
    }
    
    if (!pixKeyValid) {
      console.error(`❌ Chave PIX inválida: ${validationMessage}`);
      return NextResponse.json({
        success: false,
        message: `Chave PIX inválida: ${validationMessage}`
      }, { status: 400 });
    }
    
    console.log('✅ Validação da chave PIX passou');
    
    // Validar CPF do destinatário
    console.log('🔍 Validando CPF do destinatário...');
    const documentClean = receiverDocument.replace(/\D/g, '');
    if (documentClean.length !== 11 || !/^\d{11}$/.test(documentClean)) {
      console.error('❌ CPF do destinatário inválido:', {
        original: receiverDocument,
        cleaned: documentClean,
        length: documentClean.length
      });
      return NextResponse.json({
        success: false,
        message: 'CPF do destinatário deve ter 11 dígitos numéricos'
      }, { status: 400 });
    }
    console.log('✅ CPF do destinatário válido:', `${documentClean.substring(0, 3)}***`);
    
    // Gerar ID único para idempotência
    const idempotentId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 ID de idempotência gerado:', idempotentId);
    
    // Preparar dados para o PIX
    const pixPaymentData = {
      initiation_type: 'dict' as const,
      idempotent_id: idempotentId,
      receiver_name: receiverName,
      receiver_document: documentClean,
      value_cents: 100, // R$ 1,00 para teste
      pix_key_type: pixKeyType,
      pix_key: pixKey,
      authorized: true, // Autorizar automaticamente para teste
      account: 1 as const // Usar conta 1
    };
    
    console.log('📤 Dados que serão enviados para PrimePag:', {
      ...pixPaymentData,
      pix_key: `${pixPaymentData.pix_key.substring(0, 5)}***`,
      receiver_document: `${documentClean.substring(0, 3)}***`
    });
    
    console.log('🚀 Enviando PIX para PrimePag...');
    
    // Criar o PIX payment via PrimePag
    const pixPayment = await primepagService.sendPixPayment(pixPaymentData);
    
    console.log('✅ PIX criado com sucesso:', {
      id: pixPayment.id,
      status: pixPayment.status,
      value_cents: pixPayment.value_cents,
      receiver_name: pixPayment.receiver_name,
      pix_key: pixPayment.pix_key ? `${pixPayment.pix_key.substring(0, 5)}***` : undefined,
      created_at: pixPayment.created_at
    });
    
    // Log de análise do status inicial
    console.log('📊 Análise do status inicial:', {
      status: pixPayment.status,
      isAutoPending: pixPayment.status === 'authorization_pending',
      isAutoAuth: pixPayment.status === 'auto_authorization',
      isSent: pixPayment.status === 'sent',
      isCompleted: pixPayment.status === 'completed',
      isFailed: pixPayment.status === 'failed',
      isCanceled: pixPayment.status === 'cancelled'
    });
    
    // Aguardar um pouco e fazer uma consulta de status para ver se mudou
    console.log('⏳ Aguardando 2 segundos para consulta de status...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      console.log('🔍 Consultando status atualizado...');
      const statusCheck = await primepagService.getPixPaymentStatus(pixPayment.id, 1);
      
      console.log('📈 Status consultado:', {
        id: statusCheck.id,
        status: statusCheck.status,
        updated_at: statusCheck.updated_at,
        failure_reason: statusCheck.failure_reason,
        statusChanged: statusCheck.status !== pixPayment.status
      });
      
      // Se o status mudou para cancelado, investigar mais
      if (statusCheck.status === 'cancelled' || statusCheck.status === 'canceled') {
        console.error('🚫 PIX FOI CANCELADO! Investigando...');
        console.error('Possíveis causas:');
        console.error('1. Chave PIX não existe ou está inativa');
        console.error('2. Nome não confere com o dono da chave PIX');
        console.error('3. CPF não pertence ao dono da chave PIX');
        console.error('4. Conta de destino bloqueada ou inexistente');
        console.error('5. Valor muito baixo (R$ 1,00)');
        console.error('6. Timeout na validação');
        
        if (statusCheck.failure_reason) {
          console.error('Motivo do cancelamento:', statusCheck.failure_reason);
        }
      }
      
      // Retornar o status mais atual
      return NextResponse.json({
        success: true,
        message: 'PIX de teste criado com sucesso',
        pixPayment: statusCheck, // Retornar status atualizado
        validation: {
          pixKeyValid: true,
          pixKeyType,
          validationMessage
        },
        debug: {
          idempotentId,
          initialStatus: pixPayment.status,
          currentStatus: statusCheck.status,
          statusChanged: statusCheck.status !== pixPayment.status
        }
      });
      
    } catch (statusError) {
      console.error('⚠️ Erro ao consultar status (não é crítico):', statusError);
      
      // Retornar o PIX original mesmo se a consulta de status falhar
      return NextResponse.json({
        success: true,
        message: 'PIX de teste criado com sucesso (consulta de status falhou)',
        pixPayment,
        validation: {
          pixKeyValid: true,
          pixKeyType,
          validationMessage
        },
        debug: {
          idempotentId,
          statusCheckError: statusError instanceof Error ? statusError.message : 'Erro desconhecido'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO no teste de saque:', error);
    
    if (error instanceof Error) {
      console.error('Detalhes do erro:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Analisar mensagens de erro específicas da PrimePag
      if (error.message.includes('400')) {
        console.error('🚫 Erro 400 - Dados inválidos detectados pela PrimePag');
      } else if (error.message.includes('401')) {
        console.error('🔐 Erro 401 - Problema de autenticação');
      } else if (error.message.includes('422')) {
        console.error('📋 Erro 422 - Dados não passaram na validação da PrimePag');
      }
    }
    
    return NextResponse.json({
      success: false,
      message: `Erro ao criar PIX de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      error: process.env.NODE_ENV === 'development' ? {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error)
      } : undefined
    }, { status: 500 });
  }
} 