import { IsIn, IsOptional, IsUUID } from "class-validator";

export class AddMemberDto {
    @IsUUID()
    userId!: string;

    @IsOptional()
    @IsIn(['MEMBER', 'ADMIN'])
    role?: string = 'MEMBER'
}