import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsAfter } from "../../../../common/validators/is-after.validator";
import { Transform } from "class-transformer";

export class CreateEventDto {
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    location?: string;

    @IsOptional()
    @IsString()
    bannerImage?: string;

    @IsDateString()
    @Transform(({ value }) => new Date(value).toISOString())
    startDate!: string;

    @IsDateString()
    @Transform(({ value }) => new Date(value).toISOString())
    @IsAfter('startDate', { message: 'end date must be after start date' })
    endDate!: string;
}