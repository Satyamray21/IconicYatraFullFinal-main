import React, { useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    IconButton,
    Card,
    Tooltip
} from '@mui/material';
import { Pagination, Stack } from '@mui/material';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllVouchers, deleteVoucher,fetchCompanyTotals } from '../../../features/payment/paymentSlice';
import { toast } from 'react-toastify';

const cellStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const PaymentsCard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [search, setSearch] = React.useState('');
    const ITEMS_PER_PAGE = 10;
    const [page, setPage] = React.useState(1);
    const { list: payments = [],companyTotals = [] } = useSelector((state) => state.payment);


    const filteredPayments = payments.filter((p) =>
        p.partyName?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);

    const paginatedPayments = filteredPayments.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    useEffect(() => {
        dispatch(fetchAllVouchers());
        dispatch(fetchCompanyTotals());
    }, [dispatch]);

    useEffect(() => {
        setPage(1);
    }, [search]);


    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this payment?')) {
            try {
                await dispatch(deleteVoucher(id)).unwrap();
                toast.success('Payment deleted');
            } catch {
                toast.error('Delete failed');
            }
        }
    };

    return (
        <Box>
            {/* Company Totals */}
<Box
    mb={3}
    p={2}
    borderRadius={2}
    bgcolor="#ffffff"
    boxShadow="0 2px 8px rgba(0,0,0,0.08)"
>
    <Typography variant="h6" fontWeight={600} mb={1}>
        Company Payment Summary
    </Typography>

    {companyTotals.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
            No data available
        </Typography>
    ) : (
        <Box display="flex" flexWrap="wrap" gap={2}>
            {companyTotals.map((item) => (
                <Box
                    key={item.companyId}
                    px={2}
                    py={1}
                    borderRadius="8px"
                    bgcolor="#f5f6fa"
                    boxShadow="0 1px 4px rgba(0,0,0,0.05)"
                >
                    <Typography variant="body2" fontWeight={600}>
                        {item.companyName}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        ₹{item.totalAmount}
                    </Typography>
                </Box>
            ))}
        </Box>
    )}
</Box>

            {/* Header */}
            <Box
                mb={3}
                p={2}
                borderRadius={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor="#ffffff"
                boxShadow="0 2px 8px rgba(0,0,0,0.08)"
            >
                {/* Left: Title */}
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Submitted Payments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View, search and manage all payment records
                    </Typography>
                </Box>

                {/* Right: Search + Button */}
                <Box display="flex" alignItems="center" gap={2}>
                    <TextField
                        size="small"
                        placeholder="Search by Name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 260 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        variant="contained"
                        size="medium"
                        sx={{
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                        onClick={() => navigate('/payments-form')}
                    >
                        + Add Payment
                    </Button>
                </Box>
            </Box>

            {/* Table Header */}
            <Box
                display="grid"
                gridTemplateColumns="60px 120px 120px 180px 240px 80px 140px 120px 120px"
                bgcolor="#f5f6fa"
                p={1.5}
                fontWeight={600}
                borderRadius="8px"
                mb={1}
            >
                <Box>S.No</Box>
                <Box>Receipt</Box>
                <Box>Invoice</Box>
                <Box>Name</Box>
                <Box>Particulars</Box>
                <Box>Dr/Cr</Box>
                <Box>Txn ID</Box>
                <Box>Amount</Box>
                <Box align="center">Actions</Box>
            </Box>

            {payments.length === 0 ? (
                <Typography>No payment records found</Typography>
            ) : (
                paginatedPayments.map((p, i) => (
                    <Card
                        key={p._id}
                        onClick={() => navigate(`/invoice-view/${p._id}`)}
                        sx={{
                            mb: 1,
                            p: 1.5,
                            cursor: 'pointer',
                            transition: '0.2s',
                            '&:hover': {
                                boxShadow: 4,
                                backgroundColor: '#fafafa',
                            },
                        }}
                    >
                        <Box
                            display="grid"
                            gridTemplateColumns="60px 120px 120px 180px 240px 80px 140px 120px 120px"
                            alignItems="center"
                        >
                            <Box>{(page - 1) * ITEMS_PER_PAGE + i + 1}</Box>

                            <Tooltip title={p.receiptNumber || ''}>
                                <Box sx={cellStyle}>{p.receiptNumber || '-'}</Box>
                            </Tooltip>

                            <Tooltip title={p.invoice || ''}>
                                <Box sx={cellStyle}>{p.invoiceId || '-'}</Box>
                            </Tooltip>

                            <Tooltip title={p.partyName}>
                                <Box sx={cellStyle}>{p.partyName}</Box>
                            </Tooltip>

                            <Tooltip title={p.particulars}>
                                <Box sx={cellStyle}>{p.particulars}</Box>
                            </Tooltip>

                            <Box>{p.drCr}</Box>

                            <Tooltip title={p.referenceNumber}>
                                <Box sx={cellStyle}>{p.referenceNumber}</Box>
                            </Tooltip>

                            <Box fontWeight={600}>₹{p.amount}</Box>

                            <Box display="flex" justifyContent="center" gap={1}>
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/payments-form/${p._id}`);
                                    }}
                                >
                                    <Edit />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => handleDelete(p._id, e)}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        </Box>
                    </Card>
                ))
            )}
            {totalPages > 1 && (
                <Stack alignItems="center" mt={3}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        shape="rounded"
                    />
                </Stack>
            )}
        </Box>
    );
};

export default PaymentsCard;
