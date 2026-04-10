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
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const EmailQuotationDialog = ({
  open,
  onClose,
  onSend = () => {},
  onCompanyChange,
  initialValuesOverride,
  templateBodies,
  companyOptions = [],
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
    senderAccount: "gmail1",
    companyId: "",
  };
  const initialValues = { ...baseInitialValues, ...(initialValuesOverride || {}) };

  const handleSubmit = (values) => {
    onSend(values); 
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Email</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue }) => (
          (() => {
            const appendToMessage = (snippet) => {
              const current = values.message || "";
              const separator = current && !current.endsWith("\n") ? "\n" : "";
              setFieldValue("message", `${current}${separator}${snippet}`);
            };
            return (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {!!templateBodies && (
                  <Grid size={{xs:12, sm:6}}>
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
                <Grid size={{xs:12, sm:6}}>
                  <TextField
                    select
                    fullWidth
                    name="companyId"
                    label="Company"
                    value={values.companyId || ""}
                    onChange={async (e) => {
                      const companyId = e.target.value;
                      setFieldValue("companyId", companyId);
                      if (typeof onCompanyChange === "function") {
                        const nextType = values.mailType || "normal";
                        const tpl = await onCompanyChange(companyId, nextType);
                        if (tpl?.subject !== undefined) setFieldValue("subject", tpl.subject);
                        if (tpl?.message !== undefined) setFieldValue("message", tpl.message);
                      }
                    }}
                    error={touched.companyId && Boolean(errors.companyId)}
                    helperText={touched.companyId && errors.companyId}
                  >
                    {companyOptions.map((company) => (
                      <MenuItem key={company._id} value={company._id}>
                        {company.companyName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <Field
                    as={TextField}
                    select
                    fullWidth
                    name="senderAccount"
                    label="Send From"
                    error={touched.senderAccount && Boolean(errors.senderAccount)}
                    helperText={touched.senderAccount && errors.senderAccount}
                  >
                    <MenuItem value="gmail1">Gmail 1</MenuItem>
                    <MenuItem value="gmail2">Gmail 2</MenuItem>
                  </Field>
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <Field
                    as={TextField}
                    name="to"
                    label="To"
                    fullWidth
                    error={touched.to && Boolean(errors.to)}
                    helperText={touched.to && errors.to}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <Field
                    as={TextField}
                    name="cc"
                    label="CC"
                    fullWidth
                    error={touched.cc && Boolean(errors.cc)}
                    helperText={touched.cc && errors.cc}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <Field
                    as={TextField}
                    name="recipientName"
                    label="Recipient Name"
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <Field
                    as={TextField}
                    name="salutation"
                    label="Salutation"
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <Field
                    as={TextField}
                    name="subject"
                    label="Subject"
                    fullWidth
                    error={touched.subject && Boolean(errors.subject)}
                    helperText={touched.subject && errors.subject}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <Field
                    as={TextField}
                    name="greetLine"
                    label="Greet Line"
                    fullWidth
                  />
                </Grid>
                <Grid size={{xs:12}}>
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
                <Grid size={{xs:12}}>
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
                <Grid size={{xs:12}}>
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
              <Button type="submit" variant="contained" color="primary">
                Send
              </Button>
            </DialogActions>
          </Form>
            );
          })()
        )}
      </Formik>
    </Dialog>
  );
};

export default EmailQuotationDialog;
