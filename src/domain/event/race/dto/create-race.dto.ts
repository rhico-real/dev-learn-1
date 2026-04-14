import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class CreateRaceDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @IsNumber()
    @Min(0)
    distance!: number;

    @IsString()
    unit!: string;

    @IsInt()
    @Min(1)
    maxParticipants!: number;

    @IsInt()
    @Min(0)
    price!: number;

    @IsOptional()
    @IsString()
    currency?: string = 'PHP';
}
