import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid
} from "@mui/material";
import axios from "../../../../utils/axios";

const GlobalSettings = () => {
  const [formData, setFormData] = useState({
    inclusions: "",
    exclusions: "",
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: ""
  });

  const [loading, setLoading] = useState(false);

  // Fetch existing global settings
  const fetchSettings = async () => {
    try {
      const res = await axios.get("/global-settings");

      setFormData({
        inclusions: res.data.inclusions?.join("\n") || "",
        exclusions: res.data.exclusions?.join("\n") || "",
        paymentPolicy: res.data.paymentPolicy || "",
        cancellationPolicy: res.data.cancellationPolicy || "",
        termsAndConditions: res.data.termsAndConditions || ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await axios.put("/global-settings", {
        inclusions: formData.inclusions.split("\n").filter(Boolean),
        exclusions: formData.exclusions.split("\n").filter(Boolean),
        paymentPolicy: formData.paymentPolicy,
        cancellationPolicy: formData.cancellationPolicy,
        termsAndConditions: formData.termsAndConditions
      });

      alert("Global Settings Updated Successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" mb={3}>
          Global Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Inclusions (One per line)"
              name="inclusions"
              value={formData.inclusions}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Exclusions (One per line)"
              name="exclusions"
              value={formData.exclusions}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Payment Policy"
              name="paymentPolicy"
              value={formData.paymentPolicy}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Cancellation Policy"
              name="cancellationPolicy"
              value={formData.cancellationPolicy}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Terms & Conditions"
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        <Box mt={3}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default GlobalSettings;
