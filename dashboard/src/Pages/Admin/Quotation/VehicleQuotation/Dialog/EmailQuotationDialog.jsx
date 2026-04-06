import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const EmailQuotationDialog = ({ open, onClose, onSend }) => {
  const validationSchema = Yup.object({
    to: Yup.string().email("Invalid email").required("Required"),
    cc: Yup.string().email("Invalid email").nullable(),
    recipientName: Yup.string().required("Required"),
    salutation: Yup.string().required("Required"),
    subject: Yup.string().required("Required"),
    greetLine: Yup.string().required("Required"),
    message: Yup.string().required("Required"),
    signature: Yup.string().required("Required"),
  });

  const initialValues = {
    to: "",
    cc: "",
    recipientName: "",
    salutation: "",
    subject: "",
    greetLine: "",
    message: "",
    signature: "",
  };

  const handleSubmit = (values) => {
    onSend(values); 
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Email</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>
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
                    error={touched.recipientName && Boolean(errors.recipientName)}
                    helperText={touched.recipientName && errors.recipientName}
                  />
                </Grid>
                <Grid size={{xs:12, sm:6}}>
                  <Field
                    as={TextField}
                    name="salutation"
                    label="Salutation"
                    fullWidth
                    error={touched.salutation && Boolean(errors.salutation)}
                    helperText={touched.salutation && errors.salutation}
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
                    error={touched.greetLine && Boolean(errors.greetLine)}
                    helperText={touched.greetLine && errors.greetLine}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <Field
                    as={TextField}
                    name="message"
                    label="Message"
                    multiline
                    minRows={4}
                    fullWidth
                    error={touched.message && Boolean(errors.message)}
                    helperText={touched.message && errors.message}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <Field
                    as={TextField}
                    name="signature"
                    label="Signature"
                    fullWidth
                    error={touched.signature && Boolean(errors.signature)}
                    helperText={touched.signature && errors.signature}
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
        )}
      </Formik>
    </Dialog>
  );
};

export default EmailQuotationDialog;
