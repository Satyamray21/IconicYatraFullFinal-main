import React, { useEffect } from "react";
import {
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Switch,
  FormControlLabel
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";

import {
  createCompany,
  getCompanyById,
  updateCompany,
  resetSuccess,
  clearCompany
} from "../../../../features/company/InsideCompany";

const CompanyForm = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { loading, success, error, company } = useSelector(
    (state) => state.company
  );

  const isEditMode = !!id;

  /* ================= FETCH COMPANY ================= */

  useEffect(() => {

    if (isEditMode) {
      dispatch(getCompanyById(id));
    } else {
      dispatch(clearCompany());
    }

  }, [dispatch, id, isEditMode]);

  /* ================= SUCCESS ================= */

  useEffect(() => {

    if (success) {

      alert(
        isEditMode
          ? "Company updated successfully!"
          : "Company added successfully!"
      );

      dispatch(resetSuccess());

      navigate("/admin/inside-company");

    }

  }, [success, dispatch, navigate, isEditMode]);

  /* ================= INITIAL VALUES ================= */

  const initialValues = {

    companyName: isEditMode ? company?.companyName || "" : "",
    address: isEditMode ? company?.address || "" : "",
    phone: isEditMode ? company?.phone || "" : "",
    email: isEditMode ? company?.email || "" : "",
    gstin: isEditMode ? company?.gstin || "" : "",
    stateCode: isEditMode ? company?.stateCode || "" : "",
    termsConditions: isEditMode ? company?.termsConditions || "" : "",
    paymentLink: isEditMode ? company?.paymentLink || "" : "",
    isActive: isEditMode ? company?.isActive ?? true : true,
    logo: null,
    signatureImage: null

  };

  /* ================= VALIDATION ================= */

  const validationSchema = Yup.object({
    companyName: Yup.string().required("Company name is required"),
    address: Yup.string().required("Address is required")
  });

  /* ================= SUBMIT ================= */

  const handleSubmit = (values) => {

    const formData = new FormData();

    formData.append("companyName", values.companyName);
    formData.append("address", values.address);
    formData.append("phone", values.phone);
    formData.append("email", values.email);
    formData.append("gstin", values.gstin);
    formData.append("stateCode", values.stateCode);
    formData.append("termsConditions", values.termsConditions);
    formData.append("paymentLink", values.paymentLink);
    formData.append("isActive", values.isActive);

    if (values.logo) {
      formData.append("logo", values.logo);
    }

    if (values.signatureImage) {
      formData.append("signatureImage", values.signatureImage);
    }

    if (isEditMode) {
      dispatch(updateCompany({ id, formData }));
    } else {
      dispatch(createCompany(formData));
    }

  };

  /* ================= LOADING ================= */

  if (isEditMode && loading && !company) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography>Loading company data...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: "auto", mt: 4 }}>

      <Typography variant="h5" mb={3}>
        {isEditMode ? "Edit Company" : "Add Company"}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          setFieldValue,
          handleSubmit
        }) => (

          <form onSubmit={handleSubmit}>

            <Grid container spacing={3}>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="companyName"
                  value={values.companyName}
                  onChange={handleChange}
                  error={touched.companyName && !!errors.companyName}
                  helperText={touched.companyName && errors.companyName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={values.address}
                  onChange={handleChange}
                  error={touched.address && !!errors.address}
                  helperText={touched.address && errors.address}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GSTIN"
                  name="gstin"
                  value={values.gstin}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State Code"
                  name="stateCode"
                  value={values.stateCode}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Link"
                  name="paymentLink"
                  value={values.paymentLink}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Terms & Conditions"
                  name="termsConditions"
                  multiline
                  rows={3}
                  value={values.termsConditions}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.isActive}
                      onChange={(e) =>
                        setFieldValue("isActive", e.target.checked)
                      }
                    />
                  }
                  label="Active Company"
                />
              </Grid>

              <Grid item xs={6}>
                <Button variant="outlined" component="label" fullWidth>
                  Upload Logo
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFieldValue("logo", e.target.files[0])
                    }
                  />
                </Button>
              </Grid>

              <Grid item xs={6}>
                <Button variant="outlined" component="label" fullWidth>
                  Upload Signature
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFieldValue("signatureImage", e.target.files[0])
                    }
                  />
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate("/admin/inside-company")}
                >
                  Cancel
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : isEditMode
                    ? "Update Company"
                    : "Save Company"}
                </Button>
              </Grid>

            </Grid>

          </form>

        )}
      </Formik>

    </Paper>
  );
};

export default CompanyForm;
