import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsEnum(PaymentMethod)
    method!: PaymentMethod;

    @IsInt()
    @Min(1)
    amount!: number;

    @IsString()
    currency!: string;

    @IsString()
    proofImage!: string;
}
