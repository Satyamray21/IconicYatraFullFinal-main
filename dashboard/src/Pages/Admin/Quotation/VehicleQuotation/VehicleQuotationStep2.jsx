import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createVehicleQuotation } from "../../../../features/quotation/vehicleQuotationSlice";

const VehicleQuotationStep2 = ({ step1Data, onBack }) => {
  const [openPreview, setOpenPreview] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formik = useFormik({
    initialValues: {


      discount: "",
      gstOption: "",
      taxPercent: "",
      contactDetails: "",
    },
    validationSchema: Yup.object({
      discount: Yup.number().typeError("Must be a number"),
      gstOption: Yup.string().required("Required"),
      taxPercent: Yup.string().required("Required"),
      contactDetails: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      // Combine step1 + step2 data
      const finalData = {
        basicsDetails: {
          clientName: step1Data.clientName,
          vehicleType: step1Data.vehicleType,
          tripType: step1Data.tripType,
          noOfDays: step1Data.noOfDays,
          perDayCost: step1Data.perDayCost,
        },
        costDetails: {
          totalCost: step1Data.totalCost,
          discount: values.discount,
          gstOn: values.gstOption,          // ✅ FIXED
          applyGst: values.taxPercent,
        },
        pickupDropDetails: {
          pickupDate: step1Data.pickupDate,
          pickupTime: step1Data.pickupTime,
          pickupLocation: step1Data.pickupLocation,
          dropDate: step1Data.dropDate,
          dropTime: step1Data.dropTime,
          dropLocation: step1Data.dropLocation,
        },
        signatureDetails: {
          contactDetails: values.contactDetails,
        },
      };

      try {
        const result = await dispatch(createVehicleQuotation(finalData)).unwrap();
        console.log("API Response:", result);

        setOpenSnackbar(true);

        // Reset Form after success
        formik.resetForm();

        // Navigate back or to listing after success
        navigate("/quotation", { replace: true });
      } catch (err) {
        console.error("Error creating quotation:", err);
      }
    },
  });

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: "auto" }} elevation={3}>
      <Typography variant="h6" gutterBottom>
        Quotation : Margin & Taxes
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        {/* Company Margin */}
        <Box sx={{ mb: 3, border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Company Margin
          </Typography>
          <Grid container spacing={2}>


          </Grid>
        </Box>

        {/* Discount */}
        <Box sx={{ mb: 3, border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Discount
          </Typography>
          <TextField
            fullWidth
            label="Discount in ₹"
            name="discount"
            value={formik.values.discount}
            onChange={formik.handleChange}
            error={formik.touched.discount && Boolean(formik.errors.discount)}
            helperText={formik.touched.discount && formik.errors.discount}
          />
        </Box>

        {/* Taxes */}
        <Box sx={{ mb: 3, border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Taxes
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">GST ON</FormLabel>
            <RadioGroup
              row
              name="gstOption"
              value={formik.values.gstOption}
              onChange={formik.handleChange}
            >
              <FormControlLabel value="Full" control={<Radio />} label="Full" />
              <FormControlLabel
                value="Margin"
                control={<Radio />}
                label="Margin"
              />
              <FormControlLabel value="None" control={<Radio />} label="None" />
            </RadioGroup>
            {formik.touched.gstOption && formik.errors.gstOption && (
              <Typography variant="caption" color="error">
                {formik.errors.gstOption}
              </Typography>
            )}
          </FormControl>

          <TextField
            select
            fullWidth
            label="Apply GST (Tax %)"
            name="taxPercent"
            value={formik.values.taxPercent}
            onChange={formik.handleChange}
            error={
              formik.touched.taxPercent && Boolean(formik.errors.taxPercent)
            }
            helperText={formik.touched.taxPercent && formik.errors.taxPercent}
          >
            <MenuItem value="5%">5%</MenuItem>
            <MenuItem value="12%">12%</MenuItem>
            <MenuItem value="18%">18%</MenuItem>
            <MenuItem value="28%">28%</MenuItem>
          </TextField>
        </Box>

        {/* Signature Details */}
        <Box sx={{ mb: 3, border: "1px solid #ccc", p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Signature Details
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Contact Details"
            name="contactDetails"
            value={formik.values.contactDetails}
            onChange={formik.handleChange}
            error={
              formik.touched.contactDetails &&
              Boolean(formik.errors.contactDetails)
            }
            helperText={
              formik.touched.contactDetails && formik.errors.contactDetails
            }
          />
        </Box>

        {/* Buttons */}
        <Box display="flex" gap={2}>
          <Button
            fullWidth
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => onBack()}
          >
            Back
          </Button>

          <Button fullWidth type="submit" variant="contained" color="primary">
            Submit
          </Button>

          <Button
            fullWidth
            type="button"
            variant="outlined"
            onClick={() => setOpenPreview(true)}
          >
            Preview
          </Button>
        </Box>
      </form>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="md"
        fullWidth
      >
        {/* Header */}
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 22,
            bgcolor: "#f5f5f5",
          }}
        >
          Iconic Yatra - Quotation Preview
        </DialogTitle>

        {/* Body */}
        <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
          {/* Step 1 Data */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              borderBottom: "2px solid #1976d2",
              pb: 1,
              mb: 2,
              textAlign: "center",
            }}
          >
            Vehicle & Trip Details
          </Typography>

          <Grid
            container
            spacing={3}
            justifyContent="center"
            textAlign="center"
            sx={{ mb: 3 }}
          >
            <Grid size={{ xs: 6 }}>
              <Typography>
                <strong>Client Name</strong>
              </Typography>
              <Typography>{step1Data.clientName}</Typography>

              <Typography>
                <strong>Vehicle Type</strong>
              </Typography>
              <Typography>{step1Data.vehicleType}</Typography>

              <Typography>
                <strong>Trip Type</strong>
              </Typography>
              <Typography>{step1Data.tripType}</Typography>

              <Typography>
                <strong>No of Days</strong>
              </Typography>
              <Typography>{step1Data.noOfDays}</Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Typography>
                <strong>Total Cost</strong>
              </Typography>
              <Typography>₹{step1Data.totalCost}</Typography>

              <Typography>
                <strong>Pickup</strong>
              </Typography>
              <Typography>
                {step1Data.pickupDate?.toLocaleDateString()}{" "}
                {step1Data.pickupTime?.toLocaleTimeString()}
              </Typography>
              <Typography>{step1Data.pickupLocation}</Typography>

              <Typography>
                <strong>Drop</strong>
              </Typography>
              <Typography>
                {step1Data.dropDate?.toLocaleDateString()}{" "}
                {step1Data.dropTime?.toLocaleTimeString()}
              </Typography>
              <Typography>{step1Data.dropLocation}</Typography>
            </Grid>
          </Grid>

          {/* Step 2 Data */}


          <Grid container spacing={3} justifyContent="center" textAlign="center">
            <Grid size={{ xs: 6 }}>



              <Typography>
                <strong>Discount</strong>
              </Typography>
              <Typography>₹{formik.values.discount}</Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Typography>
                <strong>GST On</strong>
              </Typography>
              <Typography>{formik.values.gstOption}</Typography>

              <Typography>
                <strong>Tax %</strong>
              </Typography>
              <Typography>{formik.values.taxPercent}</Typography>

              <Typography>
                <strong>Contact Details</strong>
              </Typography>
              <Typography>{formik.values.contactDetails}</Typography>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ justifyContent: "center", bgcolor: "#f5f5f5" }}>
          <Button
            onClick={() => setOpenPreview(false)}
            variant="contained"
            sx={{ bgcolor: "#1976d2" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: "100%" }}>
          Vehicle quotation created successfully!
        </Alert>
      </Snackbar>

    </Paper>
  );
};

export default VehicleQuotationStep2;
