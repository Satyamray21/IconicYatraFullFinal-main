import React, { useEffect, useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  TextField,
  Badge,
} from "@mui/material";
import axios from "../utils/axios.js";

const CompanyWebsiteEnquiry = () => {
  const [tab, setTab] = useState(0);
  const [pendingEnquiries, setPendingEnquiries] = useState([]);
  const [connectedEnquiries, setConnectedEnquiries] = useState([]);
  const [remarks, setRemarks] = useState({});

  /* ================= FETCH ENQUIRIES ================= */

  const fetchAllEnquiries = async () => {
    try {
      const pendingRes = await axios.get(
        `/enquiry/admin/enquiries?status=pending`
      );

      const connectedRes = await axios.get(
        `/enquiry/admin/enquiries?status=connected`
      );

      setPendingEnquiries(pendingRes.data.data);
      setConnectedEnquiries(connectedRes.data.data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    }
  };

  useEffect(() => {
    fetchAllEnquiries();
  }, []);

  /* ================= MARK AS CONNECTED ================= */

  const markAsConnected = async (id) => {
    try {
      await axios.patch(`/enquiry/admin/enquiry/${id}`, {
        talkStatus: "connected",
        remarks: remarks[id] || "",
        talkedBy: "Admin",
      });

      // Refresh list after update
      fetchAllEnquiries();
    } catch (error) {
      console.error("Error updating enquiry:", error);
    }
  };

  const enquiries =
    tab === 0 ? pendingEnquiries : connectedEnquiries;

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Company Website Enquiries
      </Typography>

      {/* ================= TABS WITH COUNT ================= */}

      <Tabs value={tab} onChange={(e, val) => setTab(val)}>
        <Tab
          label={
            <Badge
              badgeContent={pendingEnquiries.length}
              color="error"
            >
              Pending To Talk
            </Badge>
          }
        />
        <Tab
          label={
            <Badge
              badgeContent={connectedEnquiries.length}
              color="success"
            >
              Connected
            </Badge>
          }
        />
      </Tabs>

      {/* ================= ENQUIRY LIST ================= */}

      {enquiries.length === 0 && (
        <Typography sx={{ mt: 3 }}>
          No enquiries found.
        </Typography>
      )}

      {enquiries.map((item) => (
        <Box
          key={item._id}
          sx={{
            border: "1px solid #ddd",
            p: 2,
            mt: 2,
            borderRadius: 2,
          }}
        >
          <Typography>
            <strong>Name:</strong> {item.name}
          </Typography>

          <Typography>
            <strong>Mobile:</strong> {item.mobile}
          </Typography>

          <Typography>
            <strong>Destination:</strong> {item.destination}
          </Typography>

          <Typography>
            <strong>Persons:</strong> {item.persons}
          </Typography>

          <Typography>
            <strong>Travel Date:</strong>{" "}
            {item.travelDate
              ? new Date(item.travelDate).toLocaleDateString()
              : "-"}
          </Typography>

          {/* Pending Tab UI */}
          {tab === 0 && (
            <>
              <TextField
                placeholder="Add Remarks"
                fullWidth
                size="small"
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

          {/* Connected Tab UI */}
          {tab === 1 && (
            <>
              <Typography sx={{ mt: 1 }}>
                <strong>Remarks:</strong> {item.remarks || "-"}
              </Typography>
              <Typography>
                <strong>Talked By:</strong> {item.talkedBy || "-"}
              </Typography>
              <Typography>
                <strong>Talked At:</strong>{" "}
                {item.talkedAt
                  ? new Date(item.talkedAt).toLocaleString()
                  : "-"}
              </Typography>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CompanyWebsiteEnquiry;