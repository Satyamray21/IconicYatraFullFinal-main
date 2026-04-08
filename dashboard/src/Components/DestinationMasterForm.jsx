import React, { useEffect, useState } from "react";
import axios from "../utils/axios.js";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  TextField,
  Button
} from "@mui/material";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DestinationMasterForm = () => {
  const [tourType, setTourType] = useState("");
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [usedDestinations, setUsedDestinations] = useState([]);

  // 🔥 CACHE (IMPORTANT)
  const [cache, setCache] = useState({});

  // ---------------------------
  // FETCH DATA (WITH CACHE)
  // ---------------------------
  const loadDestinations = async () => {
    if (!tourType) return;

    // ✅ USE CACHE
    if (cache[tourType]) {
      setAvailableDestinations(cache[tourType].available || []);
      setUsedDestinations(cache[tourType].used || []);
      return;
    }

    try {
      const res = await axios.get(
        `/destinations/available?tourType=${tourType}`
      );

      // SAVE CACHE
      setCache((prev) => ({
        ...prev,
        [tourType]: res.data
      }));

      setAvailableDestinations(res.data.available || []);
      setUsedDestinations(res.data.used || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load destinations ❌");
    }
  };

  useEffect(() => {
    loadDestinations();
  }, [tourType]);

  // ---------------------------
  // HANDLE DESCRIPTION CHANGE
  // ---------------------------
  const handleDescriptionChange = (id, value) => {
    const updated = usedDestinations.map((item) =>
      item._id === id ? { ...item, description: value } : item
    );
    setUsedDestinations(updated);
  };

  // ---------------------------
  // SAVE DESCRIPTION
  // ---------------------------
  const handleSave = async (item) => {
    try {
      await axios.put(`/destinations/update/${item._id}`, {
        description: item.description
      });

      toast.success("Description updated ✅");

      // 🔥 UPDATE CACHE ALSO
      setCache((prev) => ({
        ...prev,
        [tourType]: {
          ...prev[tourType],
          used: prev[tourType].used.map((d) =>
            d._id === item._id ? item : d
          )
        }
      }));

    } catch (err) {
      console.error(err);
      toast.error("Update failed ❌");
    }
  };

  return (
    <Box p={3}>
      <ToastContainer position="top-right" autoClose={2000} />

      <Typography variant="h5" mb={2}>
        Destination Master (CRM)
      </Typography>

      {/* TOUR TYPE */}
      <Typography mb={1}>Tour Type</Typography>
      <Select
        fullWidth
        value={tourType}
        onChange={(e) => setTourType(e.target.value)}
        sx={{ mb: 3 }}
      >
        <MenuItem value="Domestic">Domestic</MenuItem>
        <MenuItem value="International">International</MenuItem>
      </Select>

      {/* ---------------- USED DESTINATIONS ---------------- */}
      {usedDestinations.length > 0 && (
        <>
          <Typography variant="h6" mb={2}>
            Manage Descriptions
          </Typography>

          {usedDestinations.map((item) => (
            <Card key={item._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography fontWeight="bold" mb={1}>
                  {tourType === "Domestic"
                    ? item.sector
                    : item.country}
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Enter description..."
                  value={item.description || ""}
                  onChange={(e) =>
                    handleDescriptionChange(item._id, e.target.value)
                  }
                />

                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => handleSave(item)}
                >
                  Save
                </Button>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* EMPTY STATE */}
      {tourType && usedDestinations.length === 0 && (
        <Typography>No destinations found</Typography>
      )}
    </Box>
  );
};

export default DestinationMasterForm;
