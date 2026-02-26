

import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Button,
    Grid,
    CircularProgress,
    Tooltip,
    Snackbar,
    Alert,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
    getAllBankDetails,
    deleteBankDetails,
    addBankDetails,
    updateBankDetails,
} from "../../../../../features/bank/bankSlice";
import AddBankDetails from "../Form/BankForm";
import EditBankDetails from "../Form/EditForm"

const BankDetailsPage = () => {
    const dispatch = useDispatch();
    const { list: bankDetails, status, error } = useSelector((state) => state.bank);

    // Dialog states
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    // Add form state
    const [newBankDetails, setNewBankDetails] = useState({
        bankName: "",
        branchName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
    });

    // Edit form state
    const [editBank, setEditBank] = useState(null);

    useEffect(() => {
        dispatch(getAllBankDetails());
    }, [dispatch]);

    // Show notification
    const showNotification = (message, severity = "success") => {
        setNotification({
            open: true,
            message,
            severity
        });
    };

    // Add Bank Handlers
    const handleNewBankChange = (field, value) => {
        setNewBankDetails({ ...newBankDetails, [field]: value });
    };

    const handleAddBank = () => {
        dispatch(addBankDetails(newBankDetails))
            .unwrap()
            .then(() => {
                setOpenAdd(false);
                setNewBankDetails({
                    bankName: "",
                    branchName: "",
                    accountHolderName: "",
                    accountNumber: "",
                    ifscCode: "",
                });
                dispatch(getAllBankDetails()); // Refresh the list
                showNotification("Bank added successfully!");
            })
            .catch((error) => {
                showNotification(error || "Failed to add bank", "error");
            });
    };

    // Edit Handlers
    const handleEdit = (bank) => {
        setEditBank({ ...bank });
        setOpenEdit(true);
    };

    const handleEditBankChange = (field, value) => {
        setEditBank({ ...editBank, [field]: value });
    };

    const handleUpdateBank = () => {
        if (!editBank || !editBank._id) return;

        dispatch(updateBankDetails({
            id: editBank._id,
            data: {
                bankName: editBank.bankName,
                branchName: editBank.branchName,
                accountHolderName: editBank.accountHolderName,
                accountNumber: editBank.accountNumber,
                ifscCode: editBank.ifscCode,
            }
        }))
            .unwrap()
            .then(() => {
                setOpenEdit(false);
                setEditBank(null);
                dispatch(getAllBankDetails()); // Refresh the list
                showNotification("Bank updated successfully!");
            })
            .catch((error) => {
                showNotification(error || "Failed to update bank", "error");
            });
    };

    // Delete
    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this bank?")) {
            dispatch(deleteBankDetails(id))
                .unwrap()
                .then(() => {
                    // No need to fetch again as deleteBankDetails already updates the state
                    showNotification("Bank deleted successfully!");
                })
                .catch((error) => {
                    showNotification(error || "Failed to delete bank", "error");
                });
        }
    };

    // Close notification
    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    if (status === "loading" && bankDetails.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={4}>
            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* TOP BAR */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={600}>
                    Bank Details:
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAdd(true)}
                    sx={{ borderRadius: "10px" }}
                >
                    Add Bank
                </Button>
            </Box>

            {/* GRID LIST */}
            <Grid container spacing={3}>
                {bankDetails?.length === 0 ? (
                    <Grid size={{xs:12}}>
                        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                            <Typography variant="h6" color="text.secondary">
                                No bank details found. Add your first bank!
                            </Typography>
                        </Box>
                    </Grid>
                ) : (
                    bankDetails?.map((bank) => (
                        <Grid size={{xs:12,md:6, lg:4}} key={bank._id}>
                            <Card
                                sx={{
                                    borderRadius: "16px",
                                    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                    "&:hover": { boxShadow: "0px 6px 14px rgba(0,0,0,0.15)" },
                                }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            backgroundColor: "#005eb8",
                                            color: "white",
                                            display: "inline-block",
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: "8px",
                                            fontWeight: 500,
                                            mb: 1.5,
                                        }}
                                    >
                                        {bank.bankName}
                                    </Box>

                                    <Typography>
                                        <strong>Account Holder Name:</strong> {bank.accountHolderName}
                                    </Typography>

                                    <Typography>
                                        <strong>Account Number:</strong> {bank.accountNumber}
                                    </Typography>

                                    <Typography>
                                        <strong>IFSC Code:</strong> {bank.ifscCode}
                                    </Typography>

                                    <Typography>
                                        <strong>Branch Name:</strong> {bank.branchName}
                                    </Typography>

                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Tooltip title="Edit">
                                            <IconButton onClick={() => handleEdit(bank)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Delete">
                                            <IconButton onClick={() => handleDelete(bank._id)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* ADD DIALOG */}
            <AddBankDetails
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                newBankDetails={newBankDetails}
                onNewBankChange={handleNewBankChange}
                onAddBank={handleAddBank}
            />

            {/* EDIT DIALOG */}
            {editBank && (
                <EditBankDetails
                    open={openEdit}
                    onClose={() => {
                        setOpenEdit(false);
                        setEditBank(null);
                    }}
                    bankDetails={editBank}
                    onBankChange={handleEditBankChange}
                    onUpdateBank={handleUpdateBank}
                />
            )}
        </Box>
    );
};

export default BankDetailsPage;