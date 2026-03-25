import { IsIn } from "class-validator";

export class UpdateRoleDto {
    @IsIn(['MEMBER', 'ADMIN'])
    role!: string;
}