import React, { useState } from "react";
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
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import AddIcon from "@mui/icons-material/Add";


import BankDetailsDialog from "./BankDetailsDialog"; // Update the import path as per your project structure
import AddBankDialog from "./AddBankDialog"; // Update the import path as per your project structure
import AssociateDetailForm from "../../../Associates/Form/AssociatesForm";
const HotelVendorDialog = ({ open, onClose }) => {
    const [vendorType, setVendorType] = useState("single");
    const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);
    const [vehicleVendorDialogOpen, setVehicleVendorDialogOpen] = useState(false);
    const [bankDetailsDialogOpen, setBankDetailsDialogOpen] = useState(false);
    const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);
    const [vendors, setVendors] = useState(["Vendor 1", "Vendor 2"]);
    const [vehicleVendors, setVehicleVendors] = useState(["Vehicle Vendor 1", "Vehicle Vendor 2", "Vehicle Vendor 3"]);
    const [vehicleVendorForm, setVehicleVendorForm] = useState({
        vehicleVendorName: "",
        showAllVehicle: false,
    });

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
            // Close hotel vendor dialog and open vehicle vendor dialog
            onClose();
            setVehicleVendorDialogOpen(true);
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
            setVehicleVendorForm(prev => ({
                ...prev,
                vehicleVendorName: newVendorName
            }));
        }
        setAddVendorDialogOpen(false);
    };

    const handleVehicleVendorChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVehicleVendorForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVehicleVendorConfirm = () => {
        console.log("Vehicle Vendor Form Data:", vehicleVendorForm);
        // Close vehicle vendor dialog and open bank details dialog
        setVehicleVendorDialogOpen(false);
        setBankDetailsDialogOpen(true);
    };

    const handleVehicleVendorCancel = () => {
        setVehicleVendorDialogOpen(false);
    };

    const handleBankDetailsConfirm = () => {
        console.log("Bank Details confirmed");
        console.log("Account Type:", accountType);
        console.log("Account Name:", accountName);
        setBankDetailsDialogOpen(false);
        // You can add additional logic here for what happens after bank details confirmation
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
            value={vehicleVendorForm.vehicleVendorName}
            onChange={handleVehicleVendorChange}
            fullWidth
            displayEmpty
        >
            <MenuItem value="">Vehicle Vendor</MenuItem>
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                {renderVendorSelect(
                                    "vendorName",
                                    formik.values.vendorName,
                                    formik.handleChange
                                )}
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
                            </Box>
                        </>
                    ) : (
                        <>
                            <Typography
                                variant="body1"
                                sx={{ color: "#f39c12", fontWeight: "bold", mb: 1 }}
                            >
                                Standard
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "#e74c3c", mb: 1, fontWeight: "bold" }}
                            >
                                Max Amount Limit ₹ 50,000
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Typography sx={{ fontWeight: "bold", color: "#34495e" }}>
                                    *Sikkim Resto Aritar (5N)
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="same"
                                            checked={formik.values.same}
                                            onChange={formik.handleChange}
                                        />
                                    }
                                    label="Same"
                                />
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                                {renderVendorSelect(
                                    "vendorName",
                                    formik.values.vendorName,
                                    formik.handleChange
                                )}
                                <TextField
                                    name="amount"
                                    label="Amount"
                                    value={formik.values.amount}
                                    onChange={formik.handleChange}
                                    type="number"
                                    sx={{ width: "40%" }}
                                />
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
                                sx={{ mt: 1 }}
                            />
                        </>
                    )}

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
                            disabled={!formik.isValid}
                            onClick={formik.handleSubmit}
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
                        // Determine which vendor list to update based on which dialog is open
                        if (vehicleVendorDialogOpen) {
                            handleAddVehicleVendor(newVendor.name || newVendor);
                        } else {
                            handleAddVendor(newVendor.name || newVendor);
                        }
                    }}
                />
            </Dialog>

            {/* Vehicle Vendor Dialog */}
            <Dialog open={vehicleVendorDialogOpen} onClose={() => setVehicleVendorDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", color: "#1976d2", textAlign: "center" }}>
                    Vehicle Vendor
                </DialogTitle>
                <DialogContent>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: "bold",
                            color: "#e74c3c",
                            mb: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                        }}
                    >
                        ***Vehicle Vendor**
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <Checkbox
                            name="showAllVehicle"
                            checked={vehicleVendorForm.showAllVehicle}
                            onChange={handleVehicleVendorChange}
                        />
                        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                            Show All
                        </Typography>
                    </Box>

                    {renderVehicleVendorSelect()}

                    <Divider sx={{ mb: 3, mt: 2 }} />

                    {/* Buttons */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            sx={{
                                background: "#90caf9",
                                color: "#fff",
                                "&:hover": {
                                    background: "#64b5f6",
                                }
                            }}
                            onClick={handleVehicleVendorConfirm}
                        >
                            Confirm
                        </Button>
                        <Button
                            variant="contained"
                            sx={{
                                background: "#e67e22",
                                color: "#fff",
                                "&:hover": {
                                    background: "#d35400",
                                }
                            }}
                            onClick={handleVehicleVendorCancel}
                        >
                            Cancel
                        </Button>
                    </Box>
                </DialogContent>
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