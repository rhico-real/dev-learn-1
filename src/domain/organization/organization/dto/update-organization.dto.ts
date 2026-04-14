import {
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdateOrganizationDto {
    // name
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    // description
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    // logo
    @IsOptional()
    @IsUrl()
    logo?: string;

    // banner
    @IsOptional()
    @IsUrl()
    banner?: string;
}
