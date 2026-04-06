import React from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";

const CancellationPolicy = () => {
    return (
        <Box sx={{ bgcolor: "#f9f9f9", py: 6, px: { xs: 3, sm: 6, md: 12 } }}>
            <Paper sx={{ p: { xs: 3, sm: 6 }, borderRadius: "16px" }} elevation={3}>
                {/* Page Title */}
                <Typography
                    variant="h3"
                    sx={{ mb: 4, fontWeight: "bold", textAlign: "center", color: "primary.main" }}
                >
                    Cancellation & Refund Policy
                </Typography>

                {/* General Note */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        ICONIC YATRA.com reserves the right to change terms and conditions with or without prior notice.
                    </Typography>
                </Box>

                {/* Booking & Payment Policy */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Booking & Payment Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        A non-refundable 20% of package cost + GST (5%) is required at the first payment.
                    </Typography>
                    <ul style={{ marginLeft: 20, color: "rgba(0,0,0,0.7)" }}>
                        <li>20% at reservation + 100% Flight/Train Cost</li>
                        <li>60% after receiving booking confirmation email</li>
                        <li>Balance after receiving hotel confirmation</li>
                        <li>Copies of visa/ID confirmation required for International/Domestic trips</li>
                        <li>GST 5% applies on all bookings</li>
                    </ul>
                </Box>

                {/* Scratch-off / Cancellation Policy */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Scratch-off / Cancellation Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        All cancellations must be submitted in writing. Tickets on LCC airlines are non-refundable.
                    </Typography>
                    <ul style={{ marginLeft: 20, color: "rgba(0,0,0,0.7)" }}>
                        <li>Booking confirmed = 20% non-refundable</li>
                        <li>60-45 days before travel = 20% + ₹10,000</li>
                        <li>44-30 days = 20% + 50% of holiday cost</li>
                        <li>29-15 days = 20% + 80% of holiday cost</li>
                        <li>Within 14 days / No-show = 100%</li>
                        <li>Air Asia / Star Cruise cancellations as per their rules</li>
                        <li>Super Peak period (20 Dec - 10 Jan) = 80% cancellation within 45 days</li>
                    </ul>
                </Box>

                {/* Guarantee Booking Policy */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Guarantee Booking Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        For guaranteed bookings, 100% of the tour cost is non-refundable regardless of the days before departure.
                    </Typography>
                </Box>

                {/* VISA Notice */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Visa Notice
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        On Arrival Visa is valid for max 14 days. ICONIC YATRA.com is not responsible for visa refusal or delay.
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        Travelers from certain states/UTs must submit documents 15 days before departure. Check with Visa department for exact requirements.
                    </Typography>
                </Box>

                {/* Risk Disclaimer */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Risk & Liability
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        ICONIC YATRA.com acts as an intermediary and is not responsible for delays, accidents, baggage loss, or other risks. Travelers are advised to purchase travel insurance.
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        ICONIC YATRA.com is not liable for weather, strikes, war, natural disasters, or force majeure events.
                    </Typography>
                </Box>

                {/* General Provisions */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        General Provisions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        By using ICONIC YATRA.com services, you agree to all terms. Disputes will be resolved via arbitration under the Arbitration & Conciliation Act, 1996, in Delhi. Laws of India apply, jurisdiction Noida, Uttar Pradesh.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default CancellationPolicy;
