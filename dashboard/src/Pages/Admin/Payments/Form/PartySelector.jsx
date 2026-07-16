import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAssociates } from "../../../../features/associate/associateSlice";
import { getAllLeads } from "../../../../features/leads/leadSlice";
import {
    FormControl,
    InputLabel,
    Select,
    Typography,
    MenuItem,
    CircularProgress,
} from "@mui/material";

const PartySelector = ({ formik, prefillPartyName = "" }) => {
    const dispatch = useDispatch();

    const { list: associateList = [], loading: associateLoading } = useSelector(
        (state) => state.associate
    );

    const {
        list: leadList = [],
        status: leadStatus,
    } = useSelector((state) => state.leads);

    const accountType = formik.values.accountType;

    const [filteredAssociates, setFilteredAssociates] = useState([]);

    // ✅ Normalize helper
    const norm = (s) => String(s || "").trim().toLowerCase();

    // ─────────────────────────────
    // Fetch Data
    // ─────────────────────────────
    useEffect(() => {
        if (!associateList.length) dispatch(fetchAllAssociates());
        if (!leadList.length) dispatch(getAllLeads());
    }, [dispatch]);

    // ─────────────────────────────
    // Filter Data SAFELY
    // ─────────────────────────────
    useEffect(() => {
        if (!accountType) {
            setFilteredAssociates([]);
            return;
        }

        let filtered = [];

        // ✅ SAFE associate filtering
        const safeAssociates = associateList.filter(
            (a) => a && a.personalDetails
        );

        switch (accountType) {
            case "Vendor":
                filtered = safeAssociates.filter(
                    (a) =>
                        a.personalDetails?.associateType === "Hotel Vendor" ||
                        a.personalDetails?.associateType === "Vehicle Vendor"
                );
                break;

            case "Vehicle":
                filtered = safeAssociates.filter(
                    (a) =>
                        a.personalDetails?.associateType === "Vehicle Vendor"
                );
                break;

            case "Agent":
                filtered = safeAssociates.filter(
                    (a) =>
                        a.personalDetails?.associateType === "Sub Agent"
                );
                break;

            case "Client":
                // ✅ SAFE leads mapping
                filtered = leadList
                    .filter((lead) => lead && lead.personalDetails)
                    .map((lead) => ({
                        _id: lead._id,
                        fullName:
                            lead.personalDetails?.fullName || "Unnamed Client",
                        mobile: lead.personalDetails?.mobile || "",
                        isClient: true,
                    }));
                break;

            default:
                filtered = [];
        }

        setFilteredAssociates(filtered);

        // ─────────────────────────────
        // Prefill logic
        // ─────────────────────────────
        const prefill = String(prefillPartyName || "").trim();

        if (accountType === "Client" && prefill) {
            const match = filtered.find(
                (a) => a.isClient && norm(a.fullName) === norm(prefill)
            );

            formik.setFieldValue(
                "partyName",
                match ? match.fullName : prefill
            );
            return;
        }

        formik.setFieldValue("partyName", "");
    }, [accountType, associateList, leadList, prefillPartyName]);

    // ─────────────────────────────
    const loading = associateLoading || leadStatus === "loading";

    const prefillTrim = String(prefillPartyName || "").trim();

    const clientMatchedInList =
        accountType === "Client" &&
        prefillTrim &&
        filteredAssociates.some(
            (a) => a.isClient && norm(a.fullName) === norm(prefillTrim)
        );

    const showQuotationClientOption =
        accountType === "Client" && prefillTrim && !clientMatchedInList;

    const selectDisabled =
        !accountType ||
        (loading && !(accountType === "Client" && prefillTrim));

    // ✅ SAFE value (important for MUI crash fix)
    const safeValue = useMemo(() => {
        const values = filteredAssociates.map((a) =>
            a.isClient
                ? a.fullName
                : a.personalDetails?.fullName
        );

        return values.includes(formik.values.partyName)
            ? formik.values.partyName
            : "";
    }, [filteredAssociates, formik.values.partyName]);

    // ─────────────────────────────
    return (
        <FormControl
            fullWidth
            error={formik.touched.partyName && Boolean(formik.errors.partyName)}
        >
            <InputLabel>Party Name</InputLabel>

            <Select
                name="partyName"
                value={safeValue}
                onChange={formik.handleChange}
                label="Party Name"
                sx={{ bgcolor: "white" }}
                disabled={selectDisabled}
            >
                {/* Quotation fallback */}
                {showQuotationClientOption && (
                    <MenuItem value={prefillTrim}>
                        {prefillTrim} (quotation client)
                    </MenuItem>
                )}

                {/* Loading */}
                {loading && (
                    <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading...
                    </MenuItem>
                )}

                {/* Empty */}
                {!loading &&
                filteredAssociates.length === 0 &&
                !showQuotationClientOption ? (
                    <MenuItem disabled>No options available</MenuItem>
                ) : (
                    filteredAssociates.map((a) => {
                        const name = a.isClient
                            ? a.fullName
                            : a.personalDetails?.fullName;

                        if (!name) return null; // ✅ CRITICAL FIX

                        return (
                            <MenuItem key={a._id} value={name}>
                                {a.isClient
                                    ? `${a.fullName} (${a.mobile})`
                                    : name}
                            </MenuItem>
                        );
                    })
                )}
            </Select>

            {/* Info */}
            {loading && accountType === "Client" && prefillTrim && (
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                    Client list loading, using quotation client.
                </Typography>
            )}
        </FormControl>
    );
};

export default PartySelector;
