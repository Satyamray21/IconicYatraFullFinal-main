import React from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
} from "@mui/material";

// Convert number to words
const numberToWords = (num) => {
    if (typeof num !== "number" || isNaN(num)) return "Zero INR";

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

    if (num === 0) return "Zero INR";

    const convert = (n) => {
        if (n < 20) return ones[n];
        if (n < 100)
            return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        if (n < 1000)
            return (
                ones[Math.floor(n / 100)] +
                " Hundred" +
                (n % 100 ? " " + convert(n % 100) : "")
            );
        if (n < 100000)
            return (
                convert(Math.floor(n / 1000)) +
                " Thousand" +
                (n % 1000 ? " " + convert(n % 1000) : "")
            );
        if (n < 10000000)
            return (
                convert(Math.floor(n / 100000)) +
                " Lakh" +
                (n % 100000 ? " " + convert(n % 100000) : "")
            );
        return (
            convert(Math.floor(n / 10000000)) +
            " Crore" +
            (n % 10000000 ? " " + convert(n % 10000000) : "")
        );
    };

    return convert(num) + " INR";
};

// Format currency
const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(amount || 0);

const InvoicePDF = ({ invoiceData }) => {
    if (!invoiceData)
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">No invoice data available</Typography>
            </Box>
        );

    const { company, customer, invoice, items, summary, description, terms, signature } =
        invoiceData;

    const subTotal = items.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0
    );
    const total = summary?.total || subTotal;
    const received = summary?.received || 0;
    const balance = summary?.balance || total - received;

    return (
        <Box
            sx={{
                p: 3,
                backgroundColor: "#fff",
                color: "#000",
                fontFamily: "Arial, sans-serif",
                "@media print": {
                    p: 0,
                    margin: 0,
                    boxShadow: "none",
                },
            }}
        >
            <Paper
                sx={{
                    width: "210mm",
                    minHeight: "297mm",
                    mx: "auto",
                    p: 4,
                    border: "2px solid #1976d2",
                    "@media print": {
                        border: "none",
                        boxShadow: "none",
                        width: "100%",
                        minHeight: "auto",
                        p: 3,
                    },
                }}
            >
                {/* Header */}
                <Box textAlign="center" borderBottom="3px solid #1976d2" pb={1} mb={3}>
                    <Typography
                        variant="h5"
                        sx={{ color: "#1976d2", fontWeight: "bold", fontSize: "1.6rem" }}
                    >
                        TAX INVOICE
                    </Typography>
                </Box>

                {/* Company Info */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Box flex={1}>
                        <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
                            {company.name}
                        </Typography>
                        <Typography fontSize="14px">{company.address}</Typography>
                        <Typography fontSize="14px">Phone: {company.phone}</Typography>
                        <Typography fontSize="14px">Email: {company.email}</Typography>
                        <Typography fontSize="14px">State: {company.state}</Typography>
                        {company.gstin && (
                            <Typography fontSize="14px" sx={{ fontWeight: "bold", mt: 0.5 }}>
                                GSTIN: {company.gstin}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ flexShrink: 0, ml: 2, textAlign: "center" }}>
                        {company.logo ? (
                            <Box
                                component="img"
                                src={company.logo}
                                alt="Logo"
                                sx={{ height: 80, maxWidth: 150, objectFit: "contain" }}
                                onError={(e) => (e.target.style.display = "none")}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: 80,
                                    width: 150,
                                    backgroundColor: "#1976d2",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                {company.name}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ borderColor: "#1976d2", mb: 3 }} />

                {/* Billing Info */}
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={3} mb={3}>
                    <Box flex="1" minWidth="250px">
                        <Typography sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
                            Billing To
                        </Typography>
                        <Typography fontSize="14px" sx={{ fontWeight: "bold" }}>
                            {customer.name}
                        </Typography>
                        <Typography fontSize="14px">Mobile: {customer.mobile}</Typography>
                        <Typography fontSize="14px">Email: {customer.email}</Typography>
                        <Typography fontSize="14px">State: {customer.state}</Typography>
                        {customer.gstin && (
                            <Typography fontSize="14px" sx={{ fontWeight: "bold", mt: 0.5 }}>
                                GSTIN: {customer.gstin}
                            </Typography>
                        )}
                    </Box>

                    <Box flex="1" minWidth="250px">
                        <Typography sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
                            Invoice Details
                        </Typography>
                        <Typography fontSize="14px">
                            <strong>Invoice No:</strong> {invoice.number}
                        </Typography>
                        <Typography fontSize="14px">
                            <strong>Date:</strong> {invoice.date}
                        </Typography>
                        <Typography fontSize="14px">
                            <strong>Due Date:</strong> {invoice.dueDate}
                        </Typography>
                        <Typography fontSize="14px">
                            <strong>Place of Supply:</strong> {invoice.placeOfSupply}
                        </Typography>
                    </Box>
                </Box>

                {/* Items Table */}
                <TableContainer
                    component={Paper}
                    sx={{ border: "2px solid #1976d2", boxShadow: "none", mb: 3 }}
                >
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: "#E3F2FD" }}>
                            <TableRow>
                                <TableCell sx={{ border: "1px solid #1976d2", fontWeight: "bold" }}>#</TableCell>
                                <TableCell sx={{ border: "1px solid #1976d2", fontWeight: "bold" }}>
                                    Particulars
                                </TableCell>
                                <TableCell sx={{ border: "1px solid #1976d2", fontWeight: "bold" }}>
                                    HSN/SAC
                                </TableCell>
                                <TableCell
                                    sx={{ border: "1px solid #1976d2", fontWeight: "bold", textAlign: "right" }}
                                >
                                    Price (₹)
                                </TableCell>
                                <TableCell
                                    sx={{ border: "1px solid #1976d2", fontWeight: "bold", textAlign: "right" }}
                                >
                                    Amount (₹)
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell sx={{ border: "1px solid #1976d2" }}>{i + 1}</TableCell>
                                    <TableCell sx={{ border: "1px solid #1976d2" }}>{item.particulars}</TableCell>
                                    <TableCell sx={{ border: "1px solid #1976d2" }}>{item.hsnSac || "-"}</TableCell>
                                    <TableCell sx={{ border: "1px solid #1976d2", textAlign: "right" }}>
                                        {formatCurrency(item.price)}
                                    </TableCell>
                                    <TableCell sx={{ border: "1px solid #1976d2", textAlign: "right" }}>
                                        {formatCurrency(item.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={4} sx={{ border: "1px solid #1976d2", fontWeight: "bold" }}>
                                    Total
                                </TableCell>
                                <TableCell sx={{ border: "1px solid #1976d2", textAlign: "right", fontWeight: "bold" }}>
                                    ₹{formatCurrency(total)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Summary */}
                <Box display="flex" justifyContent="flex-end" mb={3}>
                    <Box width="40%" minWidth="250px">
                        <Box display="flex" justifyContent="space-between">
                            <Typography>Sub Total</Typography>
                            <Typography>₹{formatCurrency(subTotal)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography>Total</Typography>
                            <Typography>₹{formatCurrency(total)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography>Received</Typography>
                            <Typography>₹{formatCurrency(received)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                            <Typography sx={{ fontWeight: "bold" }}>Balance Due</Typography>
                            <Typography sx={{ fontWeight: "bold" }}>₹{formatCurrency(balance)}</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Amount in words */}
                <Box mb={3} sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                    <Typography sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
                        Amount in Words:
                    </Typography>
                    <Typography fontSize="14px" sx={{ fontStyle: "italic" }}>
                        {numberToWords(total)}
                    </Typography>
                </Box>

                {description && (
                    <Box mb={3} sx={{ border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
                        <Typography sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
                            Description:
                        </Typography>
                        <Typography fontSize="14px">{description}</Typography>
                    </Box>
                )}

                {/* Footer */}
                <Divider sx={{ borderColor: "#1976d2", my: 2 }} />
                <Typography fontSize="14px">
                    <strong>Terms:</strong> {terms}
                </Typography>

                {/* Signature */}
                <Box textAlign="right" mt={4}>
                    <Typography fontSize="14px">For, {company.name}</Typography>
                    {signature && (
                        <Box
                            component="img"
                            src={signature}
                            alt="signature"
                            sx={{ height: 60, my: 1, maxWidth: 200 }}
                            onError={(e) => (e.target.style.display = "none")}
                        />
                    )}
                    <Typography fontSize="14px" sx={{ borderTop: "1px solid #000", display: "inline-block", pt: 1 }}>
                        Authorized Signatory
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default InvoicePDF;