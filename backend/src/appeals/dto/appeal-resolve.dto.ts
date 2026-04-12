import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AppealResolveDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['accepted', 'rejected'], { message: 'Status must be either "accepted" or "rejected"' })
    status: 'accepted' | 'rejected';

    @IsString()
    @IsNotEmpty()
    feedback: string;
}
