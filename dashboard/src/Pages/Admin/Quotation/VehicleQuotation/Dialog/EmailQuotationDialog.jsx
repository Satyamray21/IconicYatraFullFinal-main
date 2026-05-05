import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const EmailQuotationDialog = ({
  open,
  onClose,
  onSend = () => { },
  onCompanyChange,
  initialValuesOverride,
  templateBodies,
  companyOptions = [],
  emailAccountOptions = [],
  hasPdfAttachment = false,
}) => {
  const validationSchema = Yup.object({
    to: Yup.string().email("Invalid email").required("Required"),
    cc: Yup.string().email("Invalid email").nullable(),
    subject: Yup.string().required("Required"),
    message: Yup.string().required("Required"),
    companyId:
      companyOptions.length > 0
        ? Yup.string().required("Select company")
        : Yup.string().nullable(),
    senderAccount: Yup.string().required("Select sender email"),
  });

  const baseInitialValues = {
    to: "",
    cc: "",
    recipientName: "",
    salutation: "",
    subject: "",
    greetLine: "",
    message: "",
    signature: "",
    mailType: "normal",
    senderAccount: emailAccountOptions[0]?._id || "",
    companyId: "",
    nextPayableAmount: "",
    paymentDueDate: null,
  };
  const initialValues = { ...baseInitialValues, ...(initialValuesOverride || {}) };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Format date before sending if it exists
      const formattedValues = {
        ...values,
        paymentDueDate: values.paymentDueDate
          ? dayjs(values.paymentDueDate).format("DD/MM/YYYY")
          : "",
      };
      const result = await onSend(formattedValues);
      if (result !== false) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Email</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue, isSubmitting }) => (
            (() => {
              const appendToMessage = (snippet) => {
                const current = values.message || "";
                const separator = current && !current.endsWith("\n") ? "\n" : "";
                setFieldValue("message", `${current}${separator}${snippet}`);
              };
              const addPaymentReminderBlock = () => {
                const amount = String(values.nextPayableAmount || "").trim() || "2400";
                const dueDate = values.paymentDueDate
                  ? dayjs(values.paymentDueDate).format("DD/MM/YYYY")
                  : "DD/MM/YYYY";
                appendToMessage(
                  `<p style="color:#d32f2f; font-weight:bold;"><b>Next Payable Amount:</b> INR ${amount}</p>`
                );
                appendToMessage(
                  `<p><b>Payment Due Date:</b> ${dueDate}</p>`
                );
                appendToMessage(
                  `<p style="color:#d32f2f; font-weight:bold;">Please clear your all dues as per the payment policy.</p>`
                );
                appendToMessage(
                  `<p style="color:#2e7d32; font-weight:bold;">Kindly pay the next amount as per due date to avoid penalty or fine (10% on remaining amount).</p>`
                );
              };
              return (
                <Form>
                  <DialogContent dividers>
                    <Alert
                      severity={hasPdfAttachment ? "success" : "warning"}
                      sx={{ mb: 2 }}
                    >
                      {hasPdfAttachment
                        ? "PDF attachment is ready and will be sent with normal quotation mail."
                        : "No PDF attachment found. Open Preview PDF and click Send Mail to attach the PDF."}
                    </Alert>
                    <Grid container spacing={2}>
                      {!!templateBodies && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label="Mail Type"
                            value={values.mailType || "normal"}
                            onChange={(e) => {
                              const type = e.target.value;
                              setFieldValue("mailType", type);
                              const tpl = templateBodies?.[type];
                              if (tpl?.subject) setFieldValue("subject", tpl.subject);
                              if (tpl?.message) setFieldValue("message", tpl.message);
                            }}
                          >
                            <MenuItem value="normal">Normal Quotation</MenuItem>
                            <MenuItem value="booking">Booking Confirmation</MenuItem>
                          </TextField>
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          fullWidth
                          name="companyId"
                          label="Company"
                          value={values.companyId || ""}
                          onChange={async (e) => {
                            const companyId = e.target.value;
                            setFieldValue("companyId", companyId);

                            // Find first available account for this company
                            const firstAvailable = emailAccountOptions.find((acc) => {
                              const accCompanyId = acc.companyId?._id || acc.companyId;
                              return accCompanyId === companyId;
                            });
                            if (firstAvailable) {
                              setFieldValue("senderAccount", firstAvailable._id);
                            } else {
                              setFieldValue("senderAccount", "");
                            }

                            if (typeof onCompanyChange === "function") {
                              const nextType = values.mailType || "normal";
                              const { subject: s, message: m } =
                                await onCompanyChange(companyId, nextType);
                              if (s) setFieldValue("subject", s);
                              if (m) setFieldValue("message", m);
                            }
                          }}
                          error={touched.companyId && Boolean(errors.companyId)}
                          helperText={
                            touched.companyId &&
                            (errors.companyId ||
                              `Company Email: ${companyOptions.find((c) => c._id === values.companyId)?.email || "N/A"}`)
                          }
                        >
                          {companyOptions.map((company) => (
                            <MenuItem key={company._id} value={company._id}>
                              {company.companyName}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                          <Field
                          as={TextField}
                          select
                          fullWidth
                          name="senderAccount"
                          label="Send From"
                          error={touched.senderAccount && Boolean(errors.senderAccount)}
                          SelectProps={{
                            renderValue: (selected) => {
                              const acc = emailAccountOptions.find((a) => a._id === selected);
                              return acc ? `${acc.label || acc.displayName} <${acc.email}>` : "Select Sender";
                            },
                          }}
                          helperText={
                            (touched.senderAccount && errors.senderAccount) ||
                            (values.senderAccount &&
                            emailAccountOptions.find((a) => a._id === values.senderAccount)
                              ? `Selected Sender: ${
                                  emailAccountOptions.find((a) => a._id === values.senderAccount)?.email
                                }`
                              : "")
                          }
                        >
                          {emailAccountOptions
                            .filter((acc) => {
                              const accCompanyId = acc.companyId?._id || acc.companyId;
                              if (values.companyId) {
                                return accCompanyId === values.companyId;
                              }
                              return !accCompanyId;
                            })
                            .map((account) => (
                              <MenuItem key={account._id} value={account._id}>
                                <Box>
                                  <Typography variant="body1" fontWeight="bold">
                                    {account.label || account.displayName || "No Label"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {account.email}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                        </Field>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                          as={TextField}
                          name="to"
                          label="To"
                          fullWidth
                          error={touched.to && Boolean(errors.to)}
                          helperText={touched.to && errors.to}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                          as={TextField}
                          name="cc"
                          label="CC"
                          fullWidth
                          error={touched.cc && Boolean(errors.cc)}
                          helperText={touched.cc && errors.cc}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                          as={TextField}
                          name="recipientName"
                          label="Recipient Name"
                          fullWidth
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Field
                          as={TextField}
                          name="salutation"
                          label="Salutation"
                          fullWidth
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Field
                          as={TextField}
                          name="subject"
                          label="Subject"
                          fullWidth
                          error={touched.subject && Boolean(errors.subject)}
                          helperText={touched.subject && errors.subject}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Field
                          as={TextField}
                          name="greetLine"
                          label="Greet Line"
                          fullWidth
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        {(values.mailType || "normal") === "booking" && (
                          <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                name="nextPayableAmount"
                                label="Next Payable Amount (INR)"
                                value={values.nextPayableAmount || ""}
                                onChange={(e) =>
                                  setFieldValue("nextPayableAmount", e.target.value)
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <DatePicker
                                label="Payment Due Date"
                                value={values.paymentDueDate}
                                onChange={(newDate) => {
                                  setFieldValue("paymentDueDate", newDate);
                                }}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: "medium",
                                  },
                                }}
                              />
                            </Grid>
                          </Grid>
                        )}
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Email Body (Editable HTML)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              appendToMessage(
                                '<h3 style="color:#d32f2f; font-weight:bold;">YOUR HEADING</h3>'
                              )
                            }
                          >
                            Add Red Heading
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => appendToMessage("<p>Write your line here...</p>")}
                          >
                            Add Line
                          </Button>
                          {(values.mailType || "normal") === "booking" && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={addPaymentReminderBlock}
                            >
                              Add Payment Reminder Block
                            </Button>
                          )}
                        </Box>
                        <TextField
                          fullWidth
                          name="message"
                          label="Message HTML"
                          multiline
                          minRows={8}
                          value={values.message || ""}
                          onChange={(e) => setFieldValue("message", e.target.value)}
                          error={touched.message && Boolean(errors.message)}
                          helperText={touched.message && errors.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Live Preview
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, maxHeight: 280, overflow: "auto" }}>
                          <Box
                            sx={{ "& p": { m: 0, mb: 1 } }}
                            dangerouslySetInnerHTML={{ __html: values.message || "<p>No preview</p>" }}
                          />
                        </Paper>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Field
                          as={TextField}
                          name="signature"
                          label="Signature"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={onClose} color="secondary">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary" 
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {isSubmitting ? "Sending..." : "Send"}
                    </Button>
                  </DialogActions>
                </Form>
              );
            })()
          )}
        </Formik>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EmailQuotationDialog;