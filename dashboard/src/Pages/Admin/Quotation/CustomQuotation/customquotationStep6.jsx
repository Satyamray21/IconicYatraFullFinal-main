// ==================== FULL FIXED FILE ====================
// customquotationStep6.jsx

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Card,
  CardContent,
} from "@mui/material";

import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { createCustomQuotation } from "../../../../features/quotation/customQuotationSlice";
import { toast } from "react-toastify";
import { computeCustomQuotationPackages } from "../../../../utils/customQuotationPricing";

// =====================================================
// VALIDATION SCHEMA
// =====================================================
const validationSchema = yup.object({
  adult: yup.number().min(0).required(),
  child: yup.number().min(0),
  kid: yup.number().min(0),
  infants: yup.number().min(0),
  mediPlan: yup.string().required(),
  noOfRooms: yup.number().min(1).required(),
  roomType: yup.string().required(),
  sharingType: yup.string().required(),
  noOfMattress: yup.number().min(0),
  superiorMattressCost: yup.number().min(0),
  deluxeMattressCost: yup.number().min(0),
  marginPercent: yup.number().min(0),
  marginAmount: yup.number().min(0),
  discount: yup.number().min(0),
  gstOn: yup.string(),
  taxPercent: yup.number().min(0),
  regardsText: yup.string(),
  signedBy: yup.string(),
});

