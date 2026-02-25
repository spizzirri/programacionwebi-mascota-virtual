import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppealDocument = Appeal & Document;

@Schema()
export class Appeal {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    userName: string;

    @Prop({ required: true })
    answerId: string;

    @Prop({ required: true })
    questionId: string;

    @Prop({ required: true })
    questionText: string;

    @Prop({ required: true })
    userAnswer: string;

    @Prop({ required: true })
    originalRating: string;

    @Prop({ required: true })
    originalFeedback: string;

    @Prop({ required: true, enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
    status: string;

    @Prop()
    professorFeedback?: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop()
    resolvedAt?: Date;
}

export const AppealSchema = SchemaFactory.createForClass(Appeal);
