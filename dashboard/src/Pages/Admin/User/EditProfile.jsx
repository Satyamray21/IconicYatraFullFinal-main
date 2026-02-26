import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Avatar,
    CircularProgress,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateProfile } from "../../../features/user/userSlice";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.profile);

    const [formData, setFormData] = useState({
        fullName: "",
        mobileNumber: "",
        email: "",
        country: "",
        state: "",
        city: "",
        address: {
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            pincode: ""
        },
        profileImg: null,
    });
    const [previewImg, setPreviewImg] = useState("");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser?.userId) {
            dispatch(fetchProfile(storedUser.userId));
        }
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                mobileNumber: user.mobileNumber || "",
                email: user.email || "",
                country: user.country || "",
                state: user.state || "",
                city: user.city || "",
                address: {
                    addressLine1: user.address?.addressLine1 || "",
                    addressLine2: user.address?.addressLine2 || "",
                    addressLine3: user.address?.addressLine3 || "",
                    pincode: user.address?.pincode || "",
                },
                profileImg: null,
            });
            setPreviewImg(user.profileImg || "");
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleImageChange = (e) => {
        setFormData({ ...formData, profileImg: e.target.files[0] });
        setPreviewImg(URL.createObjectURL(e.target.files[0]));
    };

    const handleAddressChange = (e) => {
        setFormData({
            ...formData,
            address: { ...formData.address, [e.target.name]: e.target.value },
        });
    };

    const handleSubmit = () => {
        const data = new FormData();
        data.append("fullName", formData.fullName);
        data.append("mobileNumber", formData.mobileNumber);
        data.append("email", formData.email);
        data.append("country", formData.country);
        data.append("state", formData.state);
        data.append("city", formData.city);
        // stringify address
        data.append("address", JSON.stringify(formData.address));

        if (formData.profileImg) {
            data.append("profileImg", formData.profileImg);
        }

        dispatch(updateProfile({ userId: user.userId, formData: data }))
            .unwrap()
            .then((updatedUser) => {
                setPreviewImg(updatedUser.profileImg);
                navigate("/profile/edit");
            })
            .catch((err) => console.error("Profile update failed:", err));
    };


    if (loading || !user) return <CircularProgress />;

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
                Edit Profile
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }} sx={{ textAlign: "center" }}>
                    <Avatar
                        src={previewImg}
                        sx={{ width: 100, height: 100, mx: "auto" }}
                    />
                    <Button variant="contained" component="label" sx={{ mt: 1 }}>
                        Change Profile Image
                        <input type="file" hidden onChange={handleImageChange} />
                    </Button>
                </Grid>

                {[
                    { label: "Full Name", name: "fullName" },
                    { label: "Mobile Number", name: "mobileNumber" },
                    { label: "Email", name: "email", disabled: true },
                    { label: "Country", name: "country" },
                    { label: "State", name: "state" },
                    { label: "City", name: "city" },
                ].map((field) => (
                    <Grid size={{ xs: 12, md: 6 }} sm={6} key={field.name}>
                        <TextField
                            fullWidth
                            label={field.label}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            disabled={field.disabled || false}
                        />
                    </Grid>
                ))}

                {/* Address fields */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Address Line 1"
                        name="addressLine1"
                        value={formData.address.addressLine1}
                        onChange={handleAddressChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Address Line 2"
                        name="addressLine2"
                        value={formData.address.addressLine2}
                        onChange={handleAddressChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Address Line 3"
                        name="addressLine3"
                        value={formData.address.addressLine3}
                        onChange={handleAddressChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Pincode"
                        name="pincode"
                        value={formData.address.pincode}
                        onChange={handleAddressChange}
                    />
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ textAlign: "center" }}>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Update Profile
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EditProfile;
