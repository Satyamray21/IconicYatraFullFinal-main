import {
  Box,
  Card,
  CardMedia,
  Grid,
  Typography,
  Pagination,
  Dialog,
  IconButton,
  useMediaQuery,
  useTheme,
  Fade,
  Chip,
  alpha,
} from "@mui/material";
import {
  ZoomIn,
  Close,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import Gellary from "../Data/Gellary";
import galleryBanner from "../assets/Banner/galleryBanner.jpg"

const ITEMS_PER_PAGE = 8;

function Gallery() {
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const totalPages = Math.ceil(Gellary.length / ITEMS_PER_PAGE);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedImages = Gellary.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleOpenImage = (index) => {
    setCurrentIndex(index);
  };

  const handleClose = () => {
    setCurrentIndex(null);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex !== null
        ? (prevIndex - 1 + displayedImages.length) % displayedImages.length
        : 0
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex !== null ? (prevIndex + 1) % displayedImages.length : 0
    );
  };

  // Handle image loading for smooth transitions
  const handleImageLoad = (index) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  };

  // Keyboard navigation for the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentIndex !== null) {
        if (e.key === "ArrowLeft") {
          handlePrev();
        } else if (e.key === "ArrowRight") {
          handleNext();
        } else if (e.key === "Escape") {
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex]);

  return (
    <>
      {/* Hero background with parallax effect */}
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <Box
          sx={{
            width: "100%",
            height: { xs: "60vh", sm: "70vh", md: "80vh" },
             backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url(${galleryBanner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed", // Parallax effect
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Animated text */}
          <Box
            sx={{
              textAlign: "center",
              color: "white",
              zIndex: 2,
              animation: "fadeInUp 1s ease-out",
              "@keyframes fadeInUp": {
                "0%": {
                  opacity: 0,
                  transform: "translateY(30px)",
                },
                "100%": {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Typography
              variant="h1"
              fontWeight="bold"
              sx={{
                fontSize: {
                  xs: "2.5rem",
                  sm: "3.5rem",
                  md: "4rem",
                  lg: "4.5rem",
                },
                mb: 2,
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              Our Gallery
            </Typography>
            <Typography
              variant="h6"
              sx={{
                maxWidth: "600px",
                mx: "auto",
                px: 2,
                fontWeight: 300,
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              Discover the beauty through our lens
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Gallery Grid */}
      <Box sx={{ px: isMobile ? 2 : { md: 8, lg: 10 }, py: 6 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 4, fontWeight: 600, color: "primary.main" }}
        >
          Memorable Moments
        </Typography>
        
        <Grid container spacing={3}>
          {displayedImages.map((photo, index) => (
            <Grid size={{xs:12, sm:6,  md:3}} key={index}>
              <Fade in={true} timeout={800}>
                <Card
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 12px 20px rgba(0,0,0,0.2)",
                      "& .overlay": { opacity: 1 },
                      "& .zoom-icon": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
                    },
                  }}
                  onClick={() => handleOpenImage(index)}
                >
                  <Box sx={{ position: "relative", overflow: "hidden" }}>
                    <Box
                      sx={{
                        height: isMobile ? 200 : 250,
                        backgroundColor: alpha(theme.palette.grey[300], 0.5),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={photo.imagePath}
                        sx={{
                          height: "100%",
                          width: "100%",
                          objectFit: "cover",
                          transition: "transform 0.5s ease",
                          transform: loadedImages[index] ? "scale(1)" : "scale(1.1)",
                          filter: loadedImages[index] ? "none" : "blur(5px)",
                          opacity: loadedImages[index] ? 1 : 0.7,
                        }}
                        onLoad={() => handleImageLoad(index)}
                      />
                    </Box>

                    {/* Gradient Overlay */}
                    <Box
                      className="overlay"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                        opacity: 0,
                        transition: "opacity 0.3s ease",
                      }}
                    />

                    {/* Category Tag */}
                    {photo.category && (
                      <Chip
                        label={photo.category}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          backgroundColor: "primary.main",
                          color: "white",
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    )}

                    {/* Zoom Icon */}
                    <ZoomIn
                      className="zoom-icon"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) scale(0.8)",
                        color: "white",
                        fontSize: 40,
                        opacity: 0,
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        p: 1,
                        width: 50,
                        height: 50,
                      }}
                    />
                  </Box>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" sx={{ my: 6 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handleChange}
          color="primary"
          size={isMobile ? "small" : "large"}
          sx={{
            "& .MuiPaginationItem-root": {
              fontWeight: 600,
              fontSize: isMobile ? "0.875rem" : "1rem",
            },
            "& .MuiPaginationItem-root.Mui-selected": {
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            },
          }}
        />
      </Box>

      {/* Full Image Slider Modal */}
      <Dialog
        open={currentIndex !== null}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(0,0,0,0.95)",
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.6)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
              zIndex: 2,
            }}
          >
            <Close />
          </IconButton>

          {/* Prev Button */}
          <IconButton
            onClick={handlePrev}
            sx={{
              position: "absolute",
              top: "50%",
              left: 16,
              color: "white",
              background: "rgba(0,0,0,0.6)",
              transform: "translateY(-50%)",
              zIndex: 2,
              "&:hover": { background: "rgba(0,0,0,0.8)" },
            }}
          >
            <ArrowBackIos />
          </IconButton>

          {/* Image */}
          {currentIndex !== null && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: isMobile ? "auto" : "70vh",
                p: 4,
                pt: 6,
              }}
            >
              <CardMedia
                component="img"
                image={displayedImages[currentIndex].imagePath}
                alt="Full Size"
                sx={{
                  maxWidth: "100%",
                  maxHeight: isMobile ? "80vh" : "70vh",
                  objectFit: "contain",
                  borderRadius: 1,
                  boxShadow: "0 0 40px rgba(255,255,255,0.1)",
                }}
              />
            </Box>
          )}

          {/* Next Button */}
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: 16,
              color: "white",
              background: "rgba(0,0,0,0.6)",
              transform: "translateY(-50%)",
              zIndex: 2,
              "&:hover": { background: "rgba(0,0,0,0.8)" },
            }}
          >
            <ArrowForwardIos />
          </IconButton>

          {/* Image Counter */}
          {currentIndex !== null && (
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                color: "white",
                backgroundColor: "rgba(0,0,0,0.6)",
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: "0.9rem",
              }}
            >
              {currentIndex + 1} / {displayedImages.length}
            </Box>
          )}
        </Box>
      </Dialog>
    </>
  );
}

export default Gallery;