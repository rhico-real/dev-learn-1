import { Controller, Get, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { CurrentUser } from "src/shared/decorators/current-user.decorator";

@Controller('users')
export class UserController {
    constructor(private userService: UserService){}

    @Get('me')
    getMe(@CurrentUser() user: any){
        return this.userService.findById(user.userId);
    }

    @Patch('me')
    patchMe(@CurrentUser() user: any, data: any){
        return this.userService.update(user.userId, data);
    }

    @Get(':id')
    getById(id: string){
        return this.userService.findById(id);
    }
}