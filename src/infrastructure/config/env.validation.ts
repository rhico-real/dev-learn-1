// class validator + class transformer
import { IsNumber, IsString, validateSync } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

export class EnvironmentVariables {
    @IsString()
    DATABASE_URL!: string;

    @IsString()
    REDIS_HOST!: string;

    @Type(() => Number)
    @IsNumber()
    REDIS_PORT!: number;

    @IsString()
    JWT_SECRET!: string;

    @IsString()
    JWT_ACCESS_EXPIRY!: string;

    @IsString()
    JWT_REFRESH_EXPIRY!: string;

    @Type(() => Number)
    @IsNumber()
    PORT!: number;

    @IsString()
    NODE_ENV!: string;

    @IsString()
    API_PREFIX!: string;

    @IsString()
    CORS_ORIGIN!: string;
}

export function validate(config: Record<string, unknown>){
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true
    });

    const errors = validateSync(validatedConfig);

    if(errors.length > 0){
        throw new Error(`Config validation error: ${errors.toString()}`);
    }

    return validatedConfig;
}