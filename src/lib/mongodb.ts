import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

export interface AdminWithdrawal {
  _id?: ObjectId;
  adminId: ObjectId;
  adminEmail: string;
  amount: number; // em centavos
  pixKey: string;
  pixKeyType: string;
  receiverName: string;
  receiverDocument: string;
  pixPaymentId?: string; // ID do PIX da PrimePag
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reason: string; // "admin_profit", "system_maintenance", etc
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  failureReason?: string;
} 