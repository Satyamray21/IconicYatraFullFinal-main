import React, { useEffect, useState, useCallback } from "react";
import {
    Autocomplete,
    TextField,
    CircularProgress,
    Box,
    Typography,
} from "@mui/material";
import axios from "../../../../utils/axios";

// Simple debounce helper
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const QuotationSelector = ({ formik, prefillQuotationId = "" }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [value, setValue] = useState(null);

    const fetchQuotations = useCallback(
        debounce(async (search) => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/quotations/search?search=${search}`);
                setOptions(data?.data || []);
            } catch (error) {
                console.error("Error fetching quotations:", error);
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        if (open) {
            fetchQuotations("");
        }
    }, [open, fetchQuotations]);

    useEffect(() => {
        if (inputValue !== undefined) {
            fetchQuotations(inputValue);
        }
    }, [inputValue, fetchQuotations]);

    // Handle prefill (e.g. when editing or coming from a quotation link)
    useEffect(() => {
        if (formik.values.quotationRef) {
            // If we have a quotationRef but no selected value, we might want to fetch details.
            // For now, we'll let the user re-select if it's not pre-loaded.
        }
    }, [formik.values.quotationRef]);

    return (
        <Autocomplete
            fullWidth
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            getOptionLabel={(option) => `[${option.type}] ${option.quotationId} - ${option.clientName}`}
            options={options}
            loading={loading}
            value={value}
            onChange={(event, newValue) => {
                setValue(newValue);
                formik.setFieldValue("quotationRef", newValue ? newValue._id : "");
            }}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Select Quotation (Custom, Quick, Vehicle, Flight, Hotel)"
                    variant="outlined"
                    sx={{ bgcolor: "white" }}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="bold">
                                {option.quotationId}
                            </Typography>
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    bgcolor: '#e3f2fd', 
                                    color: '#1976d2', 
                                    px: 1, 
                                    borderRadius: 1,
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {option.type}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Client: {option.clientName}
                        </Typography>
                    </Box>
                </Box>
            )}
        />
    );
};

export default QuotationSelector;
