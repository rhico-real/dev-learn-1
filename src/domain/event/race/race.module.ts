import { Module } from "@nestjs/common";
import { RaceController } from "./race.controller";
import { RaceService } from "./race.service";
import { EventModule } from "../event/event.module";
import { OrganizationContextModule } from "../../organization/organization-context.module";


@Module({
  imports: [
    EventModule,
    OrganizationContextModule
  ],
  controllers: [RaceController],
  providers: [RaceService],
  exports: [RaceService],
})
export class RaceModule {}