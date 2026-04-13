import { TargetType } from '@prisma/client';
import { IsEnum, IsString, IsUUID } from 'class-validator';

export class CreateFollowDto {
    @IsUUID()
    targetId!: string;

    @IsEnum(TargetType)
    targetType!: TargetType;
}
