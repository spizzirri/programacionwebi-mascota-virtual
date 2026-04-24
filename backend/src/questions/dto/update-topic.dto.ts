import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTopicDto {
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @IsOptional()
    startDate?: Date;

    @IsOptional()
    endDate?: Date;
}
