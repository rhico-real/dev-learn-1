import { Module } from "@nestjs/common";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";
import { OrganizationContextModule } from "../../organization/organization-context.module";

@Module({
    providers: [EventService],
    controllers: [EventController],
    imports: [OrganizationContextModule],
    exports: [EventService]
})
export class EventModule { }