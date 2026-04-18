import React from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
} from "@mui/material";

const StaffFormDetail = ({ formik }) => {
  return (
    <Box p={3}>
      {/* Bank Details Section */}
      <Box border={1} borderRadius={2} p={2} mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Bank Details (Optional)
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
    </Box>
  );
};

export default StaffFormDetail;