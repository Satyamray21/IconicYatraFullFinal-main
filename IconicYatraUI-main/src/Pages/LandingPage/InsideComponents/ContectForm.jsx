import React from "react";
import {
  TextField,
  Button,
  MenuItem,
  Grid,
  InputAdornment,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LuggageIcon from "@mui/icons-material/Luggage";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const validationSchema = Yup.object({
  name: Yup.string().required("Name required"),
  email: Yup.string().email("Invalid email").required("Email required"),
  phone: Yup.string().required("Phone required"),
});

const ContactForm = () => {
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{
        name: "",
        email: "",
        phone: "",
        timeframe: "",
        adult: "",
        child: "",
        infant: "",
        inclusion: "",
        notes: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { resetForm }) => {
  try {

    const trackingData =
      JSON.parse(localStorage.getItem("trackingData")) || {};

    const payload = {
      ...values,
      ...trackingData
    };

    const res = await fetch(
      `${import.meta.env.VITE_BASE_URL}/api/v1/googleAdsEnquiry`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    if (data.success) {

      toast.success("Enquiry submitted successfully ✅");

      // reset form
      resetForm();

      // redirect
      navigate("/thank-you");

    } else {
      toast.error(data.message || "Something went wrong");
    }

  } catch (error) {
    console.error(error);
    toast.error("Server error. Please try again later.");
  }
}}


    >
      {({ values, handleChange, errors, touched ,isSubmitting}) => (
        <Form>
          {/* Name */}
          <TextField
            size="small"
            fullWidth
            placeholder="Name*"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={touched.name && Boolean(errors.name)}
            helperText={touched.name && errors.name}
            sx={{ mb: 0.5, bgcolor: "#fff", borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon fontSize="small" sx={{ color: "#1976d2" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Email */}
          <TextField
            size="small"
            fullWidth
            placeholder="Email Id*"
            name="email"
            value={values.email}
            onChange={handleChange}
            error={touched.email && Boolean(errors.email)}
            helperText={touched.email && errors.email}
            sx={{ mb: 0.5, bgcolor: "#fff", borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" sx={{ color: "#d32f2f" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Phone */}
          <TextField
            size="small"
            fullWidth
            placeholder="Phone Number"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            sx={{ mb: 0.5, bgcolor: "#fff", borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneAndroidIcon
                    fontSize="small"
                    sx={{ color: "#2e7d32" }}
                  />
                </InputAdornment>
              ),
            }}
          />

          {/* Timeframe */}
          <TextField
            select
            size="small"
            fullWidth
            name="timeframe"
            value={values.timeframe}
            onChange={handleChange}
            sx={{ mb: 0.5, bgcolor: "#fff", borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthIcon
                    fontSize="small"
                    sx={{ color: "#ed6c02" }}
                  />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="1month">1 Month</MenuItem>
            <MenuItem value="3month">3 Months</MenuItem>
            <MenuItem value="6month">6 Months</MenuItem>
          </TextField>

          {/* Travelers */}
          <Grid container spacing={0.5} mb={0.5}>
            <Grid size={{xs:4}}>
              <TextField
                size="small"
                select
                fullWidth
                name="adult"
                label="Adult"
                value={values.adult}
                onChange={handleChange}
                sx={{ bgcolor: "#fff", borderRadius: 1 }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{xs:4}}>
              <TextField
                size="small"
                select
                fullWidth
                name="child"
                label="Child"
                value={values.child}
                onChange={handleChange}
                sx={{ bgcolor: "#fff", borderRadius: 1 }}
              >
                {[0, 1, 2, 3].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{xs:4}}>
              <TextField
                size="small"
                select
                fullWidth
                name="infant"
                label="Infant"
                value={values.infant}
                onChange={handleChange}
                sx={{ bgcolor: "#fff", borderRadius: 1 }}
              >
                {[0, 1, 2].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* Inclusion */}
          <TextField
            size="small"
            select
            fullWidth
            name="inclusion"
            value={values.inclusion}
            onChange={handleChange}
            sx={{ mb: 0.5, bgcolor: "#fff", borderRadius: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LuggageIcon fontSize="small" sx={{ color: "#6a1b9a" }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="hotel">Hotel</MenuItem>
            <MenuItem value="flight">Flight</MenuItem>
            <MenuItem value="sightseeing">Sightseeing</MenuItem>
          </TextField>

          {/* Notes */}
          <TextField
            size="small"
            fullWidth
            multiline
            rows={1}
            placeholder="Notes"
            name="notes"
            value={values.notes}
            onChange={handleChange}
            sx={{ mb: 0.5, bgcolor: "#fff", borderRadius: 1 }}
          />

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{
              background: "#1e66dc",
              py: 0.6,
              fontSize: "13px",
              fontWeight: 600,
              "&:hover": {
                background: "#174fb0",
              },
            }}
          >
             {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default ContactForm;