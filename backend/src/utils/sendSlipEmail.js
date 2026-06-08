import emailQueue from "./emailQueue.js";
import path from "path";

export const sendSlipEmail = async ({ to, subject, text, slipPath }) => {
    const mailOptions = {
        from: process.env.gmail,
        to,
        subject,
        text,
        attachments: [
            {
                filename: path.basename(slipPath),
                path: slipPath,
            },
        ],
    };

    await emailQueue.add('sendEmail', mailOptions);
};
