import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "ADMIN" as any },
        });
        console.log(`Successfully made ${email} an ADMIN.`);
        return user;
    } catch (error) {
        console.error(`Error making ${email} an admin:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
if (!email) {
    console.log("Please provide an email address: npx tsx scripts/make-admin.ts user@example.com");
    process.exit(1);
}

makeAdmin(email);
