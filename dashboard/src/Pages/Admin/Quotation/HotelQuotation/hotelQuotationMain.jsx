import React, { useState, useEffect } from "react";
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import HotelQuotationStep1 from "../HotelQuotation/hotelquotation";
import HotelQuotationStep2 from "../HotelQuotation/HotelQuotationStep2";
import HotelQuotationStep3 from "../HotelQuotation/HotelQuotationStep3";
import HotelQuotationStep4 from "../HotelQuotation/HotelQuotationStep4";
import HotelQuotationStep5 from "../HotelQuotation/HotelQuotationStep5";
import { createHotelQuotation } from "../../../../features/quotation/hotelQuotation";

const steps = [
    "Basic Details",
    "Itinerary Setup",
    "Hotel Configuration",
    "Transport Details",
    "Final Review"
];

const HotelQuotationMain = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        step1: null,
        step2: null,
        step3: null,
        step4: null,
    });
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ✅ Enhanced Data Logging
    useEffect(() => {
        console.log("=== MAIN COMPONENT DATA STATE ===");
        console.log("📊 CURRENT FORM DATA STATE:", formData);
        console.log("🔍 Step1 Data:", formData.step1);
        console.log("🔍 Step1 Client Name:", formData.step1?.clientName);
        console.log("🔍 Step2 Data:", formData.step2);
        console.log("🔍 Step3 Data:", formData.step3);
        console.log("🔍 Step4 Data:", formData.step4);
        console.log("========================");
    }, [formData]);

    // ✅ FIXED: Handle moving to next step - PROPER data passing
    const handleNext = (stepData) => {
        console.log(`✅ STEP ${activeStep + 1} COMPLETED:`, stepData);

        // ✅ IMMEDIATE state update
        const stepKey = `step${activeStep + 1}`;
        const newFormData = {
            ...formData,
            [stepKey]: stepData
        };

        setFormData(newFormData);
        console.log(`🔄 UPDATED FORM DATA for ${stepKey}:`, newFormData[stepKey]);

        if (activeStep === steps.length - 2) {
            setOpenConfirmDialog(true);
        } else {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    // Handle moving to previous step
    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmitQuotation = async () => {
        try {
            setSubmissionStatus('loading');

            if (!formData.step1 || !formData.step4) {
                console.error("Step 1 or Step 4 data missing");
                setSubmissionStatus('error');
                return;
            }

            // Map tripType dropdown value to schema enum
            const tripTypeMapping = {
                "One Way": "OneWay",
                "Round Trip": "RoundTrip"
            };

            // ✅ PROPERLY FORMATTED stayLocation array
            const formattedStayLocations = (formData.step2?.stayLocations || []).map((location, index) => ({
                city: location.city || "Unknown City",
                order: location.order || index + 1,
                nights: location.nights || 1,
                standard: location.standard || {
                    hotelName: "",
                    roomType: "",
                    mealPlan: "",
                    noNights: 1,
                    noOfRooms: 0,
                    mattressForAdult: false,
                    adultExBed: false,
                    mattressForChildren: false,
                    withoutMattress: false
                },
                deluxe: location.deluxe || {
                    hotelName: "",
                    roomType: "",
                    mealPlan: "",
                    noNights: 1,
                    noOfRooms: 0,
                    mattressForAdult: false,
                    adultExBed: false,
                    mattressForChildren: false,
                    withoutMattress: false
                },
                superior: location.superior || {
                    hotelName: "",
                    roomType: "",
                    mealPlan: "",
                    noNights: 1,
                    noOfRooms: 0,
                    mattressForAdult: false,
                    adultExBed: false,
                    mattressForChildren: false,
                    withoutMattress: false
                }
            }));

            // ✅ If no stay locations from step2, create at least one default
            const finalStayLocations = formattedStayLocations.length > 0
                ? formattedStayLocations
                : [{
                    city: formData.step2?.arrivalCity || "Default City",
                    order: 1,
                    nights: formData.step2?.nights || 1,
                    standard: {
                        hotelName: "",
                        roomType: "",
                        mealPlan: "",
                        noNights: 1,
                        noOfRooms: 0,
                        mattressForAdult: false,
                        adultExBed: false,
                        mattressForChildren: false,
                        withoutMattress: false
                    },
                    deluxe: {
                        hotelName: "",
                        roomType: "",
                        mealPlan: "",
                        noNights: 1,
                        noOfRooms: 0,
                        mattressForAdult: false,
                        adultExBed: false,
                        mattressForChildren: false,
                        withoutMattress: false
                    },
                    superior: {
                        hotelName: "",
                        roomType: "",
                        mealPlan: "",
                        noNights: 1,
                        noOfRooms: 0,
                        mattressForAdult: false,
                        adultExBed: false,
                        mattressForChildren: false,
                        withoutMattress: false
                    }
                }];

            console.log("🏨 FORMATTED STAY LOCATIONS:", finalStayLocations);

            // ✅ COMPLETE FINAL DATA with all missing fields
            const finalData = {
                clientDetails: {
                    clientName: formData.step1.clientName || "",
                    tourType: formData.step1.tourType || "Domestic",
                    sector: formData.step1.sector || "",
                    showCostPerAdult: formData.step1.showCostPerAdult || false,
                    serviceRequired: Array.isArray(formData.step1.serviceRequired)
                        ? formData.step1.serviceRequired
                        : [formData.step1.serviceRequired].filter(Boolean),
                    adults: formData.step1.adults?.toString() || "0",
                    children: formData.step1.children?.toString() || "0",
                    infants: formData.step1.infants?.toString() || "0",
                    kids: formData.step1.kids?.toString() || "0",
                },
                accommodationDetails: {
                    hotelType: Array.isArray(formData.step3?.hotelType)
                        ? formData.step3.hotelType
                        : [],
                    mealPlan: formData.step3?.mealPlan || "",
                    transport: formData.step3?.transport || "No",
                    sharingType: formData.step3?.sharingType || "",
                    noOfRooms: formData.step3?.noOfRooms?.toString() || "0",
                    noOfMattress: formData.step3?.noOfMattress?.toString() || "0",
                },
                pickupDrop: {
                    arrivalDate: formData.step2?.arrivalDate || new Date(),
                    arrivalCity: formData.step2?.arrivalCity || "",
                    arrivalLocation: formData.step2?.arrivalLocation || "",
                    departureDate: formData.step2?.departureDate || new Date(),
                    departureCity: formData.step2?.departureCity || "",
                    departureLocation: formData.step2?.departureLocation || "",
                    nights: formData.step2?.nights || 0
                },
                quotationValidity: {
                    validFrom: new Date(),
                    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                },
                quotation: {
                    createdBy: true,
                    quotationTitle: formData.step1?.quotationTitle || `Quotation for ${formData.step1.clientName}`,
                    initialNotes: formData.step1?.initialNotes || "",
                    selectBannerImage: formData.step1?.selectBannerImage || ""
                },
                // ✅ FIXED: Properly formatted stayLocation array
                stayLocation: finalStayLocations,
                vehicleDetails: {
                    basicsDetails: {
                        clientName: formData.step4.clientName || formData.step1.clientName || "",
                        vehicleType: formData.step4.vehicleType || "",
                        tripType: tripTypeMapping[formData.step4.tripType] || "OneWay",
                        noOfDays: formData.step4.noOfDays?.toString() || "1",
                        perDayCost: formData.step4.perDayCost?.toString() || "0",
                    },
                    costDetails: {
                        totalCost: formData.step4.totalCost?.toString() || "0",
                    },
                    pickupDropDetails: {
                        pickupDate: formData.step4.pickupDate || formData.step2?.arrivalDate || "",
                        pickupTime: formData.step4.pickupTime || "",
                        pickupLocation: formData.step4.pickupLocation || formData.step2?.arrivalLocation || "",
                        dropDate: formData.step4.dropDate || formData.step2?.departureDate || "",
                        dropTime: formData.step4.dropTime || "",
                        dropLocation: formData.step4.dropLocation || formData.step2?.departureLocation || "",
                    }
                },
                quotationInclusion: formData.step4.inclusion || "",
                quotationExculsion: formData.step4.exclusion || "",
                paymentPolicies: formData.step4.paymentPolicies || "",
                CancellationRefund: formData.step4.cancellation || "",
                termsAndConditions: formData.step4.terms || "",
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log("✅ SUBMITTING COMPLETE FINAL DATA:", finalData);
            console.log("🏨 STAY LOCATIONS DETAILS:", finalData.stayLocation);

            // ✅ Validate critical fields
            if (!finalData.clientDetails.clientName) {
                alert("Client name is required!");
                setSubmissionStatus('error');
                return;
            }

            // ✅ Validate stayLocation required fields
            const invalidStayLocations = finalData.stayLocation.filter(loc =>
                !loc.city || !loc.order
            );

            if (invalidStayLocations.length > 0) {
                console.error("Invalid stay locations:", invalidStayLocations);
                alert("Stay locations must have city and order fields!");
                setSubmissionStatus('error');
                return;
            }

            await dispatch(createHotelQuotation(finalData)).unwrap();

            setSubmissionStatus('success');
            setOpenConfirmDialog(false);

            setTimeout(() => {
                setActiveStep(0);
                setFormData({
                    step1: null,
                    step2: null,
                    step3: null,
                    step4: null,
                });
                setSubmissionStatus(null);
                navigate("/quotation");
            }, 2000);

        } catch (error) {
            console.error('Submission failed:', error);
            setSubmissionStatus('error');
        }
    };

    const renderStepContent = (step) => {
        console.log(`🎯 RENDERING STEP ${step + 1} with data:`, {
            step1Data: formData.step1,
            step2Data: formData.step2,
            step3Data: formData.step3,
            step4Data: formData.step4
        });

        const commonProps = {
            onNext: handleNext,
            onBack: handleBack,
            initialData: formData[`step${step + 1}`] || {},
        };

        switch (step) {
            case 0:
                return <HotelQuotationStep1 {...commonProps} />;
            case 1:
                return <HotelQuotationStep2
                    {...commonProps}
                    step1Data={formData.step1} // ✅ Pass step1 data
                />;
            case 2:
                return <HotelQuotationStep3
                    {...commonProps}
                    step1Data={formData.step1} // ✅ Pass step1 data
                    step2Data={formData.step2}
                />;
            case 3:
                return (
                    <HotelQuotationStep4
                        {...commonProps}
                        step1Data={formData.step1}
                        step2Data={formData.step2}
                        step3Data={formData.step3}
                    />
                );
            case 4:
                return <HotelQuotationStep5
                    formData={formData}
                    onBack={handleBack}
                    onSubmit={handleSubmitQuotation}
                    submissionStatus={submissionStatus}
                />;
            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                {/* Header */}
                <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                    Hotel Quotation
                </Typography>

                <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                    Create a comprehensive hotel quotation in simple steps
                </Typography>

                {!formData.step1 && activeStep > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        ⚠️ Step 1 data not available. Please go back to Step 1 and complete it.
                    </Alert>
                )}

                {/* Stepper */}
                <Box sx={{ width: '100%', mt: 4, mb: 6 }}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {/* Step Content */}
                <Box sx={{ mt: 2 }}>
                    {renderStepContent(activeStep)}
                </Box>
            </Paper>

            {/* Confirmation Dialog */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Ready to Review?</DialogTitle>
                <DialogContent>
                    <Typography>
                        You're about to proceed to the final review step. Make sure all information is correct.
                        You can still go back and make changes before final submission.
                    </Typography>
                    {formData.step1 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <strong>Client:</strong> {formData.step1.clientName || 'Not specified'}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            setOpenConfirmDialog(false);
                            setActiveStep(steps.length - 1);
                        }}
                        variant="contained"
                    >
                        Continue to Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default HotelQuotationMain;