// MakePaymentDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';

const MakePaymentDialog = ({ open, onClose }) => {
  const [paymentData, setPaymentData] = React.useState({
    amount: '',
    paymentMethod: '',
    transactionId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Payment data:', paymentData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Make Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={paymentData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              label="Payment Method"
            >
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="debit_card">Debit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Transaction ID"
            value={paymentData.transactionId}
            onChange={(e) => handleInputChange('transactionId', e.target.value)}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={paymentData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!paymentData.amount || !paymentData.paymentMethod}
        >
          Process Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MakePaymentDialog;