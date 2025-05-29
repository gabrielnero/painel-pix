import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { primepagService } from '@/lib/services/primepag';
import { connectToDatabase } from '@/lib/db';
import { AdminWithdrawal } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIANDO SAQUE DE LUCRO ADMINISTRATIVO ===');
    
    // Verificar autenticação e permissão de admin
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📋 Dados recebidos:', {
      amount: body.amount,
      pixKey: body.pixKey ? `${body.pixKey.substring(0, 5)}***` : 'VAZIO',
      pixKeyType: body.pixKeyType,
      receiverName: body.receiverName,
      hasAllFields: !!(body.amount && body.pixKey && body.pixKeyType && body.receiverName && body.receiverDocument)
    });
    
    const { amount, pixKey, pixKeyType, receiverName, receiverDocument, notes } = body;
    
    // Validações básicas
    if (!amount || !pixKey || !pixKeyType || !receiverName || !receiverDocument) {
      console.error('❌ Dados obrigatórios em falta');
      return NextResponse.json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Valor deve ser maior que zero'
      }, { status: 400 });
    }

    // Validar CPF
    const documentClean = receiverDocument.replace(/\D/g, '');
    if (documentClean.length !== 11) {
      return NextResponse.json({
        success: false,
        message: 'CPF deve ter 11 dígitos'
      }, { status: 400 });
    }

    console.log('✅ Validações passaram');
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Criar registro de saque administrativo
    const withdrawalRecord: AdminWithdrawal = {
      adminId: new mongoose.Types.ObjectId(authResult.userId),
      adminEmail: `admin-${authResult.userId}@sistema.com`,
      amount: Math.round(amount * 100), // Converter para centavos
      pixKey,
      pixKeyType,
      receiverName,
      receiverDocument: documentClean,
      status: 'pending',
      reason: 'admin_profit',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Salvando registro no banco...');
    
    // Usar mongoose connection ao invés de MongoDB driver
    const db = mongoose.connection.db;
    const insertResult = await db.collection('admin_withdrawals').insertOne(withdrawalRecord);
    
    if (!insertResult.insertedId) {
      throw new Error('Falha ao salvar registro no banco');
    }

    console.log('✅ Registro salvo com ID:', insertResult.insertedId);
    
    // Preparar dados para o PIX
    const pixPaymentData = {
      initiation_type: 'dict' as const,
      idempotent_id: `admin_profit_${insertResult.insertedId}_${Date.now()}`,
      receiver_name: receiverName,
      receiver_document: documentClean,
      value_cents: Math.round(amount * 100),
      pix_key_type: pixKeyType,
      pix_key: pixKey,
      authorized: true,
      account: 1 as const
    };
    
    console.log('🚀 Enviando PIX via PrimePag...');
    
    try {
      // Atualizar status para processando
      await db.collection('admin_withdrawals').updateOne(
        { _id: insertResult.insertedId },
        { 
          $set: { 
            status: 'processing',
            updatedAt: new Date()
          }
        }
      );

      // Criar PIX payment
      const pixPayment = await primepagService.sendPixPayment(pixPaymentData);
      
      console.log('✅ PIX criado:', {
        id: pixPayment.id,
        status: pixPayment.status,
        value_cents: pixPayment.value_cents
      });

      // Atualizar registro com dados do PIX
      await db.collection('admin_withdrawals').updateOne(
        { _id: insertResult.insertedId },
        { 
          $set: { 
            pixPaymentId: pixPayment.id,
            status: pixPayment.status === 'completed' ? 'completed' : 'processing',
            processedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ Saque administrativo processado com sucesso');

      return NextResponse.json({
        success: true,
        message: 'Saque de lucro processado com sucesso',
        withdrawal: {
          id: insertResult.insertedId,
          amount: amount,
          pixPaymentId: pixPayment.id,
          status: pixPayment.status,
          createdAt: withdrawalRecord.createdAt
        },
        pixPayment: {
          id: pixPayment.id,
          status: pixPayment.status,
          value_cents: pixPayment.value_cents,
          receiver_name: pixPayment.receiver_name,
          created_at: pixPayment.created_at
        }
      });

    } catch (pixError) {
      console.error('❌ Erro ao processar PIX:', pixError);
      
      // Atualizar status para falha
      await db.collection('admin_withdrawals').updateOne(
        { _id: insertResult.insertedId },
        { 
          $set: { 
            status: 'failed',
            failureReason: pixError instanceof Error ? pixError.message : 'Erro desconhecido',
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        success: false,
        message: `Erro ao processar PIX: ${pixError instanceof Error ? pixError.message : 'Erro desconhecido'}`,
        withdrawalId: insertResult.insertedId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO no saque administrativo:', error);
    
    return NextResponse.json({
      success: false,
      message: `Erro ao processar saque: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 