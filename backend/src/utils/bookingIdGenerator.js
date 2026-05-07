import { Counter } from "../models/Counter.js";

/**
 * Generates a booking ID based on the company name.
 * Default rule: First letter of 1st word + First 3 letters of 2nd word (if available).
 * Special case: "Iconic Travel" -> "ITRK"
 * @param {string} companyName 
 * @returns {Promise<string>}
 */
export const generateBookingId = async (companyName) => {
    let prefix = "BOOK";
    
    if (companyName) {
        const name = companyName.trim().toUpperCase();
        
        // Special case for Iconic Travel as requested
        if (name.includes("ICONIC TRAVEL")) {
            prefix = "ITRK";
        } else {
            const words = name.split(/\s+/).filter(Boolean);
            if (words.length >= 2) {
                const w1 = words[0];
                const w2 = words[1];
                // Pattern: W1L1 + W2L1 + W2L2 + W2L3
                // This will result in 4 letters if W2 has at least 3 letters.
                const p = w1[0] + w2.substring(0, 3);
                prefix = p.toUpperCase().padEnd(4, "X").substring(0, 4);
            } else if (words.length === 1) {
                prefix = words[0].substring(0, 4).toUpperCase().padEnd(4, "X");
            }
        }
    }

    const counter = await Counter.findOneAndUpdate(
        { id: `bookingId_${prefix}` },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );

    const seq = String(counter.seq).padStart(4, "0");
    return `${prefix}${seq}`;
};
