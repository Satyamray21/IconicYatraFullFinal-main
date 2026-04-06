import express from "express";
import { sendSlipEmail } from "../utils/sendSlipEmail.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// POST /send
router.post("/send", async (req, res) => {
    const { email, slipName } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const uploadDir = path.resolve("upload");
        let slipPath;

        if (slipName) {
            // Check if the specific slip file exists
            const specificSlipPath = path.join(uploadDir, slipName);
            if (!fs.existsSync(specificSlipPath)) {
                return res.status(404).json({ message: "Slip file not found" });
            }
            slipPath = specificSlipPath;
        } else {
            // Pick the latest slip-*.pdf
            const files = fs.readdirSync(uploadDir).filter(file => /^slip-.*\.pdf$/.test(file));
            if (files.length === 0) {
                return res.status(404).json({ message: "No slip files found" });
            }

            const latestFile = files
                .map(file => ({
                    name: file,
                    time: fs.statSync(path.join(uploadDir, file)).mtime.getTime(),
                }))
                .sort((a, b) => b.time - a.time)[0].name;

            slipPath = path.join(uploadDir, latestFile);
        }

        await sendSlipEmail({
            to: email,
            subject: "Your Payment Slip",
            text: "Please find the attached payment slip.",
            slipPath,
        });

        res.status(200).json({ message: "Slip sent successfully", file: path.basename(slipPath) });
    } catch (error) {
        console.error("Email send error:", error);
        res.status(500).json({ message: "Failed to send slip" });
    }
});


export default router;
