import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import * as interfaces from '../../../shared/types/interfaces';

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
}
