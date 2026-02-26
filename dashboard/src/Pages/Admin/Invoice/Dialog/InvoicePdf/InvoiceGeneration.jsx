import React, { useEffect, useRef } from 'react';
import { Container, Box, Button, CircularProgress, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import InvoicePDF from '../InvoicePdf/InvoicePDF';
import { useReactToPrint } from 'react-to-print';
import { getInvoiceById, clearInvoiceState } from '../../../../../features/invoice/invoiceSlice';

const InvoiceGeneration = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const componentRef = useRef();

    // Get invoice data from Redux store
    const { selectedInvoice, loading, error } = useSelector((state) => state.invoice);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    // Fetch invoice data when component mounts or ID changes
    useEffect(() => {
        if (id) {
            dispatch(getInvoiceById(id));
        }
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
                    <Button variant="contained" color="primary" onClick={handlePrint}>
                        Print Invoice
                    </Button>
                </Box>

                <Box ref={componentRef}>
                    <InvoicePDF invoiceData={selectedInvoice} />
                </Box>
            </Box>
        </Container>
    );
};

export default InvoiceGeneration;