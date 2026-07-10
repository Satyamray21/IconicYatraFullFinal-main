import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Button, CircularProgress, Alert,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Divider, Collapse 
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import axios from "../../../../utils/axios";
import HotelEmailDialog from "./HotelEmailDialog";
import HotelWhatsAppDialog from "./HotelWhatsAppDialog";

const QuotationRow = ({ group, handleEditClick, handleSplitClick, handleOpenEmail, handleOpenWhatsApp }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <React.Fragment>
      <TableRow 
        sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
        onClick={() => setOpen(!open)}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell><strong>{group.quotationId}</strong></TableCell>
        <TableCell>{group.clientName}</TableCell>
        <TableCell>Stays: {group.stays.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Stay Details
              </Typography>
              <Table size="small" aria-label="stays">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Stay Location</strong></TableCell>
                    <TableCell><strong>Check In / Out</strong></TableCell>
                    <TableCell><strong>Details</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.stays.map(({ stay, originalIndex }) => (
                    <TableRow key={stay._localId || originalIndex}>
                      <TableCell>
                        <strong>Hotel</strong><br/>
                        <span style={{color: "gray"}}>{stay.city} ({stay.nights} Nights)</span>
                      </TableCell>
                      <TableCell>
                        IN: {stay.checkInDate}<br/>
                        OUT: {stay.checkOutDate}
                      </TableCell>
                      <TableCell>
                        {stay.noOfRooms} Room(s) - {stay.sharingType}<br/>
                        <span style={{color: "gray"}}>{stay.mealPlan} | {stay.roomCategory}</span>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Tooltip title="Edit Stay Details">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleEditClick(stay, originalIndex)}
                              sx={{ border: "1px solid #1976d2", borderRadius: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Split Stay">
                            <IconButton 
                              color="secondary" 
                              size="small"
                              onClick={() => handleSplitClick(stay, originalIndex)}
                              sx={{ border: "1px solid #9c27b0", borderRadius: 1 }}
                            >
                              <CallSplitIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            startIcon={<EmailIcon />}
                            onClick={(e) => { e.stopPropagation(); handleOpenEmail(stay); }}
                          >
                            SEND REQUEST
                          </Button>
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            startIcon={<WhatsAppIcon />}
                            onClick={(e) => { e.stopPropagation(); handleOpenWhatsApp(stay); }}
                          >
                            SHARE
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const HotelAvailability = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingToBackend, setSavingToBackend] = useState(false);
  
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [selectedStay, setSelectedStay] = useState(null);
  const [emailData, setEmailData] = useState(null);
  
  const [companies, setCompanies] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);

  // WhatsApp Share State
  const [openWhatsAppDialog, setOpenWhatsAppDialog] = useState(false);
  const [whatsAppStay, setWhatsAppStay] = useState(null);

  // Edit Stay State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStay, setEditingStay] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Split Stay State
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitTargetStay, setSplitTargetStay] = useState(null);
  const [splitTargetIndex, setSplitTargetIndex] = useState(-1);
  const [splitFirstNights, setSplitFirstNights] = useState(1);

  useEffect(() => {
    fetchStays();
    fetchCompaniesAndAccounts();
  }, []);

  const fetchStays = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/quotations/stay-locations");
      const fetchedStays = (data.data || []).map((s, idx) => ({ ...s, _localId: Date.now() + idx }));
      setStays(fetchedStays);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch stay locations");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompaniesAndAccounts = async () => {
    try {
      const [compRes, accRes] = await Promise.all([
        axios.get("/company"),
        axios.get("/email-accounts"),
      ]);
      setCompanies(compRes.data.data || []);
      setEmailAccounts(accRes.data.data || []);
    } catch (err) {
      console.error("Failed to load companies or email accounts", err);
    }
  };

  const handleOpenEmail = async (stay) => {
    setSelectedStay(stay);
    try {
      const { data } = await axios.post("/quotations/hotel-availability-email/preview", {
        stay,
        companyId: companies[0]?._id,
      });
      setEmailData(data.data);
      setOpenEmailDialog(true);
    } catch (err) {
      setError("Failed to generate email preview");
    }
  };

  const handleSendEmail = async (values) => {
    try {
      await axios.post("/quotations/hotel-availability-email/send", {
        to: values.to,
        cc: values.cc,
        subject: values.subject,
        bodyHtml: values.message + (values.signature || ""),
        senderAccount: values.senderAccount,
        companyId: values.companyId,
      });
      setOpenEmailDialog(false);
      setError("Email queued successfully! (Success)");
    } catch (err) {
      setError("Failed to send email");
      return false;
    }
  };

  const handleCompanyChange = async (companyId, mailType) => {
    if (!selectedStay) return {};
    try {
      const { data } = await axios.post("/quotations/hotel-availability-email/preview", {
        stay: selectedStay,
        companyId,
      });
      setEmailData(data.data);
      return data.data;
    } catch (err) {
      console.error("Failed to preview with new company", err);
      return {};
    }
  };

  const handleOpenWhatsApp = (stay) => {
    setWhatsAppStay(stay);
    setOpenWhatsAppDialog(true);
  };

  const handleSaveChangesToBackend = async (staysToSave = stays) => {
    try {
      setSavingToBackend(true);
      await axios.post("/quotations/stay-locations/save-availability", { stays: staysToSave });
      setHasUnsavedChanges(false);
      setError("Changes saved successfully! (Success)");
    } catch (err) {
      setError("Failed to save changes to backend");
    } finally {
      setSavingToBackend(false);
    }
  };

  // --- Edit Handlers ---
  const handleEditClick = (stay, index) => {
    setEditingStay({ ...stay });
    setEditingIndex(index);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    const newStays = [...stays];
    newStays[editingIndex] = editingStay;
    setStays(newStays);
    setEditDialogOpen(false);
    setEditingStay(null);
    setEditingIndex(-1);
    // Auto-save to backend
    handleSaveChangesToBackend(newStays);
  };

  // --- Split Handlers ---
  const handleSplitClick = (stay, index) => {
    const nights = Number(stay.nights || 1);
    if (nights <= 1) {
      setError("Cannot split a stay of 1 night");
      return;
    }
    setSplitTargetStay(stay);
    setSplitTargetIndex(index);
    setSplitFirstNights(Math.max(1, nights - 1));
    setSplitDialogOpen(true);
  };

  const handleConfirmSplit = () => {
    if (!splitTargetStay) return;
    const totalNights = Number(splitTargetStay.nights || 2);
    const firstNights = Number(splitFirstNights);
    
    if (firstNights < 1 || firstNights >= totalNights) {
      setError(`Please enter nights between 1 and ${totalNights - 1}`);
      return;
    }
    
    const secondNights = totalNights - firstNights;
    
    const firstStay = { ...splitTargetStay, nights: firstNights, _localId: Date.now() + "-1" };
    const secondStay = { ...splitTargetStay, nights: secondNights, _localId: Date.now() + "-2" };
    
    // Auto adjust dates
    if (firstStay.checkInDate) {
        const checkIn = new Date(firstStay.checkInDate);
        if (!isNaN(checkIn.getTime())) {
            const midDate = new Date(checkIn);
            midDate.setDate(midDate.getDate() + firstNights);
            
            firstStay.checkOutDate = midDate.toISOString().split('T')[0];
            secondStay.checkInDate = midDate.toISOString().split('T')[0];
            
            const checkOut = new Date(midDate);
            checkOut.setDate(checkOut.getDate() + secondNights);
            secondStay.checkOutDate = checkOut.toISOString().split('T')[0];
        }
    }
    
    const newStays = [...stays];
    newStays.splice(splitTargetIndex, 1, firstStay, secondStay);
    setStays(newStays);
    setSplitDialogOpen(false);
    setSplitTargetStay(null);
    setSplitTargetIndex(-1);
    // Auto-save to backend
    handleSaveChangesToBackend(newStays);
  };

  if (loading) return <CircularProgress />;

  const groupedStaysMap = stays.reduce((acc, stay, index) => {
    const qId = stay.quotationId;
    if (!acc[qId]) {
      acc[qId] = {
        quotationId: qId,
        clientName: stay.clientName,
        stays: [],
      };
    }
    acc[qId].stays.push({ stay, originalIndex: index });
    return acc;
  }, {});
  const quotationGroups = Object.values(groupedStaysMap);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Hotel Availability Requests</Typography>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSaveChangesToBackend}
          disabled={!hasUnsavedChanges || savingToBackend}
        >
          {savingToBackend ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
        </Button>
      </Box>
      {error && <Alert severity={error?.includes && error.includes("Success") ? "success" : "error"} sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell><strong>Quotation ID</strong></TableCell>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Total Stays</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quotationGroups.map((group) => (
              <QuotationRow 
                key={group.quotationId} 
                group={group} 
                handleEditClick={handleEditClick} 
                handleSplitClick={handleSplitClick} 
                handleOpenEmail={handleOpenEmail} 
                handleOpenWhatsApp={handleOpenWhatsApp}
              />
            ))}
            {quotationGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">No upcoming stays found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {openEmailDialog && (
        <HotelEmailDialog
          open={openEmailDialog}
          onClose={() => setOpenEmailDialog(false)}
          onSend={handleSendEmail}
          onCompanyChange={handleCompanyChange}
          initialValuesOverride={{
            subject: emailData?.normal?.subject || "",
            message: emailData?.normal?.message || "",
            companyId: companies[0]?._id || "",
            senderAccount: emailAccounts.find(a => (a.companyId?._id || a.companyId) === companies[0]?._id)?._id || "",
          }}
          companyOptions={companies}
          emailAccountOptions={emailAccounts}
        />
      )}

      {/* Edit Stay Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", background: "#f8f9fa" }}>Edit Stay Details</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
            {editingStay && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                        <TextField label="City" fullWidth size="small" value={editingStay.city || ""} onChange={e => setEditingStay({...editingStay, city: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField label="Nights" type="number" fullWidth size="small" value={editingStay.nights || ""} onChange={e => setEditingStay({...editingStay, nights: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField label="No of Rooms" type="number" fullWidth size="small" value={editingStay.noOfRooms || ""} onChange={e => setEditingStay({...editingStay, noOfRooms: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField label="Check-in Date" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small" value={editingStay.checkInDate || ""} onChange={e => setEditingStay({...editingStay, checkInDate: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField label="Check-out Date" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small" value={editingStay.checkOutDate || ""} onChange={e => setEditingStay({...editingStay, checkOutDate: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField label="Sharing Type" fullWidth size="small" value={editingStay.sharingType || ""} onChange={e => setEditingStay({...editingStay, sharingType: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField label="Room Category (Type)" fullWidth size="small" value={editingStay.roomCategory || ""} onChange={e => setEditingStay({...editingStay, roomCategory: e.target.value})} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField label="Meal Plan" fullWidth size="small" value={editingStay.mealPlan || ""} onChange={e => setEditingStay({...editingStay, mealPlan: e.target.value})} />
                    </Grid>
                </Grid>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f1f3f5" }}>
            <Button onClick={() => setEditDialogOpen(false)} color="inherit" sx={{ fontWeight: "bold" }}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSaveEdit} sx={{ fontWeight: "bold" }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {openWhatsAppDialog && (
        <HotelWhatsAppDialog
          open={openWhatsAppDialog}
          onClose={() => setOpenWhatsAppDialog(false)}
          stay={whatsAppStay}
          companyOptions={companies}
          emailAccountOptions={emailAccounts}
        />
      )}

      {/* Split Stay Dialog */}
      <Dialog open={splitDialogOpen} onClose={() => setSplitDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", textAlign: "center", background: "#f8f9fa", py: 2 }}>
            Split Stay Duration
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Choose how many nights to allocate to each split stay for <b>{splitTargetStay?.city}</b>.
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                    label="Nights for First Stay"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ 
                        min: 1, 
                        max: splitTargetStay ? Number(splitTargetStay.nights || 2) - 1 : 1 
                    }}
                    value={splitFirstNights}
                    onChange={(e) => setSplitFirstNights(Number(e.target.value))}
                    helperText={`Max nights for first stay: ${splitTargetStay ? Number(splitTargetStay.nights || 2) - 1 : 1}`}
                />
                <Divider />
                <Box sx={{ bgcolor: "#f8f9fa", p: 2, borderRadius: 2, border: "1px dashed #ced4da" }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main" gutterBottom>
                        Split Preview:
                    </Typography>
                    <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            🏨 <b>Stay 1:</b> {splitFirstNights} Night{splitFirstNights > 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="body2">
                            🏨 <b>Stay 2:</b> {splitTargetStay ? Number(splitTargetStay.nights) - splitFirstNights : 0} Night{splitTargetStay && (Number(splitTargetStay.nights) - splitFirstNights) > 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f1f3f5" }}>
            <Button onClick={() => setSplitDialogOpen(false)} color="inherit" sx={{ fontWeight: "bold" }}>Cancel</Button>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleConfirmSplit}
                disabled={!splitFirstNights || splitFirstNights < 1 || (splitTargetStay && splitFirstNights >= Number(splitTargetStay.nights))}
                sx={{ fontWeight: "bold" }}
            >
                Split Now
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HotelAvailability;
