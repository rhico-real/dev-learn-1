import { Global, Module } from "@nestjs/common";
import { GenerateSlugService } from "./generate-slug.service";

@Global()
@Module({
    providers: [GenerateSlugService],
    exports: [GenerateSlugService]
})
export class CommonModule { }