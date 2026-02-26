// src/components/MultiStepPackageForm.jsx
import React, { useEffect, useState } from "react";
import { Box, Stepper, Step, StepLabel, Typography, Paper, Button } from "@mui/material";
import PackageEntryForm from "../Form/PackageForm";
import TourDetailsForm from "../Form/TourDetailsForm";
import { useDispatch } from "react-redux";
import { createPackage, updatePackageTourDetails, fetchYatraPackages } from "../../../../features/package/packageSlice"; // ✅ Import fetchYatraPackages
import { useNavigate } from "react-router-dom";
import { fetchHotels } from "../../../../features/hotel/hotelSlice";

const steps = ["Package Info", "Tour Details"];

const MultiStepPackageForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [createdPackageId, setCreatedPackageId] = useState(null);
    const [step1Data, setStep1Data] = useState({});
    const [step2Data, setStep2Data] = useState({});
    const [loading, setLoading] = useState(false);
    const [packageDataFromStep1, setPackageDataFromStep1] = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchHotels());
    }, [dispatch]);

    const handleNextStep1 = async (values, stayLocations) => {
        setLoading(true);
        try {
            // ✅ FIX 1: Set status to "active" immediately for new packages
            const payload = {
                ...values,
                stayLocations,
                status: "active" // ✅ CHANGE: Set to active immediately
            };

            console.log("🚀 Step 1 Payload:", payload);

            const result = await dispatch(createPackage(payload)).unwrap();
            console.log("✅ Step 1 Response:", result);

            if (!result || (!result._id && !result.package?._id)) {
                alert("❌ Backend did not return a valid package ID");
                return;
            }

            const packageData = result.package || result;
            const packageId = packageData._id;

            // Store complete package data
            const completePackageData = {
                ...payload,
                _id: packageId,
                stayLocations: stayLocations,
                tourType: values.tourType,
                destinationCountry: values.destinationCountry,
                sector: values.sector,
                packageSubType: values.packageSubType
            };

            console.log("📦 Complete Package Data for Step 2:", completePackageData);

            setStep1Data(completePackageData);
            setPackageDataFromStep1(completePackageData);
            setCreatedPackageId(packageId);
            setActiveStep(1);

        } catch (err) {
            console.error("Step 1 Error:", err);
            alert(`❌ Failed to create package: ${err.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep2 = async (step2Values) => {
        if (!createdPackageId || !packageDataFromStep1) {
            alert("❌ Package data missing. Please complete Step 1 first.");
            return;
        }

        setLoading(true);
        try {
            // ✅ FIX 2: Include tourType and other essential fields
            const payload = {
                id: createdPackageId,
                data: {
                    // ✅ Include tourType from Step 1
                    tourType: packageDataFromStep1.tourType,
                    destinationCountry: packageDataFromStep1.destinationCountry,
                    sector: packageDataFromStep1.sector,
                    packageSubType: packageDataFromStep1.packageSubType,

                    // Step 2 specific fields
                    arrivalCity: step2Values.arrivalCity || "",
                    departureCity: step2Values.departureCity || "",
                    title: step2Values.title || "",
                    notes: step2Values.notes || "",
                    days: (step2Values.days || []).map((day) => ({
                        title: day.title || "",
                        notes: day.notes || "",
                        aboutCity: day.aboutCity || "",
                        sightseeing: day.sightseeing || [],
                        selectedSightseeing: day.selectedSightseeing || [],
                        dayImage: day.dayImage || "",
                    })),
                    mealPlan: step2Values.mealPlan || step1Data.mealPlan || {
                        planType: "CP",
                        description: ""
                    },
                    destinationNights: step2Values.destinationNights || [],
                    policy: step2Values.policy || step1Data.policy || {},
                    status: "active" // ✅ Keep it active
                },
            };

            console.log("🚀 Step 2 Payload:", payload);
            const result = await dispatch(updatePackageTourDetails(payload)).unwrap();

            // ✅ FIX 3: Refresh the specific tour type packages after creation
            if (packageDataFromStep1.tourType) {
                switch (packageDataFromStep1.tourType.toLowerCase()) {
                    // case 'yatra':
                    //     dispatch(fetchYatraPackages());
                    //     break;
                    case 'domestic':
                        dispatch(fetchDomesticPackages());
                        break;
                    case 'international':
                        dispatch(fetchInternationalPackages());
                        break;
                    // Add other tour types as needed
                }
            }

            alert("✅ Package created successfully!");
            navigate("/tourpackage");

        } catch (err) {
            console.error("Step 2 Error:", err);
            alert(`❌ Failed to update tour details: ${err.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom color="primary">
                Create New Package
            </Typography>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {steps.map((label, index) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <Typography>Processing...</Typography>
                </Box>
            )}

            <Box mt={2}>
                {activeStep === 0 && (
                    <PackageEntryForm
                        onNext={handleNextStep1}
                        initialData={step1Data}
                        loading={loading}
                    />
                )}

                {activeStep === 1 && createdPackageId && packageDataFromStep1 ? (
                    <TourDetailsForm
                        onNext={handleNextStep2}
                        onBack={handleBack}
                        initialData={step1Data}
                        packageId={createdPackageId}
                        packageData={packageDataFromStep1}
                        loading={loading}
                    />
                ) : activeStep === 1 ? (
                    <Typography color="error">
                        Error: Package data not available. Please go back to Step 1.
                    </Typography>
                ) : null}
            </Box>

            {activeStep === 1 && (
                <Box mt={2} display="flex" justifyContent="space-between">
                    <Button variant="outlined" onClick={handleBack}>
                        Back
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default MultiStepPackageForm;