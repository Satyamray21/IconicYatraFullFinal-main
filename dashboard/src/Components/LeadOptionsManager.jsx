import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    CircularProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
    getLeadOptions,
    addLeadOption,
    deleteLeadOption,
} from "../features/leads/leadSlice"; // adjust import path

const LeadOptionsManager = ({ fieldName }) => {
    const dispatch = useDispatch();
    const { options, loading, error } = useSelector((state) => state.leads);

    const [newOption, setNewOption] = useState("");

    // Fetch options when component mounts
    useEffect(() => {
        dispatch(getLeadOptions());
    }, [dispatch]);

    const handleAdd = () => {
        if (!newOption.trim()) return;
        dispatch(addLeadOption({ fieldName, value: newOption.trim() }));
        setNewOption("");
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this option?")) {
            dispatch(deleteLeadOption(id)).then(() => {
                dispatch(getLeadOptions()); // refresh options
            });
        }
    };


    return (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, background: "#fafafa" }}>
            <Typography variant="h6" gutterBottom>
                Manage {fieldName} Options
            </Typography>

            <Box display="flex" gap={2} mb={2}>
                <TextField
                    fullWidth
                    label={`Add new ${fieldName}`}
                    variant="outlined"
                    size="small"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                    disabled={loading}
                >
                    Add
                </Button>
            </Box>

            {loading && <CircularProgress size={24} />}

            {error && (
                <Typography color="error" variant="body2">
                    {error}
                </Typography>
            )}

            <List>
                {Array.isArray(options)
                    ? options
                        .filter(opt => opt.fieldName === fieldName && opt._id && opt.value)
                        .map(opt => (
                            <ListItem
                                key={opt._id}
                                divider
                                secondaryAction={
                                    <IconButton edge="end" color="error" onClick={() => handleDelete(opt._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={opt.value} />
                            </ListItem>
                        ))
                    : null}
            </List>


        </Paper>
    );
};

export default LeadOptionsManager;