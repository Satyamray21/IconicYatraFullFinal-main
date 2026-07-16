import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import StepClientDetails from "./QuickQuotationStep2";
import StepPackageDetails from "./QuickQuotationStep3";
import StepPolicy from "./QuickQuotationStep4";
import StepPreview from "./QuickQuotationStep5";
import {
  createQuickQuotation,
  clearStatus,
} from "../../../../features/quotation/quickQuotationSlice";

const steps = [
  "Client Details",
  "Package Details",
  "Policy & Others",
  "Preview",
];

const QuickQuotationForm = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const convertPackageId = location.state?.convertPackageId || null;
  const convertSector = location.state?.convertSector || null;
  const convertNights = location.state?.convertNights || null;

  const { loading, error, successMessage } = useSelector(
    (state) => state.quickQuotation,
  );

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    clientDetails: {},
    packageDetails: {},
    policies: {},
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Show snackbar for success/error messages
  useEffect(() => {
    if (successMessage) {
      setSnackbar({
        open: true,
        message: successMessage,
        severity: "success",
      });
      dispatch(clearStatus());
    }
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: "error",
      });
      dispatch(clearStatus());
    }
  }, [successMessage, error, dispatch]);

  const handleNext = (stepData) => {
    console.log("Step Data Received:", stepData);

    // Merge the new step data with existing form data
    const newData = {
      ...formData,
      ...stepData,
    };

    setFormData(newData);
    console.log("Updated Form Data:", newData);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (finalData) => {
    try {
      console.log("Final Data for API:", finalData);

      let calculatedStandard = Number(finalData.packageDetails?.standardCost) || 0;
      let calculatedDeluxe = Number(finalData.packageDetails?.deluxeCost) || 0;
      let calculatedSuperior = Number(finalData.packageDetails?.superiorCost) || 0;
      let calculatedTotal = Number(finalData.packageDetails?.totalCost) || 0;

      if (finalData.packageDetails?.calculationMethod === "perPerson") {
        const adults = Number(finalData.clientDetails?.adults) || 1;
        const children = Number(finalData.clientDetails?.children) || 0;
        const mattresses = Number(finalData.packageDetails?.noOfMattress) || 0;
        const pd = finalData.packageDetails;

        const calc = (a, c, m) => (Number(a || 0) * adults) + (Number(c || 0) * children) + (Number(m || 0) * mattresses);

        const s = calc(pd.standardAdultCost, pd.standardChildCost, pd.standardMattressCost);
        const d = calc(pd.deluxeAdultCost, pd.deluxeChildCost, pd.deluxeMattressCost);
        const sup = calc(pd.superiorAdultCost, pd.superiorChildCost, pd.superiorMattressCost);

        calculatedStandard = s;
        calculatedDeluxe = d;
        calculatedSuperior = sup;
        
        calculatedTotal = s > 0 ? s : (d > 0 ? d : sup);
      }

      const apiData = {
        customerName: finalData.clientDetails?.customerName || "",
        title: finalData.clientDetails?.title || "Mr",
        email: finalData.clientDetails?.email || "",
        phone: finalData.clientDetails?.phone || "",
        clientLocation: finalData.clientDetails?.clientLocation || "",
        packageId: finalData.packageDetails?.selectedPackage || "",
        adults: Number(finalData.clientDetails?.adults) || 0,
        children: Number(finalData.clientDetails?.children) || 0,
        kids: Number(finalData.clientDetails?.kids) || 0,
        infants: Number(finalData.clientDetails?.infants) || 0,
        noOfRooms: Number(finalData.packageDetails?.noOfRooms) || 0,
        noOfMattress: Number(finalData.packageDetails?.noOfMattress) || 0,
        roomType: finalData.packageDetails?.roomType || "",
        noOfVehicles: Number(finalData.packageDetails?.noOfVehicles) || 0,
        vehiclesSameOrDifferent:
          finalData.packageDetails?.vehiclesSameOrDifferent || "",
        message: finalData.clientDetails?.message || "",
        transportation: finalData.packageDetails?.transportation || "",
        totalCost: Number(finalData.packageDetails?.totalCost) || 0,
        calculationMethod: finalData.packageDetails?.calculationMethod || "package",
        perPersonAdultCost: Number(finalData.packageDetails?.perPersonAdultCost) || 0,
        perPersonChildCost: Number(finalData.packageDetails?.perPersonChildCost) || 0,
        perPersonMattressCost: Number(finalData.packageDetails?.perPersonMattressCost) || 0,
        standardAdultCost: Number(finalData.packageDetails?.standardAdultCost) || 0,
        standardChildCost: Number(finalData.packageDetails?.standardChildCost) || 0,
        standardMattressCost: Number(finalData.packageDetails?.standardMattressCost) || 0,
        deluxeAdultCost: Number(finalData.packageDetails?.deluxeAdultCost) || 0,
        deluxeChildCost: Number(finalData.packageDetails?.deluxeChildCost) || 0,
        deluxeMattressCost: Number(finalData.packageDetails?.deluxeMattressCost) || 0,
        superiorAdultCost: Number(finalData.packageDetails?.superiorAdultCost) || 0,
        superiorChildCost: Number(finalData.packageDetails?.superiorChildCost) || 0,
        superiorMattressCost: Number(finalData.packageDetails?.superiorMattressCost) || 0,
        pickupPoint: finalData.packageDetails?.pickupPoint || "",
        dropPoint: finalData.packageDetails?.dropPoint || "",
        arrivalDate: finalData.packageDetails?.arrivalDate || "",
        departureDate: finalData.packageDetails?.departureDate || "",
        pickupTime:
          finalData.packageDetails?.pickupTime ||
          finalData.clientDetails?.pickupTime ||
          "",
        dropTime:
          finalData.packageDetails?.dropTime ||
          finalData.clientDetails?.dropTime ||
          "",
        numberOfPax: Number(finalData.packageDetails?.numberOfPax) || 0,
        transportationCost:
          Number(finalData.packageDetails?.transportationCost) || 0,
        hotelTotalCost: Number(finalData.packageDetails?.hotelTotalCost) || 0,
        standardCost: calculatedStandard,
        deluxeCost: calculatedDeluxe,
        superiorCost: calculatedSuperior,
        mealPlan: finalData.packageDetails?.mealPlan || "",
        multipleVehicles: Array.isArray(finalData.clientDetails?.multipleVehicles) ? finalData.clientDetails.multipleVehicles : [],

        // Package Snapshot (unchanged)
        packageSnapshot: {
          clientLocation: finalData.clientDetails?.clientLocation?.trim() || "",
          tourType: finalData.packageDetails?.tourType || "",
          destinations: Array.isArray(finalData.packageDetails?.destinations)
            ? finalData.packageDetails.destinations.filter(
                (dest) => dest && dest.trim() !== "",
              )
            : [],
          days: parseInt(finalData.packageDetails?.days) || 0,
          nights: parseInt(finalData.packageDetails?.nights) || 0,
          hotelType: finalData.packageDetails?.hotelType || "",
          transportMode: finalData.packageDetails?.transportMode || "",
          mealPlan: finalData.packageDetails?.mealPlan || "",
          activities: Array.isArray(finalData.packageDetails?.activities)
            ? finalData.packageDetails.activities.filter(
                (activity) => activity && activity.trim() !== "",
              )
            : [],
          itinerary: Array.isArray(finalData.packageDetails?.itinerary)
            ? finalData.packageDetails.itinerary
            : [],
          arrivalCity: finalData.packageDetails?.arrivalCity || "",
          departureCity: finalData.packageDetails?.departureCity || "",
          destinationCountry:
            finalData.packageDetails?.destinationCountry || "",
          numberOfPax: finalData.packageDetails?.numberOfPax || "",
          roomType: finalData.packageDetails?.roomType || "",
          pickupPoint: finalData.packageDetails?.pickupPoint || "",
          dropPoint: finalData.packageDetails?.dropPoint || "",
          arrivalDate: finalData.packageDetails?.arrivalDate || "",
          departureDate: finalData.packageDetails?.departureDate || "",
          pickupTime:
            finalData.packageDetails?.pickupTime ||
            finalData.clientDetails?.pickupTime ||
            "",
          dropTime:
            finalData.packageDetails?.dropTime ||
            finalData.clientDetails?.dropTime ||
            "",
          noOfRooms: Number(finalData.packageDetails?.noOfRooms) || 0,
          noOfMattress: Number(finalData.packageDetails?.noOfMattress) || 0,
          transportationCost:
            Number(finalData.packageDetails?.transportationCost) || 0,
          hotelTotalCost: Number(finalData.packageDetails?.hotelTotalCost) || 0,
          standardCost: calculatedStandard,
          deluxeCost: calculatedDeluxe,
          superiorCost: calculatedSuperior,
          totalCost: calculatedTotal,
          calculationMethod: finalData.packageDetails?.calculationMethod || "package",
          perPersonAdultCost: Number(finalData.packageDetails?.perPersonAdultCost) || 0,
          perPersonChildCost: Number(finalData.packageDetails?.perPersonChildCost) || 0,
          perPersonMattressCost: Number(finalData.packageDetails?.perPersonMattressCost) || 0,
          standardAdultCost: Number(finalData.packageDetails?.standardAdultCost) || 0,
          standardChildCost: Number(finalData.packageDetails?.standardChildCost) || 0,
          standardMattressCost: Number(finalData.packageDetails?.standardMattressCost) || 0,
          deluxeAdultCost: Number(finalData.packageDetails?.deluxeAdultCost) || 0,
          deluxeChildCost: Number(finalData.packageDetails?.deluxeChildCost) || 0,
          deluxeMattressCost: Number(finalData.packageDetails?.deluxeMattressCost) || 0,
          superiorAdultCost: Number(finalData.packageDetails?.superiorAdultCost) || 0,
          superiorChildCost: Number(finalData.packageDetails?.superiorChildCost) || 0,
          superiorMattressCost: Number(finalData.packageDetails?.superiorMattressCost) || 0,
        },

        policy: {
          inclusionPolicy: Array.isArray(finalData.policies?.inclusions)
            ? finalData.policies.inclusions.filter(
                (item) => item && item.trim() !== "",
              )
            : [],
          exclusionPolicy: Array.isArray(finalData.policies?.exclusions)
            ? finalData.policies.exclusions.filter(
                (item) => item && item.trim() !== "",
              )
            : [],
          paymentPolicy: finalData.policies?.paymentPolicy?.trim()
            ? [finalData.policies.paymentPolicy.trim()]
            : [],
          cancellationPolicy: finalData.policies?.cancellationPolicy?.trim()
            ? [finalData.policies.cancellationPolicy.trim()]
            : [],
          termsAndConditions: finalData.policies?.notes?.trim()
            ? [finalData.policies.notes.trim()]
            : [],
        },

        status: "draft",
      };

      console.log("API Data being sent:", apiData);

      // Validate required fields
      const missingFields = [];
      if (!apiData.customerName || apiData.customerName.trim() === "")
        missingFields.push("Customer Name");
      if (!apiData.email || apiData.email.trim() === "")
        missingFields.push("Email");
      if (!apiData.packageId || apiData.packageId.trim() === "")
        missingFields.push("Package Selection");
      if (!apiData.adults || apiData.adults === 0)
        missingFields.push("Number of Adults");

      if (missingFields.length > 0) {
        alert(`Please fill in required fields:\n${missingFields.join("\n")}`);
        return;
      }

      // Dispatch the API call
      const result = await dispatch(createQuickQuotation(apiData)).unwrap();

      console.log("Quotation created successfully:", result);

      // Show success message
      setSnackbar({
        open: true,
        message: "Quotation created successfully!",
        severity: "success",
      });

      // Reset form after successful submission
      setTimeout(() => {
        setActiveStep(0);
        setFormData({
          clientDetails: {},
          packageDetails: {},
          policies: {},
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to create quotation:", error);
      setSnackbar({
        open: true,
        message: error || "Failed to create quotation",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get current step component
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <StepClientDetails onNext={handleNext} convertSector={convertSector} convertNights={convertNights} initialClientDetails={formData.clientDetails} />;
      case 1:
        return (
          <StepPackageDetails
            onNext={handleNext}
            onBack={handleBack}
            clientDetails={formData.clientDetails}
            convertPackageId={convertPackageId}
          />
        );
      case 2:
        return <StepPolicy onNext={handleNext} onBack={handleBack} />;
      case 3:
        return (
          <StepPreview
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: 4,
          maxWidth: 900,
          mx: "auto",
          mt: 4,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box mt={4}>{getStepContent(activeStep)}</Box>
      </Paper>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QuickQuotationForm;