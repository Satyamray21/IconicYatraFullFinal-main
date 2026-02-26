import React, { useEffect, useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  TextField,
} from "@mui/material";
import axios from "../utils/axios.js";

const CompanyWebsiteEnquiry = () => {
  const [tab, setTab] = useState(0);
  const [enquiries, setEnquiries] = useState([]);

  const fetchEnquiries = async (status) => {
    const res = await axios.get(
      `/enquiry/admin/enquiries?status=${status}`
    );
    setEnquiries(res.data.data);
  };

  useEffect(() => {
    fetchEnquiries(tab === 0 ? "pending" : "connected");
  }, [tab]);

  const markAsConnected = async (id, remarks) => {
    await axios.patch(`/enquiry/admin/enquiry/${id}`, {
      talkStatus: "connected",
      remarks,
      talkedBy: "Admin",
    });

    fetchEnquiries("pending");
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Company Website Enquiries
      </Typography>

      <Tabs value={tab} onChange={(e, val) => setTab(val)}>
        <Tab label="Pending To Talk" />
        <Tab label="Connected" />
      </Tabs>

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
          <Typography><strong>Name:</strong> {item.name}</Typography>
          <Typography><strong>Mobile:</strong> {item.mobile}</Typography>
          <Typography><strong>Destination:</strong> {item.destination}</Typography>

          {tab === 0 && (
            <>
              <TextField
                placeholder="Add Remarks"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                onChange={(e) => (item.tempRemark = e.target.value)}
              />

              <Button
                variant="contained"
                sx={{ mt: 1 }}
                onClick={() =>
                  markAsConnected(item._id, item.tempRemark)
                }
              >
                Mark as Connected
              </Button>
            </>
          )}

          {tab === 1 && (
            <Typography sx={{ mt: 1 }}>
              <strong>Remarks:</strong> {item.remarks}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CompanyWebsiteEnquiry;