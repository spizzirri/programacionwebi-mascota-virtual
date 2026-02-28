import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnswerDocument = HydratedDocument<Answer>;

@Schema()
export class Answer {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    questionId: string;

    @Prop()
    questionText: string;

    @Prop()
    userAnswer: string;

    @Prop({ required: true, enum: ['correct', 'partial', 'incorrect'] })
    rating: string;

    @Prop()
    feedback: string;

    @Prop({ default: Date.now })
    timestamp: Date;

    @Prop({ default: 0 })
    streakAtMoment: number;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
