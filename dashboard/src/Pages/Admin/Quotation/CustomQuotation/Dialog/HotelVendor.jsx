import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
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
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";


import BankDetailsDialog from "./BankDetailsDialog"; // Update the import path as per your project structure
import AddBankDialog from "./AddBankDialog"; // Update the import path as per your project structure
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
    const [bankDetailsDialogOpen, setBankDetailsDialogOpen] = useState(false);
    const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [vehicleVendors, setVehicleVendors] = useState([]);
    const [vehicleVendorName, setVehicleVendorName] = useState("");
    const [vehicleAmount, setVehicleAmount] = useState("");

    // Vendor amounts tracking
    const [finalizedVendorsWithAmounts, setFinalizedVendorsWithAmounts] = useState([]);
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

    // Bank Details Dialog States
    const [accountType, setAccountType] = useState("company");
    const [accountName, setAccountName] = useState("");
    const [accountOptions, setAccountOptions] = useState([
        { value: "account1", label: "Account 1" },
        { value: "account2", label: "Account 2" },
        { value: "account3", label: "Account 3" },
    ]);

    // Add Bank Dialog States
    const [newBankDetails, setNewBankDetails] = useState({
        bankName: "",
        branchName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        openingBalance: "",
    });

    useEffect(() => {
        if (open) dispatch(fetchAllAssociates());
    }, [dispatch, open]);

    const normalizeAssociates = useMemo(() => {
        if (Array.isArray(associateList)) return associateList;
        if (Array.isArray(associateList?.data)) return associateList.data;
        if (Array.isArray(associateList?.data?.data)) return associateList.data.data;
        return [];
    }, [associateList]);

    useEffect(() => {
        if (!normalizeAssociates.length) return;

        const hotelVendorNames = normalizeAssociates
            .filter(
                (a) => a?.personalDetails?.associateType === "Hotel Vendor"
            )
            .map((a) => a?.personalDetails?.fullName)
            .filter(Boolean);

        const vehicleVendorNames = normalizeAssociates
            .filter(
                (a) => a?.personalDetails?.associateType === "Vehicle Vendor"
            )
            .map((a) => a?.personalDetails?.fullName)
            .filter(Boolean);

        setVendors((prev) => {
            const merged = [...hotelVendorNames, ...prev];
            return Array.from(new Set(merged));
        });

        setVehicleVendors((prev) => {
            const merged = [...vehicleVendorNames, ...prev];
            return Array.from(new Set(merged));
        });
    }, [normalizeAssociates]);

    const formik = useFormik({
        initialValues: {
            vendorType: "single",
            vendorName: "",
            amount: "",
            showAll: false,
            same: false,
        },
        validationSchema: Yup.object({
            vendorType: Yup.string().required("Required"),
            vendorName: Yup.string().when("vendorType", {
                is: "single",
                then: (schema) => schema.required("Vendor name is required"),
            }),
        }),
        onSubmit: (values) => {
            console.log("Hotel Vendor Form Data:", values);
            setBankDetailsDialogOpen(true);
        },
    });

    const handleVendorTypeChange = (e) => {
        const value = e.target.value;
        setVendorType(value);
        formik.setFieldValue("vendorType", value);
    };

    const handleAddVendor = (newVendorName) => {
        if (newVendorName && !vendors.includes(newVendorName)) {
            const updatedVendors = [...vendors, newVendorName];
            setVendors(updatedVendors);
            formik.setFieldValue("vendorName", newVendorName);
        }
        setAddVendorDialogOpen(false);
    };

    const handleAddVehicleVendor = (newVendorName) => {
        if (newVendorName && !vehicleVendors.includes(newVendorName)) {
            const updatedVendors = [...vehicleVendors, newVendorName];
            setVehicleVendors(updatedVendors);
            setVehicleVendorName(newVendorName);
        }
        setAddVendorDialogOpen(false);
    };

    const handleBankDetailsConfirm = () => {
        console.log("Bank Details confirmed");
        console.log("Account Type:", accountType);
        console.log("Account Name:", accountName);
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
            accountType,
            accountName,
            finalizedVendorsWithAmounts, // Pass vendor amounts
        });
        setBankDetailsDialogOpen(false);
        // You can add additional logic here for what happens after bank details confirmation
    };

    // Handle adding vendor with amount
    const handleAddVendorWithAmount = () => {
        if (formik.values.vendorName && formik.values.amount) {
            const newVendor = {
                id: Date.now(),
                vendorName: formik.values.vendorName,
                vendorType: "Hotel",
                amount: Number(formik.values.amount),
                remarks: "",
            };
            setFinalizedVendorsWithAmounts((prev) => {
                const otherRows = prev.filter((v) => v.vendorType !== "Hotel");
                if (vendorType === "single") {
                    return [...otherRows, newVendor];
                }
                return [...prev, newVendor];
            });
            formik.setFieldValue("vendorName", "");
            formik.setFieldValue("amount", "");
        }
    };

    const handleAddVehicleVendorWithAmount = () => {
        if (vehicleVendorName && vehicleAmount) {
            const newVendor = {
                id: Date.now(),
                vendorName: vehicleVendorName,
                vendorType: "Vehicle",
                amount: Number(vehicleAmount),
                remarks: "",
            };
            setFinalizedVendorsWithAmounts((prev) => {
                const otherRows = prev.filter((v) => v.vendorType !== "Vehicle");
                if (vendorType === "single") {
                    return [...otherRows, newVendor];
                }
                return [...prev, newVendor];
            });
            setVehicleVendorName("");
            setVehicleAmount("");
        }
    };

    // Handle editing vendor
    const handleEditVendor = (vendor) => {
        setEditingVendorId(vendor.id);
        setEditForm({
            vendorName: vendor.vendorName,
            amount: vendor.amount.toString(),
            remarks: vendor.remarks,
            vendorType: vendor.vendorType,
        });
    };

    // Handle saving edited vendor
    const handleSaveEditedVendor = () => {
        setFinalizedVendorsWithAmounts(
            finalizedVendorsWithAmounts.map((v) =>
                v.id === editingVendorId
                    ? {
                        ...v,
                        vendorName: editForm.vendorName,
                        amount: Number(editForm.amount),
                        remarks: editForm.remarks,
                    }
                    : v
            )
        );
        setEditingVendorId(null);
        setEditForm({ vendorName: "", amount: "", remarks: "", vendorType: "" });
    };

    // Handle deleting vendor
    const handleDeleteVendor = (vendorId) => {
        setFinalizedVendorsWithAmounts(
            finalizedVendorsWithAmounts.filter((v) => v.id !== vendorId)
        );
    };

    const handleCancelEdit = () => {
        setEditingVendorId(null);
        setEditForm({ vendorName: "", amount: "", remarks: "", vendorType: "" });
    };

    const handlePrimaryConfirm = () => {
        if (finalizedVendorsWithAmounts.length > 0) {
            setBankDetailsDialogOpen(true);
            return;
        }
        formik.handleSubmit();
    };

    const handleBankDetailsCancel = () => {
        setBankDetailsDialogOpen(false);
    };

    const handleAddBankOpen = () => {
        // Open the Add Bank dialog
        setAddBankDialogOpen(true);
    };

    const handleNewBankChange = (field, value) => {
        setNewBankDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddBank = () => {
        console.log("New Bank Details:", newBankDetails);

        // Create a new account option from the bank details
        const newAccountOption = {
            value: newBankDetails.accountNumber,
            label: `${newBankDetails.bankName} - ${newBankDetails.accountHolderName}`
        };

        // Add the new account to the options
        setAccountOptions(prev => [...prev, newAccountOption]);

        // Set the newly added account as selected
        setAccountName(newAccountOption.value);

        // Reset the form and close the dialog
        setNewBankDetails({
            bankName: "",
            branchName: "",
            accountHolderName: "",
            accountNumber: "",
            ifscCode: "",
            openingBalance: "",
        });

        setAddBankDialogOpen(false);
    };

    const handleAddBankCancel = () => {
        // Reset the form and close the dialog
        setNewBankDetails({
            bankName: "",
            branchName: "",
            accountHolderName: "",
            accountNumber: "",
            ifscCode: "",
            openingBalance: "",
        });
        setAddBankDialogOpen(false);
    };

    const renderVendorSelect = (name, value, onChange) => (
        <Select
            name={name}
            value={value}
            onChange={onChange}
            fullWidth
            displayEmpty
        >
            <MenuItem value="">Hotel Vendor Name</MenuItem>
            {associatesLoading && <MenuItem disabled>Loading vendors...</MenuItem>}
            {vendors.map((vendor) => (
                <MenuItem key={vendor} value={vendor}>
                    {vendor}
                </MenuItem>
            ))}
            <MenuItem onClick={() => setAddVendorDialogOpen(true)}>
                <ListItemIcon>
                    <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Add New Vendor</ListItemText>
            </MenuItem>
        </Select>
    );

    const renderVehicleVendorSelect = () => (
        <Select
            name="vehicleVendorName"
            value={vehicleVendorName}
            onChange={(e) => setVehicleVendorName(e.target.value)}
            fullWidth
            displayEmpty
        >
            <MenuItem value="">Vehicle Vendor</MenuItem>
            {associatesLoading && <MenuItem disabled>Loading vendors...</MenuItem>}
            {vehicleVendors.map((vendor) => (
                <MenuItem key={vendor} value={vendor}>
                    {vendor}
                </MenuItem>
            ))}
            <MenuItem onClick={() => setAddVendorDialogOpen(true)}>
                <ListItemIcon>
                    <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Add New Vendor</ListItemText>
            </MenuItem>
        </Select>
    );

    return (
        <>
            {/* Hotel Vendor Dialog */}
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", color: "#1976d2" }}>
                    Select Hotel Vendor
                </DialogTitle>
                <DialogContent>
                    {/* Vendor Type */}
                    <Box sx={{ mb: 2 }}>
                        <FormLabel sx={{ fontWeight: "bold", color: "#34495e" }}>
                            *Vendor Type
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
                                label="Single Vendor"
                            />
                            <FormControlLabel
                                value="multiple"
                                control={<Radio />}
                                label="Multiple Vendor"
                            />
                        </RadioGroup>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Conditional Rendering */}
                    {vendorType === "single" ? (
                        <>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 600, color: "#e74c3c", mb: 1 }}
                            >
                                *Hotel Vendor
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                {renderVendorSelect(
                                    "vendorName",
                                    formik.values.vendorName,
                                    formik.handleChange
                                )}
                                <TextField
                                    name="amount"
                                    label="Amount (₹)"
                                    value={formik.values.amount}
                                    onChange={formik.handleChange}
                                    type="number"
                                    sx={{ width: "200px" }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleAddVendorWithAmount}
                                    disabled={
                                        vendorType === "single" &&
                                        finalizedVendorsWithAmounts.some((v) => v.vendorType === "Hotel")
                                    }
                                    sx={{ background: "#4caf50" }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="showAll"
                                        checked={formik.values.showAll}
                                        onChange={formik.handleChange}
                                    />
                                }
                                label="Show All"
                            />

                            {/* Vendors with Amounts Table */}
                            {finalizedVendorsWithAmounts.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                        Finalized Vendors:
                                    </Typography>
                                    <TableContainer component={Paper}>
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
                                                                <TextField
                                                                    size="small"
                                                                    value={editForm.vendorName}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, vendorName: e.target.value })
                                                                    }
                                                                    fullWidth
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <TextField
                                                                    size="small"
                                                                    type="number"
                                                                    value={editForm.amount}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, amount: e.target.value })
                                                                    }
                                                                    sx={{ width: "100px" }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    size="small"
                                                                    value={editForm.remarks}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, remarks: e.target.value })
                                                                    }
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
                                                            <TableCell>{vendor.vendorType}</TableCell>
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
                                </Box>
                            )}
                        </>
                    ) : (
                        <>
                            <Typography
                                variant="body1"
                                sx={{ color: "#f39c12", fontWeight: "bold", mb: 1 }}
                            >
                                Multiple Hotel Vendors
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#e74c3c", mb: 2, fontWeight: "bold" }}
                            >
                                Add vendors with their respective amounts
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 2,
                                }}
                            >
                                {renderVendorSelect(
                                    "vendorName",
                                    formik.values.vendorName,
                                    formik.handleChange
                                )}
                                <TextField
                                    name="amount"
                                    label="Amount (₹)"
                                    value={formik.values.amount}
                                    onChange={formik.handleChange}
                                    type="number"
                                    sx={{ width: "150px" }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleAddVendorWithAmount}
                                    disabled={
                                        vendorType === "single" &&
                                        finalizedVendorsWithAmounts.some((v) => v.vendorType === "Hotel")
                                    }
                                    sx={{ background: "#4caf50", height: "56px" }}
                                >
                                    <AddIcon /> Add
                                </Button>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="showAll"
                                        checked={formik.values.showAll}
                                        onChange={formik.handleChange}
                                    />
                                }
                                label="Show All"
                                sx={{ mb: 2 }}
                            />

                            {/* Vendors with Amounts Table */}
                            {finalizedVendorsWithAmounts.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                        Added Vendors:
                                    </Typography>
                                    <TableContainer component={Paper}>
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
                                                                <TextField
                                                                    size="small"
                                                                    value={editForm.vendorName}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, vendorName: e.target.value })
                                                                    }
                                                                    fullWidth
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <TextField
                                                                    size="small"
                                                                    type="number"
                                                                    value={editForm.amount}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, amount: e.target.value })
                                                                    }
                                                                    sx={{ width: "100px" }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    size="small"
                                                                    value={editForm.remarks}
                                                                    onChange={(e) =>
                                                                        setEditForm({ ...editForm, remarks: e.target.value })
                                                                    }
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
                                                            <TableCell>{vendor.vendorType}</TableCell>
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
                                    {/* Total Amount */}
                                    <Box sx={{ mt: 2, p: 1, backgroundColor: "#fff3e0", borderRadius: 1 }}>
                                        <Typography sx={{ fontWeight: "bold", color: "#e65100" }}>
                                            Total Amount: ₹ {finalizedVendorsWithAmounts.reduce((sum, v) => sum + Number(v.amount), 0).toLocaleString("en-IN")}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: "#1976d2", mb: 1 }}
                    >
                        *Vehicle Vendor
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        {renderVehicleVendorSelect()}
                        <TextField
                            name="vehicleAmount"
                            label="Vehicle Amount (₹)"
                            value={vehicleAmount}
                            onChange={(e) => setVehicleAmount(e.target.value)}
                            type="number"
                            sx={{ width: "200px" }}
                        />
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleAddVehicleVendorWithAmount}
                            disabled={
                                vendorType === "single" &&
                                finalizedVendorsWithAmounts.some((v) => v.vendorType === "Vehicle")
                            }
                            sx={{ background: "#4caf50" }}
                        >
                            Add
                        </Button>
                    </Box>

                    {/* Buttons */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 2,
                            mt: 3,
                        }}
                    >
                        <Button
                            variant="contained"
                            sx={{ background: "#90caf9", color: "#fff" }}
                            disabled={
                                finalizedVendorsWithAmounts.length === 0 &&
                                !formik.isValid
                            }
                            onClick={handlePrimaryConfirm}
                        >
                            Confirm
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ background: "#e67e22", color: "#fff" }}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Add New Vendor Form Dialog */}
            <Dialog
                open={addVendorDialogOpen}
                onClose={() => setAddVendorDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <AssociateDetailForm
                    onClose={() => setAddVendorDialogOpen(false)}
                    onSuccess={(newVendor) => {
                        handleAddVendor(newVendor.name || newVendor);
                        handleAddVehicleVendor(newVendor.name || newVendor);
                    }}
                />
            </Dialog>

            {/* Bank Details Dialog */}
            <BankDetailsDialog
                open={bankDetailsDialogOpen}
                onClose={handleBankDetailsCancel}
                accountType={accountType}
                setAccountType={setAccountType}
                accountName={accountName}
                setAccountName={setAccountName}
                accountOptions={accountOptions}
                onAddBankOpen={handleAddBankOpen}
                onConfirm={handleBankDetailsConfirm}
            />

            {/* Add Bank Dialog */}
            <AddBankDialog
                open={addBankDialogOpen}
                onClose={handleAddBankCancel}
                newBankDetails={newBankDetails}
                onNewBankChange={handleNewBankChange}
                onAddBank={handleAddBank}
            />
        </>
    );
};

export default HotelVendorDialog;