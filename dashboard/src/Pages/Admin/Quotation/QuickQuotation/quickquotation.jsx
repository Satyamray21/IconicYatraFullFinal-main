import React, { useState, useEffect } from "react";
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

      const apiData = {
        customerName: finalData.clientDetails?.customerName?.trim() || "",
        email: finalData.clientDetails?.email?.trim() || "",
        phone: finalData.clientDetails?.phone?.trim() || "",
        adults: parseInt(finalData.clientDetails?.adults) || 0,
        children: parseInt(finalData.clientDetails?.children) || 0,
        message: finalData.clientDetails?.message?.trim() || "",

        packageId: finalData.packageDetails?.selectedPackage || "",

        // *** FIXED: transportation root पर भेज रहे हैं ***
        transportation: finalData.packageDetails?.transportation || "",
        totalCost: Number(finalData.packageDetails?.totalCost) || 0,
        pickupPoint: finalData.packageDetails?.pickupPoint || "",
        dropPoint: finalData.packageDetails?.dropPoint || "",
        arrivalDate: finalData.packageDetails?.arrivalDate || "",
        departureDate: finalData.packageDetails?.departureDate || "",
        numberOfPax: Number(finalData.packageDetails?.numberOfPax) || 0,
        noOfRooms: Number(finalData.packageDetails?.noOfRooms) || 0,
        transportationCost:
          Number(finalData.packageDetails?.transportationCost) || 0,
        hotelTotalCost: Number(finalData.packageDetails?.hotelTotalCost) || 0,
        standardCost: Number(finalData.packageDetails?.standardCost) || 0,
        deluxeCost: Number(finalData.packageDetails?.deluxeCost) || 0,
        superiorCost: Number(finalData.packageDetails?.superiorCost) || 0,
        mealPlan: finalData.packageDetails?.mealPlan || "",

        // Package Snapshot (unchanged)
        packageSnapshot: {
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
          noOfRooms: Number(finalData.packageDetails?.noOfRooms) || 0,
          transportationCost:
            Number(finalData.packageDetails?.transportationCost) || 0,
          hotelTotalCost: Number(finalData.packageDetails?.hotelTotalCost) || 0,
          standardCost: Number(finalData.packageDetails?.standardCost) || 0,
          deluxeCost: Number(finalData.packageDetails?.deluxeCost) || 0,
          superiorCost: Number(finalData.packageDetails?.superiorCost) || 0,
          totalCost: Number(finalData.packageDetails?.totalCost) || 0,
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
        return <StepClientDetails onNext={handleNext} />;
      case 1:
        return (
          <StepPackageDetails
            onNext={handleNext}
            onBack={handleBack}
            clientDetails={formData.clientDetails}
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
