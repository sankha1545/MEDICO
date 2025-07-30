"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
// File: backend/models/wallet.ts
const mongoose_1 = __importStar(require("mongoose"));
const WalletTransactionSchema = new mongoose_1.Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { _id: false });
const WalletSchema = new mongoose_1.Schema({
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    transactions: { type: [WalletTransactionSchema], default: [] },
}, { timestamps: true });
exports.Wallet = mongoose_1.default.model('Wallet', WalletSchema);
