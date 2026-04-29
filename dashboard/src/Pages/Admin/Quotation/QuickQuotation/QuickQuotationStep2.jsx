import React, { useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { Formik, Form } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { getAllLeads } from "../../../../features/leads/leadSlice";

const formatPickupDropLine = (city, location) => {
  const c = (city || "").trim();
  const l = (location || "").trim();
  if (c && l) return `${c} - ${l}`;
  return c || l || "";
};

const StepClientDetails = ({ onNext }) => {
  const dispatch = useDispatch();
  const { list: leads, status } = useSelector((state) => state.leads);

  useEffect(() => {
    // Fetch all leads when component mounts
    dispatch(getAllLeads());
  }, [dispatch]);

  return (
    <Formik
      initialValues={{
        customerName: "",
        email: "",
        phone: "",
        adults: "",
        children: "",
        message: "",
        tourType: "",
        clientLocation: "",
        tourDestination: "",
        pickupPoint: "",
        dropPoint: "",
        arrivalDate: "",
        departureDate: "",
        pickupTime: "",
        dropTime: "",
        noOfRooms: 1,
      }}
      validate={(values) => {
        const errors = {};

        if (!values.customerName || values.customerName.trim() === "") {
          errors.customerName = "Customer Name is required";
        }

        if (!values.email || values.email.trim() === "") {
          errors.email = "Email is required";
        } else if (
          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
        ) {
          errors.email = "Invalid email address";
        }

        if (!values.phone || values.phone.trim() === "") {
          errors.phone = "Phone number is required";
        }

        if (!values.adults || values.adults === "") {
          errors.adults = "Number of adults is required";
        }

        return errors;
      }}
      onSubmit={(values, { setSubmitting }) => {
        console.log("Client Details Submitted:", values);
        onNext({ clientDetails: values });
        setSubmitting(false);
      }}
    >
      {({
        handleChange,
        values,
        setFieldValue,
        errors,
        touched,
        isSubmitting,
      }) => (
        <Form>
          <Grid container spacing={2}>
            {/* Client Dropdown */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Client Name *"
                name="customerName"
                value={values.customerName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setFieldValue("customerName", selectedName);

                  // Find selected client details
                  const selectedClient = leads.find(
                    (lead) => lead.personalDetails?.fullName === selectedName,
                  );

                  console.log("Selected Client:", selectedClient); // Debug

                  if (selectedClient) {
                    // Auto-fill all fields from the selected lead
                    setFieldValue(
                      "email",
                      selectedClient.personalDetails?.emailId || "",
                    );
                    setFieldValue(
                      "phone",
                      selectedClient.personalDetails?.mobile || "",
                    );
                    const fullLocation = [
                      selectedClient.location?.city,
                      selectedClient.location?.state,
                      selectedClient.location?.country,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    setFieldValue(
                      "clientLocation",
                      fullLocation || selectedClient.location?.city || "",
                    );
                    setFieldValue(
                      "tourDestination",
                      selectedClient.tourDetails?.tourDestination || "",
                    );
                    setFieldValue(
                      "tourType",
                      selectedClient.tourDetails?.tourType || "",
                    );

                    // FIXED: Adults and children are inside tourDetails.members
                    setFieldValue(
                      "adults",
                      selectedClient.tourDetails?.members?.adults || "",
                    );
                    setFieldValue(
                      "children",
                      selectedClient.tourDetails?.members?.children || 0,
                    );

                    // Auto-fill message with tour destination if available
                    const tourDestination =
                      selectedClient.tourDetails?.tourDestination;
                    if (tourDestination) {
                      setFieldValue(
                        "message",
                        `Interested in ${tourDestination} tour package`,
                      );
                    }

                    const pd = selectedClient.tourDetails?.pickupDrop;
                    if (pd) {
                      setFieldValue("arrivalDate", pd.arrivalDate || "");
                      setFieldValue("departureDate", pd.departureDate || "");
                      setFieldValue(
                        "pickupTime",
                        pd.arrivalTime || pd.pickupTime || "",
                      );
                      setFieldValue(
                        "dropTime",
                        pd.departureTime || pd.dropTime || "",
                      );
                      setFieldValue(
                        "pickupPoint",
                        formatPickupDropLine(
                          pd.arrivalCity,
                          pd.arrivalLocation,
                        ),
                      );
                      setFieldValue(
                        "dropPoint",
                        formatPickupDropLine(
                          pd.departureCity,
                          pd.departureLocation,
                        ),
                      );
                    } else {
                      setFieldValue("arrivalDate", "");
                      setFieldValue("departureDate", "");
                      setFieldValue("pickupTime", "");
                      setFieldValue("dropTime", "");
                      setFieldValue("pickupPoint", "");
                      setFieldValue("dropPoint", "");
                    }

                    setFieldValue(
                      "noOfRooms",
                      Number(selectedClient.tourDetails?.accommodation?.noOfRooms) || 1,
                    );
                  }
                }}
                error={touched.customerName && Boolean(errors.customerName)}
                helperText={touched.customerName && errors.customerName}
              >
                {status === "loading" ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                    Loading clients...
                  </MenuItem>
                ) : leads && leads.length > 0 ? (
                  leads.map((lead) => (
                    <MenuItem
                      key={lead._id}
                      value={lead.personalDetails?.fullName}
                    >
                      {/* FIXED: Only show full name, no ID */}
                      {lead.personalDetails?.fullName}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No clients found</MenuItem>
                )}
              </TextField>
            </Grid>

            {/* Email */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                value={values.email}
                onChange={handleChange}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
            </Grid>

            {/* Contact Number */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Phone Number *"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                error={touched.phone && Boolean(errors.phone)}
                helperText={touched.phone && errors.phone}
              />
            </Grid>

            {/* Number of Adults */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Adults *"
                name="adults"
                value={values.adults}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                error={touched.adults && Boolean(errors.adults)}
                helperText={touched.adults && errors.adults}
              />
            </Grid>

            {/* Number of Children */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Children"
                name="children"
                value={values.children}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Tour Type */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Tour Type"
                name="tourType"
                value={values.tourType}
                onChange={handleChange}
              >
                <MenuItem value="">Select Tour Type</MenuItem>
                <MenuItem value="Domestic">Domestic</MenuItem>
                <MenuItem value="International">International</MenuItem>
              </TextField>
            </Grid>

            {/* Client Location */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Client Location"
                name="clientLocation"
                value={values.clientLocation}
                onChange={handleChange}
                placeholder="e.g., Delhi, Uttar Pradesh, India"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="Pick Up Time"
                name="pickupTime"
                value={values.pickupTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="Drop Time"
                name="dropTime"
                value={values.dropTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Message */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message / Requirements"
                name="message"
                value={values.message}
                onChange={handleChange}
                placeholder="Enter any specific requirements or message..."
              />
            </Grid>
          </Grid>

          <Box mt={3} textAlign="right">
            <Button variant="contained" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Next"}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default StepClientDetails;
