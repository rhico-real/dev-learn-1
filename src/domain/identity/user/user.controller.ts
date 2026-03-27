import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get('me')
    getMe(@CurrentUser() user: any) {
        return this.userService.findById(user.userId);
    }

    @Patch('me')
    patchMe(@CurrentUser() user: any, @Body() data: UpdateUserDto) {
        return this.userService.update(user.userId, data);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.userService.findById(id);
    }
}