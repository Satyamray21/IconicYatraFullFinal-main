import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { 
  Box, Typography, Button, Paper, Grid, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, TextField,
  InputAdornment, Chip, IconButton, CircularProgress
} from '@mui/material';
import { 
  Domain as DomainIcon, 
  CheckCircle as CheckCircleIcon, 
  Block as BlockIcon, 
  Search as SearchIcon, 
  AddBusiness as AddBusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const TenantsList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    email: '',
    domain: '',
    adminEmail: '',
    adminPassword: ''
  });

  const fetchTenants = async () => {
    try {
      const { data } = await axios.get('/company');
      setTenants(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenants");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The backend expects 'email' for the company record
      await axios.post('/company', formData);
      setShowModal(false);
      setFormData({ companyName: '', address: '', email: '', domain: '', adminEmail: '', adminPassword: '' });
      fetchTenants();
      toast.success("Tenant created successfully!");
    } catch (error) {
      toast.error("Error creating tenant: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? "suspend" : "restore";
    try {
      await axios.patch(`/company/${id}/status`);
      fetchTenants();
      toast.success(`Tenant ${action}ed successfully!`);
    } catch (error) {
      toast.error(`Error trying to ${action} tenant: ` + (error.response?.data?.message || error.message));
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  const handleToggleStatus = (id, currentStatus) => {
    const action = currentStatus ? "suspend" : "restore";
    setConfirmDialog({
      isOpen: true,
      title: `${currentStatus ? 'Suspend' : 'Restore'} Tenant`,
      message: `Are you sure you want to ${action} this tenant? ${currentStatus ? 'Their website and APIs will go offline immediately.' : ''}`,
      onConfirm: () => executeToggleStatus(id, currentStatus)
    });
  };

  const filteredTenants = tenants.filter(t => 
    t.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = tenants.filter(t => t.isActive !== false).length;
  const suspendedCount = tenants.length - activeCount;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            SaaS Administration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Manage your platform's tenants, subscriptions, and environments.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddBusinessIcon />}
          onClick={() => setShowModal(true)}
          sx={{ px: 3, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
        >
          Provision New Tenant
        </Button>
      </Box>

      {/* METRICS ROW */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Total Active Tenants
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="text.primary" sx={{ mt: 1 }}>
                  {activeCount}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.main', display: 'flex' }}>
                <DomainIcon fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Suspended Tenants
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="error.main" sx={{ mt: 1 }}>
                  {suspendedCount}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'error.light', borderRadius: 2, color: 'error.main', display: 'flex', opacity: 0.8 }}>
                <BlockIcon fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                System Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                  All Systems Operational
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DATA GRID */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <TextField
            fullWidth
            placeholder="Search companies by name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ maxWidth: 400, bgcolor: 'white' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Domain Setup</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Provisioned On</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Quick Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Loading tenants...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" fontWeight="medium">
                      No tenants found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map(tenant => {
                  const isActive = tenant.isActive !== false;
                  return (
                    <TableRow 
                      key={tenant._id} 
                      hover
                      sx={{ 
                        bgcolor: !isActive ? 'error.50' : 'inherit',
                        '&:last-child td, &:last-child th': { border: 0 } 
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 40, height: 40, borderRadius: 2, 
                            bgcolor: 'primary.light', color: 'primary.dark', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1.2rem', mr: 2
                          }}>
                            {tenant.companyName.charAt(0).toUpperCase()}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                              {tenant.companyName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tenant.email || 'No email provided'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {tenant.domain || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          ID: {tenant._id.substring(0,8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(tenant.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={isActive ? "Active" : "Suspended"} 
                          color={isActive ? "success" : "error"} 
                          size="small" 
                          variant={isActive ? "outlined" : "filled"}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          variant={isActive ? "outlined" : "contained"} 
                          color={isActive ? "error" : "success"}
                          size="small"
                          onClick={() => handleToggleStatus(tenant._id, isActive)}
                          sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                          {isActive ? 'Suspend' : 'Restore'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* CONFIRMATION DIALOG */}
      <Dialog
        open={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} variant="contained" color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* PROVISIONING MODAL */}
      <Dialog 
        open={showModal} 
        onClose={() => !isSubmitting && setShowModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ m: 0, p: 2.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">Provision New Tenant</Typography>
            <Typography variant="caption" color="text.secondary">Create an isolated environment and admin account.</Typography>
          </Box>
          <IconButton onClick={() => setShowModal(false)} disabled={isSubmitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Section 1 */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="primary" fontWeight="bold" sx={{ mb: 2, display: 'block' }}>
                  1. Company Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField 
                    required 
                    label="Company Name" 
                    name="companyName" 
                    value={formData.companyName} 
                    onChange={handleChange} 
                    fullWidth 
                    size="small"
                    placeholder="e.g. Dream Travels" 
                  />
                  <TextField 
                    required 
                    label="Company Address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    fullWidth 
                    size="small"
                    placeholder="e.g. 123 Main St, NY" 
                  />
                  <TextField 
                    required 
                    type="email"
                    label="Company Email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    fullWidth 
                    size="small"
                    placeholder="contact@agency.com" 
                  />
                  <TextField 
                    required 
                    label="Tenant Domain" 
                    name="domain" 
                    value={formData.domain} 
                    onChange={handleChange} 
                    fullWidth 
                    size="small"
                    placeholder="agency.com" 
                    InputProps={{
                      startAdornment: <InputAdornment position="start">https://</InputAdornment>,
                    }}
                    helperText="Do not include www. or admin."
                  />
                </Box>
              </Grid>

              {/* Section 2 */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="primary" fontWeight="bold" sx={{ mb: 2, display: 'block' }}>
                  2. Initial Admin Setup
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField 
                    required 
                    type="email"
                    label="Admin Login Email" 
                    name="adminEmail" 
                    value={formData.adminEmail} 
                    onChange={handleChange} 
                    fullWidth 
                    size="small"
                    placeholder="admin@domain.com" 
                  />
                  <TextField 
                    required 
                    type="password"
                    label="Admin Password" 
                    name="adminPassword" 
                    value={formData.adminPassword} 
                    onChange={handleChange} 
                    fullWidth 
                    size="small"
                    placeholder="********" 
                  />
                  
                  <Box sx={{ mt: 1, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.100' }}>
                    <Typography variant="caption" color="primary.dark">
                      <strong>Note:</strong> This will automatically create the database schemas, seed initial settings, and provision the master admin role for the new tenant.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 2.5, px: 4, bgcolor: 'grey.50' }}>
            <Button onClick={() => setShowModal(false)} disabled={isSubmitting} color="inherit" sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              sx={{ px: 3 }}
            >
              {isSubmitting ? 'Provisioning...' : 'Provision Tenant'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TenantsList;
