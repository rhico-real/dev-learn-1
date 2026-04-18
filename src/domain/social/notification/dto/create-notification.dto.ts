import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    @IsUUID()
    actorId!: string;

    @IsString()
    @IsUUID()
    postId!: string;

    @IsString()
    @IsUUID()
    @IsOptional()
    commentId?: string;
}
