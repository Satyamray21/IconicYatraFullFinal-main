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
import { getAllLeads, getLeadOptions } from "../../../../features/leads/leadSlice";

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms"];

const normalizeTitle = (value, allowed = TITLE_OPTIONS) => {
  const raw = String(value ?? "")
    .trim()
    .replace(/\.$/, "");
  if (!raw) return allowed[0] || "Mr";
  const match = allowed.find((t) => t.toLowerCase() === raw.toLowerCase());
  return match || allowed[0] || "Mr";
};

const findLeadByName = (leadList, name) =>
  (leadList || []).find(
    (lead) => lead.personalDetails?.fullName === name,
  ) || null;

const formatPickupDropLine = (city, location) => {
  const c = (city || "").trim();
  const l = (location || "").trim();
  if (c && l) return `${c} - ${l}`;
  return c || l || "";
};

const StepClientDetails = ({ onNext, convertSector, convertNights, initialClientDetails = {} }) => {
  const dispatch = useDispatch();
  const { list: leads, status, options: leadOptions = [] } = useSelector(
    (state) => state.leads,
  );

  const titleOptions = React.useMemo(() => {
    const fromApi = (leadOptions || [])
      .filter((opt) => opt.fieldName === "title")
      .map((opt) => opt.value)
      .filter(Boolean);
    return [...new Set([...TITLE_OPTIONS, ...fromApi])];
  }, [leadOptions]);

  const buildInitialValues = React.useCallback(
    () => ({
      title: normalizeTitle(initialClientDetails.title, titleOptions),
      customerName: initialClientDetails.customerName || "",
      email: initialClientDetails.email || "",
      phone: initialClientDetails.phone || "",
      adults: initialClientDetails.adults ?? "",
      children: initialClientDetails.children ?? "",
      kids: initialClientDetails.kids ?? "",
      infants: initialClientDetails.infants ?? "",
      message: initialClientDetails.message || "",
      tourType: initialClientDetails.tourType || "",
      clientLocation: initialClientDetails.clientLocation || "",
      tourDestination: initialClientDetails.tourDestination || "",
      pickupPoint: initialClientDetails.pickupPoint || "",
      dropPoint: initialClientDetails.dropPoint || "",
      arrivalDate: initialClientDetails.arrivalDate || "",
      departureDate: initialClientDetails.departureDate || "",
      pickupTime: initialClientDetails.pickupTime || "",
      dropTime: initialClientDetails.dropTime || "",
      roomType: initialClientDetails.roomType || "",
      noOfRooms: initialClientDetails.noOfRooms ?? 1,
      noOfMattress: initialClientDetails.noOfMattress ?? "",
      noOfVehicles: initialClientDetails.noOfVehicles ?? 0,
      vehiclesSameOrDifferent: initialClientDetails.vehiclesSameOrDifferent || "Same",
      multipleVehicles: Array.isArray(initialClientDetails.multipleVehicles)
        ? initialClientDetails.multipleVehicles
        : [
            {
              vehicleType: "",
              tripType: "Round Trip",
              noOfDays: "",
              perDayCost: "",
              totalCost: "",
            },
          ],
    }),
    [initialClientDetails, titleOptions],
  );

  const activeLeads = leads ? leads.filter((lead) => {
    if (lead.status === "Cancelled" || lead.status === "Confirmed") return false;
    const departure = lead.tourDetails?.pickupDrop?.departureDate || lead.tourDetails?.departureDate || lead.tourDetails?.travelDate;
    if (departure) {
      const depDate = new Date(departure);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isNaN(depDate) && depDate < today) return false;
    }
    
    // Sector-based filtering from "Convert to Quotation"
    if (convertSector) {
      const s = String(convertSector).toLowerCase().trim();
      const dest = String(lead.tourDetails?.tourDestination || "").toLowerCase().trim();
      const locCity = String(lead.location?.city || "").toLowerCase().trim();
      if (!dest.includes(s) && !locCity.includes(s) && !s.includes(dest) && !s.includes(locCity)) {
        return false;
      }
    }

    // Nights-based filtering from "Convert to Quotation"
    if (convertNights !== undefined && convertNights !== null && convertNights > 0) {
      const leadNights = Number(lead.tourDetails?.accommodation?.noOfNights) || Number(lead.tourDetails?.numberOfNights) || 0;
      if (leadNights > 0 && leadNights !== convertNights) {
        return false; // Exclude if nights are explicitly specified in the lead and they don't match
      }
    }
    
    return true;
  }) : [];

  useEffect(() => {
    dispatch(getAllLeads());
    dispatch(getLeadOptions());
  }, [dispatch]);

  const applyLeadToForm = (selectedClient, setFieldValue) => {
    if (!selectedClient) return;

    setFieldValue(
      "title",
      normalizeTitle(selectedClient.personalDetails?.title, titleOptions),
    );
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

    const tourDestination = selectedClient.tourDetails?.tourDestination;
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
        formatPickupDropLine(pd.arrivalCity, pd.arrivalLocation),
      );
      setFieldValue(
        "dropPoint",
        formatPickupDropLine(pd.departureCity, pd.departureLocation),
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
  };

  return (
    <Formik
      enableReinitialize
      initialValues={buildInitialValues()}
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
      }) => {
        useEffect(() => {
          if (!values.customerName || !leads?.length) return;
          const selectedClient =
            findLeadByName(leads, values.customerName) ||
            findLeadByName(activeLeads, values.customerName);
          if (!selectedClient) return;

          const nextTitle = normalizeTitle(
            selectedClient.personalDetails?.title,
            titleOptions,
          );
          const rawTitle = String(values.title || "").trim();
          const shouldAutoFill =
            !rawTitle || !titleOptions.includes(rawTitle);
          if (shouldAutoFill && normalizeTitle(values.title, titleOptions) !== nextTitle) {
            setFieldValue("title", nextTitle);
          }
        }, [values.customerName, values.title, leads, activeLeads, titleOptions, setFieldValue]);

        return (
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

                  const selectedClient =
                    findLeadByName(leads, selectedName) ||
                    findLeadByName(activeLeads, selectedName);

                  if (selectedClient) {
                    applyLeadToForm(selectedClient, setFieldValue);
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

            {/* Title */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Title"
                name="title"
                value={normalizeTitle(values.title, titleOptions)}
                onChange={(e) =>
                  setFieldValue(
                    "title",
                    normalizeTitle(e.target.value, titleOptions),
                  )
                }
                helperText="Auto-filled from lead when client is selected"
              >
                {titleOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
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
        );
      }}
    </Formik>
  );
};

export default StepClientDetails;
