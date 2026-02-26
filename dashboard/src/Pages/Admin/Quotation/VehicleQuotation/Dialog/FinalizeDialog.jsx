import React,{useEffect} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {fetchAllAssociates} from "../../../../../features/associate/associateSlice"
const FinalizeDialog = ({ open, onClose, vendor, setVendor, onConfirm }) => {
  const dispatch = useDispatch();
  const{list:associateList=[]}=useSelector((state)=>(state.associate))
    useEffect(()=>{
      dispatch(fetchAllAssociates())
    },[dispatch])
  const vehicleVendors = associateList.filter(
    (associate) => associate.personalDetails.associateType === "Vehicle Vendor"
  );
   useEffect(() => {
    if (!vendor && vehicleVendors.length > 0) {
      setVendor(vehicleVendors[0].personalDetails.fullName);
    }
  }, [vendor, vehicleVendors, setVendor]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "primary.main" }}>Vehicle Vendor</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel required>Vehicle Vendor</InputLabel>
<Select
  value={vendor}
  onChange={(e) => setVendor(e.target.value)}
  displayEmpty
>
  

  {vehicleVendors.map((v) => (
              <MenuItem key={v._id} value={v.personalDetails.fullName}>
                {v.personalDetails.fullName}
              </MenuItem>
  ))}
</Select>

        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!vendor}
          sx={{ bgcolor: "skyblue", "&:hover": { bgcolor: "deepskyblue" } }}
        >
          Confirm
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

export default FinalizeDialog;