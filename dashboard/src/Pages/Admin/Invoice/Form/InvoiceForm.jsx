import React, { useEffect, useState, useCallback } from "react";
import {
    Box,
    Grid,
    TextField,
    MenuItem,
    Button,
    Typography,
    Checkbox,
    FormControlLabel,
    RadioGroup,
    Radio,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
} from "@mui/material";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import {
    createInvoice,
    recalculateInvoiceTotals,
    setSelectedInvoiceField,
} from "../../../../features/invoice/invoiceSlice";
import {
    fetchCountries,
    fetchStatesByCountry,
} from "../../../../features/location/locationSlice";
import AddNewBank from "../Dialog/AddNewBank";
import axios from "../../../../utils/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const taxOptions = ["0", "5", "12", "18", "28"];
const paymentModes = ["Cash", "Credit Card", "Bank Transfer", "Cheque"];

const InvoiceForm = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [paymentModeOptions, setPaymentModeOptions] = useState(paymentModes);
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const [autoInvoiceNo, setAutoInvoiceNo] = useState("ICYR_0001");
    const { loading } = useSelector((state) => state.invoice);
    const { countries, states } = useSelector((state) => state.location);

    const [companies, setCompanies] = useState([]);

    // --- Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data } = await axios.get("/company");
                setCompanies(data?.data || data);
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []);

    // --- Fetch countries & states
    useEffect(() => {
        dispatch(fetchCountries());
        dispatch(fetchStatesByCountry("India"));
    }, [dispatch]);

    const handleAddNewPaymentMode = (newMode) => {
        if (newMode && !paymentModeOptions.includes(newMode)) {
            setPaymentModeOptions((prev) => [...prev, newMode]);
        }
        setOpenDialog(false);
    };

    const formik = useFormik({
        initialValues: {
            companyId: "",
            accountType: "",
            mobile: "",
            billingName: "",
            billingAddress: "",
            gstin: "",
            invoiceNo: autoInvoiceNo,
            invoiceDate: "",
            dueDate: "",
            stateOfSupply: "",
            taxType: "withTax",
            isInternational: false,
            items: [
                {
                    particulars: "",
                    price: "",
                    discountPercent: "",
                    discount: "",
                    taxPercent: "5", // default fixed 5% for withTax
                    taxAmount: "",
                    amount: "",
                },
            ],
            decription: "",
            noOfPax: "",
            startDate: "",
            returnDate: "",
            cabType: "",
            tourType: "",
            paymentMode: "",
            referenceNo: "",
            note: "",
            invoiceValuePurchase: "",
            totalAmount: "",
            receivedAmount: "",
            balanceAmount: "",
            startingPoint: "",
            dropPoint: "",
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            companyId: Yup.string().required("Please select a company"),
            accountType: Yup.string().required("Required"),
            mobile: Yup.string()
                .matches(/^[0-9]{10}$/, "Enter valid mobile number")
                .required("Required"),
            billingName: Yup.string().required("Required"),
            items: Yup.array().of(
                Yup.object().shape({
                    particulars: Yup.string().required("Required"),
                    price: Yup.number().typeError("Must be a number").required("Required"),
                })
            ),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const payload = {
                    ...values,
                    withTax: values.taxType === "withTax", // true if withTax, false if withoutTax
                };
                await dispatch(createInvoice(payload)).unwrap();
                toast.success("Invoice created successfully!");
                resetForm();

                // navigate to invoice listing page (adjust path if needed)
                setTimeout(() => navigate("/invoice"), 800);
            } catch (err) {
                toast.error(err?.message || "Error creating invoice");
            }
        },
    });

    const { values, handleChange, handleSubmit, setFieldValue } = formik;

    // === Compute Totals (withTax / withoutTax logic) ===
    const computeTotals = useCallback((itemsArr, received, taxType) => {
        let total = 0;
        let invoiceValuePurchase = 0;

        const recalculated = itemsArr.map((it) => {
            const price = parseFloat(it.price) || 0;
            const discountPercent = parseFloat(it.discountPercent) || 0;
            const taxPercent = taxType === "withTax" ? 5 : parseFloat(it.taxPercent) || 0;

            const discount = (price * discountPercent) / 100;
            const discountedPrice = price - discount;

            let baseAmount = 0;
            let taxAmount = 0;
            let amount = 0;

            if (taxType === "withTax") {
                baseAmount = discountedPrice / (1 + 5 / 100);
                taxAmount = discountedPrice - baseAmount;
                amount = discountedPrice;
            } else {
                baseAmount = discountedPrice;
                taxAmount = (baseAmount * taxPercent) / 100;
                amount = baseAmount + taxAmount;
            }

            total += amount;
            invoiceValuePurchase += baseAmount;

            return {
                ...it,
                discount: Number(discount.toFixed(2)),
                taxPercent,
                taxAmount: Number(taxAmount.toFixed(2)),
                amount: Number(amount.toFixed(2)),
            };
        });

        const totalFixed = Number(total.toFixed(2));
        const invoiceValuePurchaseFixed = Number(invoiceValuePurchase.toFixed(2));

        return {
            items: recalculated,
            totalAmount: totalFixed,
            invoiceValuePurchase: invoiceValuePurchaseFixed,
            balanceAmount: Number((totalFixed - (parseFloat(received) || 0)).toFixed(2)),
        };
    }, []);

    // === Update Items & Totals ===
    const updateItemsAndTotals = useCallback(
        (updatedItems, receivedAmountVal = values.receivedAmount) => {
            const {
                items: recalcItems,
                totalAmount,
                balanceAmount,
                invoiceValuePurchase,
            } = computeTotals(updatedItems, receivedAmountVal, values.taxType);

            setFieldValue("items", recalcItems, false);
            setFieldValue("totalAmount", totalAmount, false);
            setFieldValue("balanceAmount", balanceAmount, false);
            setFieldValue("invoiceValuePurchase", invoiceValuePurchase, false);

            dispatch(setSelectedInvoiceField({ field: "items", value: recalcItems }));
            dispatch(setSelectedInvoiceField({ field: "totalAmount", value: totalAmount }));
            dispatch(
                setSelectedInvoiceField({
                    field: "invoiceValuePurchase",
                    value: invoiceValuePurchase,
                })
            );
            dispatch(setSelectedInvoiceField({ field: "balanceAmount", value: balanceAmount }));

            dispatch(recalculateInvoiceTotals());
        },
        [computeTotals, dispatch, setFieldValue, values.receivedAmount, values.taxType]
    );

    // Recalculate when taxType changes
    useEffect(() => {
        updateItemsAndTotals(values.items || [], values.receivedAmount);
    }, [values.taxType]);

    // Update on receivedAmount change
    useEffect(() => {
        updateItemsAndTotals(values.items || [], values.receivedAmount);
    }, [values.receivedAmount]);

    const handleItemChange = (e, index) => {
        const { name, value } = e.target;
        const field = name.split(".").pop();

        // Update the current item temporarily
        const updatedItems = values.items.map((it, idx) => {
            if (idx !== index) return it;

            let updatedItem = { ...it, [field]: value };

            const price = parseFloat(updatedItem.price) || 0;
            let discountPercent = parseFloat(updatedItem.discountPercent) || 0;
            let discount = parseFloat(updatedItem.discount) || 0;

            // === Interdependent discount logic ===
            if (field === "discountPercent" && price > 0) {
                // If percentage changed → recalc discount amount
                discount = (price * discountPercent) / 100;
                updatedItem.discount = Number(discount.toFixed(2));
            } else if (field === "discount" && price > 0) {
                // If amount changed → recalc discount percentage
                discountPercent = (discount / price) * 100;
                updatedItem.discountPercent = Number(discountPercent.toFixed(2));
            }

            return updatedItem;
        });

        updateItemsAndTotals(updatedItems, values.receivedAmount);
    };


    // Handle international toggle
    useEffect(() => {
        if (values.isInternational) {
            dispatch(fetchCountries());
        } else {
            dispatch(fetchStatesByCountry("India"));
        }
    }, [values.isInternational, dispatch]);
    useEffect(() => {
        const fetchNextInvoiceNo = async () => {
            try {
                const { data } = await axios.get("/invoice/next-number");
                if (data?.nextNumber) {
                    setAutoInvoiceNo(data.nextNumber);
                    formik.setFieldValue("invoiceNo", data.nextNumber);
                }
            } catch (error) {
                console.error("Error generating invoice number:", error);
            }
        };
        fetchNextInvoiceNo();
    }, [])
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Invoice
            </Typography>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    {/* Company */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            label="Company"
                            name="companyId"
                            value={values.companyId}
                            onChange={handleChange}
                        >
                            {companies.map((company) => (
                                <MenuItem key={company._id} value={company._id}>
                                    {company.companyName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Account Type */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            label="Account Type"
                            name="accountType"
                            value={values.accountType}
                            onChange={handleChange}
                        >
                            {["Agent", "Supplier", "Client"].map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Mobile */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            label="Mobile"
                            name="mobile"
                            value={values.mobile}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Invoice No */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            label="Invoice No"
                            name="invoiceNo"
                            value={values.invoiceNo}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Invoice Date */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Invoice Date"
                            name="invoiceDate"
                            InputLabelProps={{ shrink: true }}
                            value={values.invoiceDate}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            name="startDate"
                            InputLabelProps={{ shrink: true }}
                            value={values.startDate}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Return Date"
                            name="returnDate"
                            InputLabelProps={{ shrink: true }}
                            value={values.returnDate}
                            onChange={handleChange}
                        />
                    </Grid>
                    {/* Billing Name */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Billing Name"
                            name="billingName"
                            value={values.billingName}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Billing Address */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Billing Address"
                            name="billingAddress"
                            value={values.billingAddress}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* GSTIN & Due Date */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="GSTIN"
                            name="gstin"
                            value={values.gstin}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={values.description}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Tour Type"
                            name="tourType"
                            value={values.tourType}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Start Point"
                            name="startingPoint"
                            value={values.startingPoint}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Drop Point"
                            name="dropPoint"
                            value={values.dropPoint}
                            onChange={handleChange}
                        />
                    </Grid>


                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="No of Pax"
                            name="noOfPax"
                            value={values.noOfPax}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Cab Type"
                            name="cabType"
                            value={values.cabType}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Due Date"
                            name="dueDate"
                            InputLabelProps={{ shrink: true }}
                            value={values.dueDate}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* State / Country */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            select
                            fullWidth
                            label={
                                values.isInternational ? "Country of Supply" : "State of Supply"
                            }
                            name="stateOfSupply"
                            value={values.stateOfSupply}
                            onChange={handleChange}
                        >
                            {(values.isInternational ? countries : states).map((item, i) => (
                                <MenuItem key={i} value={item.name || item}>
                                    {item.name || item}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* International checkbox */}
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="isInternational"
                                    checked={values.isInternational}
                                    onChange={handleChange}
                                />
                            }
                            label="International"
                        />
                    </Grid>
                </Grid>

                {/* Tax Type */}
                <RadioGroup
                    row
                    name="taxType"
                    value={values.taxType}
                    onChange={handleChange}
                    sx={{ mt: 2 }}
                >
                    <FormControlLabel value="withTax" control={<Radio />} label="With Tax (5%)" />
                    <FormControlLabel value="withoutTax" control={<Radio />} label="Without Tax" />
                </RadioGroup>

                {/* Items Table */}
                <FormikProvider value={formik}>
                    <FieldArray
                        name="items"
                        render={(arrayHelpers) => (
                            <TableContainer component={Paper} sx={{ mt: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Particulars</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>Discount %</TableCell>
                                            <TableCell>Discount</TableCell>
                                            <TableCell>Tax %</TableCell>
                                            <TableCell>Tax Amount</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {values.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                {[
                                                    "particulars",
                                                    "price",
                                                    "discountPercent",
                                                    "discount",
                                                    "taxPercent",
                                                    "taxAmount",
                                                    "amount",
                                                ].map((field) => (
                                                    <TableCell key={field}>
                                                        {field === "taxPercent" ? (
                                                            values.taxType === "withTax" ? (
                                                                <TextField
                                                                    fullWidth
                                                                    value="5"
                                                                    disabled
                                                                />
                                                            ) : (
                                                                <TextField
                                                                    select
                                                                    name={`items[${index}].${field}`}
                                                                    value={item[field]}
                                                                    onChange={(e) => handleItemChange(e, index)}
                                                                    fullWidth
                                                                >
                                                                    {taxOptions.map((tax) => (
                                                                        <MenuItem key={tax} value={tax}>
                                                                            {tax}%
                                                                        </MenuItem>
                                                                    ))}
                                                                </TextField>
                                                            )
                                                        ) : (
                                                            <TextField
                                                                name={`items[${index}].${field}`}
                                                                value={item[field]}
                                                                onChange={(e) => handleItemChange(e, index)}
                                                                fullWidth
                                                            />
                                                        )}
                                                    </TableCell>
                                                ))}
                                                <TableCell align="center">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => {
                                                            arrayHelpers.remove(index);
                                                            const newItems = values.items.filter((_, i) => i !== index);
                                                            updateItemsAndTotals(newItems, values.receivedAmount);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Box p={2}>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            arrayHelpers.push({
                                                particulars: "",
                                                price: "",
                                                discountPercent: "",
                                                discount: "",
                                                taxPercent: values.taxType === "withTax" ? "5" : "",
                                                taxAmount: "",
                                                amount: "",
                                            });
                                        }}
                                    >
                                        Add New
                                    </Button>
                                </Box>
                            </TableContainer>
                        )}
                    />
                </FormikProvider>

                {/* Payment & Totals */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            select
                            fullWidth
                            label="Payment Mode"
                            name="paymentMode"
                            value={values.paymentMode}
                            onChange={handleChange}
                        >
                            {paymentModeOptions.map((mode) => (
                                <MenuItem key={mode} value={mode}>
                                    {mode}
                                </MenuItem>
                            ))}
                            <MenuItem onClick={() => setOpenDialog(true)}>+ Add New</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Reference/Cash/Cheque No."
                            name="referenceNo"
                            value={values.referenceNo}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="Additional Note"
                            name="note"
                            value={values.note}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>

                {/* Totals */}
                <Box sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        {[
                            "invoiceValuePurchase",
                            "totalAmount",
                            "receivedAmount",
                            "balanceAmount",
                        ].map((field) => (
                            <Grid item xs={12} sm={3} key={field}>
                                <TextField
                                    fullWidth
                                    label={field
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (s) => s.toUpperCase())}
                                    name={field}
                                    value={values[field]}
                                    onChange={(e) => {
                                        handleChange(e);
                                        if (field === "receivedAmount") {
                                            updateItemsAndTotals(values.items || [], e.target.value);
                                        }
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Submit */}
                <Box sx={{ mt: 4, textAlign: "center" }}>
                    <Button type="submit" variant="contained" color="primary" disabled={loading}>
                        {loading ? "Saving..." : "Submit"}
                    </Button>
                </Box>
            </form>

            <AddNewBank
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onSave={handleAddNewPaymentMode}
            />
        </Box>
    );
};

export default InvoiceForm;