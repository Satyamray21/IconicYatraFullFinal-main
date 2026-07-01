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

const EmailInvoiceDialog = ({
  open,
  onClose,
  onSend = () => {},
  initialValuesOverride,
  companyOptions = [],
  emailAccountOptions = [],
}) => {
  const validationSchema = Yup.object({
    to: Yup.string().email("Invalid email").required("Required"),
    subject: Yup.string().required("Required"),
    companyId:
      companyOptions.length > 0
        ? Yup.string().required("Select company")
        : Yup.string().nullable(),
    senderAccount: Yup.string().required("Select sender email"),
  });

  const baseInitialValues = {
    to: "",
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Invoice via Email</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
              <SignatureUpdater
                senderAccount={values.senderAccount}
                emailAccountOptions={emailAccountOptions}
                setFieldValue={setFieldValue}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    name="companyId"
                    label="Company"
                    value={values.companyId || ""}
                    onChange={(e) => {
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
                <Grid item xs={12} sm={6}>
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
                        ? `Sender: ${emailAccountOptions.find((a) => a._id === values.senderAccount)?.email}`
                        : "")
                    }
                  >
                    {emailAccountOptions
                      .filter((acc) => {
                        const accCompanyId = acc.companyId?._id || acc.companyId;
                        if (values.companyId) {
                          return accCompanyId === values.companyId;
                        }
                        return true;
                      })
                      .map((acc) => (
                        <MenuItem key={acc._id} value={acc._id}>
                          {acc.label || acc.displayName} - {acc.email}
                        </MenuItem>
                      ))}
                  </Field>
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    name="to"
                    label="To Email"
                    error={touched.to && Boolean(errors.to)}
                    helperText={touched.to && errors.to}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    name="subject"
                    label="Subject"
                    error={touched.subject && Boolean(errors.subject)}
                    helperText={touched.subject && errors.subject}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    fullWidth
                    multiline
                    rows={4}
                    name="message"
                    label="Additional Message"
                    placeholder="Optional message to include in the email body"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Send Mail"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default EmailInvoiceDialog;
