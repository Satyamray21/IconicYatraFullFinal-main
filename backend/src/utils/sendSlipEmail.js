import nodemailer from "nodemailer";
import path from "path";

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.gmail,
        pass: process.env.app_pass,
    },
});

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

    await transporter.sendMail(mailOptions);
};
