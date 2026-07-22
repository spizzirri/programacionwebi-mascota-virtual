import { IsArray, IsString, IsNotEmpty, IsBoolean, ValidateNested, ArrayMinSize, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TestCaseDto } from './create-problem.dto';

export class UpdateProblemDto {
    @IsString()
    @IsNotEmpty({ message: 'title cannot be empty' })
    @IsOptional()
    title?: string;

    @IsString()
    @IsNotEmpty({ message: 'description cannot be empty' })
    @IsOptional()
    description?: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'params must contain at least one param' })
    @IsString({ each: true })
    @IsOptional()
    params?: string[];

    @IsArray()
    @ArrayMinSize(1, { message: 'testCases must contain at least one test' })
    @ValidateNested({ each: true })
    @Type(() => TestCaseDto)
    @IsOptional()
    testCases?: TestCaseDto[];

    @IsBoolean()
    @IsOptional()
    active?: boolean;
}