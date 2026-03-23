import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Alert,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  CalendarToday,
  Search as SearchIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllBlogs,
  selectAllBlogs,
  selectBlogStatus,
  selectBlogError,
  selectBlogPagination,
  setFilters,
  resetFilters,
  selectBlogFilters,
} from "../Features/blogSlice";

export default function BlogList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const blogs = useSelector(selectAllBlogs);
  const status = useSelector(selectBlogStatus);
  const error = useSelector(selectBlogError);
  const pagination = useSelector(selectBlogPagination);
  const filters = useSelector(selectBlogFilters);

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("-publishedAt");
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    "All",
    "India Travel",
    "International Travel",
    "Beach Destinations",
    "Hill Stations",
    "Cultural Tours",
    "Adventure Travel",
    "Honeymoon Packages",
    "Family Tours",
  ];

  const sortOptions = [
    { value: "-publishedAt", label: "Latest First" },
    { value: "publishedAt", label: "Oldest First" },
    { value: "-views", label: "Most Viewed" },
    { value: "-createdAt", label: "Recently Updated" },
  ];

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  useEffect(() => {
    dispatch(
      getAllBlogs({
        page: currentPage,
        limit: 9,
        category: category === "All" ? "" : category,
        search: filters.search,
        sort: sortBy,
      })
    );
  }, [dispatch, currentPage, category, sortBy, filters.search]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategory("");
    setSortBy("-publishedAt");
    setCurrentPage(1);
    dispatch(resetFilters());
  };

  // Loading skeletons
  const LoadingSkeleton = () => (
    <>
      {[...Array(6)].map((_, index) => (
        <Grid size={{ xs: 12, md: 4 }} key={index}>
          <Card sx={{ height: "100%" }}>
            <Skeleton variant="rectangular" height={200} animation="wave" />
            <CardContent>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="80%" height={28} />
              <Skeleton variant="text" width="100%" height={60} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </>
  );

  if (error && !blogs.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <button onClick={() => window.location.reload()}>Retry</button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Typography
          variant="h3"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Latest Travel Blogs
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Discover inspiring travel stories, tips, and guides from around the world
        </Typography>

        {/* Search and Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              placeholder="Search blogs by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "white",
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={handleCategoryChange}
                sx={{ bgcolor: "white", borderRadius: 2 }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
                sx={{ bgcolor: "white", borderRadius: 2 }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {option.value === "-views" && <TrendingIcon fontSize="small" />}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Clear Filters Button */}
        {(searchTerm || category !== "All" || sortBy !== "-publishedAt") && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <button
              onClick={handleClearFilters}
              style={{
                background: "none",
                border: "none",
                color: theme.palette.primary.main,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.9rem",
              }}
            >
              Clear all filters
            </button>
          </Box>
        )}

        {/* Blog Grid */}
        <Grid container spacing={4}>
          {status === "loading" && !blogs.length ? (
            <LoadingSkeleton />
          ) : blogs && blogs.length > 0 ? (
            blogs.map((blog, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={blog._id || blog.slug}>
                <Card
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    borderRadius: 3,
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 30px rgba(0,0,0,0.15)",
                    },
                  }}
                  onClick={() => navigate(`/latestblogs/${blog.slug}`)}
                >
                  <CardMedia
                    component="img"
                    height="240"
                    image={blog.image?.url || blog.image}
                    alt={blog.title}
                    sx={{
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                      <Chip
                        icon={<CategoryIcon fontSize="small" />}
                        label={blog.category}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        icon={<CalendarToday fontSize="small" />}
                        label={blog.date || blog.formattedDate}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        mb: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {blog.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {blog.excerpt}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 2,
                        pt: 1,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {blog.readTime}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        👁️ {blog.views || 0} views
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No blog posts found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or filters
                </Typography>
                <button
                  onClick={handleClearFilters}
                  style={{
                    marginTop: 16,
                    padding: "8px 24px",
                    background: theme.palette.primary.main,
                    color: "white",
                    border: "none",
                    borderRadius: 20,
                    cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <Pagination
              count={pagination.totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        )}

        {/* Stats */}
        {pagination.totalItems > 0 && (
          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            Showing {blogs.length} of {pagination.totalItems} blog posts
          </Typography>
        )}
      </Container>
    </Box>
  );
}