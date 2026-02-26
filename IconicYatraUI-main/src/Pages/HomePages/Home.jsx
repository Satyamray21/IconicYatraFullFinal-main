import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import {
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom"; // ✅ added

import InquiryFormDialog from "../../Components/InquiryFormDialog";
import FeaturedPackages from "../../Components/FeaturedPackages";
import WhyChooseUs from "../../Components/WhyChooseUs";
import DomesticPackage from "../../Components/DomesticPackage";
import InternationalPackage from "../../Components/InternationalPackage";
import TrustedCompany from "../../Components/TrustedCompany";
import Achievements from "../../Components/Achievements";
import SpecialPackages from "../../Components/SpecialPackages";
import HolidaysPackages from "../../Components/HolidaysPackages";
import Testimonial from "./Testimonial";
import Gallery from "../../Components/Gallery";
import { enquiryAxios } from "../../Utils/axiosInstance";
import img1 from "../../assets/Banner/banner1.jpg";
import img2 from "../../assets/Banner/banner2.jpg";
import img3 from "../../assets/Banner/banner3.jpg";

const Home = () => {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // controlled inputs
  const [mobile, setMobile] = useState("");
  const [persons, setPersons] = useState("");

  const navigate = useNavigate(); // ✅ navigation hook

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // ✅ submit handler with redirect
const handleInquirySubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await enquiryAxios.post(
      "/enquiry/create",
      data
    );

    // ✅ Navigate to Thank You page
    navigate("/thank-you");

  } catch (error) {
    alert(
      error.response?.data?.message || "Something went wrong"
    );
  }
};



  const slides = [
    { img: img1, title: "Summer Special", subtitle: "4 Nights / 5 Days" },
    { img: img2, title: "Honeymoon Special", subtitle: "3 Nights / 4 Days" },
    { img: img3, title: "Jungle Safari", subtitle: "2 Nights / 3 Days" },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {/* ================= Carousel ================= */}
      <div
        id="carouselExampleIndicators"
        className="carousel slide carousel-fade"
        data-bs-ride="carousel"
        data-bs-interval="3000"
        data-bs-pause="false"
      >
        <Box className="carousel-inner">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`carousel-item ${
                index === 0 ? "active" : ""
              } position-relative`}
            >
              {/* Banner */}
              <img
                src={slide.img}
                className="d-block w-100"
                alt="banner"
                style={{
                  height: "70vh",
                  objectFit: "cover",
                  filter: "brightness(70%)",
                }}
              />

              {/* Center Content */}
              <div className="carousel-caption d-flex flex-column justify-content-center align-items-center h-100">
                <Paper
                  elevation={24}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: "rgba(0,0,0,0.4)",
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ color: "#fff", fontWeight: 600 }}
                  >
                    {slide.title}
                  </Typography>

                  <Typography variant="h5" sx={{ color: "#fff", mb: 2 }}>
                    {slide.subtitle}
                  </Typography>

                  <Button
                    onClick={handleClickOpen}
                    variant="contained"
                    color="warning"
                    size="large"
                  >
                    Book Now
                  </Button>
                </Paper>
              </div>

              {/* ================= Inquiry Form ================= */}
              {showForm && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: { xs: 10, md: 60 },
                    transform: "translateY(-50%)",
                    zIndex: 5,
                  }}
                >
                  <Paper
                    elevation={10}
                    sx={{
                      width: 360,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        background: "#f28c63",
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        Get a Free Enquiry
                      </Typography>

                      <IconButton onClick={() => setShowForm(false)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Form */}
                    <Box
                      component="form"
                      onSubmit={handleInquirySubmit}
                      sx={{ p: 2.5 }}
                    >
                      <Typography variant="body2">Name</Typography>
                      <TextField
                        name="name"
                        fullWidth
                        placeholder="Your Name*"
                        size="small"
                        required
                        sx={{ mb: 2 }}
                      />

                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">Email</Typography>
                          <TextField
                            name="email"
                            fullWidth
                            placeholder="Your Email*"
                            size="small"
                          />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            Mobile/Whatsapp No.
                          </Typography>
                          <TextField
                            name="mobile"
                            value={mobile}
                            onChange={(e) =>
                              setMobile(e.target.value.replace(/\D/g, ""))
                            }
                            inputProps={{
                              inputMode: "numeric",
                              maxLength: 10,
                            }}
                            fullWidth
                            placeholder="Your Mobile No.*"
                            size="small"
                            required
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            No. of Persons
                          </Typography>
                          <TextField
                            name="persons"
                            value={persons}
                            onChange={(e) =>
                              setPersons(e.target.value.replace(/\D/g, ""))
                            }
                            inputProps={{ inputMode: "numeric" }}
                            fullWidth
                            placeholder="Number of Persons*"
                            size="small"
                            required
                          />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            Destination
                          </Typography>
                          <TextField
                            name="destination"
                            fullWidth
                            placeholder="Your Destination*"
                            size="small"
                          />
                        </Box>
                      </Box>

                      <Typography variant="body2">Travel Date</Typography>
                      <TextField
                        name="travelDate"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 3 }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        sx={{
                          background: "#f28c63",
                          color: "#fff",
                          borderRadius: "30px",
                          py: 1.3,
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": { background: "#e2764e" },
                        }}
                      >
                        Submit Enquiry
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              )}
            </div>
          ))}
        </Box>
      </div>

      {/* Dialog */}
      <InquiryFormDialog
        open={open}
        handleClose={handleClose}
        onSubmit={(data) => console.log(data)}
        title="Travel Inquiry"
      />

      {/* Sections */}
      <WhyChooseUs />
      <TrustedCompany />
      <SpecialPackages />
      <DomesticPackage />
      <InternationalPackage />
      <FeaturedPackages />
      <HolidaysPackages />
      <Testimonial />
      <Gallery />
      <Achievements />
    </Box>
  );
};

export default Home;