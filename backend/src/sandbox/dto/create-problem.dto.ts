import { IsArray, IsString, IsNotEmpty, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class TestCaseDto {
    @IsArray()
    input: unknown[];

    expected: unknown;

    @IsBoolean()
    sample: boolean;
}

export class CreateProblemDto {
    @IsString()
    @IsNotEmpty({ message: 'title is required' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'description is required' })
    description: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'params must contain at least one param' })
    @IsString({ each: true })
    params: string[];

    @IsArray()
    @ArrayMinSize(1, { message: 'testCases must contain at least one test' })
    @ValidateNested({ each: true })
    @Type(() => TestCaseDto)
    testCases: TestCaseDto[];
}