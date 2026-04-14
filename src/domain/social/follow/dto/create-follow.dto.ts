import { TargetType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateFollowDto {
    @IsUUID()
    targetId!: string;

    @IsEnum(TargetType)
    targetType!: TargetType;
}
