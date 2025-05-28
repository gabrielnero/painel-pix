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
  // Novos campos de perfil
  profilePicture?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  profileViews: number;
  isProfilePublic: boolean;
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
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment';
  pixKey?: string;
  pixCopiaECola?: string;
  qrCodeImage?: string;
  referenceCode?: string;
  idempotentId?: string;
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  primepagAccount?: 1 | 2; // Salvar qual conta da PrimePag foi usada
}

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  paymentId?: mongoose.Types.ObjectId;
  withdrawalId?: mongoose.Types.ObjectId;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

export interface ISystemConfig extends Document {
  key: string;
  value: string;
  description?: string;
  isEncrypted: boolean;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

export interface IProfileComment extends Document {
  profileUserId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
}

export interface IShoutboxMessage extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  message: string;
  role: 'user' | 'moderator' | 'admin';
  profilePicture?: string;
  createdAt: Date;
}

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  processedAt?: Date;
  primepagTransactionId?: string;
  primepagAccount: 1 | 2;
  failureReason?: string;
  metadata?: mongoose.Schema.Types.Mixed;
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'payment_approved' | 'withdrawal_approved' | 'withdrawal_rejected' | 'system_announcement' | 'invite_used';
  title: string;
  message: string;
  read: boolean;
  data?: mongoose.Schema.Types.Mixed;
  createdAt: Date;
  expiresAt?: Date;
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
  },
  // Novos campos de perfil
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 200,
    default: ''
  },
  socialLinks: {
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' }
  },
  profileViews: {
    type: Number,
    default: 0
  },
  isProfilePublic: {
    type: Boolean,
    default: true
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
    enum: ['pending', 'paid', 'expired', 'cancelled', 'awaiting_payment'],
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
  },
  cancelledAt: {
    type: Date
  },
  primepagAccount: {
    type: Number,
    enum: [1, 2],
    default: 1
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
  withdrawalId: {
    type: Schema.Types.ObjectId,
    ref: 'Withdrawal'
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

const SystemConfigSchema = new Schema<ISystemConfig>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ProfileCommentSchema = new Schema<IProfileComment>({
  profileUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  }
});

const ShoutboxMessageSchema = new Schema<IShoutboxMessage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WithdrawalSchema = new Schema<IWithdrawal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  pixKey: {
    type: String,
    required: true
  },
  pixKeyType: {
    type: String,
    enum: ['cpf', 'cnpj', 'email', 'phone', 'random'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String
  },
  processedAt: {
    type: Date
  },
  primepagTransactionId: {
    type: String
  },
  primepagAccount: {
    type: Number,
    enum: [1, 2]
  },
  failureReason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
});

WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ status: 1, requestedAt: 1 });

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['payment_approved', 'withdrawal_approved', 'withdrawal_rejected', 'system_announcement', 'invite_used'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

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
export const SystemConfig = getModel<ISystemConfig>('SystemConfig', SystemConfigSchema);
export const ProfileComment = getModel<IProfileComment>('ProfileComment', ProfileCommentSchema);
export const ShoutboxMessage = getModel<IShoutboxMessage>('ShoutboxMessage', ShoutboxMessageSchema);
export const Withdrawal = getModel<IWithdrawal>('Withdrawal', WithdrawalSchema);
export const Notification = getModel<INotification>('Notification', NotificationSchema); 