import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Public } from "src/shared/decorators/public.decorator";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { CurrentUser } from "src/shared/decorators/current-user.decorator";
import * as interfaces from "src/shared/types/interfaces";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    //register
    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    //login
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    //refresh
    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }

    //logout
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: interfaces.AuthenticatedUser) {
        await this.authService.logout(user.jti, user.userId);
    }
}