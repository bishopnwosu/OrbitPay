import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = 3005;

// =============================
// Prisma + PostgreSQL
// =============================

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
    adapter
});


// =============================
// ADMIN AUTHENTICATION
// =============================

function authenticateAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {

        return res.status(401).json({
            status: "error",
            message: "Authentication required."
        });

    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            status: "error",
            message: "Invalid or expired authentication token."
        });

    }

}

// =============================
// Middleware
// =============================

app.use(express.json());

app.use(express.static(__dirname));

// =============================
// Homepage
// =============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =============================
// Backend Test
// =============================

app.get("/api/test", (req, res) => {

    res.json({
        message: "Hello from the OrbitPay backend!",
        status: "success"
    });

});

// =============================
// Contact Form
// =============================

app.post("/api/contact", async (req, res) => {

    try {

        console.log("CONTACT FORM DATA:");
        console.log(req.body);

        const {
            name,
            email,
            subject,
            department,
            message
        } = req.body;

        // Check that all fields were provided
        if (
            !name ||
            !email ||
            !subject ||
            !department ||
            !message
        ) {

            return res.status(400).json({

                status: "error",

                message: "Please fill in all fields."

            });

        }

        // Save message into PostgreSQL
        const contactMessage = await prisma.contactMessage.create({

            data: {

                name: name,

                email: email,

                subject: subject,

                department: department,

                message: message

            }

        });

        console.log("MESSAGE SAVED TO DATABASE:");
        console.log(contactMessage);

        res.status(201).json({

            status: "success",

            message: "Your message has been received!"

        });

    } catch (error) {

        console.error("DATABASE ERROR:");
        console.error(error);

        res.status(500).json({

            status: "error",

            message: "Something went wrong while saving your message."

        });

    }

});

// =============================
// ADMIN - GET CONTACT MESSAGES
// =============================

app.get("/api/contact-messages", authenticateAdmin, async (req, res) => {

    try {

        const messages = await prisma.contactMessage.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json({
            status: "success",
            data: messages
        });

    } catch (error) {

        console.error("Error loading contact messages:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to load contact messages."
        });

    }

});

// =============================
// ADMIN DASHBOARD STATISTICS
// =============================

app.get("/api/admin/dashboard", authenticateAdmin, async (req, res) => {

    try {

        // Total messages
        const totalMessages =
            await prisma.contactMessage.count();


        // Unread messages
        const unreadMessages =
            await prisma.contactMessage.count({
                where: {
                    isRead: false
                }
            });


        // Read messages
        const readMessages =
            await prisma.contactMessage.count({
                where: {
                    isRead: true
                }
            });


        // Messages received today
        const today = new Date();

        today.setHours(0, 0, 0, 0);


        const messagesToday =
            await prisma.contactMessage.count({
                where: {
                    createdAt: {
                        gte: today
                    }
                }
            });


        res.json({

            status: "success",

            data: {

                totalMessages: totalMessages,

                unreadMessages: unreadMessages,

                readMessages: readMessages,

                messagesToday: messagesToday

            }

        });


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        res.status(500).json({

            status: "error",

            message:
                "Unable to load dashboard statistics."

        });

    }

});

// =============================
// MARK MESSAGE AS READ
// =============================

app.put("/api/contact-messages/:id/read", authenticateAdmin, async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({
                status: "error",
                message: "Invalid message ID."
            });

        }

        const message = await prisma.contactMessage.update({
            where: {
                id: id
            },
            data: {
                isRead: true
            }
        });

        res.json({
            status: "success",
            message: "Message marked as read.",
            data: message
        });

    } catch (error) {

        console.error("Mark as read error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to mark message as read."
        });

    }

});


// =============================
// MARK MESSAGE AS UNREAD
// =============================

app.put("/api/contact-messages/:id/unread", authenticateAdmin, async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({
                status: "error",
                message: "Invalid message ID."
            });

        }

        const message = await prisma.contactMessage.update({
            where: {
                id: id
            },
            data: {
                isRead: false
            }
        });

        res.json({
            status: "success",
            message: "Message marked as unread.",
            data: message
        });

    } catch (error) {

        console.error("Mark as unread error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to mark message as unread."
        });

    }

});

// =============================
// ADMIN - DELETE CONTACT MESSAGE
// =============================

app.delete("/api/contact-messages/:id", authenticateAdmin, async (req, res) => {

    try {

        const id = Number(req.params.id);

        // Check that ID is a valid number
        if (!Number.isInteger(id)) {

            return res.status(400).json({

                status: "error",

                message: "Invalid message ID."

            });

        }

        // Check if message exists
        const existingMessage =
            await prisma.contactMessage.findUnique({

                where: {
                    id: id
                }

            });


        if (!existingMessage) {

            return res.status(404).json({

                status: "error",

                message: "Message not found."

            });

        }


        // Delete message
        await prisma.contactMessage.delete({

            where: {
                id: id
            }

        });


        res.json({

            status: "success",

            message: "Message deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );


        res.status(500).json({

            status: "error",

            message: "Unable to delete message."

        });

    }

});

// =============================
// ADMIN LOGIN
// =============================

app.post("/api/admin/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                status: "error",

                message: "Email and password are required."

            });

        }

        const admin = await prisma.admin.findUnique({

            where: {
                email: email
            }

        });

        if (!admin) {

            return res.status(401).json({

                status: "error",

                message: "Invalid email or password."

            });

        }

        const passwordMatch = await bcrypt.compare(
            password,
            admin.passwordHash
        );

        if (!passwordMatch) {

            return res.status(401).json({

                status: "error",

                message: "Invalid email or password."

            });

        }

        const token = jwt.sign(
    {
        adminId: admin.id,
        email: admin.email
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "2h"
    }
);

res.json({
    status: "success",
    message: "Login successful!",
    token: token
});

    } catch (error) {

        console.error("Admin login error:", error);

        res.status(500).json({

            status: "error",

            message: "Something went wrong during login."

        });

    }

});

// =============================
// Start Server
// =============================

app.listen(PORT, () => {

    console.log(
        `OrbitPay server is running on http://localhost:${PORT}`
    );

});