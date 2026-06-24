import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Technician', required: true })
  technicianId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceEntity', default: null })
  serviceId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'MainRequest', required: true })
  requestId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, maxlength: 500 })
  comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ requestId: 1 }, { unique: true });
ReviewSchema.index({ technicianId: 1 });
ReviewSchema.index({ serviceId: 1 });
