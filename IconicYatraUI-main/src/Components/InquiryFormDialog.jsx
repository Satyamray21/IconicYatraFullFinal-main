// src/Components/InquiryFormDialog.jsx
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Typography,
    Box,
    IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {enquiryAxios} from "../Utils/axiosInstance"

const InquiryFormDialog = ({
    open,
    handleClose,
    title = "Get a Free Enquiry",
    defaultDestination = ""
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    

    const [form, setForm] = useState({
        name: "",
        email: "",
        mobile: "",
        persons: "",
        destination: defaultDestination,
        travelDate: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        setForm((prev) => ({ ...prev, destination: defaultDestination }));
    }, [defaultDestination, open]);

     

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

      const handleFormSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            await enquiryAxios.post("/enquiry/create", form);

            // reset form
            setForm({
                name: "",
                email: "",
                mobile: "",
                persons: "",
                destination: "",
                travelDate: "",
            });

            handleClose();
            navigate("/thank-you");

        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Inquiry Form Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                
                {/* Header */}
                <Box
                    sx={{
                        backgroundColor: "#e67e52",
                        color: "#000",
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <Typography fontWeight={600}>{title}</Typography>
                    <IconButton size="small" onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ background: "#f2f2f2" }}>
                    {error && <Alert severity="error">{error.message || error}</Alert>}

                    <form onSubmit={handleFormSubmit}>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>

                            {/* Name */}
                            <Grid size={{xs:12}} >
                                <Typography fontSize={13}>Name</Typography>
                                <TextField
                                    fullWidth
                                    name="name"
                                    placeholder="Your Name*"
                                    value={form.name}
                                    onChange={handleChange}
                                    size="small"
                                    required
                                />
                            </Grid>

                            {/* Email */}
                            <Grid size={{xs:6}}>
                                <Typography fontSize={13}>Email</Typography>
                                <TextField
                                    fullWidth
                                    name="email"
                                    type="email"
                                    placeholder="Your Email*"
                                    value={form.email}
                                    onChange={handleChange}
                                    size="small"
                                    required
                                />
                            </Grid>

                            {/* Mobile */}
                            <Grid size={{xs:6}}>
                                <Typography fontSize={13}>Mobile/Whatsapp No.</Typography>
                                <TextField
                                    fullWidth
                                    name="mobile"
                                    placeholder="Your Mobile No.*"
                                    value={form.mobile}
                                    onChange={handleChange}
                                    size="small"
                                    required
                                />
                            </Grid>

                            {/* Persons */}
                            <Grid size={{xs:6}}>
                                <Typography fontSize={13}>No. of Persons</Typography>
                                <TextField
                                    fullWidth
                                    name="persons"
                                    type="number"
                                    placeholder="Number of Perso"
                                    value={form.persons}
                                    onChange={handleChange}
                                    size="small"
                                    required
                                />
                            </Grid>

                            {/* Destination */}
                            <Grid size={{xs:6}}>
                                <Typography fontSize={13}>Destination</Typography>
                                <TextField
                                    fullWidth
                                    name="destination"
                                    placeholder="Your Destination*"
                                    value={form.destination}
                                    onChange={handleChange}
                                    size="small"
                                    required
                                />
                            </Grid>

                            {/* Date */}
                            <Grid size={{xs:12}}>
                                <Typography fontSize={13}>Travel Date</Typography>
                                <TextField
                                    fullWidth
                                    type="date"
                                    name="travelDate"
                                    value={form.travelDate}
                                    onChange={handleChange}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>

                            {/* Button */}
                            <Grid size={{xs:12}} sx={{ mt: 1 }}>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        backgroundColor: "#e67e52",
                                        borderRadius: "25px",
                                        py: 1.2,
                                        fontWeight: 600,
                                        textTransform: "none",
                                        "&:hover": {
                                            backgroundColor: "#d96d3f"
                                        }
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={22} color="inherit" />
                                    ) : (
                                        "Submit Enquiry"
                                    )}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default InquiryFormDialog;