import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../../../infrastructure/redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { v4 as uuid } from 'uuid';
import { RegisterDto } from "./dto/register.dto";
import { SystemRole } from "../../../shared/types/enums";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from 'bcrypt';
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private redisService: RedisService,
        private configService: ConfigService
    ) { }

    private async generateTokens(userId: string, role: string) {
        const jti = uuid();

        const accessToken = this.jwtService.sign(
            { sub: userId, role, jti }
        );

        const refreshTokenId = uuid();

        const refreshKey = `auth:refresh:${userId}:${refreshTokenId}`;
        const refreshTtl = this.configService.get<number>('JWT_REFRESH_TTL', 604800); // 7 days
        await this.redisService.setex(refreshKey, refreshTtl, 'valid');

        const refreshToken = `${userId}:${refreshTokenId}`;

        return { accessToken, refreshToken };
    }

    async register(dto: RegisterDto) {
        // check if email already exists
        const existing = await this.userService.findByEmail(dto.email);

        // if exist, throw conflictException
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        // create user
        const user = await this.userService.create(dto);

        // generate tokens
        const tokens = await this.generateTokens(user.id, SystemRole.USER);

        // return tokens and user
        return { ...tokens, user };
    }

    async login(dto: LoginDto) {
        // find user by email
        const user = await this.userService.findByEmail(dto.email);

        // if not found, throw UnauthorizedException invalid credentials
        /**
         * Ngano invalid credentials man?
         * This is because para dili ma guess sa attacker kung
         * ang email is ga exist or wala ba sa system.
         */
        if (!user) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const { password, ...userResult } = user;

        // compare password via bcrypt
        const isMatch = await bcrypt.compare(dto.password, password);

        if (!isMatch) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        // generate tokens
        const tokens = await this.generateTokens(userResult.id, userResult.role);

        // return tokens and user
        return { ...tokens, user: userResult };
    }

    async refresh(dto: RefreshTokenDto) {
        // parse refreshtoken
        const [userId, refreshTokenId] = dto.refreshToken.split(':');

        // build the redis key
        const redisKey = `auth:refresh:${userId}:${refreshTokenId}`;

        // look up key
        const redisLookup = await this.redisService.get(redisKey);

        // if not found -> UnauthorizedException invalid refresh token
        if (!redisLookup) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // delete old refresh token
        await this.redisService.del(redisKey);

        // generate new tokens
        const user = await this.userService.findById(userId);
        const tokens = await this.generateTokens(userId, user.role);

        return { ...tokens, user };
    }

    async logout(jti: string, userId: string) {
        // store the access token's jti as blacklist
        const blacklistKey = `auth:blacklist:${jti}`;
        const ttl = this.configService.get<number>('JWT_EXPIRY', 900);
        await this.redisService.setex(blacklistKey, ttl, 'revoke');

        // delete the user's refresh tokens
        const patternKey = `auth:refresh:${userId}:*`;
        await this.redisService.delByPattern(patternKey);
    }

}