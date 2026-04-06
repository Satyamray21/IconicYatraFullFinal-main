// QuotationPDFDialog.jsx
import React, { useRef, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
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
    Alert,
    Snackbar,
    CircularProgress,
} from "@mui/material";
import {
    PictureAsPdf as PictureAsPdfIcon,
    Download,
    Print,
    Close,
} from "@mui/icons-material";

const QuotationPDFDialog = ({ open, onClose, quotation }) => {
    const printRef = useRef();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Company logo URL
    const companyLogo = "https://iconicyatra.com/assets/logoiconic-CDBgNKCW.jpg";

    // Default quotation data structure
    const defaultQuotation = {
        date: "27/08/2025",
        reference: "41",
        customer: {
            name: "Amit Jaiswal",
            location: "Andhya Pradesh",
            phone: "+91 7053900957",
            email: "amit.jaiswal@example.com",
        },
        pickup: {
            arrival: "Arrival: Lucknow (22/08/2025) at Airport, 3:35PM",
            departure: "Departure: Delhi (06/09/2025) from Local Address, 6:36PM",
        },
        hotel: {
            guests: "6 Adults",
            rooms: "3 Bedroom",
            mealPlan: "CP, AP, EP",
            destination: "3N Borong, 2N Damthang",
            itinerary: "This is only tentative schedule for sightseeing and travel...",
        },
        pricing: {
            discount: "₹ 200",
            gst: "₹ 140",
            total: "₹ 3,340",
            received: "₹ 1,500",
            balance: "₹ 1,840"
        },
        policies: {
            inclusions: [
                "All transfers tours in a Private AC cab.",
                "Parking, Toll charges, Fuel and Driver expenses.",
                "Hotel Taxes.",
                "Car AC off during hill stations.",
            ],
            exclusions: "1. Any Cost change...",
            paymentPolicy: "50% amount to pay at confirmation, balance before 10 days.",
            cancellationPolicy: "1. Before 15 days: 50%. 2. Within 7 days: 100%.",
            terms: "1. This is only a Quote. Availability is checked only on confirmation...",
        },
        footer: {
            contact: "Amit Jaiswal | +91 7053900957 (Noida)",
            phone: "+91 7053900957",
            email: "amit.jaiswal@example.com",
            company: "Iconic Yatra",
            address: "Office No 15, Bhawani Market Sec 27, Noida, Uttar Pradesh – 201301",
            website: "https://www.iconicyatra.com",
        },
        hotelPricingData: [
            {
                destination: "Borong",
                nights: "3 N",
                standard: "Tempo Heritage Resort",
                deluxe: "Tempo Heritage Resort",
                superior: "Yovage The Aryan Regency",
            },
            {
                destination: "Damthang",
                nights: "2 N",
                standard: "Tempo Heritage Resort",
                deluxe: "Tempo Heritage Resort",
                superior: "Yovage The Aryan Regency",
            },
            {
                destination: "Quotation Cost",
                nights: "-",
                standard: "₹ 40,366",
                deluxe: "₹ 440,829",
                superior: "₹ 92,358",
            },
            {
                destination: "IGST",
                nights: "-",
                standard: "₹ 2,018.3",
                deluxe: "₹ 22,041.4",
                superior: "₹ 4,617.9",
            },
            {
                destination: "Total Quotation Cost",
                nights: "5 N",
                standard: "₹ 42,384",
                deluxe: "₹ 462,870",
                superior: "₹ 96,976",
            },
        ],
        days: [
            { id: 1, date: "11/09/2025", title: "About Day 1", description: "Arrival and check-in process" },
        ],
    };

    // Use provided quotation or default data
    const quotationData = quotation || defaultQuotation;

    const handleDownloadPDF = async () => {
        try {
            setLoading(true);
            setError("");

            // Dynamically import the libraries
            const [jsPDFModule, html2canvasModule] = await Promise.all([
                import("jspdf"),
                import("html2canvas")
            ]);

            const jsPDF = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            // Create a new PDF document
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Get all page elements
            const pages = printRef.current.querySelectorAll('.pdf-page');

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                // Show the current page and hide others
                pages.forEach((p, index) => {
                    p.style.display = index === i ? 'block' : 'none';
                });

                // Capture the page as canvas
                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: page.offsetWidth,
                    height: page.offsetHeight
                });

                const imgData = canvas.toDataURL("image/png");
                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Add new page for all pages except the first one
                if (i > 0) {
                    pdf.addPage();
                }

                // Add image to PDF
                pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            }

            // Show all pages again
            pages.forEach(page => {
                page.style.display = 'block';
            });

            // Save the PDF
            pdf.save(`${quotationData.customer.name.replace(/\s+/g, '_')}_${quotationData.reference}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            setError("Failed to generate PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (content) {
            const printWindow = window.open('', '_blank');
            const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${quotationData.customer.name} - Quotation</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 20px;
                line-height: 1.4;
                font-size: 12px;
                color: #000;
              }
              .pdf-page { 
                page-break-after: always;
                margin-bottom: 20px;
                padding: 20px;
              }
              .pdf-page:last-child { 
                page-break-after: auto;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 10px 0; 
              }
              th, td { 
                border: 1px solid #000; 
                padding: 6px; 
                text-align: left; 
                font-size: 11px;
              }
              th { 
                background-color: #f0f0f0; 
                font-weight: bold; 
              }
              ol, ul { 
                margin: 5px 0; 
                padding-left: 20px; 
              }
              li { 
                margin-bottom: 3px; 
              }
              .section { 
                margin-bottom: 15px; 
              }
              .section-title { 
                font-weight: bold; 
                margin-bottom: 8px; 
              }
              .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                margin-bottom: 20px; 
              }
              .logo-container { 
                width: 100px;  /* Reduced from 150px */
                height: 40px;  /* Reduced from 60px */
                display: flex; 
                align-items: center; 
                justify-content: center;
              }
              .logo-img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              .company-info { 
                text-align: right; 
              }
              @media print {
                body { margin: 0; padding: 15px; }
                .pdf-page { margin: 0; padding: 15px; }
              }
            </style>
          </head>
          <body>
            ${content.innerHTML}
          </body>
        </html>
      `;

            printWindow.document.write(printContent);
            printWindow.document.close();

            // Wait for content to load before printing
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const handleCloseError = () => {
        setError("");
    };

    // PDF Content Component
    const PDFContent = () => (
        <Box sx={{
            backgroundColor: "#fff",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1.4,
            fontSize: '12px',
            color: '#000'
        }}>
            {/* Page 1 */}
            <Box className="pdf-page" sx={{
                minHeight: '270mm',
                padding: '20px',
                boxSizing: 'border-box'
            }}>
                {/* Header with Logo and Company Info */}
                <Box className="header">
                    <Box className="logo-container">
                        <img
                            src={companyLogo}
                            alt={`${quotationData.footer.company} Logo`}
                            className="logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <Box
                            className="logo-fallback"
                            sx={{
                                display: 'none',
                                width: '100px',  // Reduced size
                                height: '40px',  // Reduced size
                                backgroundColor: '#f0f0f0',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #ddd',
                                fontSize: '10px'  // Smaller font for fallback
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">
                                {quotationData.footer.company}
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="company-info">
                        <Typography variant="h6" fontWeight="bold">
                            QUOTATION
                        </Typography>
                        <Typography variant="body2">
                            Date: {quotationData.date}
                        </Typography>
                        <Typography variant="body2">
                            Ref: {quotationData.reference}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Kind Attention
                </Typography>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                    {quotationData.customer.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    {quotationData.customer.location}
                </Typography>

                <Box sx={{ mt: 3 }} className="section">
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        About Us
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {quotationData.footer.company} is the main online Tour operator Platform. We are tour packages specialist for Domestic and International both, offering a wide range of administrations that incorporate travel services need are the bundles given by our organisation in particular Domestic Tour Packages and International Tour Packages.
                    </Typography>
                </Box>

                <Box sx={{ mt: 3 }} className="section">
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Pickup/Drop Details
                    </Typography>
                    <Typography variant="body1">
                        {quotationData.pickup.arrival}
                    </Typography>
                    <Typography variant="body1">
                        {quotationData.pickup.departure}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                        Destination: {quotationData.hotel.destination}
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ mt: 1 }}>
                        {quotationData.hotel.itinerary}
                    </Typography>
                </Box>

                <Box sx={{ mt: 3 }} className="section">
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Day Wise Itinerary
                    </Typography>
                    <Typography variant="body1" fontStyle="italic" paragraph>
                        This is only tentative schedule for sightseeing and travel. Actual sightseeing may get affected due to weather, road conditions, local authority notices, shortage of timing, or off days.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {quotationData.days.map((day, index) => (
                            <Typography key={day.id} variant="body1">
                                <strong>Day {index + 1} ({day.date}):</strong> {day.title} - {day.description}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Page 2 - Package Details & Pricing */}
            <Box className="pdf-page" sx={{
                minHeight: '270mm',
                padding: '20px',
                boxSizing: 'border-box'
            }}>
                <Box className="header">
                    <Box className="logo-container">
                        <img
                            src={companyLogo}
                            alt={`${quotationData.footer.company} Logo`}
                            className="logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <Box
                            className="logo-fallback"
                            sx={{
                                display: 'none',
                                width: '100px',  // Reduced size
                                height: '40px',  // Reduced size
                                backgroundColor: '#f0f0f0',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #ddd',
                                fontSize: '10px'  // Smaller font for fallback
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">
                                {quotationData.footer.company}
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="company-info">
                        <Typography variant="h6" fontWeight="bold">
                            QUOTATION
                        </Typography>
                        <Typography variant="body2">
                            Date: {quotationData.date}
                        </Typography>
                        <Typography variant="body2">
                            Ref: {quotationData.reference}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Package Details
                </Typography>
                <Typography variant="body1" gutterBottom>
                    No of Guest: {quotationData.hotel.guests}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    No of Rooms: {quotationData.hotel.rooms}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Meal Plan: {quotationData.hotel.mealPlan}
                </Typography>

                {/* Hotel Pricing Table */}
                <TableContainer component={Paper} sx={{ mt: 2, mb: 2, boxShadow: 'none' }}>
                    <Table size="small" sx={{ border: '1px solid #000' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '11px' }}>Destination</TableCell>
                                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '11px' }}>Nights</TableCell>
                                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '11px' }}>Standard</TableCell>
                                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '11px' }}>Deluxe</TableCell>
                                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '11px' }}>Superior</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {quotationData.hotelPricingData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell sx={{ border: '1px solid #000', fontSize: '11px', fontWeight: index >= quotationData.hotelPricingData.length - 2 ? 'bold' : 'normal' }}>
                                        {row.destination}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid #000', fontSize: '11px', fontWeight: index >= quotationData.hotelPricingData.length - 2 ? 'bold' : 'normal' }}>
                                        {row.nights}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid #000', fontSize: '11px', fontWeight: index >= quotationData.hotelPricingData.length - 2 ? 'bold' : 'normal' }}>
                                        {row.standard}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid #000', fontSize: '11px', fontWeight: index >= quotationData.hotelPricingData.length - 2 ? 'bold' : 'normal' }}>
                                        {row.deluxe}
                                    </TableCell>
                                    <TableCell sx={{ border: '1px solid #000', fontSize: '11px', fontWeight: index >= quotationData.hotelPricingData.length - 2 ? 'bold' : 'normal' }}>
                                        {row.superior}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pricing Summary */}
                <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 1, border: '1px solid #ddd' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Pricing Summary
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Discount:</Typography>
                        <Typography variant="body2">{quotationData.pricing.discount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">GST:</Typography>
                        <Typography variant="body2">{quotationData.pricing.gst}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body1" fontWeight="bold">Total:</Typography>
                        <Typography variant="body1" fontWeight="bold">{quotationData.pricing.total}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Received:</Typography>
                        <Typography variant="body2">{quotationData.pricing.received}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Balance:</Typography>
                        <Typography variant="body2">{quotationData.pricing.balance}</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Page 3 - Policies */}
            <Box className="pdf-page" sx={{
                minHeight: '270mm',
                padding: '20px',
                boxSizing: 'border-box'
            }}>
                <Box className="header">
                    <Box className="logo-container">
                        <img
                            src={companyLogo}
                            alt={`${quotationData.footer.company} Logo`}
                            className="logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <Box
                            className="logo-fallback"
                            sx={{
                                display: 'none',
                                width: '100px',  // Reduced size
                                height: '40px',  // Reduced size
                                backgroundColor: '#f0f0f0',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #ddd',
                                fontSize: '10px'  // Smaller font for fallback
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">
                                {quotationData.footer.company}
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="company-info">
                        <Typography variant="h6" fontWeight="bold">
                            QUOTATION
                        </Typography>
                        <Typography variant="body2">
                            Date: {quotationData.date}
                        </Typography>
                        <Typography variant="body2">
                            Ref: {quotationData.reference}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Inclusion Policy */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Inclusion Policy
                </Typography>
                <Box component="ol" sx={{ pl: 2 }}>
                    {quotationData.policies.inclusions.map((inclusion, index) => (
                        <Typography key={index} variant="body1" component="li">
                            {inclusion}
                        </Typography>
                    ))}
                </Box>

                <Box sx={{ borderTop: '1px solid #000', my: 2 }} />

                {/* Exclusion Policy */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Exclusion Policy
                </Typography>
                <Typography variant="body1" paragraph>
                    {quotationData.policies.exclusions}
                </Typography>

                <Box sx={{ borderTop: '1px solid #000', my: 2 }} />

                {/* Payment Policy */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Payment Policy
                </Typography>
                <Typography variant="body1" paragraph>
                    {quotationData.policies.paymentPolicy}
                </Typography>

                <Box sx={{ borderTop: '1px solid #000', my: 2 }} />

                {/* Cancellation Policy */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Cancellation & Refund Policy
                </Typography>
                <Typography variant="body1" paragraph>
                    {quotationData.policies.cancellationPolicy}
                </Typography>
            </Box>

            {/* Page 4 - Terms & Footer */}
            <Box className="pdf-page" sx={{
                minHeight: '270mm',
                padding: '20px',
                boxSizing: 'border-box'
            }}>
                <Box className="header">
                    <Box className="logo-container">
                        <img
                            src={companyLogo}
                            alt={`${quotationData.footer.company} Logo`}
                            className="logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <Box
                            className="logo-fallback"
                            sx={{
                                display: 'none',
                                width: '100px',  // Reduced size
                                height: '40px',  // Reduced size
                                backgroundColor: '#f0f0f0',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #ddd',
                                fontSize: '10px'  // Smaller font for fallback
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">
                                {quotationData.footer.company}
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="company-info">
                        <Typography variant="h6" fontWeight="bold">
                            QUOTATION
                        </Typography>
                        <Typography variant="body2">
                            Date: {quotationData.date}
                        </Typography>
                        <Typography variant="body2">
                            Ref: {quotationData.reference}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Terms & Conditions */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Terms & Conditions
                </Typography>
                <Typography variant="body1" paragraph>
                    {quotationData.policies.terms}
                </Typography>

                <Box sx={{ borderTop: '1px solid #000', my: 2 }} />

                {/* Footer */}
                <Box sx={{ mt: 4 }} className="section" textAlign="center">
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                        Thanks & Regards,
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                        {quotationData.footer.company}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {quotationData.footer.contact}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {quotationData.footer.address}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {quotationData.footer.website}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Phone: {quotationData.footer.phone} | Email: {quotationData.footer.email}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        GST: 09EYCPK8832C1ZC
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { minHeight: "80vh", width: "90vw" } }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div" fontWeight="bold">
                        Preview PDF - {quotationData.customer.name}
                    </Typography>
                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handlePrint}
                            startIcon={<Print />}
                            disabled={loading}
                        >
                            Print
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDownloadPDF}
                            startIcon={loading ? <CircularProgress size={20} /> : <Download />}
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Download PDF"}
                        </Button>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {/* Error Snackbar */}
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={handleCloseError}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                        {error}
                    </Alert>
                </Snackbar>

                {loading && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bgcolor="rgba(255,255,255,0.8)"
                        zIndex={1}
                    >
                        <Box textAlign="center">
                            <CircularProgress size={40} />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Generating PDF...
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Box sx={{ height: "70vh", width: "100%", overflow: 'auto' }} ref={printRef}>
                    <PDFContent />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} startIcon={<Close />}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuotationPDFDialog;