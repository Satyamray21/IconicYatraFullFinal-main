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
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function emailTokens(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => emailTokens(item));
  }
  return String(value || "")
    .split(/[,;\n]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function mergeEmails(existing, raw) {
  const next = [];
  const invalid = [];
  emailTokens([...(Array.isArray(existing) ? existing : []), raw]).forEach((token) => {
    if (!EMAIL_RE.test(token)) {
      if (!invalid.includes(token)) invalid.push(token);
      return;
    }
    if (!next.includes(token)) next.push(token);
  });
  return { next, invalid };
}

function EmailChipField({
  label,
  emails,
  error,
  helperText,
  onEmailsChange,
  onDraftChange,
  onBlur,
}) {
  const [draft, setDraft] = React.useState("");

  const setDraftValue = (next) => {
    setDraft(next);
    onDraftChange(next);
  };

  const addDraft = () => {
    const raw = draft.trim();
    if (!raw) return;
    const { next, invalid } = mergeEmails(emails, raw);
    if (invalid.length) {
      onEmailsChange(Array.isArray(emails) ? emails : [], invalid);
      return;
    }
    onEmailsChange(next, []);
    setDraftValue("");
  };

  return (
    <TextField
      label={label}
      fullWidth
      value={draft}
      placeholder={emails?.length ? "" : "Type email and press Enter"}
      error={Boolean(error)}
      helperText={helperText || "Press Enter to add each email"}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={() => {
        addDraft();
        onBlur?.();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === ",") {
          event.preventDefault();
          event.stopPropagation();
          addDraft();
          return;
        }
        if (event.key === "Backspace" && draft === "" && emails?.length) {
          event.preventDefault();
          onEmailsChange(emails.slice(0, -1), []);
        }
      }}
      slotProps={{
        input: {
          startAdornment: emails?.length ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
              {emails.map((email) => (
                <Chip
                  key={email}
                  size="small"
                  label={email}
                  onMouseDown={(event) => event.preventDefault()}
                  onDelete={() =>
                    onEmailsChange(
                      emails.filter((item) => item !== email),
                      [],
                    )
                  }
                />
              ))}
            </Box>
          ) : undefined,
        },
      }}
    />
  );
}

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
  receiptOptions = [],
  onReceiptChange = () => { },
}) => {
  const validationSchema = Yup.object({
    subject: Yup.string().required("Required"),
    message: Yup.string().required("Required"),
    companyId:
      companyOptions.length > 0
        ? Yup.string().required("Select company")
        : Yup.string().nullable(),
    senderAccount: Yup.string().required("Select sender email"),
  });

  const baseInitialValues = {
    to: [],
    cc: [],
    toDraft: "",
    ccDraft: "",
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
    selectedReceiptId: "",
  };
  const initialValues = {
    ...baseInitialValues,
    ...(initialValuesOverride || {}),
    to: mergeEmails([], initialValuesOverride?.to || "").next,
    cc: mergeEmails([], initialValuesOverride?.cc || "").next,
    toDraft: "",
    ccDraft: "",
  };

  const validate = async (values) => {
    const errors = {};
    const toMerged = mergeEmails(values.to, values.toDraft);
    const ccMerged = mergeEmails(values.cc, values.ccDraft);
    if (toMerged.invalid.length) {
      errors.to = `Invalid email: ${toMerged.invalid[0]}`;
    } else if (!toMerged.next.length) {
      errors.to = "Add at least one email";
    }
    if (ccMerged.invalid.length) {
      errors.cc = `Invalid email: ${ccMerged.invalid[0]}`;
    }
    try {
      await validationSchema.validate(
        { ...values, to: toMerged.next, cc: ccMerged.next },
        { abortEarly: false },
      );
    } catch (err) {
      (err.inner || []).forEach((item) => {
        if (item.path && !errors[item.path]) errors[item.path] = item.message;
      });
    }
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const toList = mergeEmails(values.to, values.toDraft).next;
      const ccList = mergeEmails(values.cc, values.ccDraft).next;
      const formattedValues = {
        ...values,
        to: toList,
        cc: ccList,
        paymentDueDate: values.paymentDueDate
          ? dayjs(values.paymentDueDate).format("DD/MM/YYYY")
          : "",
      };
      delete formattedValues.toDraft;
      delete formattedValues.ccDraft;
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
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue, setFieldError, setFieldTouched, isSubmitting }) => (
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
                    <SignatureUpdater senderAccount={values.senderAccount} emailAccountOptions={emailAccountOptions} setFieldValue={setFieldValue} />
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
                        <EmailChipField
                          label="To"
                          emails={values.to}
                          error={touched.to && errors.to}
                          helperText={
                            (touched.to && errors.to) ||
                            "Press Enter to add each email"
                          }
                          onEmailsChange={(next, invalid) => {
                            setFieldValue("to", next);
                            if (invalid?.length) {
                              setFieldError("to", `Invalid email: ${invalid[0]}`);
                            } else {
                              setFieldError("to", undefined);
                            }
                          }}
                          onDraftChange={(nextInput) => setFieldValue("toDraft", nextInput)}
                          onBlur={() => setFieldTouched("to", true)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <EmailChipField
                          label="CC"
                          emails={values.cc}
                          error={touched.cc && errors.cc}
                          helperText={
                            (touched.cc && errors.cc) ||
                            "Press Enter to add each email"
                          }
                          onEmailsChange={(next, invalid) => {
                            setFieldValue("cc", next);
                            if (invalid?.length) {
                              setFieldError("cc", `Invalid email: ${invalid[0]}`);
                            } else {
                              setFieldError("cc", undefined);
                            }
                          }}
                          onDraftChange={(nextInput) => setFieldValue("ccDraft", nextInput)}
                          onBlur={() => setFieldTouched("cc", true)}
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
                            <Grid size={{ xs: 12, sm: 4 }}>
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
                            <Grid size={{ xs: 12, sm: 4 }}>
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
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                select
                                fullWidth
                                label="Attach Receipt"
                                value={values.selectedReceiptId || ""}
                                onChange={(e) => {
                                  setFieldValue("selectedReceiptId", e.target.value);
                                  onReceiptChange(e.target.value);
                                }}
                                helperText={receiptOptions.length === 0 ? "No receipts found" : "Attach a payment receipt"}
                              >
                                <MenuItem value="">
                                  <em>None</em>
                                </MenuItem>
                                {receiptOptions.map((r) => (
                                  <MenuItem key={r._id} value={r._id}>
                                    {r.invoiceId || r.receiptNumber} - ₹{r.amount}
                                  </MenuItem>
                                ))}
                              </TextField>
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
                            dangerouslySetInnerHTML={{ __html: (values.message || "<p>No preview</p>") + (values.signature || "") }}
                          />
                        </Paper>
                      </Grid>
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