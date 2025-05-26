import mongoose, { Schema, Document, Model } from 'mongoose';

// Interfaces
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'moderator' | 'admin';
  banned: boolean;
  balance: number;
  inviteCode?: string;
  invitedBy?: mongoose.Types.ObjectId;
  isVip: boolean;
  bannedBy?: mongoose.Types.ObjectId;
  bannedAt?: Date;
  banReason?: string;
  totalEarnings: number;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  profile: {
    avatar: string;
    bio: string;
    displayName: string;
    location: string;
    website: string;
    socialLinks: {
      telegram: string;
      twitter: string;
      instagram: string;
    };
    privacy: {
      showEmail: boolean;
      showBalance: boolean;
      allowComments: boolean;
      allowMessages: boolean;
    };
    stats: {
      profileViews: number;
      totalTransactions: number;
      reputation: number;
      badges: string[];
    };
  };
  settings: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      payments: boolean;
      comments: boolean;
    };
  };
  updatedAt: Date;
}

export interface IProfileComment extends Document {
  profileOwner: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  isPublic: boolean;
  likes: mongoose.Types.ObjectId[];
  replies: Array<{
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: 'payment' | 'comment' | 'like' | 'follow' | 'system' | 'achievement';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  pixCode: string;
  qrCodeUrl?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: Date;
  paidAt?: Date;
  customerInfo: {
    name?: string;
    email?: string;
    document?: string;
  };
  paymentMethod: string;
  commission: number;
  netAmount?: number;
  externalId?: string;
  webhookData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInviteCode extends Document {
  code: string;
  createdBy: mongoose.Types.ObjectId;
  usedBy?: mongoose.Types.ObjectId;
  isUsed: boolean;
  expiresAt?: Date;
  maxUses: number;
  currentUses: number;
  createdAt: Date;
  usedAt?: Date;
}

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'payment' | 'commission' | 'bonus';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  relatedPayment?: mongoose.Types.ObjectId;
  metadata?: any;
  createdAt: Date;
  completedAt?: Date;
}

export interface ISystemConfig extends Document {
  key: string;
  value: string;
  description?: string;
  isEncrypted: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  banned: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
  inviteCode: { type: String },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVip: { type: Boolean, default: false },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bannedAt: { type: Date },
  banReason: { type: String },
  totalEarnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  
  profile: {
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    displayName: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    socialLinks: {
      telegram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showBalance: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true }
    },
    stats: {
      profileViews: { type: Number, default: 0 },
      totalTransactions: { type: Number, default: 0 },
      reputation: { type: Number, default: 0 },
      badges: [{ type: String }]
    }
  },
  
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'pt-BR' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      comments: { type: Boolean, default: true }
    }
  },
  
  updatedAt: { type: Date, default: Date.now }
});

const profileCommentSchema = new mongoose.Schema({
  profileOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  isPublic: { type: Boolean, default: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['payment', 'comment', 'like', 'follow', 'system', 'achievement'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  pixCode: { type: String, required: true },
  qrCodeUrl: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'expired', 'cancelled'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  paidAt: { type: Date },
  customerInfo: {
    name: { type: String },
    email: { type: String },
    document: { type: String }
  },
  paymentMethod: { type: String, default: 'pix' },
  commission: { type: Number, default: 0 },
  netAmount: { type: Number },
  externalId: { type: String },
  webhookData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const inviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date },
  maxUses: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  usedAt: { type: Date }
});

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'payment', 'commission', 'bonus'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  relatedPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  description: { type: String },
  isEncrypted: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para atualizar updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

profileCommentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

systemConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Exportar modelos
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const ProfileComment = mongoose.models.ProfileComment || mongoose.model<IProfileComment>('ProfileComment', profileCommentSchema);
export const Follow = mongoose.models.Follow || mongoose.model<IFollow>('Follow', followSchema);
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
export const InviteCode = mongoose.models.InviteCode || mongoose.model<IInviteCode>('InviteCode', inviteCodeSchema);
export const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);
export const SystemConfig = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema); 