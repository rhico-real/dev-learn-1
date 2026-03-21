import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

export class UpdateUserDto{
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    displayName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsUrl()
    avatar?: string
}