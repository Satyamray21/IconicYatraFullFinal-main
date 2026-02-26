import React, { useState } from "react";
import LeadForm from "./LeadForm";
import LeadTourForm from "./LeadTourForm"
import { useNavigate } from "react-router-dom";
import { createLead } from "../../../../features/leads/leadSlice";
import { Snackbar, Alert } from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
const LeadCreationFlow = () => {
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState(null);
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();

  const handleSaveAndContinue = (basicLeadData) => {
    setLeadData(basicLeadData);
    setStep(2);
  };

  const handleComplete = async (tourData) => {
    try {
      setIsSubmitting(true);

      // Combine data from both forms
      const completeLeadData = {
        ...leadData,
        ...tourData,
      };

      // Call the API
      const response = await dispatch(createLead(completeLeadData)).unwrap();

      setNotification({
        open: true,
        message: "Lead created successfully!",
        severity: "success",
      });

      // Redirect to leads list after 2 seconds
      setTimeout(() => navigate("/lead"), 2000);
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || "Failed to create lead",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <div>
      {step === 1 && <LeadForm onSaveAndContinue={handleSaveAndContinue} />}
      {step === 2 && leadData && (
        <LeadTourForm
          leadData={leadData}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
        />
      )}


      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LeadCreationFlow;