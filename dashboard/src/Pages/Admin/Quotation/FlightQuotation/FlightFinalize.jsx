import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Flight,
  Person,
  LocationOn,
  Download,
  CheckCircle,
  Flag,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getFlightQuotationById,
  confirmFlightQuotation,
} from "../../../../features/quotation/flightQuotationSlice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "jspdf/dist/polyfills.es.js";


const FlightFinalize = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [pnrList, setPnrList] = useState([]);
  const [finalFareList, setFinalFareList] = useState([]);
  const [totalFinalFare, setTotalFinalFare] = useState(0);
  const [flightData, setFlightData] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const { id } = useParams();
  const dispatch = useDispatch();
  const { quotationDetails, loading } = useSelector(
    (state) => state.flightQuotation
  );
  const quotation = quotationDetails?.quotation || null;

  // ✅ Load flight data whenever quotation changes
  useEffect(() => {
    if (quotation) {
      setFlightData(quotation.flightDetails || []);
      setPnrList(quotation.pnrList || []);
      setFinalFareList(
        quotation.flightDetails?.map((f) => f.fare) || []
      );
      setTotalFinalFare(quotation.finalFare || 0);
    }
  }, [quotation]);

  // ✅ Fetch quotation on mount or ID change
  useEffect(() => {
    if (id) {
      dispatch(getFlightQuotationById(id));
    }
  }, [id, dispatch]);

  if (!quotation || !quotation.flightDetails) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Alert severity="warning">No flight quotation found!</Alert>
      </Box>
    );
  }

  // ✅ Handle Confirm Finalization
  const handleConfirmFinalize = async () => {
    if (pnrList.some((pnr) => !pnr) || finalFareList.some((fare) => !fare)) {
      alert("Please enter PNR and Final Fare for all flights before confirming!");
      return;
    }

    try {
      const response = await dispatch(
        confirmFlightQuotation({
          flightQuotationId: quotation.flightQuotationId,
          pnrList,
          finalFareList,
          finalFare: totalFinalFare,
        })
      ).unwrap();

      // ✅ Extract updated quotation from response
      const updatedQuotation = response?.data;

      // ✅ Refetch from backend to ensure UI sync
      dispatch(getFlightQuotationById(quotation.flightQuotationId));

      // ✅ Update local state instantly
      setFlightData(
        flightData.map((f, index) => ({
          ...f,
          fare: finalFareList[index],
        }))
      );

      // ✅ Update total final fare correctly
      setTotalFinalFare(updatedQuotation?.finalFare || totalFinalFare);

      setOpenDialog(false);
      setOpenSnackbar(true);

    } catch (err) {
      console.error("Error confirming quotation:", err);
    }
  };

  // ✅ PDF Download Handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    // === Header ===
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 30, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Flight Quotation", 14, 20);

    // === Quotation Summary ===
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const startY = 40;
    const leftColX = 14;
    const rightColX = 120;

    doc.text(`Reference No: ${quotation.flightQuotationId}`, leftColX, startY);
    doc.text(
      `Date: ${new Date(quotation.createdAt).toLocaleDateString("en-GB")}`,
      leftColX,
      startY + 8
    );
    doc.text(
      `Customer: ${quotation?.clientDetails?.clientName || quotation?.personalDetails?.fullName}`,
      leftColX,
      startY + 16
    );
    doc.text(`Country: ${quotation.country || "N/A"}`, leftColX, startY + 24);
    doc.text(`Status: ${quotation.status}`, leftColX, startY + 32);

    doc.text("Passengers:", rightColX, startY);
    doc.text(`Adults: ${quotation.adults}`, rightColX, startY + 8);
    doc.text(`Children: ${quotation.childs}`, rightColX, startY + 16);
    doc.text(`Infants: ${quotation.infants}`, rightColX, startY + 24);

    // === Flight Details Table ===
    autoTable(doc, {
      startY: startY + 45,
      head: [["Flight", "From", "To", "Airline", "Flight No", "Departure Date", "Departure Time", "Fare", "PNR"]],
      body: flightData.map((flight, index) => [
        `Flight ${index + 1}`,
        flight.from,
        flight.to,
        flight.preferredAirline,
        flight.flightNo,
        flight.departureDate ? new Date(flight.departureDate).toLocaleDateString("en-GB") : "N/A",
        flight.departureTime ? new Date(flight.departureTime).toLocaleTimeString() : "N/A",
        `₹ ${Number(finalFareList[index] || flight.fare).toLocaleString("en-IN")}`,
        pnrList[index] || "N/A",
      ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 4, valign: "middle" },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: [255, 255, 255],
        halign: "center",
        fontSize: 11,
      },
      bodyStyles: { halign: "center", textColor: [40, 40, 40] },
    });

    // === Final Total Fare ===
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(76, 175, 80);

    // Right-align the final total fare
    const pageWidth = doc.internal.pageSize.getWidth();
    const finalFareText = `Final Total Fare: ₹ ${Number(totalFinalFare).toLocaleString("en-IN")}`;
    const textWidth = doc.getTextWidth(finalFareText);
    const rightAlignedX = pageWidth - textWidth - 14;

    doc.text(finalFareText, rightAlignedX, finalY);

    // === Save PDF ===
    doc.save(`Flight_Quotation_${quotation.flightQuotationId}.pdf`);
  };


  return (
    <>
      <Grid container>
        {/* Sidebar */}
        <Grid
          size={{ xs: 12, md: 3 }}
          sx={{
            borderRight: { md: "1px solid #ddd" },
            p: 3,
            minHeight: "100vh",
            bgcolor: "#f8f9fa",
            textAlign: "center",
          }}
        >
          <Chip
            icon={<Flight />}
            label="Flight Quotation"
            color="primary"
            variant="outlined"
            sx={{ mb: 3 }}
          />
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "#1976d2",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              m: "16px auto",
              color: "white",
              fontSize: 32,
              boxShadow: 2,
            }}
          >
            <Person sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h6" fontWeight="bold">
            {quotation?.clientDetails?.clientName || quotation?.personalDetails?.fullName}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Flag sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
            <Typography variant="body2">{quotation.country}</Typography>
          </Box>
          <Paper variant="outlined" sx={{ p: 2, mt: 4 }}>
            <Typography variant="subtitle2">Booking Summary</Typography>
            <Divider sx={{ my: 1 }} />
            {[["Reference No:", quotation.flightQuotationId], ["Date:", new Date(quotation.createdAt).toLocaleDateString("en-GB")]].map(([k, v]) => (
              <Box key={k} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{k}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {v}
                </Typography>
              </Box>
            ))}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Status:</Typography>
              <Chip
                label={quotation.status}
                color={quotation.status === "Confirmed" ? "success" : "default"}
                size="small"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid size={{ xs: 12, md: 9 }} sx={{ p: 3 }}>
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={() => setOpenDialog(true)}
              disabled={quotation.status === "Confirmed"}
            >
              {quotation.status === "Confirmed" ? "Booking Confirmed" : "Finalize Booking"}
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadPDF}>
              Download PDF
            </Button>
          </Box>

          {/* Flight Details */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <Flight sx={{ color: "orange", mr: 1 }} />
                <Typography variant="h6" color="orange">
                  <b>
                    Flight Booking Details{" "}
                    {quotation?.tripType === "oneway"
                      ? "(One Way Trip)"
                      : quotation?.tripType === "roundtrip"
                        ? "(Round Trip)"
                        : quotation?.tripType === "multicity"
                          ? "(Multi City Trip)"
                          : ""}
                  </b>
                </Typography>
              </Box>
              <Chip
                label={`Total Fare: ₹ ${flightData.reduce(
                  (total, flight, i) =>
                    total + (parseFloat(finalFareList[i] || flight.fare) || 0),
                  0
                )}`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: "bold", fontSize: "14px" }}
              />
            </Box>

            <Grid container spacing={2}>
              {flightData.map((flight, index) => (
                <Paper
                  key={index}
                  elevation={3}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: index % 2 === 0 ? "#f9f9f9" : "#eef7ff",
                    border: "1px solid #ddd",
                    boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                    sx={{ borderBottom: "1px solid #ccc", pb: 1 }}
                  >
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ✈️ Flight {index + 1}
                    </Typography>
                    <Chip
                      label={`₹ ${finalFareList[index] || flight.fare}`}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight="bold">From:</Typography>
                      <Typography>{flight.from}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight="bold">To:</Typography>
                      <Typography>{flight.to}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight="bold">Airline:</Typography>
                      <Typography>{flight.preferredAirline}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight="bold">Flight Number:</Typography>
                      <Typography>{flight.flightNo}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography fontWeight="bold">Fare:</Typography>
                      <Typography color="green" fontWeight="bold">
                        ₹ {finalFareList[index] || flight.fare}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
          Finalize Flight Booking
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {flightData.map((flight, index) => (
              <Grid key={index} container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label={`PNR (Flight ${index + 1})`}
                    fullWidth
                    value={pnrList[index] || ""}
                    onChange={(e) => {
                      const updated = [...pnrList];
                      updated[index] = e.target.value;
                      setPnrList(updated);
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Final Fare (₹)"
                    type="number"
                    fullWidth
                    value={finalFareList[index] || ""}
                    onChange={(e) => {
                      const updated = [...finalFareList];
                      updated[index] = e.target.value;
                      setFinalFareList(updated);
                    }}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
            ))}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <TextField
                label="Total Final Fare (₹)"
                type="number"
                fullWidth
                value={totalFinalFare}
                onChange={(e) => setTotalFinalFare(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmFinalize}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={18} /> : <CheckCircle />}
            disabled={loading}
          >
            {loading ? "Confirming..." : "Confirm Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Flight booking has been successfully confirmed!
        </Alert>
      </Snackbar>
    </>
  );
};

export default FlightFinalize;
