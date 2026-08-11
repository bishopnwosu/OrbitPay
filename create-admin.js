import "dotenv/config";

import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
    adapter
});

async function createAdmin() {

    const email = "admin@orbitpay.com";

    const password = "ChangeThisPassword123!";

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
        data: {
            name: "OrbitPay Administrator",
            email: email,
            passwordHash: passwordHash
        }
    });

    console.log("Admin account created!");
    console.log("Email:", admin.email);
    console.log("Password:", password);

    await prisma.$disconnect();

}

createAdmin().catch(async (error) => {

    console.error("Error creating admin:", error);

    await prisma.$disconnect();

    process.exit(1);

});