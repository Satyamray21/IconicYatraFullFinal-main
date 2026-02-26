import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Paper,
  IconButton,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { fetchCitiesByState } from "../../../../features/location/locationSlice";

const CustomQuotationStep2 = ({ sector, clientName, onNext }) => {
  const [totalNightsFromLead, setTotalNightsFromLead] = useState(0);
  const [calculatedTotalNights, setCalculatedTotalNights] = useState(0);
  const dispatch = useDispatch();

  const { cities = [] } = useSelector((state) => state.location);
  const { list: leadList = [] } = useSelector((state) => state.leads);

  // ✅ Fetch only cities for the selected sector
  useEffect(() => {
    if (sector) {
      dispatch(fetchCitiesByState({ countryName: "India", stateName: sector }));
    }
  }, [dispatch, sector]);

  // ✅ Find matching lead — handle tourDestination array or string
  useEffect(() => {
    if (clientName && sector && leadList.length > 0) {
      const lead = leadList.find((lead) => {
        const nameMatch =
          lead.personalDetails?.fullName?.trim().toLowerCase() ===
          clientName?.trim().toLowerCase();

        const tourDestinations = lead.tourDetails?.tourDestination;
        const sectorLower = sector?.trim().toLowerCase();

        const sectorMatch =
          (Array.isArray(tourDestinations)
            ? tourDestinations.some(
              (dest) => dest?.trim().toLowerCase() === sectorLower
            )
            : tourDestinations?.trim?.().toLowerCase() === sectorLower) ||
          lead.location?.state?.trim().toLowerCase() === sectorLower;

        return nameMatch && sectorMatch;
      });

      if (lead) {
        const nights = lead.tourDetails?.accommodation?.noOfNights || 0;
        setTotalNightsFromLead(nights);
      }
    }
  }, [clientName, sector, leadList]);

  // ✅ Formik setup
  const formik = useFormik({
    initialValues: {
      cities: [
        {
          cityName: "",
          customCity: "",
          nights: "",
        },
      ],
    },
    validationSchema: Yup.object({
      cities: Yup.array().of(
        Yup.object({
          cityName: Yup.string().required("City Name is required"),
          customCity: Yup.string().when("cityName", {
            is: "Other",
            then: (schema) =>
              schema.required("Please enter your custom city name"),
            otherwise: (schema) => schema.notRequired(),
          }),
          nights: Yup.number()
            .typeError("Must be a number")
            .positive("Must be positive")
            .integer("Must be an integer")
            .required("No. of Nights is required"),
        })
      ),
    }),
    onSubmit: (values) => {
      const formattedCities = values.cities.map((c) => ({
        cityName: c.cityName === "Other" ? c.customCity : c.cityName,
        nights: c.nights,
      }));

      const totalNights = formattedCities.reduce(
        (sum, city) => sum + (parseInt(city.nights) || 0),
        0
      );

      setCalculatedTotalNights(totalNights);

      if (totalNightsFromLead > 0 && totalNights !== totalNightsFromLead) {
        formik.setFieldError(
          "cities",
          `Total nights allocated (${totalNights}) does not match required nights (${totalNightsFromLead})`
        );
        return;
      }

      console.log("✅ Step 2 Submitted - Cities:", formattedCities);
      onNext(formattedCities);
    },
  });

  // ✅ Recalculate total nights when city nights change
  useEffect(() => {
    const totalNights = formik.values.cities.reduce(
      (sum, city) => sum + (parseInt(city.nights) || 0),
      0
    );
    setCalculatedTotalNights(totalNights);
  }, [formik.values.cities]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        width: "100%",
        maxWidth: 700,
        margin: "auto",
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Custom Quotation
      </Typography>

      <Typography
        variant="subtitle1"
        fontWeight="bold"
        sx={{ borderBottom: "1px solid #ddd", mb: 2 }}
      >
        Pickup / Drop
      </Typography>

      {totalNightsFromLead > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Total nights required for this quotation:{" "}
          <strong>{totalNightsFromLead} nights</strong>
        </Alert>
      )}

      {totalNightsFromLead > 0 &&
        calculatedTotalNights !== totalNightsFromLead && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Current total nights: <strong>{calculatedTotalNights}</strong> | Required:{" "}
            <strong>{totalNightsFromLead}</strong>
          </Alert>
        )}

      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <FieldArray
            name="cities"
            render={(arrayHelpers) => (
              <>
                {formik.values.cities.map((city, index) => (
                  <Grid container spacing={2} key={index} alignItems="center">
                    {/* City Dropdown */}
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        select
                        label="City Name"
                        name={`cities[${index}].cityName`}
                        value={city.cityName}
                        onChange={(e) => {
                          formik.handleChange(e);
                          if (e.target.value !== "Other") {
                            formik.setFieldValue(
                              `cities[${index}].customCity`,
                              ""
                            );
                          }
                        }}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.cities?.[index]?.cityName &&
                          Boolean(formik.errors.cities?.[index]?.cityName)
                        }
                        helperText={
                          formik.touched.cities?.[index]?.cityName &&
                          formik.errors.cities?.[index]?.cityName
                        }
                      >
                        {cities.map((c, idx) => (
                          <MenuItem key={idx} value={c.name}>
                            {c.name}
                          </MenuItem>
                        ))}
                        <MenuItem value="Other">Other (Add Custom City)</MenuItem>
                      </TextField>

                      {/* Custom city input */}
                      {city.cityName === "Other" && (
                        <TextField
                          sx={{ mt: 2 }}
                          fullWidth
                          label="Enter Custom City"
                          name={`cities[${index}].customCity`}
                          value={city.customCity}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.cities?.[index]?.customCity &&
                            Boolean(formik.errors.cities?.[index]?.customCity)
                          }
                          helperText={
                            formik.touched.cities?.[index]?.customCity &&
                            formik.errors.cities?.[index]?.customCity
                          }
                        />
                      )}
                    </Grid>

                    {/* Nights Input */}
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        type="number"
                        label="No. of Nights"
                        name={`cities[${index}].nights`}
                        value={city.nights}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.cities?.[index]?.nights &&
                          Boolean(formik.errors.cities?.[index]?.nights)
                        }
                        helperText={
                          formik.touched.cities?.[index]?.nights &&
                          formik.errors.cities?.[index]?.nights
                        }
                      />
                    </Grid>

                    {/* Delete */}
                    <Grid item xs={12} md={2}>
                      <IconButton
                        color="error"
                        onClick={() => arrayHelpers.remove(index)}
                        disabled={formik.values.cities.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Box sx={{ mt: 2 }}>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={() =>
                      arrayHelpers.push({
                        cityName: "",
                        customCity: "",
                        nights: "",
                      })
                    }
                  >
                    Add City
                  </Button>
                </Box>
              </>
            )}
          />

          <Box sx={{ my: 2, p: 1, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Current Total Nights:</strong> {calculatedTotalNights}
            </Typography>
          </Box>

          <Box textAlign="center">
            <Button
              type="submit"
              variant="contained"
              color="info"
              disabled={
                totalNightsFromLead > 0 &&
                calculatedTotalNights !== totalNightsFromLead
              }
            >
              Next
            </Button>
          </Box>

          {formik.errors.cities && typeof formik.errors.cities === "string" && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formik.errors.cities}
            </Alert>
          )}
        </form>
      </FormikProvider>
    </Paper>
  );
};

export default CustomQuotationStep2;