import React, { useState, useEffect } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, Alert } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import axios from "../../../../utils/axios";
import HotelEmailDialog from "./HotelEmailDialog";

const HotelAvailability = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [selectedStay, setSelectedStay] = useState(null);
  const [emailData, setEmailData] = useState(null);
  
  const [companies, setCompanies] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);

  useEffect(() => {
    fetchStays();
    fetchCompaniesAndAccounts();
  }, []);

  const fetchStays = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/quotations/stay-locations");
      setStays(data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch stay locations");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompaniesAndAccounts = async () => {
    try {
      const [compRes, accRes] = await Promise.all([
        axios.get("/company"),
        axios.get("/email-accounts"),
      ]);
      setCompanies(compRes.data.data || []);
      setEmailAccounts(accRes.data.data || []);
    } catch (err) {
      console.error("Failed to load companies or email accounts", err);
    }
  };

  const handleOpenEmail = async (stay) => {
    setSelectedStay(stay);
    try {
      const { data } = await axios.post("/quotations/hotel-availability-email/preview", {
        stay,
        companyId: companies[0]?._id,
      });
      setEmailData(data.data);
      setOpenEmailDialog(true);
    } catch (err) {
      setError("Failed to generate email preview");
    }
  };

  const handleSendEmail = async (values) => {
    try {
      await axios.post("/quotations/hotel-availability-email/send", {
        to: values.to,
        cc: values.cc,
        subject: values.subject,
        bodyHtml: values.message + (values.signature || ""),
        senderAccount: values.senderAccount,
        companyId: values.companyId,
      });
      setOpenEmailDialog(false);
      setError("Email queued successfully! (Success)");
    } catch (err) {
      setError("Failed to send email");
      return false;
    }
  };

  const handleCompanyChange = async (companyId, mailType) => {
    if (!selectedStay) return {};
    try {
      const { data } = await axios.post("/quotations/hotel-availability-email/preview", {
        stay: selectedStay,
        companyId,
      });
      setEmailData(data.data);
      return data.data;
    } catch (err) {
      console.error("Failed to preview with new company", err);
      return {};
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Hotel Availability Requests</Typography>
      {error && <Alert severity={error?.includes && error.includes("Success") ? "success" : "error"} sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Quotation ID</strong></TableCell>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Stay Location</strong></TableCell>
              <TableCell><strong>Check In / Out</strong></TableCell>
              <TableCell><strong>Details</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stays.map((stay, index) => (
              <TableRow key={index}>
                <TableCell>{stay.quotationId}</TableCell>
                <TableCell>{stay.clientName}</TableCell>
                <TableCell>
                  <strong>Hotel</strong><br/>
                  <span style={{color: "gray"}}>{stay.city} ({stay.nights} Nights)</span>
                </TableCell>
                <TableCell>
                  IN: {stay.checkInDate}<br/>
                  OUT: {stay.checkOutDate}
                </TableCell>
                <TableCell>
                  {stay.noOfRooms} Room(s) - {stay.sharingType}<br/>
                  <span style={{color: "gray"}}>{stay.mealPlan} | {stay.roomCategory}</span>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<EmailIcon />}
                    onClick={() => handleOpenEmail(stay)}
                  >
                    SEND REQUEST
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {stays.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No upcoming stays found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {openEmailDialog && (
        <HotelEmailDialog
          open={openEmailDialog}
          onClose={() => setOpenEmailDialog(false)}
          onSend={handleSendEmail}
          onCompanyChange={handleCompanyChange}
          initialValuesOverride={{
            subject: emailData?.normal?.subject || "",
            message: emailData?.normal?.message || "",
          }}
          companyOptions={companies}
          emailAccountOptions={emailAccounts}
        />
      )}
    </Box>
  );
};

export default HotelAvailability;
