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
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const generateWhatsAppText = (stay, companyName, senderAccount) => {
  if (!stay) return "";
  let text = `Dear Partner,\nGreetings from *${companyName || "Iconic Yatra"}*!!\n\n`;
  text += `*Our Requirement for Hotel Stay*\n\n`;
  text += `📍 *1- Hotel in ${stay.city || "City"}* (${stay.nights || 1} Night${stay.nights > 1 ? "s" : ""})\n\n`;
  
  text += `*Guest Name:* ${stay.clientName || "Guest"}\n`;
  
  const adults = Number(stay.adults) || 0;
  const children = Number(stay.children) || 0;
  const totalPax = adults + children + (Number(stay.kids) || 0) + (Number(stay.infants) || 0);
  
  text += `*Persons:* ${String(totalPax).padStart(2, "0")} Adults/Childs\n`;
  text += `*No of Rooms:* ${String(stay.noOfRooms || 1).padStart(2, "0")} ${stay.sharingType || "Double sharing"}\n`;
  text += `*Meal Plan:* ${stay.mealPlan || "Breakfast Only"}\n`;
  text += `*Room Type:* ${stay.roomCategory || "Premium Room"}\n`;
  text += `*Check-in Date:* ${stay.checkInDate || "TBD"}\n`;
  text += `*Check out:* ${stay.checkOutDate || "TBD"}\n`;
  
  if (senderAccount && senderAccount.signature && (senderAccount.signature.name || (senderAccount.signature.mobile && senderAccount.signature.mobile.length > 0))) {
     text += `\n*Warm Regards,*\n`;
     if (senderAccount.signature.name) text += `*${senderAccount.signature.name}*\n`;
     if (senderAccount.signature.mobile && senderAccount.signature.mobile.length > 0) {
        const mobs = senderAccount.signature.mobile.filter(m => m.trim());
        if (mobs.length > 0) text += `Mobile: ${mobs.join(", ")}\n`;
     }
     if (senderAccount.signature.links && senderAccount.signature.links.length > 0) {
        const links = senderAccount.signature.links.filter(l => l.trim());
        if (links.length > 0) text += `${links.join(" | ")}\n`;
     }
  }
  return text;
};

const HotelWhatsAppDialog = ({
  open,
  onClose,
  stay,
  companyOptions = [],
  emailAccountOptions = [],
}) => {
  const validationSchema = Yup.object({
    whatsAppNumber: Yup.string().required("Required"),
    message: Yup.string().required("Required"),
    companyId: companyOptions.length > 0 ? Yup.string().required("Select company") : Yup.string().nullable(),
    senderAccount: Yup.string().required("Select sender profile"),
  });

  const baseInitialValues = {
    whatsAppNumber: "",
    message: "",
    companyId: companyOptions[0]?._id || "",
    senderAccount: emailAccountOptions.find(a => (a.companyId?._id || a.companyId) === companyOptions[0]?._id)?._id || "",
  };

  const initialValues = { ...baseInitialValues };

  // Calculate initial message based on default selections
  const defaultCompany = companyOptions.find(c => c._id === initialValues.companyId);
  const defaultSender = emailAccountOptions.find(a => a._id === initialValues.senderAccount);
  initialValues.message = generateWhatsAppText(stay, defaultCompany?.companyName, defaultSender);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let formattedNumber = values.whatsAppNumber.replace(/\D/g, '');
      if (formattedNumber.length === 10) {
        formattedNumber = '91' + formattedNumber;
      }
      
      const encodedText = encodeURIComponent(values.message.trim());
      const url = `https://wa.me/${formattedNumber}?text=${encodedText}`;
      window.open(url, '_blank');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: "bold", background: "#f8f9fa" }}>Share via WhatsApp</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent dividers>
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

                      const company = companyOptions.find(c => c._id === companyId);
                      const firstAvailable = emailAccountOptions.find((acc) => {
                        const accCompanyId = acc.companyId?._id || acc.companyId;
                        return accCompanyId === companyId;
                      });
                      
                      let newSender = null;
                      if (firstAvailable) {
                        setFieldValue("senderAccount", firstAvailable._id);
                        newSender = firstAvailable;
                      } else {
                        setFieldValue("senderAccount", "");
                      }

                      setFieldValue("message", generateWhatsAppText(stay, company?.companyName, newSender));
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
                    label="Send From Profile (For Signature)"
                    error={touched.senderAccount && Boolean(errors.senderAccount)}
                    SelectProps={{
                      renderValue: (selected) => {
                        const acc = emailAccountOptions.find((a) => a._id === selected);
                        return acc ? `${acc.label || acc.displayName}` : "Select Sender";
                      },
                    }}
                    onChange={(e) => {
                        const senderId = e.target.value;
                        setFieldValue("senderAccount", senderId);
                        const sender = emailAccountOptions.find((a) => a._id === senderId);
                        const company = companyOptions.find(c => c._id === values.companyId);
                        setFieldValue("message", generateWhatsAppText(stay, company?.companyName, sender));
                    }}
                    helperText={touched.senderAccount && errors.senderAccount}
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
                          </Box>
                        </MenuItem>
                      ))}
                  </Field>
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    name="whatsAppNumber"
                    label="Client WhatsApp Number"
                    fullWidth
                    placeholder="e.g. 9876543210"
                    error={touched.whatsAppNumber && Boolean(errors.whatsAppNumber)}
                    helperText={(touched.whatsAppNumber && errors.whatsAppNumber) || "Country code (91) is automatically added for 10-digit numbers."}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                    Message Preview (Editable)
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
                    sx={{ backgroundColor: "#fdfdfd" }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f1f3f5" }}>
              <Button onClick={onClose} color="inherit" sx={{ fontWeight: "bold" }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="success" 
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <WhatsAppIcon />}
                sx={{ fontWeight: "bold" }}
              >
                {isSubmitting ? "Opening..." : "Share"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default HotelWhatsAppDialog;
