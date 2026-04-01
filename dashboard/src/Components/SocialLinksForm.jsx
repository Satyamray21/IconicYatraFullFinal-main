import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_BASE_URL;

const SocialLinksForm = () => {
  const [form, setForm] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    linkedin: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await axios.get(`${API}/social-links`);
      setForm(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load social links ❌");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await axios.put(`${API}/social-links`, form);

      toast.success("Social links updated successfully 🎉");
    } catch (err) {
      console.error(err);
      toast.error("Error updating social links ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5">Social Media Links</Typography>

      <TextField
        fullWidth
        margin="normal"
        label="Instagram"
        name="instagram"
        value={form.instagram}
        onChange={handleChange}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Facebook"
        name="facebook"
        value={form.facebook}
        onChange={handleChange}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Twitter"
        name="twitter"
        value={form.twitter}
        onChange={handleChange}
      />

      <TextField
        fullWidth
        margin="normal"
        label="YouTube"
        name="youtube"
        value={form.youtube}
        onChange={handleChange}
      />

      <TextField
        fullWidth
        margin="normal"
        label="LinkedIn"
        name="linkedin"
        value={form.linkedin}
        onChange={handleChange}
      />

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </Button>
    </Box>
  );
};

export default SocialLinksForm;
