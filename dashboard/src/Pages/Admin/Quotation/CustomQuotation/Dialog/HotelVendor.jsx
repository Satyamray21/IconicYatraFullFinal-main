import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
    Typography,
    Divider,
    Box,
    TextField,
    Button,
    Checkbox,
    FormLabel,
    Select,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    FormControl,
    InputLabel
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import AssociateDetailForm from "../../../Associates/Form/AssociatesForm";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAssociates } from "../../../../../features/associate/associateSlice";

const HotelVendorDialog = ({
    open,
    onClose,
    onConfirm,
    initialVendorDetails = {},
    initialFinalizedVendorsWithAmounts = [],
}) => {
    const dispatch = useDispatch();
    const { list: associateList = [], loading: associatesLoading } = useSelector(
        (state) => state.associate
    );
    const [vendorType, setVendorType] = useState("single");
    const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);
    const [finalizedVendorsWithAmounts, setFinalizedVendorsWithAmounts] = useState([]);
    
    // New unified vendor input state
    const [newVendor, setNewVendor] = useState({
        vendorName: "",
        vendorType: "Hotel",
        amount: "",
        remarks: ""
    });

    const [editingVendorId, setEditingVendorId] = useState(null);
    const [editForm, setEditForm] = useState({ vendorName: "", amount: "", remarks: "", vendorType: "" });

    useEffect(() => {
        if (!open) return;
        setVendorType(initialVendorDetails?.vendorType || "single");
        setFinalizedVendorsWithAmounts(
            Array.isArray(initialFinalizedVendorsWithAmounts)
                ? initialFinalizedVendorsWithAmounts.map((v, i) => ({
                    id: Date.now() + i,
                    vendorName: v?.vendorName || "",
                    vendorType: v?.vendorType || "Hotel",
                    amount: Number(v?.amount) || 0,
                    remarks: v?.remarks || "",
                }))
                : []
        );
    }, [open, initialVendorDetails, initialFinalizedVendorsWithAmounts]);

    useEffect(() => {
        if (open) dispatch(fetchAllAssociates());
    }, [dispatch, open]);

    const normalizeAssociates = useMemo(() => {
        if (Array.isArray(associateList)) return associateList;
        if (Array.isArray(associateList?.data)) return associateList.data;
        if (Array.isArray(associateList?.data?.data)) return associateList.data.data;
        return [];
    }, [associateList]);

    const getFilteredVendors = (selectedType) => {
        return normalizeAssociates.filter((a) => {
            const type = a?.personalDetails?.associateType;
            if (!type) return false;
            if (selectedType === "Vehicle") return type === "Vehicle Vendor";
            if (selectedType === "Hotel") return type === "Hotel Vendor";
            return type.includes("Vendor");
        });
    };

    const handleVendorTypeChange = (e) => {
        setVendorType(e.target.value);
    };

    const handlePrimaryConfirm = () => {
        onConfirm?.({
            vendorType,
            hotelVendorName: finalizedVendorsWithAmounts
                .filter((v) => String(v.vendorType).toLowerCase() === "hotel")
                .map((v) => v.vendorName)
                .join(", "),
            vehicleVendorName: finalizedVendorsWithAmounts
                .filter((v) => String(v.vendorType).toLowerCase() === "vehicle")
                .map((v) => v.vendorName)
                .join(", "),
            finalizedVendorsWithAmounts,
        });
    };

    const handleAddVendorWithAmount = () => {
        if (newVendor.vendorName && newVendor.amount) {
            const vendor = {
                id: Date.now(),
                vendorName: newVendor.vendorName,
                vendorType: newVendor.vendorType,
                amount: Number(newVendor.amount),
                remarks: newVendor.remarks,
            };
            setFinalizedVendorsWithAmounts((prev) => {
                if (vendorType === "single") {
                    // For single, allow only one of each type
                    const otherRows = prev.filter((v) => v.vendorType !== vendor.vendorType);
                    return [...otherRows, vendor];
                }
                return [...prev, vendor];
            });
            setNewVendor({ ...newVendor, vendorName: "", amount: "", remarks: "" });
        }
    };

    const handleEditVendor = (vendor) => {
        setEditingVendorId(vendor.id);
        setEditForm({
            vendorName: vendor.vendorName,
            amount: vendor.amount.toString(),
            remarks: vendor.remarks,
            vendorType: vendor.vendorType,
        });
    };

    const handleSaveEditedVendor = () => {
        setFinalizedVendorsWithAmounts(
            finalizedVendorsWithAmounts.map((v) =>
                v.id === editingVendorId
                    ? {
                        ...v,
                        vendorName: editForm.vendorName,
                        vendorType: editForm.vendorType,
                        amount: Number(editForm.amount),
                        remarks: editForm.remarks,
                    }
                    : v
            )
        );
        setEditingVendorId(null);
        setEditForm({ vendorName: "", amount: "", remarks: "", vendorType: "" });
    };

    const handleDeleteVendor = (vendorId) => {
        setFinalizedVendorsWithAmounts(
            finalizedVendorsWithAmounts.filter((v) => v.id !== vendorId)
        );
    };

    const handleCancelEdit = () => {
        setEditingVendorId(null);
        setEditForm({ vendorName: "", amount: "", remarks: "", vendorType: "" });
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", color: "#1976d2" }}>
                    Manage Vendors
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 3 }}>
                        <FormLabel sx={{ fontWeight: "bold", color: "#34495e" }}>
                            *Assignment Mode
                        </FormLabel>
                        <RadioGroup
                            row
                            name="vendorType"
                            value={vendorType}
                            onChange={handleVendorTypeChange}
                        >
                            <FormControlLabel
                                value="single"
                                control={<Radio />}
                                label="Single Vendor (Per Type)"
                            />
                            <FormControlLabel
                                value="multiple"
                                control={<Radio />}
                                label="Multiple Vendors"
                            />
                        </RadioGroup>
                    </Box>

                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#1976d2" }}>
                            Add New Vendor
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr auto", gap: 2, alignItems: "center" }}>
                            <FormControl size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={newVendor.vendorType}
                                    label="Type"
                                    onChange={(e) => setNewVendor({ ...newVendor, vendorType: e.target.value, vendorName: "" })}
                                >
                                    <MenuItem value="Hotel">Hotel</MenuItem>
                                    <MenuItem value="Vehicle">Vehicle</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small">
                                <InputLabel>Vendor Name</InputLabel>
                                <Select
                                    value={newVendor.vendorName}
                                    label="Vendor Name"
                                    onChange={(e) => {
                                        if (e.target.value === "ADD_NEW") {
                                            setAddVendorDialogOpen(true);
                                        } else {
                                            setNewVendor({ ...newVendor, vendorName: e.target.value });
                                        }
                                    }}
                                >
                                    {getFilteredVendors(newVendor.vendorType).map((v) => (
                                        <MenuItem key={v._id || v.id} value={v.personalDetails?.fullName}>
                                            {v.personalDetails?.fullName} ({v.personalDetails?.associateType})
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="ADD_NEW">
                                        <ListItemIcon>
                                            <AddIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Add New Vendor</ListItemText>
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                type="number"
                                label="Amount (₹)"
                                value={newVendor.amount}
                                onChange={(e) => setNewVendor({ ...newVendor, amount: e.target.value })}
                            />

                            <TextField
                                size="small"
                                label="Remarks"
                                value={newVendor.remarks}
                                onChange={(e) => setNewVendor({ ...newVendor, remarks: e.target.value })}
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddVendorWithAmount}
                                disabled={!newVendor.vendorName || !newVendor.amount}
                                startIcon={<AddIcon />}
                                sx={{ height: '40px' }}
                            >
                                Add
                            </Button>
                        </Box>
                    </Paper>

                    {finalizedVendorsWithAmounts.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                Added Vendors:
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                                            <TableCell sx={{ fontWeight: "bold" }}>Vendor Name</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount (₹)</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {finalizedVendorsWithAmounts.map((vendor) =>
                                            editingVendorId === vendor.id ? (
                                                <TableRow key={vendor.id}>
                                                    <TableCell>
                                                        <FormControl size="small" fullWidth>
                                                            <Select
                                                                value={editForm.vendorName || ""}
                                                                onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
                                                                displayEmpty
                                                            >
                                                                <MenuItem value="" disabled>Select Vendor</MenuItem>
                                                                {getFilteredVendors(editForm.vendorType || vendor.vendorType).map((v) => (
                                                                    <MenuItem key={v._id || v.id} value={v.personalDetails?.fullName}>
                                                                        {v.personalDetails?.fullName}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormControl size="small" fullWidth>
                                                            <Select
                                                                value={editForm.vendorType || ""}
                                                                onChange={(e) => setEditForm({ ...editForm, vendorType: e.target.value, vendorName: "" })}
                                                            >
                                                                <MenuItem value="Hotel">Hotel</MenuItem>
                                                                <MenuItem value="Vehicle">Vehicle</MenuItem>
                                                                <MenuItem value="Other">Other</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={editForm.amount}
                                                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                            sx={{ width: "100px" }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            size="small"
                                                            value={editForm.remarks}
                                                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                                            fullWidth
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            onClick={handleSaveEditedVendor}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="error"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                <TableRow key={vendor.id}>
                                                    <TableCell>{vendor.vendorName}</TableCell>
                                                    <TableCell>
                                                        <span style={{ 
                                                            padding: '2px 8px', 
                                                            borderRadius: '12px', 
                                                            fontSize: '0.75rem',
                                                            backgroundColor: vendor.vendorType === 'Hotel' ? '#e3f2fd' : (vendor.vendorType === 'Vehicle' ? '#e8f5e9' : '#f5f5f5'),
                                                            color: vendor.vendorType === 'Hotel' ? '#1565c0' : (vendor.vendorType === 'Vehicle' ? '#2e7d32' : '#616161'),
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {vendor.vendorType}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ₹ {Number(vendor.amount).toLocaleString("en-IN")}
                                                    </TableCell>
                                                    <TableCell>{vendor.remarks}</TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditVendor(vendor)}
                                                            color="primary"
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteVendor(vendor.id)}
                                                            color="error"
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ mt: 2, p: 1.5, backgroundColor: "#fff3e0", borderRadius: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <Typography sx={{ fontWeight: "bold", color: "#e65100" }}>
                                    Total Amount: ₹ {finalizedVendorsWithAmounts.reduce((sum, v) => sum + Number(v.amount), 0).toLocaleString("en-IN")}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} variant="contained" sx={{ background: "#e67e22", color: "#fff" }}>
                        Cancel
                    </Button>
                    <Button onClick={handlePrimaryConfirm} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={addVendorDialogOpen}
                onClose={() => setAddVendorDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <AssociateDetailForm
                    onClose={() => setAddVendorDialogOpen(false)}
                    onSuccess={(newV) => {
                        // After success, it will refresh automatically due to Redux fetch
                        setAddVendorDialogOpen(false);
                    }}
                />
            </Dialog>
        </>
    );
};

export default HotelVendorDialog;