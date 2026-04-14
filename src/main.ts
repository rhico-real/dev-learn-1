import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Set Global Prefix
    app.setGlobalPrefix('api/v1', {
        exclude: ['health'],
    });

    // Add helmet
    app.use(helmet());

    // Add ValidationPipe with ForbidNonWhiteListed
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.enableCors({
        origin: process.env.CORS_ORIGIN,
    });

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
