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

const PartySelector = ({ formik }) => {
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
        formik.setFieldValue("partyName", ""); // reset on type change
    }, [accountType, associateList, leadList]);

    const loading = associateLoading || leadStatus === "loading";

    return (
        <FormControl
            fullWidth
            error={formik.touched.partyName && Boolean(formik.errors.partyName)}
        >
            <InputLabel>Party Name</InputLabel>
            <Select
                name="partyName"
                value={formik.values.partyName}
                onChange={formik.handleChange}
                label="Party Name"
                sx={{ bgcolor: "white" }}
                disabled={!accountType || loading}
            >
                {loading ? (
                    <MenuItem disabled>
                        <CircularProgress size={20} /> Loading...
                    </MenuItem>
                ) : filteredAssociates.length > 0 ? (
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
                ) : (
                    <MenuItem disabled>No options available</MenuItem>
                )}
            </Select>
        </FormControl>
    );
};

export default PartySelector;