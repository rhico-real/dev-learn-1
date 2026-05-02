import { Platform } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
    @IsString()
    token!: string;

    @IsEnum(Platform)
    platform!: Platform;
}
