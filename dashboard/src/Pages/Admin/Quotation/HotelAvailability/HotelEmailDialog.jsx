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
  CircularProgress,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const SignatureUpdater = ({ senderAccount, emailAccountOptions, setFieldValue }) => {
  React.useEffect(() => {
    const acc = emailAccountOptions.find((a) => a._id === senderAccount);
    if (acc && acc.signature && (acc.signature.name || (acc.signature.mobile && acc.signature.mobile.some(m => m)) || (acc.signature.links && acc.signature.links.some(l => l)))) {
        let sigHtml = `<div style="margin-top: 15px; font-family: Arial, sans-serif;">`;
        sigHtml += `<p style="margin: 0;"><b>Warm Regards,</b></p>`;
        if (acc.signature.name) sigHtml += `<p style="margin: 0;"><b>${acc.signature.name}</b></p>`;
        if (acc.signature.mobile && acc.signature.mobile.length > 0) {
            const mobs = acc.signature.mobile.filter(m => m.trim());
            if (mobs.length > 0) sigHtml += `<p style="margin: 0;">Mobile: ${mobs.join(", ")}</p>`;
        }
        if (acc.signature.links && acc.signature.links.length > 0) {
            const links = acc.signature.links.filter(l => l.trim());
            if (links.length > 0) {
                sigHtml += `<p style="margin: 0;">${links.map(l => `<a href="${l}" style="color: #0b5394; text-decoration: none;">${l}</a>`).join(" | ")}</p>`;
            }
        }
        sigHtml += `</div>`;
        setFieldValue("signature", sigHtml);
    } else {
        setFieldValue("signature", "");
    }
  }, [senderAccount, emailAccountOptions, setFieldValue]);
  return null;
};

const HotelEmailDialog = ({
  open,
  onClose,
  onSend = () => { },
  onCompanyChange,
  initialValuesOverride,
  templateBodies,
  companyOptions = [],
  emailAccountOptions = [],
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
    subject: "",
    message: "",
    signature: "",
    senderAccount: emailAccountOptions[0]?._id || "",
    companyId: "",
  };
  const initialValues = { ...baseInitialValues, ...(initialValuesOverride || {}) };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await onSend(values);
      if (result !== false) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Send Hotel Booking Request</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              <SignatureUpdater senderAccount={values.senderAccount} emailAccountOptions={emailAccountOptions} setFieldValue={setFieldValue} />
              
              <Grid container spacing={2}>
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
                        const resData = await onCompanyChange(companyId);
                        const s = resData?.normal?.subject;
                        const m = resData?.normal?.message;
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Email Body (Editable HTML)
                  </Typography>
                  <TextField
                    fullWidth
                    name="message"
                    label=""
                    multiline
                    minRows={12}
                    value={values.message || ""}
                    onChange={(e) => setFieldValue("message", e.target.value)}
                    error={touched.message && Boolean(errors.message)}
                    helperText={touched.message && errors.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Live Preview
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, height: '305px', overflow: "auto" }}>
                    <Box
                      sx={{ "& p": { m: 0, mb: 1 } }}
                      dangerouslySetInnerHTML={{ __html: (values.message || "<p>No preview</p>") + (values.signature || "") }}
                    />
                  </Paper>
                </Grid>
                <Box sx={{ display: 'none' }}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Generated Signature (HTML)
                    </Typography>
                    <Field
                      as={TextField}
                      name="signature"
                      multiline
                      minRows={3}
                      fullWidth
                    />
                  </Grid>
                </Box>
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
        )}
      </Formik>
    </Dialog>
  );
};

export default HotelEmailDialog;
