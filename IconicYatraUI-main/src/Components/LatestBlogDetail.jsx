import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Button,
  Chip,
  Avatar,
  Rating,
  Zoom,
  Fade,
  Grow,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  LocationOn,
  CalendarToday,
  ArrowBack,
  WbSunny,
  TipsAndUpdates,
  Security,
  Star,
  AccessTime,
  Category,
  CameraAlt,
  Favorite,
  Share,
  FormatQuote,
  Home,
  Facebook,
  Twitter,
  LinkedIn,
  ContentCopy,
  CheckCircle,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getBlogByIdentifier,
  getRelatedBlogs,
  selectCurrentBlog,
  selectRelatedBlogs,
  selectBlogLoading,
  selectBlogError,
  clearCurrentBlog,
} from "../Features/blogSlice";

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const blog = useSelector(selectCurrentBlog);
  const relatedBlogs = useSelector(selectRelatedBlogs);
  const loading = useSelector(selectBlogLoading);
  const error = useSelector(selectBlogError);

  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (slug) {
      dispatch(getBlogByIdentifier(slug));
      dispatch(getRelatedBlogs({ id: slug, limit: 3 }));
    }

    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch, slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blog?.title || "");
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
    };
    
    window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Container sx={{ py: 8, textAlign: "center" }}>
        <Zoom in={true}>
          <Paper
            elevation={3}
            sx={{
              p: 6,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            }}
          >
            <Typography variant="h4" gutterBottom color="primary">
              Blog Post Not Found
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
              Oops! The travel story you're looking for seems to have wandered off.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/latestblogs")}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              }}
            >
              Back to Blogs
            </Button>
          </Paper>
        </Zoom>
      </Container>
    );
  }

  const guide = blog.content?.travelGuide;

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Fade in={true}>
          <Breadcrumbs sx={{ mb: 3, color: "text.secondary" }}>
            <Link
              underline="hover"
              color="inherit"
              onClick={() => navigate("/")}
              sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Home fontSize="small" /> Home
            </Link>
            <Link
              underline="hover"
              color="inherit"
              onClick={() => navigate("/latestblogs")}
              sx={{ cursor: "pointer" }}
            >
              Blogs
            </Link>
            <Typography color="primary">{blog.title?.substring(0, 30)}...</Typography>
          </Breadcrumbs>
        </Fade>

        {/* Back Button and Share Actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              bgcolor: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: "white",
                boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
              },
            }}
            onClick={() => navigate("/latestblogs")}
          >
            Back to Blogs
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={liked ? <Favorite color="error" /> : <Favorite />}
              onClick={() => setLiked(!liked)}
              sx={{ borderRadius: 2 }}
            >
              {liked ? "Liked" : "Like"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={copied ? <CheckCircle /> : <ContentCopy />}
              onClick={handleCopyLink}
              sx={{ borderRadius: 2 }}
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Share />}
              sx={{ borderRadius: 2 }}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Hero Section */}
        <Paper
          sx={{
            position: "relative",
            height: { xs: 400, md: 500 },
            mb: 5,
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            "&:hover img": {
              transform: "scale(1.1)",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))`,
              zIndex: 1,
            },
          }}
        >
          <Box
            component="img"
            src={blog.image?.url || blog.image}
            alt={blog.title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 8s ease",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 4,
              zIndex: 2,
              color: "white",
            }}
          >
            <Grow in={true} timeout={1000}>
              <Box>
                <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Chip
                    icon={<Category sx={{ fontSize: 18 }} />}
                     label={`${blog.category} • ${blog.subCategory || ""}`}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.8),
                      color: "white",
                      fontWeight: "bold",
                      backdropFilter: "blur(10px)",
                    }}
                  />
                  <Chip
                    icon={<CalendarToday sx={{ fontSize: 18 }} />}
                    label={blog.date || blog.formattedDate}
                    sx={{
                      bgcolor: alpha("#000", 0.4),
                      color: "white",
                      backdropFilter: "blur(10px)",
                    }}
                  />
                  <Chip
                    icon={<AccessTime sx={{ fontSize: 18 }} />}
                    label={blog.readTime}
                    sx={{
                      bgcolor: alpha("#000", 0.4),
                      color: "white",
                      backdropFilter: "blur(10px)",
                    }}
                  />
                </Box>
                <Typography
                  variant="h2"
                  fontWeight="bold"
                  sx={{
                    mb: 2,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    fontSize: { xs: "2rem", md: "3.5rem" },
                  }}
                >
                  {blog.title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                    maxWidth: { xs: "100%", md: "80%" },
                  }}
                >
                  {blog.excerpt}
                </Typography>
              </Box>
            </Grow>
          </Box>
        </Paper>

        {/* Introduction */}
        <Fade in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 6,
              borderRadius: 4,
              bgcolor: "white",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: 8,
                height: "100%",
                background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <Box sx={{ pl: 2 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.palette.primary.main,
                }}
              >
                <CameraAlt /> Introduction
              </Typography>
              <Typography sx={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
                {blog.content?.introduction}
              </Typography>
            </Box>
          </Paper>
        </Fade>

        {/* Top Places */}
        {blog.content?.topPlaces?.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: theme.palette.primary.main,
                mb: 3,
              }}
            >
              <LocationOn /> Tourist Sports
            </Typography>
            <Grid container spacing={3}>
              {blog.content.topPlaces.map((place, index) => (
                <Grid size={{ xs: 12, md: 6 }} key={index}>
                  <Grow in={true} timeout={500 + index * 100}>
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: "0 20px 30px rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <Avatar
                            sx={{
                              mr: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: "bold",
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold">
                            {place.title}
                          </Typography>
                        </Box>
                        <Typography color="text.secondary" sx={{ pl: 7 }}>
                          {place.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Best Time to Visit */}
        {/* {blog.content?.bestTimeToVisit && (
          <Zoom in={true}>
            <Paper
              sx={{
                p: 4,
                mb: 6,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.1)",
                }}
              />
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <WbSunny sx={{ mr: 2, fontSize: 40 }} />
                  <Typography variant="h4" fontWeight="bold">
                    Best Time to Visit
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ lineHeight: 1.8 }}>
                  {blog.content.bestTimeToVisit}
                </Typography>
              </Box>
            </Paper>
          </Zoom>
        )} */}

        {/* Travel Tips */}
        {/* {blog.content?.travelTips?.length > 0 && (
          <Fade in={true}>
            <Paper
              sx={{
                p: 4,
                mb: 6,
                borderRadius: 4,
                bgcolor: "white",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: theme.palette.primary.main,
                  mb: 3,
                }}
              >
                <TipsAndUpdates /> Travel Tips
              </Typography>
              <Grid container spacing={2}>
                {blog.content.travelTips.map((tip, index) => (
                  <Grid size={{ xs: 12, md: 6 }} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          transform: "translateX(8px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <TipsAndUpdates sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography>{tip}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        )} */}

        {/* Cuisine */}
        {blog.content?.cuisine && (
          <Paper
            sx={{
              p: 4,
              mb: 6,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              borderLeft: `8px solid ${theme.palette.warning.main}`,
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ color: theme.palette.warning.main }}>
              🍽️ Local Cuisine
            </Typography>
            <Typography sx={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
              {blog.content.cuisine}
            </Typography>
          </Paper>
        )}

        {/* Conclusion */}
        {blog.content?.conclusion && (
          <Fade in={true}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                mb: 6,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <FormatQuote
                sx={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  fontSize: 60,
                  color: alpha(theme.palette.primary.main, 0.2),
                  transform: "rotate(180deg)",
                }}
              />
              <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    color: theme.palette.primary.main,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <FormatQuote /> Conclusion
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    lineHeight: 1.8,
                    fontStyle: "italic",
                    color: theme.palette.text.primary,
                    maxWidth: "800px",
                    mx: "auto",
                  }}
                >
                  "{blog.content.conclusion}"
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Rating value={5} readOnly sx={{ color: theme.palette.primary.main }} />
                </Box>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Detailed Travel Guide Section */}
        {guide && (
          <>
            <Divider sx={{ my: 6 }}>
              <Chip
                label="Detailed Travel Guide"
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: "1.2rem",
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Divider>

            {/* Best Time Detailed */}
            {guide.bestTime && (
              <Fade in={true}>
                <Paper
                  sx={{
                    p: 4,
                    mb: 6,
                    borderRadius: 4,
                    bgcolor: "white",
                    borderLeft: `8px solid ${theme.palette.primary.main}`,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: theme.palette.primary.main,
                    }}
                  >
                    <WbSunny /> Seasonal Guide
                  </Typography>
                  <Typography sx={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
                    {guide.bestTime}
                  </Typography>
                </Paper>
              </Fade>
            )}

            {/* Travel Tips Detailed */}
            {guide.travelTips?.length > 0 && (
              <Box sx={{ mb: 6 }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: theme.palette.primary.main,
                    mb: 3,
                  }}
                >
                  <TipsAndUpdates /> Essential Travel Tips
                </Typography>
                <Grid container spacing={3}>
                  {guide.travelTips.map((tip, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                      <Grow in={true} timeout={500 + index * 100}>
                        <Card
                          sx={{
                            height: "100%",
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              transform: "translateY(-4px)",
                            },
                          }}
                        >
                          <CardContent>
                            <Avatar
                              sx={{
                                mb: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            >
                              <TipsAndUpdates />
                            </Avatar>
                            <Typography>{tip}</Typography>
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Why Choose Us */}
            {guide.whyChoose && (
              <Paper
                sx={{
                  p: 4,
                  mb: 6,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.05
                  )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: theme.palette.primary.main,
                    mb: 3,
                  }}
                >
                  <Star /> Why Choose Iconic Travel
                </Typography>
                <Typography sx={{ mb: 4, fontSize: "1.1rem" }}>
                  {guide.whyChoose}
                </Typography>
                {guide.services?.length > 0 && (
                  <Grid container spacing={2}>
                    {guide.services.map((service, index) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={index}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: "white",
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              borderColor: theme.palette.primary.main,
                              transform: "translateX(4px)",
                            },
                          }}
                        >
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                            <Star sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography fontWeight="500">{service}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            )}

            {/* Safety Tips */}
            {guide.safetyTips?.length > 0 && (
              <Paper
                sx={{
                  p: 4,
                  mb: 6,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                  color: "white",
                }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 3,
                  }}
                >
                  <Security /> Safety Tips
                </Typography>
                <Grid container spacing={2}>
                  {guide.safetyTips.map((tip, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 1,
                        }}
                      >
                        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                          <Security />
                        </Avatar>
                        <Typography>{tip}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Final Note */}
            {guide.finalNote && (
              <Fade in={true}>
                <Paper
                  sx={{
                    p: 5,
                    borderRadius: 4,
                    bgcolor: "white",
                    position: "relative",
                    overflow: "hidden",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 200,
                      height: 200,
                      background: `radial-gradient(circle, ${alpha(
                        theme.palette.primary.main,
                        0.1
                      )} 0%, transparent 70%)`,
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: theme.palette.primary.main,
                    }}
                  >
                    <FormatQuote /> Final Words
                  </Typography>
                  <Typography
                    sx={{
                      lineHeight: 1.8,
                      fontSize: "1.2rem",
                      fontStyle: "italic",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    "{guide.finalNote}"
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography color="text.secondary">Iconic Travel</Typography>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                        <Star sx={{ fontSize: 18 }} />
                      </Avatar>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            )}
          </>
        )}

        {/* Related Blogs */}
        {relatedBlogs?.length > 0 && (
          <>
            <Divider sx={{ my: 6 }}>
              <Chip
                label="You Might Also Like"
                sx={{
                  px: 3,
                  py: 2,
                  fontSize: "1rem",
                  bgcolor: theme.palette.grey[200],
                  fontWeight: "bold",
                }}
              />
            </Divider>
            <Grid container spacing={3}>
              {relatedBlogs.map((relatedBlog) => (
                <Grid size={{ xs: 12, md: 4 }} key={relatedBlog._id}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      height: "100%",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                      },
                    }}
                    onClick={() => navigate(`/latestblogs/${relatedBlog.slug}`)}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={relatedBlog.image?.url || relatedBlog.image}
                      alt={relatedBlog.title}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {relatedBlog.category}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {relatedBlog.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {relatedBlog.excerpt?.substring(0, 100)}...
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}