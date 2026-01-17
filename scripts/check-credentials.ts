
import prisma from "../src/lib/db";

async function main() {
    try {
        const creds = await prisma.credential.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log("Recent Credentials in DB:");
        creds.forEach(c => {
            console.log(`ID: ${c.id}`);
            console.log(`Name: ${c.name}`);
            console.log(`Type: ${c.type}`);
            console.log(`Value (raw):`, c.value);
            console.log("-------------------");
        });

    } catch (error) {
        console.error("Error fetching credentials:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
