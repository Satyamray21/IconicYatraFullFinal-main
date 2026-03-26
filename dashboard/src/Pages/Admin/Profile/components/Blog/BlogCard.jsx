import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  TablePagination,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Import Redux actions
import {
  getAllBlogs,
  deleteBlog,
  updateBlog,
  selectAllBlogs,
  selectBlogStatus,
  selectBlogError,
  selectBlogPagination,
  selectBlogLoading
} from "../../../../../features/blog/blogSlice";

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  margin: theme.spacing(3),
  width: 'auto',
  overflow: 'auto',
}));

const SearchField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 3),
  width: '300px',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: '#f5f5f5',
    '&:hover': {
      backgroundColor: '#eeeeee',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: '#e3f2fd',
  },
}));

const ViewButton = styled(IconButton)(({ theme }) => ({
  color: '#4caf50',
  '&:hover': {
    backgroundColor: '#e8f5e9',
  },
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  color: '#f44336',
  '&:hover': {
    backgroundColor: '#ffebee',
  },
}));

const StatusChip = styled(Chip)(({ status }) => ({
  backgroundColor: 
    status === 'published' ? '#e8f5e9' :
    status === 'draft' ? '#fff3e0' :
    status === 'scheduled' ? '#e1f5fe' : '#f5f5f5',
  color: 
    status === 'published' ? '#2e7d32' :
    status === 'draft' ? '#ed6c02' :
    status === 'scheduled' ? '#0288d1' : '#757575',
  fontWeight: 600,
  '& .MuiChip-label': {
    textTransform: 'capitalize'
  }
}));

