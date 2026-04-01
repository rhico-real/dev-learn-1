import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class GenerateSlugService {
    generateSlug(name: string): string {
        const res = name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')

        return `${res}-${randomUUID().slice(0, 8)}`;
    }
}