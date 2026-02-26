import React, { useRef, useState } from "react";
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Paper,
    Button,
    CircularProgress,
    Divider,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const InvoicePDF = ({ invoiceData }) => {
    const componentRef = useRef();
    const [isGenerating, setIsGenerating] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
    };

    const calculateTotalTax = () =>
        invoiceData?.items?.reduce((t, i) => t + (i.taxAmount || 0), 0) || 0;

    const calculateSubtotal = () =>
        invoiceData?.items?.reduce(
            (t, i) => t + ((i.basePrice || 0) - (i.discount || 0)),
            0
        ) || 0;

    const amountToWords = (amount) => {
        if (!amount) return "Zero Only INR";
        const ones = [
            "",
            "One",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine",
        ];
        const teens = [
            "Ten",
            "Eleven",
            "Twelve",
            "Thirteen",
            "Fourteen",
            "Fifteen",
            "Sixteen",
            "Seventeen",
            "Eighteen",
            "Nineteen",
        ];
        const tens = [
            "",
            "",
            "Twenty",
            "Thirty",
            "Forty",
            "Fifty",
            "Sixty",
            "Seventy",
            "Eighty",
            "Ninety",
        ];

        function convert(num) {
            if (num === 0) return "";
            if (num < 10) return ones[num];
            if (num < 20) return teens[num - 10];
            if (num < 100)
                return (
                    tens[Math.floor(num / 10)] +
                    (num % 10 ? " " + ones[num % 10] : "")
                );
            return (
                ones[Math.floor(num / 100)] +
                " Hundred" +
                (num % 100 ? " " + convert(num % 100) : "")
            );
        }

        let res = "",
            n = Math.floor(amount);
        if (n >= 10000000) {
            res += convert(Math.floor(n / 10000000)) + " Crore ";
            n %= 10000000;
        }
        if (n >= 100000) {
            res += convert(Math.floor(n / 100000)) + " Lakh ";
            n %= 100000;
        }
        if (n >= 1000) {
            res += convert(Math.floor(n / 1000)) + " Thousand ";
            n %= 1000;
        }
        if (n > 0) res += convert(n);
        return res.trim() + " Only INR";
    };

    const handleDownloadPDF = async () => {
        if (!componentRef.current) return;
        setIsGenerating(true);
        try {
            // render DOM to canvas
            const canvas = await html2canvas(componentRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            // create pdf and add image
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = pdfWidth / canvas.width;
            const imgHeight = canvas.height * ratio;

            // add the image that contains the visual invoice
            pdf.addImage(
                canvas.toDataURL("image/png"),
                "PNG",
                0,
                0,
                pdfWidth,
                imgHeight
            );

            // ---- Add clickable links over the image for every anchor inside the invoice ----
            // Get component bounding rect (in CSS pixels)
            const compRect = componentRef.current.getBoundingClientRect();

            // Find all anchor tags inside the component
            const anchors = Array.from(componentRef.current.querySelectorAll("a[href]"));

            anchors.forEach((a) => {
                try {
                    const href = a.getAttribute("href");
                    if (!href) return;

                    // bounding rect of the anchor (in CSS pixels)
                    const anchorRect = a.getBoundingClientRect();

                    // Convert anchor rect (CSS px) -> canvas px
                    // canvas.width corresponds to compRect.width * scale (html2canvas scale)
                    const xPxOnCanvas = (anchorRect.left - compRect.left) * (canvas.width / compRect.width);
                    const yPxOnCanvas = (anchorRect.top - compRect.top) * (canvas.height / compRect.height);
                    const wPxOnCanvas = anchorRect.width * (canvas.width / compRect.width);
                    const hPxOnCanvas = anchorRect.height * (canvas.height / compRect.height);

                    // Convert canvas px -> PDF units (mm) using same ratio used to draw the image
                    const xInPdf = xPxOnCanvas * ratio;
                    const yInPdf = yPxOnCanvas * ratio;
                    const wInPdf = wPxOnCanvas * ratio;
                    const hInPdf = hPxOnCanvas * ratio;

                    // Add link annotation pointing to the href. jsPDF link expects coords in mm.
                    // If url is relative (starts with '#') or javascript: skip it.
                    const isHttp = /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
                    if (isHttp || href.startsWith("mailto:") || href.startsWith("tel:")) {
                        pdf.link(xInPdf, yInPdf, wInPdf, hInPdf, { url: href });
                    } else if (href.startsWith("/")) {
                        // if relative path, you may want to convert to absolute using window.location.origin
                        const absolute = window.location.origin + href;
                        pdf.link(xInPdf, yInPdf, wInPdf, hInPdf, { url: absolute });
                    } else {
                        // ignore fragment-only links or javascript: links
                    }
                } catch (innerErr) {
                    // keep processing other anchors even if one fails
                    console.error("Failed to add link annotation for anchor:", innerErr);
                }
            });

            // save pdf - CORRECTED LINE
            pdf.save(`Invoice - ${invoiceData?.invoiceNo || "INV"}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Error generating PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const {
        billingName = "N/A",
        mobile = "N/A",
        gstin = "N/A",
        billingAddress = "N/A",
        stateOfSupply = "N/A",
        invoiceNo = "N/A",
        invoiceDate,
        dueDate,
        items = [],
        totalAmount = 0,
        receivedAmount = 0,
        balanceAmount = 0,
        paymentMode = "N/A",
        description = "N/A",
        startDate,
        returnDate,
        cabType = "N/A",
        tourType = "N/A",
        noOfPax = "N/A",
        financialYear,
        advancedReceiptNo = "N/A",
        referenceNo = "N/A",
    } = invoiceData || {};

    const subtotal = calculateSubtotal();
    const totalTax = calculateTotalTax();

    return (
        <Box sx={{ bgcolor: "#f5f7fa", p: 2 }}>
            <Box sx={{ mb: 1, textAlign: "right" }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                        isGenerating ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <PictureAsPdfIcon />
                        )
                    }
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                >
                    {isGenerating ? "Generating..." : "Download PDF"}
                </Button>
            </Box>

            <Box
                ref={componentRef}
                sx={{
                    backgroundColor: "#fff",
                    p: 2,
                    width: "210mm",
                    mx: "auto",
                    border: "1.5px solid #1565c0",
                    borderRadius: "6px",
                    fontFamily: "Segoe UI, Arial, sans-serif",
                    fontSize: "11px",
                    color: "#212121",
                    boxShadow: "0 0 6px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <Typography
                    align="center"
                    sx={{
                        fontWeight: "bold",
                        color: "#0d47a1",
                        fontSize: "16px",
                        mb: 1,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                    }}
                >
                    Tax Invoice
                </Typography>

                {/* Company Info */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <img
                        src={invoiceData?.companyId?.logo}
                        alt="Logo"
                        style={{ width: 100, height: 100, objectFit: "contain" }}
                    />
                    <Box sx={{ textAlign: "right" }}>
                        <Typography sx={{ fontWeight: "bold", fontSize: "13px" }}>
                            {invoiceData?.companyId?.companyName}
                        </Typography>
                        <Typography sx={{ fontSize: "10px" }}>
                            GSTIN: {invoiceData?.companyId?.gstin}
                        </Typography>
                        <Typography sx={{ fontSize: "10px" }}>
                            {invoiceData?.companyId?.address}
                        </Typography>
                        <Typography sx={{ fontSize: "10px" }}>
                            Phone: +91 {invoiceData?.companyId?.phone}
                        </Typography>
                        <Typography sx={{ fontSize: "10px" }}>
                            Email: {invoiceData?.companyId?.email}
                        </Typography>
                        <Typography sx={{ fontSize: "10px" }}>
                            State Code: {invoiceData?.companyId?.stateCode}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 1, borderColor: "#1565c0" }} />

                {/* Billing & Invoice Info */}
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    {/* Billing */}
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            Billing To
                        </Typography>
                        <Box
                            sx={{
                                border: "1px solid #1565c0",
                                p: 0.5,
                                borderRadius: "3px",
                                minHeight: 65,
                            }}
                        >
                            <b>{billingName}</b>
                            <br />
                            Mobile:+91 {mobile}
                            <br />
                            {billingAddress}
                            <br />
                            GSTIN: {gstin}
                            <br />
                            State: {stateOfSupply}
                        </Box>
                    </Box>

                    {/* Invoice Info */}
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            Invoice Details
                        </Typography>
                        <Box
                            sx={{
                                border: "1px solid #1565c0",
                                p: 0.5,
                                borderRadius: "3px",
                                minHeight: 65,
                            }}
                        >
                            <div>
                                <b>Financial Year:</b> {financialYear}
                            </div>
                            <div>
                                <div>
                                    <b>Advanced Receipt No:</b> {advancedReceiptNo}
                                </div>
                                <b>Date:</b> {formatDate(invoiceDate)}
                            </div>
                            <div>
                                <b>Description</b> {description}
                            </div>

                        </Box>
                    </Box>
                </Box>

                {/* Items Table */}
                <TableContainer component={Paper} sx={{ mb: 1 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#1565c0" }}>
                                {[
                                    "#",
                                    "Particulars",
                                    "HSN/SAC",
                                    "Price ₹",
                                    "Disc ₹",
                                    "GST ₹",
                                    "Amount ₹",
                                ].map((h, i) => (
                                    <TableCell
                                        key={i}
                                        align={i === 0 || i === 1 || i === 2 ? "left" : "right"}
                                        sx={{
                                            color: "#fff",
                                            fontWeight: "bold",
                                            fontSize: "10px",
                                            py: 0.8,
                                            px: 1.5,
                                        }}
                                    >
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {items.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell align="left" sx={{ fontSize: "10px", px: 1.5 }}>
                                        {i + 1}
                                    </TableCell>
                                    <TableCell align="left" sx={{ fontSize: "10px", px: 1.5 }}>
                                        {item.particulars}
                                    </TableCell>
                                    <TableCell align="left" sx={{ fontSize: "10px", px: 1.5 }}>
                                        998552
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: "10px", px: 1.5 }}>
                                        ₹{item.basePrice || 0}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: "10px", px: 1.5 }}>
                                        ₹{item.discount || 0}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: "10px", px: 1.5 }}>
                                        ₹{item.taxAmount || 0}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: "10px", px: 1.5 }}>
                                        ₹{item.amount || 0}
                                    </TableCell>
                                </TableRow>
                            ))}

                            <TableRow sx={{ bgcolor: "#e3f2fd" }}>
                                <TableCell
                                    colSpan={6}
                                    align="right"
                                    sx={{ fontWeight: "bold", fontSize: "10px", px: 1.5 }}
                                >
                                    Total
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ fontWeight: "bold", fontSize: "10px", px: 1.5 }}
                                >
                                    ₹{totalAmount}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>


                {/* Summary */}
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    {/* GST Details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            GST Details
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow sx={{ bgcolor: "#e3f2fd" }}>
                                        <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Amt ₹</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Rate</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Tax ₹</TableCell>
                                    </TableRow>
                                    {items.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                {!invoiceData?.stateOfSupply?.includes("Uttar Pradesh")
                                                    ? "IGST"
                                                    : "CGST / SGST"}

                                            </TableCell>
                                            <TableCell>
                                                ₹{(item.basePrice || 0) - (item.discount || 0)}
                                            </TableCell>
                                            <TableCell>{item.taxPercent || 0}%</TableCell>
                                            <TableCell>₹{item.taxAmount || 0}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                        <TableCell colSpan={3} sx={{ fontWeight: "bold" }}>
                                            Total Tax
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                            ₹{totalTax}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Amount Summary */}
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            Amount Summary
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Sub Total</TableCell>
                                        <TableCell align="right">₹{subtotal}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Total Tax</TableCell>
                                        <TableCell align="right">₹{totalTax}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Total</TableCell>
                                        <TableCell align="right">₹{totalAmount}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Received</TableCell>
                                        <TableCell align="right">₹{receivedAmount}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: "#e3f2fd" }}>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                            Balance Due
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                            ₹{balanceAmount}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            Amount in Words
                        </Typography>
                        <Box sx={{ border: "1px solid #1565c0", p: 0.5 }}>
                            {amountToWords(totalAmount)}
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            Tour Details
                        </Typography>
                        <Box sx={{ border: "1px solid #1565c0", p: 0.5 }}>
                            <b>Start Date</b>: {formatDate(startDate)} , <b>Starting Point</b> : {invoiceData?.startingPoint}
                            <br />
                            <b>Return Date</b>: {formatDate(returnDate)} , <b>Returning Point </b> : {invoiceData?.dropPoint}
                            <br />
                            <b>No Of Pax</b>:{noOfPax} || <b>Cab Type</b> : {cabType}
                            <br />
                            <b>Tour Type</b>: {tourType}
                        </Box>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                        alignItems: "flex-end",
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            sx={{
                                bgcolor: "#1565c0",
                                color: "#fff",
                                p: 0.5,
                                fontWeight: "bold",
                                fontSize: "10px",
                            }}
                        >
                            Terms & Conditions
                        </Typography>

                        <Box sx={{ border: "1px solid #1565c0", p: 0.5 }}>
                            {invoiceData?.companyId?.termsConditions && (
                                <Typography sx={{ fontSize: "10px", mb: 0.5 }}>
                                    <a
                                        href={invoiceData.companyId.termsConditions}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: "#1565c0",
                                            textDecoration: "underline",
                                            fontWeight: 500,
                                        }}
                                    >
                                        View Terms & Conditions
                                    </a>
                                </Typography>
                            )}

                            <Typography sx={{ fontSize: "10px" }}>
                                This is a system-generated invoice. Thank you for your business!
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ textAlign: "center", minWidth: 120 }}>
                        {invoiceData?.companyId?.authorizedSignatory?.signatureImage && (
                            <Box
                                component="img"
                                src={invoiceData?.companyId?.authorizedSignatory?.signatureImage}
                                alt="Authorized Signatory"
                                sx={{
                                    width: 100,
                                    height: 100,
                                    mt: 4,
                                    objectFit: "contain",
                                    display: "block",
                                    marginLeft: "auto",
                                }}
                            />
                        )}

                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default InvoicePDF;