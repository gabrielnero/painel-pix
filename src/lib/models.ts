import mongoose, { Schema, Document, Model } from 'mongoose';

// Definir interfaces para os documentos
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'moderator' | 'admin';
  banned: boolean;
  balance: number;
  inviteCode?: string;
  invitedBy?: string;
  isVip: boolean;
  bannedBy?: mongoose.Types.ObjectId;
  bannedAt?: Date;
  banReason?: string;
  totalEarnings: number;
  createdAt: Date;
  lastLogin?: Date;
}

export interface IInviteCode extends Document {
  code: string;
  createdBy: mongoose.Types.ObjectId;
  usedBy?: mongoose.Types.ObjectId;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  pixKey?: string;
  pixCopiaECola?: string;
  qrCodeImage?: string;
  referenceCode?: string;
  idempotentId?: string;
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  paymentId?: mongoose.Types.ObjectId;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

// Definir esquemas
const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  banned: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  },
  inviteCode: {
    type: String
  },
  invitedBy: {
    type: String
  },
  isVip: {
    type: Boolean,
    default: false
  },
  bannedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  bannedAt: {
    type: Date
  },
  banReason: {
    type: String
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

const InviteCodeSchema = new Schema<IInviteCode>({
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date
  }
});

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'expired', 'cancelled'],
    default: 'pending'
  },
  pixKey: {
    type: String
  },
  pixCopiaECola: {
    type: String
  },
  qrCodeImage: {
    type: String
  },
  referenceCode: {
    type: String
  },
  idempotentId: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
});

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Função auxiliar para lidar com os modelos no ambiente Next.js
const getModel = <T extends Document>(
  modelName: string,
  schema: Schema
): Model<T> => {
  // Verificar se estamos em um ambiente que suporta globalThis (servidor)
  if (typeof window === 'undefined') {
    // Usar a API de modelos do mongoose para evitar redefinições
    return mongoose.models[modelName] 
      ? (mongoose.models[modelName] as Model<T>) 
      : mongoose.model<T>(modelName, schema);
  } else {
    // No cliente, retornar um mock do modelo
    return null as any;
  }
};

// Exportar modelos usando a função auxiliar
export const User = getModel<IUser>('User', UserSchema);
export const InviteCode = getModel<IInviteCode>('InviteCode', InviteCodeSchema);
export const Payment = getModel<IPayment>('Payment', PaymentSchema);
export const WalletTransaction = getModel<IWalletTransaction>('WalletTransaction', WalletTransactionSchema); 