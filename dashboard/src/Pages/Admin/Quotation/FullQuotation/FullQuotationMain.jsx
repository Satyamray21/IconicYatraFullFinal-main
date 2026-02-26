// FullQuotationMain.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
    getQuotationById,
} from "../../../../features/quotation/fullQuotationSlice";

import FullQuotationStep1 from "./FullQuotationStep1";
import FullQuotationStep2 from "./FullQuotationStep2";
import FullQuotationStep3 from "./FullQuotationStep3";
import FullQuotationStep4 from "./FullQuotationStep4";
import FullQuotationStep5 from "./FullQuotationStep5";
import FullQuotationStep6 from "./FullQuotationStep6";

const FullQuotation = () => {
    const { quotationId, stepNumber } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { quotation, fetchLoading } = useSelector((state) => state.fullQuotation);

    const [currentStep, setCurrentStep] = useState(1);
    const [activeQuotationId, setActiveQuotationId] = useState(quotationId);

    // Fetch quotation only once per ID
    useEffect(() => {
        if (quotationId && quotationId !== "new") {
            // Only fetch if we don't have the data or it's a different quotation
            if (!quotation || quotation.quotationId !== quotationId) {
                dispatch(getQuotationById({ quotationId }));
            }
            setActiveQuotationId(quotationId);
        } else {
            setActiveQuotationId("new");
        }
    }, [quotationId, dispatch]); // Removed quotation from dependencies

    // Step control from URL
    useEffect(() => {
        const step = stepNumber ? parseInt(stepNumber) : 1;
        setCurrentStep(step);
    }, [stepNumber]);

    const handleStep1Complete = (newQuotationId) => {
        setActiveQuotationId(newQuotationId);
        navigate(`/fullquotation/${newQuotationId}/step/2`);
    };

    const handleNextStep = () => {
        const nextStep = Math.min(currentStep + 1, 6);
        navigate(`/fullquotation/${activeQuotationId}/step/${nextStep}`);
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            const prevStep = Math.max(currentStep - 1, 1);
            navigate(`/fullquotation/${activeQuotationId}/step/${prevStep}`);
        }
    };

    const renderStep = () => {
        const commonProps = {
            quotationId: activeQuotationId,
            quotation,
            onNextStep: handleNextStep,
            onPrevStep: handlePrevStep,
        };

        switch (currentStep) {
            case 1:
                return <FullQuotationStep1 {...commonProps} onNextStep={handleStep1Complete} />;
            case 2:
                return <FullQuotationStep2 {...commonProps} />;
            case 3:
                return (
                    <FullQuotationStep3
                        {...commonProps}
                        stayLocation={quotation?.stayLocation || []}
                    />
                );
            case 4:
                return <FullQuotationStep4 {...commonProps} />;
            case 5:
                return <FullQuotationStep5 {...commonProps} />;
            case 6:
                return (
                    <FullQuotationStep6
                        {...commonProps}
                        onFinalize={() => navigate(`/fullfinalize/${activeQuotationId}`)}
                    />
                );
            default:
                return <FullQuotationStep1 {...commonProps} onNextStep={handleStep1Complete} />;
        }
    };

    // Show loading only when actually fetching
    if (fetchLoading && quotationId && quotationId !== "new") {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading quotation data...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Full Quotation{" "}
                {activeQuotationId && activeQuotationId !== "new"
                    ? `- ${activeQuotationId}`
                    : "(New)"}
            </Typography>

            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Step {currentStep} of 6
            </Typography>

            {renderStep()}
        </Box>
    );
};

export default FullQuotation;