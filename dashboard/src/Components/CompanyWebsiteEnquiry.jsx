import React, { useEffect, useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  TextField,
  Badge,
  Checkbox,
} from "@mui/material";
import axios from "../utils/axios.js";

const CompanyWebsiteEnquiry = () => {
  const [tab, setTab] = useState(0);
  const [pendingEnquiries, setPendingEnquiries] = useState([]);
  const [connectedEnquiries, setConnectedEnquiries] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  /* ================= FETCH ================= */
  const fetchAllEnquiries = async () => {
    try {
      const pendingRes = await axios.get(
        `/enquiry/admin/enquiries?status=pending`,
      );
      const connectedRes = await axios.get(
        `/enquiry/admin/enquiries?status=connected`,
      );

      setPendingEnquiries(pendingRes.data.data);
      setConnectedEnquiries(connectedRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAllEnquiries();
  }, []);

  /* ================= SELECT ================= */
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  /* ================= DELETE ================= */
  const deleteSingle = async (id) => {
    try {
      await axios.delete(`/enquiry/enquiry/${id}`);
      fetchAllEnquiries();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMultiple = async () => {
    try {
      await axios.post(`/enquiry/enquiry/delete-multiple`, {
        ids: selectedIds,
      });
      setSelectedIds([]);
      fetchAllEnquiries();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= MARK CONNECTED ================= */
  const markAsConnected = async (id) => {
    try {
      await axios.patch(`/enquiry/admin/enquiry/${id}`, {
        talkStatus: "connected",
        remarks: remarks[id] || "",
        talkedBy: "Admin",
      });
      fetchAllEnquiries();
    } catch (error) {
      console.error(error);
    }
  };

  const enquiries = tab === 0 ? pendingEnquiries : connectedEnquiries;

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Company Website Enquiries
      </Typography>

      {/* DELETE MULTIPLE */}
      {selectedIds.length > 0 && (
        <Button
          variant="contained"
          color="error"
          sx={{ mb: 2 }}
          onClick={deleteMultiple}
        >
          Delete Selected ({selectedIds.length})
        </Button>
      )}

      {/* TABS */}
      <Tabs value={tab} onChange={(e, val) => setTab(val)}>
        <Tab
          label={
            <Badge badgeContent={pendingEnquiries.length} color="error">
              Pending
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={connectedEnquiries.length} color="success">
              Connected
            </Badge>
          }
        />
      </Tabs>

      {/* LIST */}
      {enquiries.length === 0 && (
        <Typography mt={2}>No enquiries found.</Typography>
      )}

      {enquiries.map((item) => (
        <Box
          key={item._id}
          sx={{ border: "1px solid #ddd", p: 2, mt: 2, borderRadius: 2 }}
        >
          <Checkbox
            checked={selectedIds.includes(item._id)}
            onChange={() => handleSelect(item._id)}
          />

          <Button
            color="error"
            size="small"
            onClick={() => deleteSingle(item._id)}
          >
            Delete
          </Button>

          <Typography>
            <b>Name:</b> {item.name}
          </Typography>
          <Typography>
            <b>Mobile:</b> {item.mobile}
          </Typography>
          <Typography>
            <b>Destination:</b> {item.destination}
          </Typography>
          <Typography>
            <b>Persons:</b> {item.persons}
          </Typography>
          <Typography>
            <b>Travel Date:</b>{" "}
            {item.travelDate
              ? new Date(item.travelDate).toLocaleDateString()
              : "-"}
          </Typography>

          {tab === 0 && (
            <>
              <TextField
                fullWidth
                size="small"
                placeholder="Remarks"
                sx={{ mt: 1 }}
                value={remarks[item._id] || ""}
                onChange={(e) =>
                  setRemarks({
                    ...remarks,
                    [item._id]: e.target.value,
                  })
                }
              />

              <Button
                variant="contained"
                sx={{ mt: 1 }}
                onClick={() => markAsConnected(item._id)}
              >
                Mark as Connected
              </Button>
            </>
          )}

          {tab === 1 && (
            <>
              <Typography>
                <b>Remarks:</b> {item.remarks || "-"}
              </Typography>
              <Typography>
                <b>Talked By:</b> {item.talkedBy || "-"}
              </Typography>
              <Typography>
                <b>Talked At:</b>{" "}
                {item.talkedAt ? new Date(item.talkedAt).toLocaleString() : "-"}
              </Typography>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CompanyWebsiteEnquiry;
