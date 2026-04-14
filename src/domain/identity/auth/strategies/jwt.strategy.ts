import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { JwtPayload } from '../../../../shared/types/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private redis: RedisService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get<string>('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload) {
        const blacklisted = await this.redis.get(
            `auth:blacklist:${payload.jti}`,
        );

        if (blacklisted) {
            throw new UnauthorizedException('Token has been revoked');
        }

        return { userId: payload.sub, role: payload.role, jti: payload.jti };
    }
}
