// File: backend/models/wallet.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IWalletTransaction {
  amount: number;
  type: 'credit' | 'debit';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IWallet extends Document {
  doctorId: mongoose.Types.ObjectId;
  balance: number;
  transactions: IWalletTransaction[];
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const WalletSchema = new Schema<IWallet>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    transactions: { type: [WalletTransactionSchema], default: [] },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
