import { IsString, IsNotEmpty } from 'class-validator';

export class RunCodeDto {
    @IsString()
    @IsNotEmpty({ message: 'problemId is required' })
    problemId: string;

    @IsString()
    @IsNotEmpty({ message: 'code is required' })
    code: string;
}