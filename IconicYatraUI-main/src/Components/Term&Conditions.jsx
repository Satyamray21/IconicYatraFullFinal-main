import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";

const TermConditions = () => {
    return (
        <Box sx={{ bgcolor: "#f9f9f9", px: { xs: 3, sm: 6, md: 12 }, py: 6 }}>
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 3, sm: 6 },
                    borderRadius: "16px",
                    bgcolor: "#fff",
                }}
            >
                {/* Page Title */}
                <Typography
                    variant="h3"
                    sx={{
                        mb: 4,
                        fontWeight: "bold",
                        textAlign: "center",
                        color: "primary.main",
                    }}
                >
                    Terms & Conditions
                </Typography>

                {/* General Terms */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        General Terms
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        ICONIC YATRA (iconicyatra.com) reserves the right to update or modify
                        these terms at any time. All bookings are subject to availability.
                        “SIC” refers to Seat-in-Coach basis, where one coach covers multiple
                        hotels.
                    </Typography>
                    <ul style={{ color: "rgba(0,0,0,0.7)", marginLeft: "20px" }}>
                        <li>Check-in time: 2 PM – 4 PM. Early check-in subject to availability.</li>
                        <li>Baggage allowance: 1 hand item + 20kg check-in. Extra baggage at traveler’s cost.</li>
                        <li>Budget packages not recommended for couples/families.</li>
                        <li>Rates may vary during fairs, festivals, or peak season.</li>
                    </ul>
                </Box>

                {/* Booking & Payment Policy */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Booking & Payment Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        At the time of reservation, a non-refundable booking amount of 20% of
                        package cost + 5% GST is required.
                    </Typography>
                    <ul style={{ color: "rgba(0,0,0,0.7)", marginLeft: "20px" }}>
                        <li>20% at reservation + 100% Flight/Train cost</li>
                        <li>60% after booking confirmation</li>
                        <li>Balance before departure</li>
                    </ul>
                </Box>

                {/* Cancellation Policy */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Cancellation Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        All cancellations must be requested in writing. Some tickets & hotel
                        bookings are strictly non-refundable.
                    </Typography>
                    <ul style={{ color: "rgba(0,0,0,0.7)", marginLeft: "20px" }}>
                        <li>60–45 days before travel: 20% + ₹10,000</li>
                        <li>44–30 days: 50% + ₹10,000</li>
                        <li>29–15 days: 80% + ₹10,000</li>
                        <li>14 days or less / No-show: 100%</li>
                    </ul>
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        Please check our full{" "}
                        <a
                            href="https://www.iconicyatra.com/cancellation-refund-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1976d2", fontWeight: 600 }}
                        >
                            Cancellation & Refund Policy
                        </a>
                        .
                    </Typography>
                </Box>

                {/* Visa Policy */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Visa & Documentation Policy
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        ICONIC YATRA is not responsible for delay/refusal of visa issuance.
                        Travelers must submit valid documents at least 15 days before
                        departure. Visa-on-arrival is valid for max 14 days.
                    </Typography>
                </Box>

                {/* Liability Disclaimer */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Liability Disclaimer
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        ICONIC YATRA acts as an intermediary between travelers and service
                        providers. We are not responsible for delays, cancellations, natural
                        disasters, baggage loss, or injuries. Travelers are advised to carry
                        valid travel insurance.
                    </Typography>
                </Box>

                {/* General Provisions */}
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        General Provisions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 1 }}>
                        By booking with ICONIC YATRA, you agree to all terms. All disputes will
                        be settled through arbitration under the Arbitration & Conciliation
                        Act, 1996. Jurisdiction lies exclusively with courts in Noida, UP.
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        ICONIC YATRA reserves the right to deny service or cancel bookings at
                        its sole discretion.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default TermConditions;
