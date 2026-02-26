
import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  firmType: Yup.string().required("Firm Type is required"),
  firmName: Yup.string().required("Firm Name is required"),
  gstin: Yup.string(),
  cin: Yup.string(),
  pan: Yup.string(),
  turnover: Yup.string(),
  firmDescription: Yup.string(),
  address1: Yup.string(),
  address2: Yup.string(),
  address3: Yup.string(),
  bankName: Yup.string(),
  branchName: Yup.string(),
  accountHolderName: Yup.string(),
  accountNumber: Yup.string(),
  ifscCode: Yup.string(),
});

const AssociateFirmForm = ({ formik }) => {
  const [firmTypes, setFirmTypes] = useState([
    "Proprietorship",
    "Partnership",
    "LLP",
    "Private Ltd",
    "Public Ltd",
  ]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newFirmType, setNewFirmType] = useState("");


  return (
    <Box p={3}>
      <>
        <Box border={1} borderRadius={2} p={2} mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Firm Details
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Firm Type *</InputLabel>
            <Select
              name="firmType"
              value={formik.values.firmType}
              onChange={(e) => {
                if (e.target.value === "__add_new__") {
                  setAddDialogOpen(true);
                } else {
                  formik.setFieldValue("firmType", e.target.value);
                }
              }}
              error={formik.touched.firmType && Boolean(formik.errors.firmType)}
            >
              {firmTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
              <MenuItem value="__add_new__">+ Add New</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2} mt={1}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="GSTIN Number"
                name="gstin"
                value={formik.values.gstin}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="CIN Number"
                name="cin"
                value={formik.values.cin}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="PAN Number"
                name="pan"
                value={formik.values.pan}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Existing TurnOver"
                name="turnover"
                value={formik.values.turnover}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Firm Name"
                name="firmName"
                value={formik.values.firmName}
                onChange={formik.handleChange}
                error={
                  formik.touched.firmName && Boolean(formik.errors.firmName)
                }
                helperText={formik.touched.firmName && formik.errors.firmName}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Firm Description"
                name="firmDescription"
                multiline
                minRows={3}
                value={formik.values.firmDescription}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="sameAsContact"
                    checked={formik.values.sameAsContact}
                    onChange={formik.handleChange}
                  />
                }
                label={<Typography variant="body2">Same as contact</Typography>}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address Line1"
                name="address1"
                value={formik.values.address1}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address Line2"
                name="address2"
                value={formik.values.address2}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address Line3"
                name="address3"
                value={formik.values.address3}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="outlined" component="label">
                Upload Supporting Documents
                <input
                  hidden
                  type="file"
                  name="supportingDocs"
                  onChange={(event) => {
                    formik.setFieldValue(
                      "supportingDocs",
                      event.currentTarget.files[0]
                    );
                  }}
                />
              </Button>
              {formik.values.supportingDocs && (
                <Typography variant="body2" mt={1}>
                  {formik.values.supportingDocs.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        <Box border={1} borderRadius={2} p={2} mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Associate’s Bank Details
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name of Bank"
                name="bankName"
                value={formik.values.bankName}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Branch Name"
                name="branchName"
                value={formik.values.branchName}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Account Holder Name"
                name="accountHolderName"
                value={formik.values.accountHolderName}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Account Number"
                name="accountNumber"
                value={formik.values.accountNumber}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="IFSC Code"
                name="ifscCode"
                value={formik.values.ifscCode}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </Box>

        <Box display="flex" justifyContent="center">
          <Button type="submit" variant="contained" color="primary" onClick={formik.handleSubmit}>
            Submit
          </Button>
        </Box>
      </>

      {/* Add New Firm Type Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add New Firm Type</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            margin="dense"
            label="Firm Type"
            value={newFirmType}
            onChange={(e) => setNewFirmType(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const trimmed = newFirmType.trim();
              if (trimmed && !firmTypes.includes(trimmed)) {
                setFirmTypes((prev) => [...prev, trimmed]);
                formik.setFieldValue("firmType", trimmed);
              }
              setNewFirmType("");
              setAddDialogOpen(false);
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssociateFirmForm;