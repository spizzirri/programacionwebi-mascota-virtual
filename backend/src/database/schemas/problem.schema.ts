import { Prop, Schema, SchemaFactory, PropOptions } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProblemDocument = HydratedDocument<Problem>;

export type ProblemBase = Omit<Problem, '_id'>;

export interface TestCase {
    input: unknown[];
    expected: unknown;
    sample: boolean;
}

export const TestCaseSchema = new MongooseSchema<TestCase>(
    {
        input: { type: [MongooseSchema.Types.Mixed], required: true },
        expected: { type: MongooseSchema.Types.Mixed, required: true },
        sample: { type: Boolean, required: true },
    },
    { _id: true },
);

@Schema({ timestamps: true })
export class Problem {
    _id?: any;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, type: [String] })
    params: string[];

    @Prop({ required: true, type: [TestCaseSchema] })
    testCases: TestCase[];

    @Prop({ default: true } satisfies PropOptions)
    active: boolean;
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);