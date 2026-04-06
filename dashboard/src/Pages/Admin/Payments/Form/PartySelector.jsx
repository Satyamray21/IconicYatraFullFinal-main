import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAssociates } from "../../../../features/associate/associateSlice";
import { getAllLeads } from "../../../../features/leads/leadSlice";
import {
    FormControl,
    InputLabel,
    Select,
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
        error: leadError,
    } = useSelector((state) => state.leads);

    const [filteredAssociates, setFilteredAssociates] = useState([]);

    const accountType = formik.values.accountType;

    // ✅ Fetch associates and leads once
    useEffect(() => {
        if (associateList.length === 0) dispatch(fetchAllAssociates());
        if (leadList.length === 0) dispatch(getAllLeads());
    }, [dispatch, associateList.length, leadList.length]);

    // ✅ Filter logic based on accountType
    useEffect(() => {
        if (!accountType) {
            setFilteredAssociates([]);
            return;
        }

        let filtered = [];

        switch (accountType) {
            case "Vendor":
                filtered = associateList.filter(
                    (a) =>
                        a.personalDetails.associateType === "Hotel Vendor" ||
                        a.personalDetails.associateType === "Vehicle Vendor"
                );
                break;

            case "Vehicle":
                filtered = associateList.filter(
                    (a) => a.personalDetails.associateType === "Vehicle Vendor"
                );
                break;

            case "Agent":
                filtered = associateList.filter(
                    (a) => a.personalDetails.associateType === "Sub Agent"
                );
                break;

            case "Client":
                // ✅ Show clients from leads
                filtered = leadList.map((lead) => ({
                    _id: lead._id,
                    fullName: lead.personalDetails?.fullName || "Unnamed Client",
                    mobile: lead.personalDetails?.mobile || "",
                    isClient: true,
                }));
                break;

            default:
                filtered = [];
                break;
        }

        setFilteredAssociates(filtered);

        const norm = (s) => String(s || "").trim().toLowerCase();
        const prefill = String(prefillPartyName || "").trim();

        if (accountType === "Client" && prefill) {
            const match = filtered.find(
                (a) => a.isClient && norm(a.fullName) === norm(prefill)
            );
            formik.setFieldValue("partyName", match ? match.fullName : prefill);
            return;
        }

        formik.setFieldValue("partyName", "");
    }, [accountType, associateList, leadList, prefillPartyName]);

    const loading = associateLoading || leadStatus === "loading";

    const normName = (s) => String(s || "").trim().toLowerCase();
    const prefillTrim = String(prefillPartyName || "").trim();
    const clientMatchedInList =
        accountType === "Client" &&
        prefillTrim &&
        filteredAssociates.some(
            (a) => a.isClient && normName(a.fullName) === normName(prefillTrim)
        );
    /** Show extra option when quotation name is not in leads (or leads still loading / empty). */
    const showQuotationClientOption =
        accountType === "Client" && prefillTrim && !clientMatchedInList;

    const selectDisabled =
        !accountType ||
        (loading && !(accountType === "Client" && prefillTrim));

    return (
        <FormControl
            fullWidth
            error={formik.touched.partyName && Boolean(formik.errors.partyName)}
        >
            <InputLabel>Party Name</InputLabel>
            <Select
                name="partyName"
                value={formik.values.partyName || ""}
                onChange={formik.handleChange}
                label="Party Name"
                sx={{ bgcolor: "white" }}
                disabled={selectDisabled}
            >
                {showQuotationClientOption && (
                    <MenuItem value={prefillTrim}>
                        {prefillTrim} (quotation client)
                    </MenuItem>
                )}
                {loading && (
                    <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading
                        directory…
                    </MenuItem>
                )}
                {!loading &&
                filteredAssociates.length === 0 &&
                !showQuotationClientOption ? (
                    <MenuItem disabled>No options available</MenuItem>
                ) : (
                    filteredAssociates.map((a) => (
                        <MenuItem
                            key={a._id}
                            value={a.isClient ? a.fullName : a.personalDetails.fullName}
                        >
                            {a.isClient
                                ? `${a.fullName} (${a.mobile})`
                                : a.personalDetails.fullName}
                        </MenuItem>
                    ))
                )}
            </Select>
            {loading && accountType === "Client" && prefillTrim && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Client list is loading; quotation client is already selected above.
                </Typography>
            )}
        </FormControl>
    );
};

export default PartySelector;