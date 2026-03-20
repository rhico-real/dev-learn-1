import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
    const email = "admin@runhop.com";
    const password = "admin123456";

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: {email: email},
        update: {
            password: hashedPassword,
            role: "SUPER_ADMIN"
        },
        create: {
            email: email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            displayName: 'System Admin'
        }
    });

    console.log({admin});
    console.log('✅ Seeding finished.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally( async () => {
    await prisma.$disconnect();
})