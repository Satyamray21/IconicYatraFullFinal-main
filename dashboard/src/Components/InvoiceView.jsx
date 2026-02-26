import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    Divider,
    Grid,
    Paper,
    Stack,
    Link,
    Button,
    CircularProgress,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { toWords } from "number-to-words";
import html2pdf from "html2pdf.js";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import PaymentIcon from "@mui/icons-material/Payment";
import axios from "../utils/axios"; // ✅ your axios instance


const InvoiceView = () => {
    const { id } = useParams();
    const invoiceRef = useRef();
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Fetch Payment Data
    useEffect(() => {
        const fetchPayment = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/payment/${id}`);
                setPaymentData(data?.data || data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch payment details.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchPayment();
    }, [id]);

    if (loading)
        return (
            <Box textAlign="center" mt={10}>
                <CircularProgress />
                <Typography mt={2}>Loading invoice details...</Typography>
            </Box>
        );

    if (error) return <Typography color="error">{error}</Typography>;
    if (!paymentData) return <Typography>No payment data found.</Typography>;

    // ✅ Extract fields safely
    const {
        companyId: company = {},
        paymentType,
        date,
        accountType,
        partyName,
        paymentMode,
        referenceNumber,
        particulars,
        amount,
        invoiceId,
    } = paymentData;

    const isReceipt = paymentType?.toLowerCase().includes("receive");
    const amountInWords = `${toWords(amount || 0)} only`.replace(
        /\b\w/g,
        (c) => c.toUpperCase()
    );
    const formattedDate = new Date(date).toLocaleDateString("en-GB");
    const paymentLink = company.paymentLink || "https://iconicyatra.com/payment";

    // ✅ Download PDF
    const handleDownload = () => {
        const opt = {
            margin: 0.3,
            filename: `${invoiceId || "invoice"}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };
        html2pdf().set(opt).from(invoiceRef.current).save();
    };

    // ✅ Share
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${paymentType} - ${invoiceId}`,
                    text: `Please find the ${isReceipt ? "receipt" : "payment"} details. Amount: ₹${amount}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log("Error sharing:", error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    // ✅ Payment
    const handlePaymentClick = () => {
        window.open(paymentLink, "_blank", "noopener,noreferrer");
    };

    return (
        <Box maxWidth="1000px" mx="auto" my={4}>
            {/* === Top Buttons === */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                gap={2}
            >
                <Button
                    variant="outlined"
                    sx={{
                        color: "#1976d2",
                        borderColor: "#1976d2",
                        px: 2.5,
                        py: 1,
                        borderRadius: 2,
                        fontWeight: "bold",
                        "&:hover": { backgroundColor: "#e3f2fd", borderColor: "#1565c0" },
                    }}
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                >
                    Share
                </Button>

                <Button
                    variant="contained"
                    sx={{
                        background: "linear-gradient(to right, #1976d2, #004ba0)",
                        color: "#fff",
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: "bold",
                        "&:hover": {
                            background: "linear-gradient(to right, #1565c0, #003c8f)",
                        },
                    }}
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                >
                    Download PDF
                </Button>
            </Box>

            {/* === Invoice Paper === */}
            <Box
                component={Paper}
                elevation={10}
                ref={invoiceRef}
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 4,
                    backgroundColor: "#fff",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "Poppins, sans-serif",
                    boxShadow: "0px 8px 30px rgba(0,0,0,0.08)",
                    maxWidth: "100%",
                }}
            >
                {/* Watermark */}
                {company.logo && (
                    <Box
                        component="img"
                        src={company.logo}
                        alt="Watermark"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            opacity: 0.05,
                            height: 200,
                            zIndex: 0,
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Title */}
                <Typography
                    variant="h5"
                    align="center"
                    fontWeight={700}
                    sx={{
                        textTransform: "uppercase",
                        color: "#0b5394",
                        mb: 1,
                        letterSpacing: 1,
                        position: "relative",
                        zIndex: 1,
                        borderBottom: "2px solid #1976d2",
                        pb: 0.5,
                    }}
                >
                    {isReceipt ? "Receive Voucher" : "Payment Voucher"}
                </Typography>

                {/* Company Header */}
                <Grid container justifyContent="space-between" alignItems="center" mt={2}>
                    <Grid item xs={12} sm={6}>
                        {company.logo && (
                            <img src={company.logo} alt="Logo" style={{ height: 50 }} />
                        )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box textAlign={{ xs: "left", sm: "right" }}>
                            <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
                                {company.companyName || "Company Name"}
                            </Typography>
                            {company.address && (
                                <Typography fontSize={12}>{company.address}</Typography>
                            )}
                            {company.phone && (
                                <Typography fontSize={12}>📞 {company.phone}</Typography>
                            )}
                            {company.email && (
                                <Typography fontSize={12}>✉️ {company.email}</Typography>
                            )}
                            {company.termsConditions && (
                                <Link
                                    href={company.termsConditions}
                                    target="_blank"
                                    underline="hover"
                                    color="primary"
                                    fontSize={12}
                                >
                                    🌐 View Terms & Conditions
                                </Link>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Party Info */}
                <Stack spacing={0.3} mb={2}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        color="#1976d2"
                        fontSize="0.9rem"
                    >
                        {isReceipt ? "Received From:" : "Paid To:"}
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                        {partyName}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                        {accountType}
                    </Typography>
                </Stack>

                {/* Date + ID */}
                <Grid container justifyContent="space-between" mb={2}>
                    <Grid item>
                        <Typography fontSize={12}>
                            <strong>Date:</strong> {formattedDate}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography fontSize={12}>
                            <strong>{isReceipt ? "Receipt No:" : "Payment No:"}</strong>{" "}
                            {invoiceId || "-"}
                        </Typography>
                    </Grid>
                </Grid>

                {/* Amount */}
                <Box
                    my={2}
                    sx={{
                        background: "linear-gradient(to right, #e3f2fd, #ffffff)",
                        borderRadius: 2,
                        border: "1px dashed #2196f3",
                        p: 2,
                    }}
                >
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item xs={12} sm={8}>
                            <Typography
                                fontWeight={600}
                                gutterBottom
                                color="#0d47a1"
                                fontSize="0.9rem"
                            >
                                Amount In Words
                            </Typography>
                            <Typography fontSize={14}>{amountInWords}</Typography>
                            <Typography fontSize={12} color="text.secondary">
                                INR
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography
                                fontSize="1.8rem"
                                fontWeight="bold"
                                color="#2e7d32"
                                textAlign={{ xs: "left", sm: "right" }}
                            >
                                ₹ {Number(amount).toLocaleString()}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                {/* Particulars */}
                <Box my={2}>
                    <Typography
                        fontWeight={600}
                        gutterBottom
                        color="#1976d2"
                        fontSize="0.9rem"
                    >
                        Particulars
                    </Typography>
                    <Typography fontSize={14}>{particulars}</Typography>
                </Box>

                {/* Payment Mode */}
                <Box mb={2}>
                    <Typography
                        fontWeight={600}
                        gutterBottom
                        color="#1976d2"
                        fontSize="0.9rem"
                    >
                        Payment Mode
                    </Typography>
                    <Typography fontSize={14}>{paymentMode}</Typography>
                    {referenceNumber && (
                        <Typography fontSize={14} color="text.secondary">
                            Transaction ID: {referenceNumber}
                        </Typography>
                    )}
                </Box>

                {/* Payment Link */}
                {!isReceipt && (
                    <Box
                        mb={3}
                        sx={{
                            p: 2,
                            border: "2px dashed #28a745",
                            borderRadius: 2,
                            backgroundColor: "#f8fff9",
                            textAlign: "center",
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            color="#28a745"
                            gutterBottom
                            fontSize="1rem"
                        >
                            💳 Online Payment
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{
                                background: "linear-gradient(to right, #28a745, #20c997)",
                                color: "white",
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                                mb: 1,
                                "&:hover": {
                                    background: "linear-gradient(to right, #218838, #1e7e34)",
                                    transform: "translateY(-1px)",
                                    boxShadow: "0 4px 8px rgba(40, 167, 69, 0.3)",
                                },
                            }}
                            startIcon={<PaymentIcon />}
                            onClick={handlePaymentClick}
                        >
                            Pay ₹{Number(amount).toLocaleString()} Now
                        </Button>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                            fontSize="0.8rem"
                        >
                            Secure payment via {company.companyName || "Iconic Yatra"}
                        </Typography>
                        <Link
                            href={paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                mt: 0.5,
                                display: "block",
                                fontSize: "12px",
                                color: "#1976d2",
                                wordBreak: "break-all",
                            }}
                        >
                            {paymentLink}
                        </Link>
                    </Box>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Signature */}
                <Grid container justifyContent="space-between" alignItems="center" mt={2}>
                    <Grid item>
                        <Typography fontSize={12}>
                            For, <strong>{company.companyName || "Company"}</strong>
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Box textAlign="right">
                            <img
                                src={
                                    company.authorizedSignatory?.signatureImage
                                }
                                alt="Digital Signature"
                                style={{ height: "50px", width: "150px" }}
                            />
                            <Typography fontWeight={600} fontSize={12}>
                                Authorized Signatory
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Footer */}
                <Box textAlign="center" mt={2}>
                    <Typography variant="caption" color="gray" fontSize={11}>
                        Powered by {company.companyName || "Our Company"} Billing System
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default InvoiceView;