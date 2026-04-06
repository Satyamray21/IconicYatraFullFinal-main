import React, { useRef, useState, useEffect } from "react";
import {
    Container,
    Box,
    Button,
    Alert,
    CircularProgress,
    Typography,
    Paper
} from "@mui/material";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Download, Print, ArrowBack } from "@mui/icons-material";
import InvoicePDF from "./InvoicePDF";

const InvoiceGeneration = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const invoiceData = location.state?.invoiceData;
    const componentRef = useRef();
    const [isPrinting, setIsPrinting] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false);

    // Wait until all images are loaded
    useEffect(() => {
        const imgs = document.querySelectorAll("img");
        if (imgs.length === 0) {
            setIsContentReady(true);
            return;
        }

        let loaded = 0;
        imgs.forEach((img) => {
            if (img.complete) loaded++;
            else {
                img.onload = () => {
                    loaded++;
                    if (loaded >= imgs.length) {
                        setIsContentReady(true);
                    }
                };
                img.onerror = () => {
                    loaded++;
                    if (loaded >= imgs.length) {
                        setIsContentReady(true);
                    }
                };
            }
        });

        // Fallback timeout
        const timeout = setTimeout(() => {
            setIsContentReady(true);
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `invoice-${id || "unknown"}`,
        onBeforeGetContent: () => {
            setIsPrinting(true);
            return Promise.resolve();
        },
        onAfterPrint: () => setIsPrinting(false),
        removeAfterPrint: false,
        pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    });

    const handleDownloadPDF = async () => {
        setIsPrinting(true);
        try {
            // For a real implementation, you would use a PDF generation library
            // For now, we'll use the same print functionality
            await handlePrint();
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    // Fallback sample data - enhanced with more realistic data
    const defaultInvoiceData = {
        company: {
            name: "Iconic Yatra",
            address: "Office No 15, Bhawani Market Sec 27, Noida, Uttar Pradesh – 201301",
            phone: "+91 7053900957",
            email: "amit.jaiswal@example.com",
            state: "9 - Uttar Pradesh",
            logo: "/logo.png",
            gstin: "09EYCPK8832C1ZC",
        },
        customer: {
            name: "Amit Jaiswal",
            mobile: "+91 7053900957",
            email: "amit.jaiswal@example.com",
            state: "28 - Andhra Pradesh",
            gstin: "28ABCDE1234F1Z2",
            address: "Andhra Pradesh, India"
        },
        invoice: {
            number: `INV-${id || "202512"}`,
            date: new Date().toLocaleDateString("en-IN"),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
            placeOfSupply: "9 - Uttar Pradesh",
        },
        items: [
            {
                id: 1,
                particulars: "Hotel Booking Services - 3N Borong, 2N Damthang",
                hsnSac: "998314",
                price: 2500,
                amount: 2500,
                quantity: 1,
            },
            {
                id: 2,
                particulars: "Transportation Services - AC Vehicle",
                hsnSac: "996411",
                price: 840,
                amount: 840,
                quantity: 1,
            },
            {
                id: 3,
                particulars: "Tour Guide Services",
                hsnSac: "998314",
                price: 0,
                amount: 0,
                quantity: 1,
            },
        ],
        summary: {
            subTotal: 3340,
            discount: 200,
            tax: 140,
            total: 3340,
            received: 1500,
            balance: 1840,
        },
        description: `Travel package for 6 Adults, 3 Bedrooms with CP, AP, EP meal plan. Destination: 3N Borong, 2N Damthang.`,
        terms: "Payment due within 15 days. 50% amount paid at confirmation, balance before 10 days of travel.",
        signature: "/signature.png",
        bankDetails: {
            bankName: "KOTAK Bank",
            accountNumber: "XXXXXXX1234",
            ifscCode: "KKBK0000123",
            accountName: "Iconic Yatra"
        }
    };

    const dataToUse = invoiceData || defaultInvoiceData;

    // Calculate totals if not provided
    if (!dataToUse.summary) {
        const subTotal = dataToUse.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        dataToUse.summary = {
            subTotal,
            total: subTotal,
            received: 0,
            balance: subTotal,
        };
    }

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Control Panel */}
            <Box className="no-print" mb={3}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Button
                                variant="outlined"
                                onClick={handleGoBack}
                                startIcon={<ArrowBack />}
                            >
                                Back
                            </Button>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                                Invoice #{dataToUse.invoice.number}
                            </Typography>
                        </Box>

                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handlePrint}
                                disabled={isPrinting || !isContentReady}
                                startIcon={isPrinting ? <CircularProgress size={20} /> : <Print />}
                            >
                                {isPrinting ? "Preparing..." : "Print"}
                            </Button>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleDownloadPDF}
                                disabled={isPrinting || !isContentReady}
                                startIcon={isPrinting ? <CircularProgress size={20} /> : <Download />}
                            >
                                {isPrinting ? "Generating..." : "Download PDF"}
                            </Button>
                        </Box>
                    </Box>

                    {!invoiceData && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Using sample invoice data. Pass invoice data via navigation state for real data.
                        </Alert>
                    )}

                    {isPrinting && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            Preparing document for printing... Please wait.
                        </Alert>
                    )}
                </Paper>
            </Box>

            {/* Invoice Content */}
            <Box
                ref={componentRef}
                sx={{
                    backgroundColor: "#fff",
                    '@media screen': {
                        boxShadow: 2,
                        borderRadius: 1,
                        overflow: 'hidden'
                    },
                    '@media print': {
                        margin: 0,
                        padding: 0,
                        boxShadow: 'none',
                        '& > *': {
                            boxShadow: 'none !important',
                        }
                    },
                }}
            >
                <InvoicePDF invoiceData={dataToUse} />
            </Box>

            {/* Print Instructions */}
            <Box className="no-print" mt={3}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Printing Instructions:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • For best results, use "Save as PDF" in the print dialog to generate a PDF file
                        • Ensure "Background graphics" is enabled in print settings
                        • Use A4 paper size for optimal formatting
                        • Check the print preview before finalizing
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default InvoiceGeneration;