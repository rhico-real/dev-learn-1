import { IsEnum, IsString, Validate, ValidateIf } from 'class-validator';

export enum ReviewAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
}

export class ReviewPaymentDto {
    @IsEnum(ReviewAction)
    action!: ReviewAction;

    @ValidateIf((o) => o.action === ReviewAction.REJECT)
    @IsString()
    rejectionReason?: string;
}
