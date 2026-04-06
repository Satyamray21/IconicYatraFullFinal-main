import React, { useRef, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSelector } from "react-redux";

const Testimonial = () => {
  const scrollRef = useRef(null);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // ✅ Redux Data
  const companyData = useSelector(
    (state) => state.companyUI?.data?.company
  );

  // ✅ useMemo for testimonials mapping optimization
  const testimonials = useMemo(() => {
    if (!companyData?.testimonials) return [];

    return companyData.testimonials.map((t) => ({
      id: t._id,
      name: t.name,
      location: t.address,
      text: t.words,
      avatar: t.photo?.url,
    }));
  }, [companyData]);

  const cardsToShow = isMobile ? 1 : isTablet ? 2 : 3;
  const cardWidth = 100 / cardsToShow;

  // ✅ Auto Scroll Effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current || !testimonials.length) return;

      scrollRef.current.scrollBy({
        left: scrollRef.current.offsetWidth / cardsToShow,
        behavior: "smooth",
      });

      if (
        scrollRef.current.scrollLeft +
          scrollRef.current.offsetWidth >=
        scrollRef.current.scrollWidth
      ) {
        scrollRef.current.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [cardsToShow, testimonials]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 5 },
        py: 6,
        background: "#f5f5f5",
        width: "100%",
      }}
    >
      <Box textAlign="center" mb={5}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            background: "linear-gradient(90deg,#ff5722,#e91e63)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          TESTIMONIALS
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{ mt: 1, color: "#555", fontStyle: "italic" }}
        >
          What our happy customers say about us
        </Typography>
      </Box>

      {/* Slider */}
      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          gap: 3,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { display: "none" },
          px: { xs: 1, md: 2 },
        }}
      >
        {testimonials.map((t) => (
          <Box
            key={t.id}
            sx={{
              flex: `0 0 ${cardWidth}%`,
              scrollSnapAlign: "center",
              borderRadius: 3,
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              p: 4,
              background: "white",
              minWidth: 250,
              textAlign: "center",
              transition: "0.3s",
              "&:hover": {
                transform: "translateY(-5px) scale(1.02)",
              },
            }}
          >
            <Avatar
              src={t.avatar}
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                border: "3px solid #1976d2",
              }}
            />

            <Typography variant="h6" fontWeight="bold" color="#1976d2">
              {t.name}
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={1}>
              {t.location}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
            >
              “{t.text}”
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Testimonial;
