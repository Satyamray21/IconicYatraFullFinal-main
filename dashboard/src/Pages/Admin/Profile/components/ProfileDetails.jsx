import React, { useState } from "react";
import { Paper, Typography, Box, IconButton, TextField, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../../../features/user/userSlice";

const ProfileDetails = ({ user }) => {
    const dispatch = useDispatch();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.fullName);

    const saveName = () => {
        const fd = new FormData();
        fd.append("fullName", name);
        dispatch(updateProfile({ formData: fd }));
        setEditing(false);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Profile Details</Typography>

            <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">User Details</Typography>
                <IconButton onClick={() => setEditing(!editing)}>
                    <EditIcon color="primary" />
                </IconButton>
            </Box>

            {editing ? (
                <>
                    <TextField fullWidth label="Name" value={name} sx={{ mt: 2 }}
                        onChange={(e) => setName(e.target.value)} />
                    <Button startIcon={<SaveIcon />} sx={{ mt: 2 }} onClick={saveName}>
                        Save
                    </Button>
                </>
            ) : (
                <>
                    <Typography><b>Name:</b> {user?.fullName}</Typography>
                    <Typography><b>Email:</b> {user?.email}</Typography>
                    <Typography><b>Role:</b> {user?.userRole}</Typography>
                </>
            )}
        </Paper>
    );
};

export default ProfileDetails;
