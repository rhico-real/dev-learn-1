import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedUser } from "../types/interfaces";

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        return {
            userId: user.userId,
            role: user.role,
            jti: user.jti
        }
    }
)