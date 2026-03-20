export enum SystemRole {
    USER = "USER",
    SUPER_ADMIN = "SUPER_ADMIN"
}

export enum OrgRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER"
}

export enum EventStatus {
    DRAFT ="DRAFT",
    PUBLISHED = "PUBLISHED",
    CLOSED = "CLOSED",
    COMPLETED = "COMPLETED"
}

export enum RegistrationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED"
}

export enum FollowTargetType {
    USER = "USER",
    ORGANIZATION = "ORGANIZATION",
    EVENT = "EVENT"
}