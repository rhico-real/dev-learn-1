import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import * as interfaces from '../../../shared/types/interfaces';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @Get('me')
    getMe(@CurrentUser() user: interfaces.AuthenticatedUser) {
        return this.userService.findById(user.userId);
    }

    @Patch('me')
    patchMe(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Body() data: UpdateUserDto,
    ) {
        return this.userService.update(user.userId, data);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.userService.findById(id);
    }

    @Post('me/device-token')
    registerDeviceToken(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Body() dto: RegisterDeviceTokenDto,
    ) {
        return this.userService.registerDeviceToken(user.userId, dto);
    }

    @Delete('me/device-token')
    removeDeviceToken(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Query('token') token: string,
    ) {
        return this.userService.removeDeviceToken(user.userId, token);
    }
}
