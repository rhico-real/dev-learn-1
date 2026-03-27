import * as dotenv from 'dotenv';

export default async function () {
    dotenv.config({
        path: '.env.test',
        override: true
    });
}