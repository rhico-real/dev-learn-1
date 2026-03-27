import { execSync } from "child_process";
import * as dotenv from 'dotenv';

export default async function () {
    dotenv.config({
        path: '.env.test',
        override: true
    });

    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
}