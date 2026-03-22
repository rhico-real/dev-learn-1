import { SystemRole } from "./enums";

export interface JwtPayload {
    sub: string,
    role: SystemRole,
    jti: string
}

export interface AuthenticatedUser {
    userId: string,
    role: SystemRole,
    jti: string
}

export interface PaginatedResponse<T> {
    data: T[],
    meta: {
        cursor: string | null,
        hasMore: boolean,
        limit: number
    }
}