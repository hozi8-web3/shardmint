import mongoose, { Schema, Document, Model } from 'mongoose'

export interface InteractionDocument extends Document {
  walletAddress: string
  sessionId: string
  startedAt: Date
  completedAt?: Date
  hasMinted: boolean
  contractAddress?: string
  transactionHash?: string
  tokenName?: string
  tokenSymbol?: string
  totalSupply?: string
  metadata?: Record<string, any>
  userAgent?: string
  ip?: string
}

const InteractionSchema = new Schema<InteractionDocument>({
  walletAddress: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  startedAt: { type: Date, required: true, default: Date.now },
  completedAt: { type: Date },
  hasMinted: { type: Boolean, required: true, default: false },
  contractAddress: { type: String },
  transactionHash: { type: String },
  tokenName: { type: String },
  tokenSymbol: { type: String },
  totalSupply: { type: String },
  metadata: { type: Schema.Types.Mixed },
  userAgent: { type: String },
  ip: { type: String }
}, { timestamps: true })

InteractionSchema.index({ walletAddress: 1, sessionId: 1 }, { unique: true })

export const Interaction: Model<InteractionDocument> = mongoose.models.Interaction || mongoose.model<InteractionDocument>('Interaction', InteractionSchema)


