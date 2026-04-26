import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

export type QuestionBase = Omit<Question, '_id'>;

@Schema()
export class Question {
    _id?: any;

    @Prop({ required: true })
    text: string;

    @Prop({ required: true })
    topic: string;

    @Prop()
    answer?: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
