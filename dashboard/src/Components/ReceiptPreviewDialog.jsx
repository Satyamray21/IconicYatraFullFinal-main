import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import { Close as CloseIcon, Email as EmailIcon } from "@mui/icons-material";
import InvoiceView from "./InvoiceView";
import axios from "../utils/axios";
import { toast } from "react-toastify";
import html2pdf from "html2pdf.js";

const ReceiptPreviewDialog = ({ open, onClose, voucher, quotation }) => {
  const [sending, setSending] = React.useState(false);

  if (!voucher) return null;

  const handleSendEmail = async () => {
    if (!quotation) {
      toast.error("Quotation data missing for sending email");
      return;
    }

    setSending(true);
    try {
      // Use the same logic as InvoiceView to generate PDF if we want it to look the same
      // But we'd need access to InvoiceView's ref.
      // Alternatively, we can let the backend generate it, which is safer.
      
      const payload = {
        to: quotation.email || quotation.clientDetails?.email || quotation.customer?.email || "",
        subject: `Payment Receipt - ${voucher.invoiceId || voucher.receiptNumber}`,
        paymentVoucherId: voucher._id,
        type: "normal"
      };

      const endpoint = quotation.quickQuotationId 
        ? `/quickQT/${quotation._id}/email/send` 
        : `/customQT/${quotation._id}/email/send`;

      await axios.post(endpoint, payload);
      toast.success("Receipt sent successfully via email!");
    } catch (error) {
      console.error("Failed to send receipt:", error);
      toast.error("Failed to send receipt");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Payment Receipt Preview
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <InvoiceView id={voucher._id} hideButtons={true} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button 
          variant="contained" 
          color="success" 
          startIcon={<EmailIcon />} 
          onClick={handleSendEmail}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send to Client Email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;
