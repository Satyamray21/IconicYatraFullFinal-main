import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    CircularProgress
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { sendResetCode, changePassword } from "../../Features/authSlice";

const ForgotPasswordModal = ({ open, handleClose }) => {
    const dispatch = useDispatch();
    const { resetLoading, resetError, resetSuccess } = useSelector(state => state.auth);

    const [step, setStep] = useState(0);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const steps = ["Enter Email", "OTP & New Password", "Success"];

    const handleSendOTP = () => {
        dispatch(sendResetCode(email)).then(res => {
            if (res.meta.requestStatus === "fulfilled") setStep(1);
        });
    };

    const handleChangePassword = () => {
        dispatch(changePassword({ email, otp, newPassword })).then(res => {
            if (res.meta.requestStatus === "fulfilled") setStep(2);
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", color: "#1976d2" }}>
                Forgot Password
            </DialogTitle>

            <DialogContent>
                <Box sx={{ width: "100%", mb: 2 }}>
                    <Stepper activeStep={step} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {step === 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 3,
                            py: 2,
                        }}
                    >
                        {/* Iconic Yatra Style Email Section */}
                        <Box
                            sx={{
                                width: "100%",
                                p: 2,
                                bgcolor: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                                borderRadius: 2,
                                boxShadow: 3,
                                textAlign: "center",
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: "bold", mb: 1 }}
                            >
                                ✈️ Iconic Yatra
                            </Typography>
                            <Typography variant="body2">
                                Enter your registered email to receive your OTP
                            </Typography>
                        </Box>

                        {/* Email Input Field */}
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Email Address"
                            placeholder="you@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            sx={{
                                bgcolor: "#f9f9f9",
                                borderRadius: 2,
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                        borderColor: "#1976d2",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "#1565c0",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#0d47a1",
                                    },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            pl: 1,
                                            color: "#1976d2",
                                        }}
                                    >
                                        📧
                                    </Box>
                                ),
                            }}
                        />

                        {/* Error/Success Messages */}
                        {resetError && <Typography color="error">{resetError}</Typography>}
                        {resetSuccess && <Typography color="success.main">{resetSuccess}</Typography>}

                        {/* Send OTP Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleSendOTP}
                            disabled={resetLoading || !email}
                            sx={{
                                mt: 2,
                                py: 1.2,
                                fontWeight: "bold",
                                bgcolor: "#1976d2",
                                borderRadius: 2,
                                "&:hover": {
                                    bgcolor: "#1565c0",
                                },
                            }}
                        >
                            {resetLoading ? "Sending..." : "Send OTP"}
                        </Button>
                    </Box>
                )}

                {step === 1 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="body1" sx={{ textAlign: "center" }}>
                            Enter the OTP sent to your email and set a new password.
                        </Typography>
                        <TextField
                            fullWidth
                            label="OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            margin="normal"
                        />
                        {resetError && <Typography color="error">{resetError}</Typography>}
                    </Box>
                )}

                {step === 2 && (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h6" color="success.main">
                            ✅ Password Changed Successfully!
                        </Typography>
                        <Typography variant="body2">
                            You can now login with your new password.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
                {step === 0 && (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSendOTP}
                        disabled={resetLoading || !email}
                        sx={{ bgcolor: "#1976d2" }}
                    >
                        {resetLoading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
                    </Button>
                )}

                {step === 1 && (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleChangePassword}
                        disabled={resetLoading || !otp || !newPassword}
                        sx={{ bgcolor: "#1976d2" }}
                    >
                        {resetLoading ? <CircularProgress size={24} color="inherit" /> : "Change Password"}
                    </Button>
                )}

                {step === 2 && (
                    <Button variant="contained" fullWidth onClick={handleClose} sx={{ bgcolor: "#1976d2" }}>
                        Close
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ForgotPasswordModal;