// =====================================================
// MAIN COMPONENT
// =====================================================
const CustomQuotationForm = ({ formData, leadData, onSubmit, loading }) => {
  const dispatch = useDispatch();
  const { clientDetails, pickupDrop, tourDetails } = formData;
  const cities = pickupDrop || [];
  const toNumber = (value) => Number(value || 0);

  // =====================================================
  // INITIALIZE CITY PRICE OBJECTS
  // =====================================================
  const buildCityPrices = (cityList) =>
    cityList.reduce((acc, city, index) => {
      const dest = tourDetails?.quotationDetails?.destinations?.[index];
      acc[index] = {
        standardHotelName: dest?.standardHotels?.[0] || "",
        standardPrice: dest?.prices?.standard ?? "",
        deluxeHotelName: dest?.deluxeHotels?.[0] || "",
        deluxePrice: dest?.prices?.deluxe ?? "",
        superiorHotelName: dest?.superiorHotels?.[0] || "",
        superiorPrice: dest?.prices?.superior ?? "",
      };
      return acc;
    }, {});

  // =====================================================
  // FORMIK INITIAL VALUES
  // =====================================================
  const formik = useFormik({
    initialValues: {
      adult: tourDetails?.quotationDetails?.adults || 0,
      child: tourDetails?.quotationDetails?.children || 0,
      kid: tourDetails?.quotationDetails?.kids || 0,
      infants: tourDetails?.quotationDetails?.infants || 0,

      mediPlan: tourDetails?.quotationDetails?.mealPlan || "",
      noOfRooms: tourDetails?.quotationDetails?.rooms?.numberOfRooms || 1,
      roomType: tourDetails?.quotationDetails?.rooms?.roomType || "",
      sharingType: tourDetails?.quotationDetails?.rooms?.sharingType || "",

      noOfMattress: tourDetails?.quotationDetails?.rooms?.mattress || 0,

      superiorMattressCost:
        tourDetails?.quotationDetails?.mattress?.superiorMattressCost || 0,
      deluxeMattressCost:
        tourDetails?.quotationDetails?.mattress?.deluxeMattressCost || 0,

      cityPrices: buildCityPrices(cities),

      marginPercent:
        tourDetails?.quotationDetails?.companyMargin?.marginPercent || 0,
      marginAmount:
        tourDetails?.quotationDetails?.companyMargin?.marginAmount || 0,

      discount: tourDetails?.quotationDetails?.discount || 0,

      gstOn: tourDetails?.quotationDetails?.taxes?.gstOn || "Full",
      taxPercent: tourDetails?.quotationDetails?.taxes?.taxPercent ?? 0,

      regardsText:
        tourDetails?.quotationDetails?.signatureDetails?.regardsText ||
        "Best Regards",
      signedBy: tourDetails?.quotationDetails?.signatureDetails?.signedBy || "",
    },

    validationSchema,

    onSubmit: async (values) => {
      try {
        const vehicleCost =
          Number(
            formData?.tourDetails?.vehicleDetails?.costDetails?.totalCost || 0,
          ) || 0;

        const pricing = computeCustomQuotationPackages({
          destinations: cities.map((city, index) => ({
            nights: city.nights,
            prices: {
              standard: Number(values.cityPrices[index]?.standardPrice) || 0,
              deluxe: Number(values.cityPrices[index]?.deluxePrice) || 0,
              superior: Number(values.cityPrices[index]?.superiorPrice) || 0,
            },
          })),
          numberOfRooms: values.noOfRooms,
          mattressCount: values.noOfMattress,
          standardPackageMattressCostPerNight: values.superiorMattressCost,
          deluxePackageMattressCostPerNight: values.deluxeMattressCost,
          superiorPackageMattressCostPerNight: values.superiorMattressCost,
          vehicleCost,
          marginPercent: values.marginPercent,
          marginAmount: values.marginAmount,
          discount: values.discount,
          taxPercent: values.taxPercent,
          gstOn: values.gstOn,
        });

        // =====================================================
        // FINAL PAYLOAD
        // =====================================================
        const finalData = {
          ...formData,
          tourDetails: {
            ...formData.tourDetails,
            quotationDetails: {
              adults: values.adult,
              children: values.child,
              kids: values.kid,
              infants: values.infants,
              mealPlan: values.mediPlan,

              destinations: cities.map((city, index) => ({
                cityName: city.cityName,
                nights: city.nights,
                standardHotels: [
                  values.cityPrices[index]?.standardHotelName || "",
                ],
                deluxeHotels: [values.cityPrices[index]?.deluxeHotelName || ""],
                superiorHotels: [
                  values.cityPrices[index]?.superiorHotelName || "",
                ],
                prices: {
                  standard:
                    Number(values.cityPrices[index]?.standardPrice) || 0,
                  deluxe: Number(values.cityPrices[index]?.deluxePrice) || 0,
                  superior:
                    Number(values.cityPrices[index]?.superiorPrice) || 0,
                },
              })),

              rooms: {
                numberOfRooms: values.noOfRooms,
                roomType: values.roomType,
                sharingType: values.sharingType,
                mattress: values.noOfMattress,
              },

              mattress: {
                superiorMattressCost: values.superiorMattressCost,
                deluxeMattressCost: values.deluxeMattressCost,
              },

              companyMargin: {
                marginPercent: values.marginPercent,
                marginAmount: values.marginAmount,
              },

              discount: values.discount,

              taxes: {
                gstOn: values.gstOn,
                taxPercent: values.taxPercent,
                applyGST: values.gstOn !== "None",
              },

              packageCalculations: {
                standard: pricing.standard,
                deluxe: pricing.deluxe,
                superior: pricing.superior,
              },

              signatureDetails: {
                regardsText: values.regardsText,
                signedBy: values.signedBy,
              },
            },
          },
        };

        if (onSubmit) {
          await onSubmit(finalData);
        } else {
          await dispatch(createCustomQuotation(finalData)).unwrap();
          toast.success("Quotation created successfully!");
        }
      } catch (err) {
        console.error("❌ Error submitting form:", err);
        toast.error("Failed to submit quotation");
      }
    },
  });

  // =====================================================
  // REALTIME CALCULATIONS (same engine as submit)
  // =====================================================
  const vehicleCostLive =
    Number(
      formData?.tourDetails?.vehicleDetails?.costDetails?.totalCost || 0,
    ) || 0;

  const pricing = computeCustomQuotationPackages({
    destinations: cities.map((city, index) => ({
      nights: city.nights,
      prices: {
        standard: Number(formik.values.cityPrices[index]?.standardPrice) || 0,
        deluxe: Number(formik.values.cityPrices[index]?.deluxePrice) || 0,
        superior: Number(formik.values.cityPrices[index]?.superiorPrice) || 0,
      },
    })),
    numberOfRooms: formik.values.noOfRooms,
    mattressCount: formik.values.noOfMattress,
    standardPackageMattressCostPerNight: formik.values.superiorMattressCost,
    deluxePackageMattressCostPerNight: formik.values.deluxeMattressCost,
    superiorPackageMattressCostPerNight: formik.values.superiorMattressCost,
    vehicleCost: vehicleCostLive,
    marginPercent: formik.values.marginPercent,
    marginAmount: formik.values.marginAmount,
    discount: formik.values.discount,
    taxPercent: formik.values.taxPercent,
    gstOn: formik.values.gstOn,
  });

  const {
    baseCost: baseStandard,
    afterMargin: standardAfterMargin,
    afterDiscount: standardTaxable,
    gstPercentage: gstPercent,
    gstAmount: standardGST,
    finalTotal: finalStandardTotal,
  } = pricing.standard;

  const {
    baseCost: baseDeluxe,
    afterMargin: deluxeAfterMargin,
    afterDiscount: deluxeTaxable,
    gstAmount: deluxeGST,
    finalTotal: finalDeluxeTotal,
  } = pricing.deluxe;

  const {
    baseCost: baseSuperior,
    afterMargin: superiorAfterMargin,
    afterDiscount: superiorTaxable,
    gstAmount: superiorGST,
    finalTotal: finalSuperiorTotal,
  } = pricing.superior;

  const marginBaseCost = useMemo(() => {
    if (Number.isFinite(baseStandard) && baseStandard > 0) return baseStandard;
    if (Number.isFinite(baseDeluxe) && baseDeluxe > 0) return baseDeluxe;
    if (Number.isFinite(baseSuperior) && baseSuperior > 0) return baseSuperior;
    return 0;
  }, [baseStandard, baseDeluxe, baseSuperior]);

  const handleMarginPercentChange = (event) => {
    const percent = toNumber(event.target.value);
    const amount = marginBaseCost > 0 ? (marginBaseCost * percent) / 100 : 0;

    formik.setFieldValue("marginPercent", percent);
    formik.setFieldValue("marginAmount", Number(amount.toFixed(2)));
  };

  const handleMarginAmountChange = (event) => {
    const amount = toNumber(event.target.value);
    const percent = marginBaseCost > 0 ? (amount / marginBaseCost) * 100 : 0;

    formik.setFieldValue("marginAmount", amount);
    formik.setFieldValue("marginPercent", Number(percent.toFixed(2)));
  };

  // =====================================================
  // UI START
  // =====================================================
  return (
    <Box sx={{ maxWidth: 1300, margin: "0 auto", p: 3 }}>
      <form onSubmit={formik.handleSubmit}>
        <Typography variant="h4" align="center">
          Custom Quotation
        </Typography>

        {/* CLIENT SUMMARY */}
        <Paper sx={{ p: 2, mt: 3, backgroundColor: "#f8f8f8" }}>
          <Typography variant="h6">Client Summary</Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <strong>Client:</strong> {clientDetails.clientName}
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <strong>Sector:</strong> {clientDetails.sector}
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <strong>Arrival:</strong> {tourDetails.arrivalCity}
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <strong>Departure:</strong> {tourDetails.departureCity}
            </Grid>
          </Grid>
        </Paper>

        {/* QUOTATION DETAILS */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6">Quotation Details</Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Adults"
                type="number"
                fullWidth
                {...formik.getFieldProps("adult")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Children"
                type="number"
                fullWidth
                {...formik.getFieldProps("child")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Kids"
                type="number"
                fullWidth
                {...formik.getFieldProps("kid")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Infants"
                type="number"
                fullWidth
                {...formik.getFieldProps("infants")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Meal Plan"
                fullWidth
                {...formik.getFieldProps("mediPlan")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="No. of Rooms"
                type="number"
                fullWidth
                {...formik.getFieldProps("noOfRooms")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Room Type"
                fullWidth
                {...formik.getFieldProps("roomType")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Sharing Type"
                fullWidth
                {...formik.getFieldProps("sharingType")}
              />
            </Grid>

            {/* MATTRESS */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="No. of Mattress"
                type="number"
                fullWidth
                {...formik.getFieldProps("noOfMattress")}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* MATTRESS COST */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6">Mattress Cost (Per Night)</Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Superior Mattress Cost"
                type="number"
                fullWidth
                {...formik.getFieldProps("superiorMattressCost")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Deluxe Mattress Cost"
                type="number"
                fullWidth
                {...formik.getFieldProps("deluxeMattressCost")}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* DESTINATION PRICE TABLE */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6">Destinations & Prices</Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Destination</TableCell>
                  <TableCell>Nights</TableCell>
                  <TableCell>Standard Hotel</TableCell>
                  <TableCell>Std / night</TableCell>
                  <TableCell>Deluxe Hotel</TableCell>
                  <TableCell>Dlx / night</TableCell>
                  <TableCell>Superior Hotel</TableCell>
                  <TableCell>Sup / night</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {cities.map((city, index) => (
                  <TableRow key={index}>
                    <TableCell>{city.cityName}</TableCell>
                    <TableCell>{city.nights}</TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        {...formik.getFieldProps(
                          `cityPrices[${index}].standardHotelName`,
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        {...formik.getFieldProps(
                          `cityPrices[${index}].standardPrice`,
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        {...formik.getFieldProps(
                          `cityPrices[${index}].deluxeHotelName`,
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        {...formik.getFieldProps(
                          `cityPrices[${index}].deluxePrice`,
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        {...formik.getFieldProps(
                          `cityPrices[${index}].superiorHotelName`,
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        {...formik.getFieldProps(
                          `cityPrices[${index}].superiorPrice`,
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* PRICING SUMMARY */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" fontWeight="bold">
              Pricing Summary
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
              {/* STANDARD */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderLeft: "6px solid #1976d2" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "#1976d2" }}>
                      STANDARD PACKAGE
                    </Typography>

                    <Typography>
                      <strong>Base Cost:</strong> ₹{baseStandard.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>After Margin:</strong> ₹
                      {standardAfterMargin.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>After Discount:</strong> ₹
                      {standardTaxable.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>GST ({gstPercent}%):</strong> ₹
                      {standardGST.toFixed(2)}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography sx={{ color: "green" }} variant="h6">
                      Final Total: ₹{finalStandardTotal.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* DELUXE */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderLeft: "6px solid #9c27b0" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "#9c27b0" }}>
                      DELUXE PACKAGE
                    </Typography>

                    <Typography>
                      <strong>Base Cost:</strong> ₹{baseDeluxe.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>After Margin:</strong> ₹
                      {deluxeAfterMargin.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>After Discount:</strong> ₹
                      {deluxeTaxable.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>GST ({gstPercent}%):</strong> ₹
                      {deluxeGST.toFixed(2)}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography sx={{ color: "green" }} variant="h6">
                      Final Total: ₹{finalDeluxeTotal.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* SUPERIOR */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderLeft: "6px solid #2e7d32" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "#2e7d32" }}>
                      SUPERIOR PACKAGE
                    </Typography>

                    <Typography>
                      <strong>Base Cost:</strong> ₹{baseSuperior.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>After Margin:</strong> ₹
                      {superiorAfterMargin.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>After Discount:</strong> ₹
                      {superiorTaxable.toFixed(2)}
                    </Typography>
                    <Typography>
                      <strong>GST ({gstPercent}%):</strong> ₹
                      {superiorGST.toFixed(2)}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography sx={{ color: "green" }} variant="h6">
                      Final Total: ₹{finalSuperiorTotal.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* MARGIN & TAXES */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6">Company Margin / Taxes</Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Margin (%)"
                type="number"
                fullWidth
                name="marginPercent"
                value={formik.values.marginPercent}
                onChange={handleMarginPercentChange}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Margin Amount"
                type="number"
                fullWidth
                name="marginAmount"
                value={formik.values.marginAmount}
                onChange={handleMarginAmountChange}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Discount"
                type="number"
                fullWidth
                {...formik.getFieldProps("discount")}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>GST On</InputLabel>
                <Select
                  value={formik.values.gstOn}
                  name="gstOn"
                  onChange={formik.handleChange}
                >
                  <MenuItem value="Full">
                    Full (GST on amount after discount)
                  </MenuItem>
                  <MenuItem value="Margin">
                    Margin (GST on margin only)
                  </MenuItem>
                  <MenuItem value="None">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="GST / Tax (%)"
                type="number"
                fullWidth
                helperText="Totals update automatically when you change this"
                {...formik.getFieldProps("taxPercent")}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* SIGNATURE */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6">Signature Details</Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Regards Text"
                fullWidth
                {...formik.getFieldProps("regardsText")}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Signed By"
                fullWidth
                {...formik.getFieldProps("signedBy")}
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? "Saving..." : "Submit Quotation"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CustomQuotationForm;
