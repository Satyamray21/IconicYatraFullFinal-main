import React, { useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Card,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import { Pagination, Stack } from "@mui/material";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllExpenses,
  deleteExpense,
} from "../../../features/expense/expenseSlice";
import { fetchCompanies } from "../../../features/company/InsideCompany";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const cellStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const ExpensesCard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = React.useState("");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = React.useState(1);
  const { list: expenses = [] } = useSelector((state) => state.expense);
  const { companies = [] } = useSelector((state) => state.company || {});

  const filteredExpenses = React.useMemo(() => {
    let source = [...expenses];

    if (selectedCompanyId !== "all") {
      source = source.filter((item) => {
        const itemCompanyId =
          typeof item?.companyId === "object"
            ? String(item?.companyId?._id || "")
            : String(item?.companyId || "");
        return itemCompanyId === String(selectedCompanyId);
      });
    }

    if (fromDate) {
      source = source.filter(item => new Date(item.date || item.createdAt) >= new Date(fromDate));
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      source = source.filter(item => new Date(item.date || item.createdAt) <= endOfDay);
    }

    if (!search.trim()) return source;

    return source.filter((e) =>
      e.category?.toLowerCase().includes(search.toLowerCase()) || 
      e.particulars?.toLowerCase().includes(search.toLowerCase())
    );
  }, [expenses, selectedCompanyId, fromDate, toDate, search]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

  const paginatedExpenses = filteredExpenses.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    dispatch(fetchAllExpenses());
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCompanyId, fromDate, toDate]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this expense?")) {
      try {
        await dispatch(deleteExpense(id)).unwrap();
        toast.success("Expense deleted");
      } catch {
        toast.error("Delete failed");
      }
    }
  };

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <Box>
      {/* Header and Filters */}
      <Box
        mb={3}
        p={2}
        borderRadius={2}
        display="flex"
        flexDirection="column"
        gap={2}
        bgcolor="#ffffff"
        boxShadow="0 2px 8px rgba(0,0,0,0.08)"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          {/* Left: Title */}
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Daily Expenses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your daily business expenses
            </Typography>
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="contained"
              size="medium"
              sx={{
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                height: 40,
              }}
              onClick={() => navigate("/expenses-form")}
            >
              + Add Expense
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="expense-company-filter-label">Company</InputLabel>
            <Select
              labelId="expense-company-filter-label"
              label="Company"
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Companies</MenuItem>
              {(Array.isArray(companies) ? companies : []).map((company) => (
                <MenuItem key={company._id} value={String(company._id)}>
                  {company.companyName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
          <TextField
            size="small"
            placeholder="Search category/desc..."
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
        </Box>
      </Box>

      {/* Summary Calculator */}
      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 3, flexWrap: "wrap", bgcolor: "#e3f2fd", borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ color: "#1565c0" }}>
          <strong>Total Filtered Expenses:</strong> ₹{(Number(totalAmount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Typography>
      </Paper>

      {/* Table Header */}
      <Box
        display="grid"
        gridTemplateColumns="60px 120px 150px 240px 120px 120px 120px 120px"
        bgcolor="#f5f6fa"
        p={1.5}
        fontWeight={600}
        borderRadius="8px"
        mb={1}
      >
        <Box>S.No</Box>
        <Box>Date</Box>
        <Box>Category</Box>
        <Box>Particulars</Box>
        <Box>Pay Mode</Box>
        <Box>Company</Box>
        <Box>Amount</Box>
        <Box align="center">Actions</Box>
      </Box>

      {expenses.length === 0 ? (
        <Typography>No expense records found</Typography>
      ) : filteredExpenses.length === 0 ? (
        <Typography>No matching records found</Typography>
      ) : (
        paginatedExpenses.map((expense, i) => (
          <Card
            key={expense._id}
            onClick={() => navigate(`/expenses-form/${expense._id}`)}
            sx={{
              mb: 1,
              p: 1.5,
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": {
                boxShadow: 4,
                backgroundColor: "#fafafa",
              },
            }}
          >
            <Box
              display="grid"
              gridTemplateColumns="60px 120px 150px 240px 120px 120px 120px 120px"
              alignItems="center"
            >
              <Box>{(page - 1) * ITEMS_PER_PAGE + i + 1}</Box>

              <Box sx={cellStyle}>{dayjs(expense.date).format("DD MMM YYYY")}</Box>

              <Tooltip title={expense.category}>
                <Box sx={cellStyle} fontWeight={500} color="secondary.main">{expense.category}</Box>
              </Tooltip>

              <Tooltip title={expense.particulars || "-"}>
                <Box sx={cellStyle}>{expense.particulars || "-"}</Box>
              </Tooltip>

              <Box>{expense.paymentMode}</Box>
              
              <Tooltip title={expense.companyId?.companyName || "-"}>
                <Box sx={cellStyle}>{expense.companyId?.companyName || "-"}</Box>
              </Tooltip>

              <Box fontWeight={600} color="error.main">₹{expense.amount}</Box>

              <Box display="flex" justifyContent="center" gap={1}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/expenses-form/${expense._id}`);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => handleDelete(expense._id, e)}
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

export default ExpensesCard;
