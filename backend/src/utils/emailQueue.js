import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import redisClient from '../config/redis.js'; // Ensure this exports a working Redis instance or connection options

dotenv.config();

// Extract redis connection options from REDIS_URL if provided, else use default localhost
const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
};

// If using REDIS_URL from .env
if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    redisOptions.host = url.hostname;
    redisOptions.port = parseInt(url.port);
    if (url.password) {
        redisOptions.password = url.password;
    }
}

// Create the Email Queue
export const emailQueue = new Queue('emailQueue', {
    connection: redisOptions,
});

// Reusable transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.gmail,
        pass: process.env.app_pass,
    },
});

// Create the Worker to process jobs
const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
        try {
            console.log(`[EmailQueue] Processing job ${job.id}`);
            
            let mailOptions = job.data;
            let currentTransporter = transporter;

            // If job data contains smtpConfig, create a custom transporter
            if (job.data.smtpConfig) {
                mailOptions = job.data.mailOptions;
                currentTransporter = nodemailer.createTransport(job.data.smtpConfig);
            }

            // Restore Buffers in attachments due to BullMQ JSON serialization
            if (mailOptions.attachments && Array.isArray(mailOptions.attachments)) {
                mailOptions.attachments = mailOptions.attachments.map(attachment => {
                    if (attachment.content && attachment.content.type === 'Buffer' && Array.isArray(attachment.content.data)) {
                        attachment.content = Buffer.from(attachment.content.data);
                    }
                    return attachment;
                });
            }
            
            console.log(`[EmailQueue] Sending email to ${mailOptions.to}`);
            const info = await currentTransporter.sendMail(mailOptions);
            
            console.log(`[EmailQueue] Job ${job.id} completed. Message sent: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`[EmailQueue] Job ${job.id} failed:`, error);
            throw error; // Let BullMQ handle retries
        }
    },
    {
        connection: redisOptions,
        concurrency: 5, // Process up to 5 emails concurrently
    }
);

emailWorker.on('completed', (job) => {
    console.log(`[EmailQueue] Job ${job.id} successfully processed`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`[EmailQueue] Job ${job.id} failed with error: ${err.message}`);
});

export default emailQueue;
