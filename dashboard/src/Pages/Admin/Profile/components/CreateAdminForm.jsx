import React, { useState } from "react";
import { Paper, Typography, TextField, Select, MenuItem, InputLabel, FormControl, Button, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { createAdmin } from "../../../../features/user/userSlice";

const CreateAdminForm = () => {
    const dispatch = useDispatch();
    const { adminCreation } = useSelector((state) => state.profile);

    const [form, setForm] = useState({
        name: "", email: "", password: "", mobile: "",
        country: "", state: "", city: "", address: "",
        role: "",
    });

    const [profileImg, setProfileImg] = useState(null);

    const updateField = (key, value) => setForm({ ...form, [key]: value });

    const createUser = () => {
        const fd = new FormData();
        fd.append("fullName", form.name);
        fd.append("email", form.email);
        fd.append("password", form.password);
        fd.append("mobileNumber", form.mobile);
        fd.append("country", form.country);
        fd.append("state", form.state);
        fd.append("city", form.city);
        fd.append("address", form.address);
        fd.append("userRole", form.role);
        if (profileImg) fd.append("profileImg", profileImg);

        dispatch(createAdmin(fd));
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 600 }}>
            <Typography variant="h4">Create User</Typography>

            {Object.entries({
                name: "Full Name", email: "Email", password: "Password",
                mobile: "Mobile Number", country: "Country", state: "State",
                city: "City", address: "Address"
            }).map(([key, label]) => (
                <TextField key={key}
                    label={label}
                    type={key === "password" ? "password" : "text"}
                    fullWidth sx={{ mb: 2 }}
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                />
            ))}

            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select value={form.role} label="Role"
                    onChange={(e) => updateField("role", e.target.value)}>
                    <MenuItem value="Superadmin">Superadmin</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Executive">Executive</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
                <input type="file" id="profile-img" style={{ display: "none" }}
                    onChange={(e) => setProfileImg(e.target.files[0])} />
                <label htmlFor="profile-img">
                    <Button variant="outlined" component="span">Upload Profile Image</Button>
                </label>
            </Box>

            <Button variant="contained" onClick={createUser}>
                {adminCreation?.loading ? "Creating..." : "Create User"}
            </Button>

            {adminCreation?.error && <Typography color="error">{adminCreation.error}</Typography>}
            {adminCreation?.success && <Typography color="green">User created!</Typography>}
        </Paper>
    );
};

export default CreateAdminForm;
