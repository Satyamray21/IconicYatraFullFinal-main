import { Box, Paper, Typography, Divider } from "@mui/material";
import React from "react";

const PrivacyPolicy = () => {
    return (
        <Box sx={{ bgcolor: "#f9f9f9", py: 6, px: { xs: 3, sm: 6, md: 12 } }}>
            <Paper sx={{ p: { xs: 3, sm: 6 }, borderRadius: "16px" }} elevation={3}>
                {/* Title */}
                <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", textAlign: "center" }}>
                    Privacy Policy of Iconic Yatra
                </Typography>

                {/* Introduction */}
                <Typography variant="body1" sx={{ mb: 3 }}>
                    At Iconic Yatra, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or use our services.
                </Typography>

                {/* Information Collection */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    Information We Collect
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                    We may collect the following information from you:
                </Typography>
                <ul style={{ marginLeft: 20, color: "rgba(0,0,0,0.8)" }}>
                    <li>Personal details such as name, email, phone number, and address</li>
                    <li>Booking and payment information</li>
                    <li>Travel preferences and special requests</li>
                    <li>Information collected automatically via cookies and analytics</li>
                </ul>

                {/* Use of Information */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    How We Use Your Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ul style={{ marginLeft: 20, color: "rgba(0,0,0,0.8)" }}>
                    <li>To process bookings and payments</li>
                    <li>To provide customer support and respond to inquiries</li>
                    <li>To send updates, promotions, or offers (with consent)</li>
                    <li>To improve our website and services</li>
                </ul>

                {/* Data Sharing */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    Sharing of Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                    We do not sell or rent your personal information to third parties. We may share your information with:
                </Typography>
                <ul style={{ marginLeft: 20, color: "rgba(0,0,0,0.8)" }}>
                    <li>Travel service providers like airlines, hotels, and transport partners</li>
                    <li>Authorities as required by law</li>
                    <li>Third-party service providers who help us operate our services (under strict confidentiality)</li>
                </ul>

                {/* Cookies & Tracking */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    Cookies and Tracking Technologies
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                    We use cookies and similar tracking technologies to enhance your experience, analyze website traffic, and deliver personalized content.
                </Typography>

                {/* Data Security */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    Data Security
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                    We implement reasonable security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </Typography>

                {/* Your Rights */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    Your Rights
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                    You have the right to access, update, or request deletion of your personal data. You can also opt-out of marketing communications at any time by contacting us.
                </Typography>

                {/* Contact Info */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
                    Contact Us
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                </Typography>
                <Typography variant="body2">Email: support@iconicyatra</Typography>
                <Typography variant="body2">Phone: +91-7053900957</Typography>
            </Paper>
        </Box>
    );
};

export default PrivacyPolicy;
