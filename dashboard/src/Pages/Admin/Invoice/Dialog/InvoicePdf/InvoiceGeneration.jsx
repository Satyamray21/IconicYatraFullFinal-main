import React, { useEffect, useRef, useState } from 'react';
import { Container, Box, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar } from '@mui/material';
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import api from '../../../../../utils/axios';
import { buildInvoiceWhatsAppText, buildInvoiceEmailHtml } from "../../../../../utils/invoiceMailerTemplates";
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import InvoicePDF from '../InvoicePdf/InvoicePDF';
import EmailInvoiceDialog from '../EmailInvoiceDialog';
import { useReactToPrint } from 'react-to-print';
import { getInvoiceById, clearInvoiceState } from '../../../../../features/invoice/invoiceSlice';
import { fetchCompanies } from '../../../../../features/company/InsideCompany';

const InvoiceGeneration = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const componentRef = useRef();
    const invoicePdfRef = useRef();

    // Dialog state
    const [whatsAppOpen, setWhatsAppOpen] = useState(false);
    const [whatsAppPhone, setWhatsAppPhone] = useState("");
    
    const [mailOpen, setMailOpen] = useState(false);
    
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Get invoice data from Redux store
    const { selectedInvoice, loading, error } = useSelector((state) => state.invoice);
    const { companies = [] } = useSelector((state) => state.company || {});

    const [emailAccountOptions, setEmailAccountOptions] = useState([]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    // Fetch invoice data when component mounts or ID changes
    useEffect(() => {
        if (id) {
            dispatch(getInvoiceById(id));
        }
        dispatch(fetchCompanies());
        api.get("/email-accounts").then((res) => {
            setEmailAccountOptions(res.data?.data || []);
        }).catch(console.error);
    }, [id, dispatch]);

    // Clear error/success messages when component unmounts
    useEffect(() => {
        return () => {
            dispatch(clearInvoiceState());
        };
    }, [dispatch]);

    const handleBack = () => {
        navigate(-1); // Go back to previous page
    };

    const handleWhatsAppClick = () => {
        if (selectedInvoice) {
            setWhatsAppPhone(selectedInvoice.mobile || "");
            setWhatsAppOpen(true);
        }
    };

    const submitWhatsApp = () => {
        if (!selectedInvoice) return;
        const text = buildInvoiceWhatsAppText(selectedInvoice);
        const url = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
        setWhatsAppOpen(false);
    };

    const handleMailClick = () => {
        if (selectedInvoice) {
            setMailOpen(true);
        }
    };

    const submitMail = async (values) => {
        if (!selectedInvoice || !invoicePdfRef.current) return;
        try {
            const base64 = await invoicePdfRef.current.generateBase64();
            if (!base64) throw new Error("Failed to generate PDF");

            const company = companies.find(c => c._id === values.companyId) || (typeof selectedInvoice.companyId === 'object' ? selectedInvoice.companyId : null);
            const bodyHtml = buildInvoiceEmailHtml(selectedInvoice, {
                companyName: company?.companyName || "Iconic Travel",
                intro: values.message,
                signature: values.signature,
                companyTermsConditions: company?.termsAndConditions,
                bankDetails: company?.bankDetails,
                logo: company?.logo
            });

            await api.post(`/invoice/${selectedInvoice._id}/email/send`, {
                to: values.to,
                subject: values.subject,
                bodyHtml,
                senderAccount: values.senderAccount,
                pdfAttachment: {
                    filename: `Invoice_${selectedInvoice.invoiceNo.replace(/\//g, '_')}.pdf`,
                    contentBase64: base64,
                    mimeType: "application/pdf"
                },
                companyId: company?._id || selectedInvoice.companyId
            });
            
            setSnackbar({ open: true, message: "Email sent successfully", severity: "success" });
            return true;
        } catch (error) {
            console.error(error);
            setSnackbar({
                open: true,
                message: "Failed to send email",
                severity: "error",
            });
            return false;
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box py={3} display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box py={3}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button variant="outlined" onClick={handleBack}>
                        Back
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box py={3}>
                <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Button variant="outlined" onClick={handleBack}>
                        Back
                    </Button>
                    <Box display="flex" gap={2}>
                        <Button variant="contained" color="success" onClick={handleWhatsAppClick} startIcon={<WhatsAppIcon />}>
                            WhatsApp
                        </Button>
                        <Button variant="contained" color="secondary" onClick={handleMailClick} startIcon={<EmailIcon />}>
                            Send Mail
                        </Button>
                        <Button variant="contained" color="primary" onClick={handlePrint}>
                            Print Invoice
                        </Button>
                    </Box>
                </Box>

                <Box ref={componentRef}>
                    <InvoicePDF invoiceData={selectedInvoice} ref={invoicePdfRef} />
                </Box>
            </Box>

            {/* WhatsApp Dialog */}
            <Dialog open={whatsAppOpen} onClose={() => setWhatsAppOpen(false)}>
                <DialogTitle>Send via WhatsApp</DialogTitle>
                <DialogContent>
                    <Box mt={1}>
                        <TextField
                            fullWidth
                            label="Phone Number (with Country Code)"
                            variant="outlined"
                            value={whatsAppPhone}
                            onChange={(e) => setWhatsAppPhone(e.target.value)}
                            placeholder="e.g., 919876543210"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWhatsAppOpen(false)}>Cancel</Button>
                    <Button onClick={submitWhatsApp} color="primary" variant="contained">
                        Open WhatsApp
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Send Mail Dialog */}
            <EmailInvoiceDialog
                open={mailOpen}
                onClose={() => setMailOpen(false)}
                onSend={submitMail}
                companyOptions={companies}
                emailAccountOptions={emailAccountOptions}
                initialValuesOverride={{
                    to: selectedInvoice?.email || "",
                    subject: selectedInvoice ? `Invoice ${selectedInvoice.invoiceNo} - ${selectedInvoice.billingName}` : "",
                    companyId: typeof selectedInvoice?.companyId === 'object' ? selectedInvoice?.companyId?._id : (selectedInvoice?.companyId || "")
                }}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default InvoiceGeneration;