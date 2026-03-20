import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { SystemRole } from "../types/enums";
import { AuthenticatedUser } from "../types/interfaces";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector: Reflector){}

    async canActivate(context: ExecutionContext){
        const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (!requiredRoles){
            return true;
        }
        
        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user){
            return false;
        }

        if(user.role === SystemRole.SUPER_ADMIN){
            return true;
        }

        return requiredRoles.includes(user.role);
    }
}