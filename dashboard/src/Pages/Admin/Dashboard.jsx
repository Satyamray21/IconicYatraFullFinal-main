import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { TextField as MuiTextField, Select as MuiSelect } from "formik-mui";

const StatCard = ({ title, value, details, gradient }) => (
  <Card
    sx={{
      borderRadius: 3,
      background: gradient,
      color: "#fff",
      boxShadow: 4,
      transition: "transform 0.3s ease",
      display: "flex",
      flexDirection: "column",
      height: "100%", // 👈 force equal height
      "&:hover": {
        transform: "translateY(-5px)",
      },
    }}
  >
    <CardContent sx={{ flex: 1 }}>
      <Typography fontWeight={700} fontSize="1.1rem" gutterBottom>
        {title}: {value}
      </Typography>
      {details.map((item, i) => (
        <Typography key={i} fontSize="0.9rem">
          {item}
        </Typography>
      ))}
    </CardContent>
  </Card>
);


const CalendarDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [scheduler, setScheduler] = useState("Scheduler");
  const [openModal, setOpenModal] = useState(false);

  const year = selectedDate.year();
  const month = selectedDate.month();
  const daysInMonth = selectedDate.daysInMonth();
  const firstDayOfMonth = dayjs(new Date(year, month, 1)).day();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const handlePrevMonth = () =>
    setSelectedDate(selectedDate.subtract(1, "month"));
  const handleNextMonth = () => setSelectedDate(selectedDate.add(1, "month"));

  const validationSchema = Yup.object({
    subject: Yup.string().required("Subject is required"),
    startDate: Yup.date().required("Start Date is required"),
    endDate: Yup.date().required("End Date is required"),
    description: Yup.string().required("Description is required"),
    lead: Yup.string().required("Lead is required"),
    agent: Yup.string().required("Agent is required"),
    staff: Yup.string().required("Staff is required"),
    vendor: Yup.string().required("Vendor is required"),
    priority: Yup.string().required("Priority is required"),
    type: Yup.string().required("Type is required"),
  });

  const initialValues = {
    subject: "",
    startDate: selectedDate,
    endDate: selectedDate.add(1, "hour"),
    description: "",
    lead: "",
    agent: "",
    staff: "",
    vendor: "",
    priority: "",
    type: "",
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3} sx={{ backgroundColor: "#f4f6f8", minHeight: "auto" }}>
        <Grid container spacing={2} mb={4} alignItems="stretch">
          <Grid size={{ xs: 12, sm: 6, md: 3 }} >
            <StatCard
              title="Lead's Req"
              value={0}
              gradient="linear-gradient(135deg, #ff6a00, #ee0979)"
              details={["Active: 0", "Confirmed: 0", "Cancelled: 0"]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Quotation"
              value={0}
              gradient="linear-gradient(135deg, #43cea2, #185a9d)"
              details={["In Process: 0", "Confirmed: 0", "Cancelled: 0"]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Tour"
              value={0}
              gradient="linear-gradient(135deg, #1e3c72, #2a5298)"
              details={["Active: 0", "Upcoming: 0", "Completed: 0"]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Invoice"
              value={0}
              gradient="linear-gradient(135deg, #0c4c66ff, #031a42ff)"
              details={["Revenue: ₹0"]}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              display="flex"
              alignItems="center"
              mb={2}
              p={1}
              borderRadius={2}
              bgcolor="#fff"
              boxShadow={1}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedDate.startOf("month").format("DD/MM/YYYY")} -{" "}
                {selectedDate.endOf("month").format("DD/MM/YYYY")}
              </Typography>
              <ArrowDropDownIcon />
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <DateTimePicker
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />

              <Select
                size="small"
                value={scheduler}
                onChange={(e) => setScheduler(e.target.value)}
                displayEmpty
                fullWidth
              >
                <MenuItem value="Scheduler" disabled>
                  Type
                </MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="itinerary">Itinerary</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="quotation">Quotation</MenuItem>
                <MenuItem value="reminder">Reminder</MenuItem>
                <MenuItem value="requirement">Requirement</MenuItem>
                <MenuItem value="task">Task</MenuItem>
              </Select>

              <Button
                size="small"
                variant="contained"
                sx={{
                  bgcolor: "#ff5722",
                  color: "#fff",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#e64a19" },
                }}
                onClick={() => setOpenModal(true)}
              >
                + New
              </Button>
            </Box>

            <Box
              mt={5}
              bgcolor="#fff"
              borderRadius={2}
              height={200}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow={2}
            >
              <Typography variant="h6" color="text.secondary">
                No Appointments
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              borderRadius={3}
              overflow="hidden"
              bgcolor="#fff"
              boxShadow={3}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={2}
                py={1}
                bgcolor="#1976d2"
                color="#fff"
              >
                <Button
                  onClick={handlePrevMonth}
                  variant="text"
                  sx={{ color: "#fff", minWidth: 0 }}
                >
                  &lt;
                </Button>
                <Typography variant="subtitle1">
                  {selectedDate.format("MMMM YYYY")}
                </Typography>
                <Button
                  onClick={handleNextMonth}
                  variant="text"
                  sx={{ color: "#fff", minWidth: 0 }}
                >
                  &gt;
                </Button>
              </Box>

              <Box
                display="grid"
                gridTemplateColumns="repeat(7, 1fr)"
                px={1}
                py={0.5}
                bgcolor="#f1f1f1"
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <Typography
                      key={day}
                      align="center"
                      fontSize={13}
                      fontWeight="bold"
                    >
                      {day}
                    </Typography>
                  )
                )}
              </Box>

              <Divider />

              <Box
                display="grid"
                gridTemplateColumns="repeat(7, 1fr)"
                gap={0.5}
                p={1}
                minHeight={200} // Reduced from 300
              >
                {calendarDays.map((day, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      minHeight: 43, // Reduced height
                      textAlign: "center",
                      lineHeight: "40px", // Reduced line height
                      backgroundColor:
                        day === selectedDate.date() ? "#bbdefb" : "#fff",
                      color:
                        day === selectedDate.date() ? "#0d47a1" : "inherit",
                      fontWeight:
                        day === selectedDate.date() ? "bold" : "normal",
                      fontSize: 13,
                    }}
                  >
                    {day || ""}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Schedule</DialogTitle>
          <DialogContent dividers>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values, { resetForm }) => {
                console.log("Submitted", values);
                resetForm();
                setOpenModal(false);
              }}
            >
              {({ setFieldValue, values }) => (
                <Form>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={MuiTextField}
                        name="subject"
                        label="Subject"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <DateTimePicker
                        label="Start Date"
                        value={values.startDate}
                        onChange={(val) => setFieldValue("startDate", val)}
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <DateTimePicker
                        label="End Date"
                        value={values.endDate}
                        onChange={(val) => setFieldValue("endDate", val)}
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Field
                        component={MuiTextField}
                        name="description"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Field
                        component={MuiSelect}
                        name="lead"
                        label="Lead"
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Lead
                        </MenuItem>
                        <MenuItem value="Lead A">Lead A</MenuItem>
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Field
                        component={MuiSelect}
                        name="agent"
                        label="Agent"
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Agent
                        </MenuItem>
                        <MenuItem value="Agent A">Agent A</MenuItem>
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Field
                        component={MuiSelect}
                        name="staff"
                        label="Staff"
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Staff
                        </MenuItem>
                        <MenuItem value="Staff A">Staff A</MenuItem>
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Field
                        component={MuiSelect}
                        name="vendor"
                        label="Vender"
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Select Vendor
                        </MenuItem>
                        <MenuItem value="Vendor A">Vendor A</MenuItem>
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Field
                        component={MuiSelect}
                        name="priority"
                        label="Priority"
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Priority
                        </MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Field
                        component={MuiSelect}
                        name="type"
                        label="Type"
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="" disabled>
                          Type
                        </MenuItem>
                        <MenuItem value="Event">Event</MenuItem>
                        <MenuItem value="Task">Task</MenuItem>
                      </Field>
                    </Grid>
                  </Grid>
                  <DialogActions sx={{ mt: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                    <Button variant="contained" type="submit">
                      Save
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarDashboard;
