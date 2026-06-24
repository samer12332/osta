import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProposalDocument = Proposal & Document;

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  technicianId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, trim: true })
  estimatedTime: string;

  @Prop({ type: String, trim: true, default: null })
  description: string | null;

  @Prop({
    type: String,
    enum: Object.values(ProposalStatus),
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
ProposalSchema.index({ postId: 1, technicianId: 1 }, { unique: true });
