import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema()
export class Topic {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ default: true })
    enabled: boolean;

    @Prop({ type: Date })
    startDate?: Date;

    @Prop({ type: Date })
    endDate?: Date;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