const BlogPostsTable = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const blogs = useSelector(selectAllBlogs);
  const status = useSelector(selectBlogStatus);
  const error = useSelector(selectBlogError);
  const pagination = useSelector(selectBlogPagination);
  const loading = useSelector(selectBlogLoading);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filters, setFilters] = useState({
    category: '',
    sort: '-publishedAt'
  });

  // Status filter menu
  const [statusFilterAnchor, setStatusFilterAnchor] = useState(null);
  
  // Available statuses for filtering
  const statusOptions = [
    { value: 'all', label: 'All Posts', icon: null },
    { value: 'published', label: 'Published', icon: <CheckCircleIcon fontSize="small" /> },
    { value: 'draft', label: 'Draft', icon: <PendingIcon fontSize="small" /> },
    { value: 'scheduled', label: 'Scheduled', icon: <ScheduleIcon fontSize="small" /> },
    { value: 'archived', label: 'Archived', icon: <ArchiveIcon fontSize="small" /> }
  ];

  // Fetch blogs on component mount and when filters change
  useEffect(() => {
    fetchBlogs();
  }, [page, rowsPerPage, selectedStatus, filters]);

  const fetchBlogs = () => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      ...(selectedStatus !== 'all' && { status: selectedStatus }),
      ...(filters.category && { category: filters.category }),
      ...(searchTerm && { search: searchTerm }),
      sort: filters.sort
    };
    
    dispatch(getAllBlogs(params));
  };

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (page !== 0) {
        setPage(0);
      } else {
        fetchBlogs();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle delete
  const handleDelete = async () => {
    if (selectedBlog) {
      const result = await dispatch(deleteBlog(selectedBlog._id));
      
      if (deleteBlog.fulfilled.match(result)) {
        setSnackbar({
          open: true,
          message: 'Blog post deleted successfully!',
          severity: 'success'
        });
        fetchBlogs();
      } else {
        setSnackbar({
          open: true,
          message: result.payload || 'Failed to delete blog post',
          severity: 'error'
        });
      }
      
      setDeleteDialogOpen(false);
      setSelectedBlog(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (selectedBlog) {
      const formData = new FormData();
      const blogData = {
        ...selectedBlog,
        status: newStatus,
        updatedAt: new Date()
      };
      formData.append('blogData', JSON.stringify(blogData));
      
      const result = await dispatch(updateBlog({ 
        id: selectedBlog._id, 
        formData 
      }));
      
      if (updateBlog.fulfilled.match(result)) {
        setSnackbar({
          open: true,
          message: `Blog post ${newStatus} successfully!`,
          severity: 'success'
        });
        fetchBlogs();
      } else {
        setSnackbar({
          open: true,
          message: result.payload || 'Failed to update blog status',
          severity: 'error'
        });
      }
      
      setStatusDialogOpen(false);
      setSelectedBlog(null);
    }
  };

  // Handle edit
 const handleEdit = (blog) => {
    // Navigate to edit form using slug (not ID)
    navigate(`/blog/edit/${blog.slug}`, { state: { blog, isEditing: true } });
};

  // Handle view
  const handleView = (blog) => {
    navigate(`/blog/${blog.slug || blog._id}`, { state: { blog } });
  };

  // Handle create new post
  const handleCreateNew = () => {
    navigate('/postblogform');
  };

  // Handle duplicate post
  const handleDuplicate = (blog) => {
    const duplicatedBlog = {
      ...blog,
      title: `${blog.title} (Copy)`,
      slug: `${blog.slug}-copy`,
      status: 'draft',
      publishedAt: new Date(),
      views: 0
    };
    
    const formData = new FormData();
    formData.append('blogData', JSON.stringify(duplicatedBlog));
    
    // Navigate to form with duplicated data
    navigate('/postblogform', { state: { blog: duplicatedBlog, isEditing: false } });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBlogs();
    setSnackbar({
      open: true,
      message: 'Refreshing blog list...',
      severity: 'info'
    });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setFilters({ category: '', sort: '-publishedAt' });
    setPage(0);
  };

  // Open menu for blog actions
  const handleMenuOpen = (event, blog) => {
    setAnchorEl(event.currentTarget);
    setSelectedBlog(blog);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBlog(null);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'published':
        return <CheckCircleIcon fontSize="small" sx={{ color: '#2e7d32', mr: 0.5 }} />;
      case 'draft':
        return <PendingIcon fontSize="small" sx={{ color: '#ed6c02', mr: 0.5 }} />;
      case 'scheduled':
        return <ScheduleIcon fontSize="small" sx={{ color: '#0288d1', mr: 0.5 }} />;
      case 'archived':
        return <ArchiveIcon fontSize="small" sx={{ color: '#757575', mr: 0.5 }} />;
      default:
        return null;
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <>
      {[...Array(rowsPerPage)].map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton variant="text" width={30} /></TableCell>
          <TableCell><Skeleton variant="text" width={80} /></TableCell>
          <TableCell>
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={300} />
          </TableCell>
          <TableCell><Skeleton variant="text" width={100} /></TableCell>
          <TableCell><Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 2 }} /></TableCell>
          <TableCell><Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 2 }} /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
          Blog Posts
          {pagination.totalItems > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 2, color: '#666' }}>
              ({pagination.totalItems} total)
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
          }}
        >
          Create New Post
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        alignItems="center" 
        sx={{ mb: 2, px: 3 }}
      >
        <SearchField
          placeholder="Search by title, excerpt, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          size="small"
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => setStatusFilterAnchor(e.currentTarget)}
          sx={{ borderRadius: 3, textTransform: 'none' }}
        >
          {selectedStatus === 'all' ? 'Filter by Status' : `Status: ${selectedStatus}`}
        </Button>
        
        <Menu
          anchorEl={statusFilterAnchor}
          open={Boolean(statusFilterAnchor)}
          onClose={() => setStatusFilterAnchor(null)}
        >
          {statusOptions.map((option) => (
            <MenuItem 
              key={option.value}
              onClick={() => {
                setSelectedStatus(option.value);
                setPage(0);
                setStatusFilterAnchor(null);
              }}
              selected={selectedStatus === option.value}
            >
              <ListItemIcon>
                {option.icon}
              </ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
              {selectedStatus === option.value && (
                <CheckCircleIcon fontSize="small" color="primary" />
              )}
            </MenuItem>
          ))}
        </Menu>
        
        <Button
          variant="text"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ borderRadius: 3, textTransform: 'none' }}
        >
          Refresh
        </Button>
        
        {(searchTerm || selectedStatus !== 'all') && (
          <Button
            variant="text"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            Clear Filters
          </Button>
        )}
      </Stack>

      {/* Table */}
      <StyledTableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }} aria-label="blog posts table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 60 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 100 }}>Post ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 400 }}>Title & Excerpt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 120 }}>Publish Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 100 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 100 }}>Views</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#455a64', width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : blogs && blogs.length > 0 ? (
              blogs.map((blog, index) => (
                <TableRow 
                  key={blog._id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer'
                    },
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleView(blog)}
                >
                  <TableCell>{pagination.currentPage === 1 ? index + 1 : (pagination.currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1976d2' }}>
                    {blog.id || blog.slug?.substring(0, 8)}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 500 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {blog.image?.url && (
                        <Avatar 
                          src={blog.image.url} 
                          variant="rounded" 
                          sx={{ width: 40, height: 40, mr: 1 }}
                        >
                          <ImageIcon />
                        </Avatar>
                      )}
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {blog.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {truncateText(blog.excerpt, 120)}
                    </Typography>
                    {blog.category && (
                      <Chip 
                        label={blog.category} 
                        size="small" 
                        sx={{ mt: 1, fontSize: '0.7rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon fontSize="small" sx={{ color: '#757575', fontSize: 16 }} />
                      <Typography variant="body2">{formatDate(blog.publishedAt)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={blog.status}
                      status={blog.status}
                      size="small"
                      icon={getStatusIcon(blog.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {blog.views || 0}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View">
                        <ViewButton 
                          size="small" 
                          onClick={() => handleView(blog)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </ViewButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <ActionButton 
                          size="small" 
                          onClick={() => handleEdit(blog)}
                        >
                          <EditIcon fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuOpen(e, blog)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No blog posts found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm || selectedStatus !== 'all' 
                        ? 'Try adjusting your filters or search term'
                        : 'Click "Create New Post" to get started'}
                    </Typography>
                    {(searchTerm || selectedStatus !== 'all') && (
                      <Button
                        variant="outlined"
                        onClick={handleClearFilters}
                        sx={{ mt: 2 }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={pagination.totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: '1px solid #e0e0e0',
              '.MuiTablePagination-select': {
                borderRadius: 2,
              },
            }}
          />
        )}
      </StyledTableContainer>

      {/* Menu for blog actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          setStatusDialogOpen(true);
        }}>
          <ListItemIcon>
            {selectedBlog?.status === 'published' ? <ArchiveIcon fontSize="small" /> : 
             selectedBlog?.status === 'archived' ? <UnarchiveIcon fontSize="small" /> :
             <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedBlog?.status === 'published' ? 'Archive Post' :
             selectedBlog?.status === 'archived' ? 'Unarchive Post' :
             selectedBlog?.status === 'draft' ? 'Publish Post' : 'Change Status'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleDuplicate(selectedBlog);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate Post</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setDeleteDialogOpen(true);
        }} sx={{ color: '#f44336' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText>Delete Post</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Blog Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedBlog?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>Change Post Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Change status for "{selectedBlog?.title}"
          </DialogContentText>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {statusOptions.filter(opt => opt.value !== 'all').map((option) => (
              <Button
                key={option.value}
                variant={selectedBlog?.status === option.value ? 'contained' : 'outlined'}
                onClick={() => handleStatusChange(option.value)}
                startIcon={option.icon}
                sx={{ justifyContent: 'flex-start' }}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BlogPostsTable;