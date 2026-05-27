import React, { useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from "@mui/material";
import { Formik, Form, FieldArray } from "formik";
import { Add, Delete } from "@mui/icons-material";
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

  const activeLeads = leads ? leads.filter((lead) => {
    if (lead.status === "Cancelled") return false;
    const departure = lead.tourDetails?.pickupDrop?.departureDate || lead.tourDetails?.departureDate || lead.tourDetails?.travelDate;
    if (departure) {
      const depDate = new Date(departure);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isNaN(depDate) && depDate < today) return false;
    }
    return true;
  }) : [];

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
        kids: "",
        infants: "",
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
        roomType: "",
        noOfRooms: 1,
        noOfMattress: "",
        noOfVehicles: 0,
        vehiclesSameOrDifferent: "Same",
        multipleVehicles: [
          { vehicleType: "", tripType: "Round Trip", noOfDays: "", perDayCost: "", totalCost: "" }
        ],
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
                  const selectedClient = activeLeads.find(
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
                    setFieldValue(
                      "kids",
                      selectedClient.tourDetails?.members?.kidsWithoutMattress || 0,
                    );
                    setFieldValue(
                      "infants",
                      selectedClient.tourDetails?.members?.infants || 0,
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
                    setFieldValue(
                      "noOfMattress",
                      Number(selectedClient.tourDetails?.accommodation?.noOfMattress) || 0,
                    );
                    setFieldValue(
                      "noOfVehicles",
                      Number(selectedClient.tourDetails?.pickupDrop?.noOfVehicles) || 0,
                    );
                    setFieldValue(
                      "roomType",
                      selectedClient.tourDetails?.accommodation?.sharingType || "",
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
                ) : activeLeads && activeLeads.length > 0 ? (
                  activeLeads.map((lead) => (
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

            {/* Kids (Without Mattress) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Kids (Without Mattress)"
                name="kids"
                value={values.kids}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Infants */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Infants"
                name="infants"
                value={values.infants}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Room Type */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Room Type"
                name="roomType"
                value={values.roomType}
                onChange={handleChange}
                placeholder="e.g., Deluxe, Triple Sharing"
              />
            </Grid>

            {/* Number of Rooms */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Rooms"
                name="noOfRooms"
                value={values.noOfRooms}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Number of Mattress */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Mattress"
                name="noOfMattress"
                value={values.noOfMattress}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Number of Vehicles */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Vehicles"
                name="noOfVehicles"
                value={values.noOfVehicles}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Vehicles Same or Different Options */}
            {values.noOfVehicles > 1 && (
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Are all vehicles same or different?</FormLabel>
                  <RadioGroup
                    row
                    name="vehiclesSameOrDifferent"
                    value={values.vehiclesSameOrDifferent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldValue("vehiclesSameOrDifferent", val);
                      if (val === "Different") {
                        const vehiclesCount = Number(values.noOfVehicles) || 0;
                        const currentList = values.multipleVehicles || [];
                        const newList = [...currentList];
                        while (newList.length < vehiclesCount) {
                          newList.push({
                            vehicleType: "",
                            tripType: "Round Trip",
                            noOfDays: "",
                            perDayCost: "",
                            totalCost: "",
                          });
                        }
                        setFieldValue("multipleVehicles", newList.slice(0, vehiclesCount));
                      }
                    }}
                  >
                    <FormControlLabel value="Same" control={<Radio />} label="Same" />
                    <FormControlLabel value="Different" control={<Radio />} label="Different" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            )}

            {/* Dynamic Vehicles Table */}
            {values.noOfVehicles > 1 && values.vehiclesSameOrDifferent === "Different" && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Enter Details for Multiple Vehicles
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Vehicle Type</TableCell>
                        <TableCell>Trip Type</TableCell>
                        <TableCell>No. of Days</TableCell>
                        <TableCell>Per Day Cost</TableCell>
                        <TableCell>Total Cost</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <FieldArray name="multipleVehicles">
                        {({ remove, push }) => (
                          <>
                            {values.multipleVehicles && values.multipleVehicles.length > 0 ? (
                              values.multipleVehicles.map((vehicle, index) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      name={`multipleVehicles.${index}.vehicleType`}
                                      value={vehicle.vehicleType}
                                      onChange={handleChange}
                                      placeholder="e.g. Innova"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      select
                                      fullWidth
                                      size="small"
                                      name={`multipleVehicles.${index}.tripType`}
                                      value={vehicle.tripType}
                                      onChange={handleChange}
                                    >
                                      <MenuItem value="Round Trip">Round Trip</MenuItem>
                                      <MenuItem value="One Way">One Way</MenuItem>
                                      <MenuItem value="Local">Local</MenuItem>
                                    </TextField>
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      type="number"
                                      name={`multipleVehicles.${index}.noOfDays`}
                                      value={vehicle.noOfDays}
                                      onChange={(e) => {
                                        handleChange(e);
                                        const days = Number(e.target.value) || 0;
                                        const cost = Number(vehicle.perDayCost) || 0;
                                        setFieldValue(
                                          `multipleVehicles.${index}.totalCost`,
                                          days * cost
                                        );
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      type="number"
                                      name={`multipleVehicles.${index}.perDayCost`}
                                      value={vehicle.perDayCost}
                                      onChange={(e) => {
                                        handleChange(e);
                                        const cost = Number(e.target.value) || 0;
                                        const days = Number(vehicle.noOfDays) || 0;
                                        setFieldValue(
                                          `multipleVehicles.${index}.totalCost`,
                                          days * cost
                                        );
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      type="number"
                                      InputProps={{
                                        readOnly: true,
                                      }}
                                      name={`multipleVehicles.${index}.totalCost`}
                                      value={vehicle.totalCost}
                                      onChange={handleChange}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      color="error"
                                      onClick={() => remove(index)}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} align="center">
                                  No vehicles added
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow>
                              <TableCell colSpan={7} align="left">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Add />}
                                  onClick={() =>
                                    push({
                                      vehicleType: "",
                                      tripType: "Round Trip",
                                      noOfDays: "",
                                      perDayCost: "",
                                      totalCost: "",
                                    })
                                  }
                                >
                                  Add Vehicle
                                </Button>
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                      </FieldArray>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

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
