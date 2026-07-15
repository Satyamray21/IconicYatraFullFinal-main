import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  Avatar,
  Divider,
  useTheme,
  Alert,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon, Save as SaveIcon } from "@mui/icons-material";
import axios from "../../../../utils/axios";

const SeoSettings = () => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    favicon: null,
    ogImage: null,
  });

  const [preview, setPreview] = useState({
    favicon: "",
    ogImage: "",
    companyName: "Iconic Yatra",
    domain: "iconicyatra.com"
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Fetch initial company data to prefill the fields
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get("/companyUI");
        if (response.data && response.data.baseCompany) {
          const { baseCompany } = response.data;
          
          setFormData({
            seoTitle: baseCompany.seoTitle || "",
            seoDescription: baseCompany.seoDescription || "",
            seoKeywords: baseCompany.seoKeywords || "",
            favicon: null,
            ogImage: null,
          });

          setPreview(prev => ({
            ...prev,
            favicon: baseCompany.faviconUrl || "",
            ogImage: baseCompany.ogImageUrl || "",
            companyName: baseCompany.companyName || "Iconic Yatra",
            domain: baseCompany.domain || "iconicyatra.com"
          }));
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchCompanyData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setPreview((prev) => ({
        ...prev,
        [name]: URL.createObjectURL(files[0]),
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg("");
    try {
      const data = new FormData();
      if (formData.seoTitle) data.append("seoTitle", formData.seoTitle);
      if (formData.seoDescription) data.append("seoDescription", formData.seoDescription);
      if (formData.seoKeywords) data.append("seoKeywords", formData.seoKeywords);
      if (formData.favicon) data.append("favicon", formData.favicon);
      if (formData.ogImage) data.append("ogImage", formData.ogImage);

      const res = await axios.patch("/companyUI/seo", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success && res.data.company) {
        setSuccessMsg("SEO Settings successfully updated!");
        const updatedCompany = res.data.company;
        setFormData(prev => ({
          ...prev,
          seoTitle: updatedCompany.seoTitle || prev.seoTitle,
          seoDescription: updatedCompany.seoDescription || prev.seoDescription,
          seoKeywords: updatedCompany.seoKeywords || prev.seoKeywords,
        }));
        setPreview(prev => ({
          ...prev,
          favicon: updatedCompany.faviconUrl || prev.favicon,
          ogImage: updatedCompany.ogImageUrl || prev.ogImage,
          companyName: updatedCompany.companyName || prev.companyName,
          domain: updatedCompany.domain || prev.domain
        }));
      }
    } catch (error) {
      console.error("Error updating SEO:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: "#1a237e" }}>
        SEO & Branding
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Control how your website appears on Google, WhatsApp, and Facebook.
      </Typography>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Side: Form */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Meta Information
            </Typography>

            <TextField
              fullWidth
              label="SEO Title"
              name="seoTitle"
              value={formData.seoTitle}
              onChange={handleInputChange}
              helperText="Best format: Primary Keyword - Secondary Keyword | Brand Name (Max 60 chars)"
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <TextField
              fullWidth
              label="SEO Description"
              name="seoDescription"
              value={formData.seoDescription}
              onChange={handleInputChange}
              multiline
              rows={3}
              helperText="A brief summary of your page. (Max 160 chars)"
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <TextField
              fullWidth
              label="Keywords"
              name="seoKeywords"
              value={formData.seoKeywords}
              onChange={handleInputChange}
              helperText="Comma separated (e.g. Travel, Packages, Holiday)"
              sx={{ mb: 4 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <Divider sx={{ mb: 4 }} />

            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Brand Assets
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Favicon (Browser Tab Icon)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ p: 2, borderRadius: 2, borderStyle: "dashed" }}
                >
                  Upload Favicon
                  <input type="file" hidden name="favicon" accept="image/*" onChange={handleFileChange} />
                </Button>
                {preview.favicon && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <img src={preview.favicon} alt="Favicon" style={{ width: 32, height: 32, borderRadius: 4 }} />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Social Share Image (Open Graph)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ p: 2, borderRadius: 2, borderStyle: "dashed" }}
                >
                  Upload OG Image
                  <input type="file" hidden name="ogImage" accept="image/*" onChange={handleFileChange} />
                </Button>
                {preview.ogImage && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <img src={preview.ogImage} alt="OG Image" style={{ width: "100%", maxHeight: 100, objectFit: "cover", borderRadius: 8 }} />
                  </Box>
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 5, textAlign: "right" }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: "none", fontSize: "1.1rem" }}
              >
                {loading ? "Saving..." : "Save SEO Settings"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Live Preview */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Live Previews
          </Typography>

          {/* Google Preview */}
          <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Google Search Result
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar src={preview.favicon || "https://www.google.com/favicon.ico"} sx={{ width: 28, height: 28, mr: 1.5 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#202124", lineHeight: 1 }}>
                    {preview.companyName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#4d5156" }}>
                    https://www.{preview.domain}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: "#1a0dab", cursor: "pointer", "&:hover": { textDecoration: "underline" }, fontSize: "1.25rem", mb: 0.5 }}>
                {formData.seoTitle || `${preview.companyName} | Best Tour Packages`}
              </Typography>
              <Typography variant="body2" sx={{ color: "#4d5156", lineHeight: 1.58 }}>
                {formData.seoDescription || "Explore premium domestic and international tour packages. Book your next holiday today with the best travel deals available."}
              </Typography>
            </CardContent>
          </Card>

          {/* WhatsApp / Facebook Preview */}
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <Box
              sx={{
                width: "100%",
                height: 200,
                bgcolor: "#f0f2f5",
                backgroundImage: `url(${preview.ogImage || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <CardContent sx={{ bgcolor: "#f0f2f5", p: 2 }}>
              <Typography variant="caption" sx={{ color: "#606770", textTransform: "uppercase", fontWeight: 600 }}>
                {preview.domain}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#1c1e21", mt: 0.5, lineHeight: 1.2 }}>
                {formData.seoTitle || `${preview.companyName} | Tour Packages`}
              </Typography>
              <Typography variant="body2" sx={{ color: "#606770", mt: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {formData.seoDescription || "Explore premium domestic and international tour packages."}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeoSettings;
