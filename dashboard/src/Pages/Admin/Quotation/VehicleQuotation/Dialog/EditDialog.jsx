import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

const EditDialog = ({
  open,
  onClose,
  title,
  value,
  onValueChange,
  onSave,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: "primary.main" }}>Edit {title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={title}
          type="text"
          fullWidth
          variant="outlined"
          value={value}
          onChange={onValueChange}
          multiline
          maxRows={4}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{ bgcolor: "skyblue", "&:hover": { bgcolor: "deepskyblue" } }}
        >
          Save
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: "darkorange", "&:hover": { bgcolor: "orange" } }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;