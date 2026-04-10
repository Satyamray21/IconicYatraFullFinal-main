import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
} from "@mui/material";
import {
  Download,
  Print,
  Close,
  LocalPhone,
  Email,
  LocationOn,
  Language,
  Person,
  FlightTakeoff,
  FlightLand,
  Hotel,
  Restaurant,
  Payments,
  CheckCircle,
  Cancel,
  MoneyOff,
  Description,
} from "@mui/icons-material";
import axios from "../../../../../../utils/axios";

const QuotationPDFDialog = ({ open, onClose, quotation }) => {
  const printRef = useRef();
  const contentRef = useRef();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageElements, setImageElements] = useState({});
  const [renderComplete, setRenderComplete] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [globalPolicyDefaults, setGlobalPolicyDefaults] = useState({
    inclusions: [],
    exclusions: [],
    paymentPolicy: "",
  });

  // Helper function to safely get nested values
  const getValue = (obj, path, defaultValue = "N/A") => {
    if (!obj) return defaultValue;
    const keys = path.split(".");
    let result = obj;
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    return result !== undefined && result !== null && result !== ""
      ? result
      : defaultValue;
  };
  const getRawValue = (obj, path) => {
    if (!obj) return undefined;
    const keys = path.split(".");
    let result = obj;
    for (const key of keys) {
      if (result === undefined || result === null) return undefined;
      result = result[key];
    }
    return result;
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹ 0";
    let numAmount = amount;
    if (typeof amount === "string") {
      const cleaned = amount.replace(/[^0-9.-]/g, "");
      numAmount = parseFloat(cleaned);
    }
    if (isNaN(numAmount)) return "₹ 0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // Compress image to reduce size
  const compressImage = (base64, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      if (!base64) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => {
        console.error("Error compressing image");
        resolve(base64);
      };
      img.src = base64;
    });
  };

  // Convert remote image to data URL (fetch first — works better with Cloudinary + html2canvas)
  const convertToBase64 = useCallback((url, compress = true) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }

      if (url.startsWith("data:image")) {
        if (compress) {
          compressImage(url, 800, 0.7).then(resolve);
        } else {
          resolve(url);
        }
        return;
      }

      const finishWithCanvas = () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const timeoutId = setTimeout(() => {
          console.warn("Image load timeout:", url);
          resolve(null);
        }, 12000);
        img.onload = () => {
          clearTimeout(timeoutId);
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxWidth = 800;
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL("image/jpeg", 0.7);
            resolve(base64);
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
          console.warn("Failed to load image (canvas path):", url);
          resolve(null);
        };
        img.src = url;
      };

      fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" })
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          return res.blob();
        })
        .then(
          (blob) =>
            new Promise((res, rej) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result);
              reader.onerror = rej;
              reader.readAsDataURL(blob);
            }),
        )
        .then((dataUrl) => {
          if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
            finishWithCanvas();
            return;
          }
          if (compress) {
            compressImage(dataUrl, 800, 0.7).then(resolve);
          } else {
            resolve(dataUrl);
          }
        })
        .catch(() => {
          finishWithCanvas();
        });
    });
  }, []);

  // Extract all data from the quotation prop
  const quotationData = quotation || {};
  const selectedCompany =
    companyOptions.find((c) => c?._id === selectedCompanyId) || null;

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!open) return;
      try {
        setLoadingCompanies(true);
        const res = await axios.get("/company");
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setCompanyOptions(list);
        if (!selectedCompanyId && list.length > 0) {
          setSelectedCompanyId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch companies for PDF preview:", err);
        setCompanyOptions([]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [open]);

  useEffect(() => {
    const fetchGlobalPolicyDefaults = async () => {
      if (!open) return;
      try {
        const res = await axios.get("/global-settings");
        const data = res?.data?.data || {};
        setGlobalPolicyDefaults({
          inclusions: Array.isArray(data?.inclusions) ? data.inclusions : [],
          exclusions: Array.isArray(data?.exclusions) ? data.exclusions : [],
          paymentPolicy:
            typeof data?.paymentPolicy === "string" ? data.paymentPolicy : "",
        });
      } catch (err) {
        console.error("Failed to fetch global settings for PDF:", err);
        setGlobalPolicyDefaults({
          inclusions: [],
          exclusions: [],
          paymentPolicy: "",
        });
      }
    };
    fetchGlobalPolicyDefaults();
  }, [open]);

  // Safely extract all needed data
  const customerName = getValue(quotationData, "customer.name", "Guest");
  const customerLocation = getValue(quotationData, "customer.location");
  const customerPhone = getValue(quotationData, "customer.phone");
  const customerEmail = getValue(quotationData, "customer.email");

  const pickupArrival = getValue(quotationData, "pickup.arrival");
  const pickupDeparture = getValue(quotationData, "pickup.departure");

  const hotelGuests = getValue(quotationData, "hotel.guests");
  const hotelRooms = getValue(quotationData, "hotel.rooms");
  const hotelMealPlan = getValue(quotationData, "hotel.mealPlan");
  const hotelType = getValue(quotationData, "hotel.hotelType");
  const hotelDestination = getValue(quotationData, "hotel.destination");
  const hotelItinerary = getValue(quotationData, "hotel.itinerary");

  const quotationTitle = getValue(
    quotationData,
    "quotationTitle",
    "Travel Quotation",
  );
  const destinationSummary = getValue(quotationData, "destinationSummary");
  const reference = getValue(quotationData, "reference");
  const date = getValue(quotationData, "date");

  const pricingTotal = getRawValue(quotationData, "pricing.total");
  const pricingDiscount = getValue(quotationData, "pricing.discount");
  const pricingGst = getValue(quotationData, "pricing.gst");

  const toNumber = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const totalFromPricing = toNumber(pricingTotal);
  const totalFromFooter = toNumber(getRawValue(quotationData, "footer.total"));
  const hotelPricingRows = Array.isArray(
    getRawValue(quotationData, "hotelPricingData"),
  )
    ? getRawValue(quotationData, "hotelPricingData")
    : [];
  const totalCostRow =
    hotelPricingRows.find((row) =>
      String(row?.destination || "")
        .toLowerCase()
        .includes("total quotation cost"),
    ) ||
    hotelPricingRows.find((row) =>
      String(row?.destination || "")
        .toLowerCase()
        .includes("quotation cost"),
    );
  const totalFromHotelRow =
    toNumber(totalCostRow?.standard) ||
    toNumber(totalCostRow?.deluxe) ||
    toNumber(totalCostRow?.superior);
  // Prefer pricing table totals because quotation.pricing.total can be stale in some flows.
  const effectiveTotal =
    totalFromHotelRow ?? totalFromPricing ?? totalFromFooter ?? 0;
  const standardTotal = toNumber(totalCostRow?.standard);
  const deluxeTotal = toNumber(totalCostRow?.deluxe);
  const superiorTotal = toNumber(totalCostRow?.superior);

  // Priority: selected company logo first, then quotation data logos
  const logoUrl =
    selectedCompany?.logo ||
    getValue(quotationData, "logo") ||
    getValue(quotationData, "footer.logo") ||
    getValue(quotationData, "companyLogo") ||
    null;

  const footerCompany =
    selectedCompany?.companyName ||
    getValue(quotationData, "footer.company", "Iconic Yatra");
  const footerAddress =
    selectedCompany?.address || getValue(quotationData, "footer.address");
  const footerPhone =
    selectedCompany?.phone || getValue(quotationData, "footer.phone");
  const footerEmail =
    selectedCompany?.email || getValue(quotationData, "footer.email");
  const footerWebsite =
    selectedCompany?.companyWebsite ||
    getValue(quotationData, "footer.website");
  const footerContact =
    selectedCompany?.authorizedSignatory?.name ||
    getValue(quotationData, "footer.contact");
  const footerContactDesignation =
    selectedCompany?.authorizedSignatory?.designation || "";
  const footerReceived = getValue(quotationData, "footer.received");
  const footerBalance = getValue(quotationData, "footer.balance");

  const fallbackInclusions = [
    "Welcome Drink on Arrival.",
    "Sanitised Private Vehicle AC for Sightseeing as per State Norms.",
    "Hotel Category Standard Type or Similar.",
    "Accommodation on Double Sharing Basis.",
    "Daily Complementary Breakfast as per Hotel Menu.",
    "Pick Up & Drop Facility From Airport/Railway Station.",
    "All Sightseeing as per places given or state norms on Priavte Basis.",
  ];
  const policiesInclusions = getValue(quotationData, "policies.inclusions", []);
  const policiesCancellationPolicy = getValue(
    quotationData,
    "policies.cancellationPolicy",
    [],
  );

  const days = getValue(quotationData, "days", []);
  const bannerImage = getValue(quotationData, "bannerImage", "");
  const hotelPricingData = hotelPricingRows;
  const isSummaryPricingRow = (row) => {
    const label = String(row?.destination || "").toLowerCase();
    return label.includes("quotation cost") || label.includes("igst");
  };
  const hasHotelNameValue = (value) => {
    const text = String(value || "").trim();
    if (!text || text === "-") return false;
    if (text.startsWith("₹")) return false;
    return true;
  };
  const nonSummaryRows = hotelPricingData.filter(
    (row) => !isSummaryPricingRow(row),
  );
  const renderHotelCellValue = (row, key) => {
    const value = row?.[key];
    if (isSummaryPricingRow(row)) return value || "-";
    return hasHotelNameValue(value) ? value : "";
  };
  const showStandardCol = nonSummaryRows.some((row) =>
    hasHotelNameValue(row?.standard),
  );
  const showDeluxeCol = nonSummaryRows.some((row) =>
    hasHotelNameValue(row?.deluxe),
  );
  const showSuperiorCol = nonSummaryRows.some((row) =>
    hasHotelNameValue(row?.superior),
  );
  const visiblePackageColumns = [
    showStandardCol,
    showDeluxeCol,
    showSuperiorCol,
  ].filter(Boolean).length;

  // Convert policies to array if they're strings
  const inclusionArray = Array.isArray(policiesInclusions)
    ? policiesInclusions
    : typeof policiesInclusions === "string"
      ? policiesInclusions.split("\n").filter((s) => s.trim())
      : typeof policiesInclusions === "object"
        ? Object.values(policiesInclusions)
        : [];
  const cancellationArray = Array.isArray(policiesCancellationPolicy)
    ? policiesCancellationPolicy
    : typeof policiesCancellationPolicy === "string"
      ? policiesCancellationPolicy.split("\n").filter((s) => s.trim())
      : typeof policiesCancellationPolicy === "object"
        ? Object.values(policiesCancellationPolicy)
        : [];
  const finalInclusionArray =
    inclusionArray.filter((item) => String(item || "").trim()).length > 0
      ? inclusionArray.filter((item) => String(item || "").trim())
      : (globalPolicyDefaults.inclusions?.length
          ? globalPolicyDefaults.inclusions
          : fallbackInclusions);

  const normalizeWebUrl = (value) => {
    if (value === undefined || value === null) return "";
    const s = String(value).trim();
    if (!s || s === "N/A") return "";
    if (/^https?:\/\//i.test(s)) return s;
    return "";
  };
  const companyWebsiteHref =
    normalizeWebUrl(selectedCompany?.companyWebsite) ||
    normalizeWebUrl(footerWebsite);
  const paymentPolicyHref =
    normalizeWebUrl(selectedCompany?.paymentLink) || companyWebsiteHref;
  const termsConditionsHref =
    normalizeWebUrl(selectedCompany?.termsConditions) || companyWebsiteHref;
  const exclusionsPolicyHref = companyWebsiteHref;

  // Pre-load all images as base64 with compression
  useEffect(() => {
    const loadAllImages = async () => {
      if (!open) return;

      setRenderComplete(false);
      const loadedImages = {};

      console.log("Loading logo from URL:", logoUrl);

      // Load logo with compression (includes local logo if no other is provided)
      if (logoUrl && typeof logoUrl === "string" && logoUrl !== "null") {
        const base64Logo = await convertToBase64(logoUrl, true);
        if (base64Logo) {
          loadedImages.logo = base64Logo;
          console.log("Logo loaded successfully, length:", base64Logo.length);
        } else {
          console.warn("Failed to load logo");
        }
      } else {
        console.warn("No logo URL provided");
      }

      // Load banner with compression
      if (bannerImage && typeof bannerImage === "string") {
        const base64Banner = await convertToBase64(bannerImage, true);
        if (base64Banner) loadedImages.banner = base64Banner;
      }

      // Load day images with compression
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (
          day.image &&
          day.image.preview &&
          typeof day.image.preview === "string"
        ) {
          const base64DayImage = await convertToBase64(day.image.preview, true);
          if (base64DayImage) loadedImages[`day_${i}`] = base64DayImage;
        }
      }

      setImageElements(loadedImages);
      setImagesLoaded(true);

      // Wait for DOM to update with images
      setTimeout(() => {
        setRenderComplete(true);
      }, 500);
    };

    if (open) {
      loadAllImages();
    }
  }, [open, logoUrl, bannerImage, days, convertToBase64]);

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      setError("");

      // Wait for render to complete
      if (!renderComplete) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Dynamically import required libraries
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const element = printRef.current;
      if (!element) {
        throw new Error("PDF content not found");
      }

      // Store original styles
      const originalStyle = {
        overflow: element.style.overflow,
        height: element.style.height,
        maxHeight: element.style.maxHeight,
      };

      // Temporarily modify styles to capture full content
      element.style.overflow = "visible";
      element.style.height = "auto";
      element.style.maxHeight = "none";

      // Re-embed logo as data URL so the capture always includes it (CORS-safe for canvas)
      if (logoUrl && typeof logoUrl === "string") {
        const freshLogo = await convertToBase64(logoUrl, true);
        if (freshLogo) {
          element.querySelectorAll('img[alt="Company Logo"]').forEach((img) => {
            img.removeAttribute("crossorigin");
            img.src = freshLogo;
          });
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      // Additional wait for any dynamic content
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Capture the entire content with optimized settings
      const canvas = await html2canvas(element, {
        scale: 2, // Increased for better quality
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: async (clonedDoc) => {
          const style = clonedDoc.createElement("style");
          style.textContent = `
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pdf-page {
              page-break-after: always;
              break-after: page;
            }
            body {
              margin: 0;
              padding: 0;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          `;
          clonedDoc.head.appendChild(style);

          const images = clonedDoc.querySelectorAll("img");
          await Promise.all(
            Array.from(images).map(async (img) => {
              const src = img.getAttribute("src") || img.src || "";
              if (src && /^https?:\/\//i.test(src)) {
                const inlined = await convertToBase64(src, true);
                if (inlined) {
                  img.removeAttribute("crossorigin");
                  img.src = inlined;
                }
              }
              if (img.complete && img.naturalHeight !== 0) return;
              await new Promise((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(resolve, 3000);
              });
            }),
          );
        },
      });

      // Restore original styles
      element.style.overflow = originalStyle.overflow;
      element.style.height = originalStyle.height;
      element.style.maxHeight = originalStyle.maxHeight;

      // Convert canvas to JPEG with compression for smaller PDF size
      const imgData = canvas.toDataURL("image/jpeg", 0.9);

      // PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");

      // Add first page with compressed image
      let heightLeft = imgHeight;
      let position = 0;
      let pageNum = 1;

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );
        heightLeft -= pageHeight;
        pageNum++;
      }

      // Add PDF metadata
      pdf.setProperties({
        title: `${customerName}_Quotation_${reference || Date.now()}`,
        subject: `Travel Quotation for ${customerName}`,
        author: footerCompany,
        creator: "Iconic Yatra Travel Management System",
        keywords: "travel, quotation, itinerary, package",
      });

      // Add page numbers if multiple pages
      if (pageNum > 1) {
        for (let i = 1; i <= pageNum; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Page ${i} of ${pageNum}`, imgWidth - 30, pageHeight - 10);
        }
      }

      // Save the PDF
      pdf.save(
        `${customerName.replace(/\s/g, "_")}_Quotation_${reference || Date.now()}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("PDF generation failed: " + (err.message || "Please try again"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const content = printRef.current.cloneNode(true);

    // Add print-specific styles
    const styles = document.querySelector("style")?.innerHTML || "";
    const materialStyles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    )
      .map((link) => link.href)
      .filter((href) => href.includes("mui") || href.includes("material"))
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${customerName} - Travel Quotation</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', 'Arial', sans-serif;
              padding: 20px;
              background: white;
            }
            @media print {
              body {
                padding: 0;
              }
              .pdf-page {
                page-break-after: always;
                break-after: page;
              }
              .no-break {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
            ${styles}
          </style>
          ${materialStyles}
        </head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // PDF Content Component - Renders EVERYTHING
  const PDFContent = () => (
    <Box
      ref={contentRef}
      sx={{
        fontFamily: "'Segoe UI', 'Arial', sans-serif",
        background: "#fff",
        width: "100%",
        position: "relative",
      }}
    >
      {/* PAGE 1 - Header, Customer Info, Itinerary */}
      <Box className="pdf-page" sx={{ p: 3, pageBreakAfter: "always" }}>
        {/* Header Section with Centered Logo */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          {/* Logo Centered - Now using local logo from folder */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            {imageElements.logo ? (
              <img
                src={imageElements.logo}
                alt="Company Logo"
                style={{
                  height: "80px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error("Logo failed to display in PDF");
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "80px",
                  height: "80px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  {footerCompany.charAt(0)}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Travel. Explore. Experience.
          </Typography>

          {/* Quotation Title and Reference */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              CUSTOM QUOTATION
            </Typography>
            {reference && reference !== "N/A" && (
              <Typography variant="caption" display="block">
                Ref No: {reference}
              </Typography>
            )}
            {date && date !== "N/A" && (
              <Typography variant="caption" display="block">
                Date: {date}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Banner Image Section */}
        {imageElements.banner ? (
          <Box sx={{ position: "relative", mb: 3 }}>
            <img
              src={imageElements.banner}
              alt="Banner"
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
              crossOrigin="anonymous"
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                color: "white",
                p: 2,
                borderRadius: "0 0 12px 12px",
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {quotationTitle}
              </Typography>
              {destinationSummary && destinationSummary !== "N/A" && (
                <Typography variant="body2">{destinationSummary}</Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              mb: 3,
              textAlign: "center",
              py: 3,
              bgcolor: "#f5f5f5",
              borderRadius: 2,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="primary">
              {quotationTitle}
            </Typography>
            {destinationSummary && destinationSummary !== "N/A" && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {destinationSummary}
              </Typography>
            )}
          </Box>
        )}

        {/* Customer Information Card */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, background: "#f8f9ff" }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
          >
            <Person fontSize="small" color="primary" /> Customer Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography fontWeight="bold" variant="body1">
                {customerName}
              </Typography>
              {customerLocation && customerLocation !== "N/A" && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <LocationOn
                    fontSize="small"
                    sx={{ fontSize: 12, color: "#666" }}
                  />
                  <Typography variant="body2">{customerLocation}</Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              {customerPhone && customerPhone !== "N/A" && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LocalPhone
                    fontSize="small"
                    sx={{ fontSize: 12, color: "#666" }}
                  />
                  <Typography variant="body2">{customerPhone}</Typography>
                </Box>
              )}
              {customerEmail && customerEmail !== "N/A" && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <Email
                    fontSize="small"
                    sx={{ fontSize: 12, color: "#666" }}
                  />
                  <Typography variant="body2">{customerEmail}</Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Travel & Hotel Details */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <FlightTakeoff fontSize="small" color="primary" />
                <Typography fontWeight="bold">Pickup Details</Typography>
              </Box>
              {pickupArrival && pickupArrival !== "N/A" ? (
                <Typography variant="body2">
                  Arrival: {pickupArrival}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not specified
                </Typography>
              )}
              {pickupDeparture && pickupDeparture !== "N/A" ? (
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
                >
                  <FlightLand fontSize="small" color="primary" />
                  <Typography variant="body2">
                    Departure: {pickupDeparture}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Departure not specified
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Hotel fontSize="small" color="primary" />
                <Typography fontWeight="bold">Accommodation</Typography>
              </Box>
              {hotelGuests && hotelGuests !== "N/A" && (
                <Typography variant="body2">
                  👥 Guests: {hotelGuests}
                </Typography>
              )}
              {hotelRooms && hotelRooms !== "N/A" && (
                <Typography variant="body2">🛏️ Rooms: {hotelRooms}</Typography>
              )}
              {hotelType && hotelType !== "N/A" && (
                <Typography variant="body2">
                  ⭐ Hotel Type: {hotelType}
                </Typography>
              )}
              {hotelMealPlan && hotelMealPlan !== "N/A" && (
                <Typography variant="body2">
                  🍽️ Meal Plan: {hotelMealPlan}
                </Typography>
              )}
              {hotelDestination && hotelDestination !== "N/A" && (
                <Typography variant="body2">
                  📍 Destination: {hotelDestination}
                </Typography>
              )}
              {!hotelGuests && !hotelRooms && !hotelType && !hotelMealPlan && (
                <Typography variant="body2" color="text.secondary">
                  Not specified
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Itinerary Section Title */}
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          📋 Detailed Itinerary
        </Typography>

        {/* General Itinerary */}
        {hotelItinerary && hotelItinerary !== "N/A" && (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {hotelItinerary}
            </Typography>
          </Paper>
        )}

        {/* Day-wise Itinerary */}
        {days && days.length > 0 ? (
          days.map((day, i) => (
            <Paper key={i} elevation={1} sx={{ mb: 2, overflow: "hidden" }}>
              {imageElements[`day_${i}`] && (
                <img
                  src={imageElements[`day_${i}`]}
                  alt={day.title || `Day ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                  }}
                  crossOrigin="anonymous"
                />
              )}
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography
                    fontWeight="bold"
                    variant="subtitle1"
                    color="primary"
                  >
                    Day {i + 1}: {day.title || `Day ${i + 1}`}
                  </Typography>
                  {(day.date || day.dayDate) &&
                    (day.date !== "N/A" || day.dayDate !== "N/A") && (
                      <Chip
                        label={day.dayDate || day.date}
                        size="small"
                        sx={{ fontSize: "10px" }}
                      />
                    )}
                </Box>
                <Typography
                  variant="body2"
                  paragraph
                  sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                >
                  {day.description || "No description available"}
                </Typography>
                {(day.meal || (day.hotel && day.hotel !== "N/A")) && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mt: 1,
                      pt: 1,
                      borderTop: "1px solid #f0f0f0",
                      flexWrap: "wrap",
                    }}
                  >
                    {day.meal && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Restaurant
                          fontSize="small"
                          sx={{ fontSize: 14, color: "#666" }}
                        />
                        <Typography variant="caption">
                          Meal: {day.meal}
                        </Typography>
                      </Box>
                    )}
                    {day.hotel && day.hotel !== "N/A" && (
                      <Typography variant="caption" color="text.secondary">
                        🏨 Hotel: {day.hotel}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          ))
        ) : (
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography color="text.secondary">
              No itinerary details available
            </Typography>
          </Paper>
        )}
      </Box>

      {/* PAGE 2 - Pricing and Payment Summary */}
      <Box className="pdf-page" sx={{ p: 3, pageBreakAfter: "always" }}>
        {/* Hotel Pricing Table */}
        {hotelPricingData && hotelPricingData.length > 0 && (
          <>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              🏨 Hotel & Package Pricing
            </Typography>
            <TableContainer
              component={Paper}
              elevation={2}
              sx={{ mb: 3, overflowX: "auto" }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ background: "#667eea" }}>
                  <TableRow>
                    {hotelPricingData[0] &&
                      Object.keys(hotelPricingData[0]).map(
                        (header) =>
                          (header === "destination" ||
                            header === "nights" ||
                            (header === "standard" && showStandardCol) ||
                            (header === "deluxe" && showDeluxeCol) ||
                            (header === "superior" && showSuperiorCol)) && (
                            <TableCell
                              key={header}
                              sx={{
                                color: "white",
                                fontWeight: "bold",
                                textTransform: "capitalize",
                              }}
                            >
                              {header.replace(/([A-Z])/g, " $1").trim()}
                            </TableCell>
                          ),
                      )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hotelPricingData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row?.destination || "-"}</TableCell>
                      <TableCell>{row?.nights || "-"}</TableCell>
                      {showStandardCol && (
                        <TableCell>
                          {renderHotelCellValue(row, "standard")}
                        </TableCell>
                      )}
                      {showDeluxeCol && (
                        <TableCell>
                          {renderHotelCellValue(row, "deluxe")}
                        </TableCell>
                      )}
                      {showSuperiorCol && (
                        <TableCell>
                          {renderHotelCellValue(row, "superior")}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Payment Summary */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          💰 Payment Summary
        </Typography>

        <TableContainer component={Paper} elevation={2} sx={{ mb: 3 }}>
          <Table>
            <TableHead sx={{ background: "#667eea" }}>
              <TableRow>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", fontSize: "14px" }}
                >
                  Particulars
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: "bold", fontSize: "14px" }}
                >
                  Amount (₹)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visiblePackageColumns > 1 ? (
                <>
                  {showStandardCol && standardTotal > 0 && (
                    <TableRow>
                      <TableCell>Total Package Cost (Standard)</TableCell>
                      <TableCell align="right">
                        {formatCurrency(standardTotal)}
                      </TableCell>
                    </TableRow>
                  )}
                  {showDeluxeCol && deluxeTotal > 0 && (
                    <TableRow>
                      <TableCell>Total Package Cost (Deluxe)</TableCell>
                      <TableCell align="right">
                        {formatCurrency(deluxeTotal)}
                      </TableCell>
                    </TableRow>
                  )}
                  {showSuperiorCol && superiorTotal > 0 && (
                    <TableRow>
                      <TableCell>Total Package Cost (Superior)</TableCell>
                      <TableCell align="right">
                        {formatCurrency(superiorTotal)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                effectiveTotal > 0 && (
                  <TableRow>
                    <TableCell>Total Package Cost</TableCell>
                    <TableCell align="right">
                      {formatCurrency(effectiveTotal)}
                    </TableCell>
                  </TableRow>
                )
              )}
              {visiblePackageColumns <= 1 &&
                pricingDiscount &&
                pricingDiscount !== "N/A" &&
                pricingDiscount !== "₹ 0" &&
                pricingDiscount !== 0 && (
                  <TableRow>
                    <TableCell>Discount</TableCell>
                    <TableCell align="right" sx={{ color: "#2e7d32" }}>
                      -{formatCurrency(pricingDiscount)}
                    </TableCell>
                  </TableRow>
                )}
              {visiblePackageColumns <= 1 &&
                pricingGst &&
                pricingGst !== "N/A" &&
                pricingGst !== "₹ 0" &&
                pricingGst !== 0 && (
                  <TableRow>
                    <TableCell>GST</TableCell>
                    <TableCell align="right">
                      {formatCurrency(pricingGst)}
                    </TableCell>
                  </TableRow>
                )}
              {visiblePackageColumns <= 1 && (
                <TableRow sx={{ background: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
                    Grand Total
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", fontSize: "16px" }}
                  >
                    {formatCurrency(effectiveTotal)}
                  </TableCell>
                </TableRow>
              )}
              {footerReceived &&
                footerReceived !== "N/A" &&
                footerReceived !== "₹ 0" &&
                footerReceived !== 0 && (
                  <TableRow>
                    <TableCell>Amount Received</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: "#2e7d32", fontWeight: "bold" }}
                    >
                      {formatCurrency(footerReceived)}
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Additional Notes if any */}
        {(pricingDiscount === "₹ 0" || pricingDiscount === 0) && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: "block" }}
          >
            * No discount applied to this quotation
          </Typography>
        )}
      </Box>

      {/* PAGE 3 - All Policies and Terms */}
      <Box className="pdf-page" sx={{ p: 3 }}>
        {/* Inclusion Policy */}
        {finalInclusionArray.length > 0 && (
            <Paper elevation={2} sx={{ p: 2, mb: 2, background: "#e8f5e9" }}>
              <Typography
                fontWeight="bold"
                sx={{
                  color: "#2e7d32",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CheckCircle fontSize="small" /> ✅ Inclusion Policy
              </Typography>
              {finalInclusionArray.map(
                (item, idx) =>
                  item &&
                  item !== "" && (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{ mb: 0.5, ml: 2 }}
                    >
                      • {item}
                    </Typography>
                  ),
              )}
            </Paper>
          )}

        {/* Exclusion Policy — as per company website */}
        <Paper elevation={2} sx={{ p: 2, mb: 2, background: "#ffebee" }}>
          <Typography
            fontWeight="bold"
            sx={{
              color: "#c62828",
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Cancel fontSize="small" /> Exclusion Policy
          </Typography>
          <Typography variant="body2" sx={{ ml: 0 }}>
            As per company website
            {exclusionsPolicyHref ? (
              <>
                {": "}
                <Link
                  href={exclusionsPolicyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="always"
                >
                  {exclusionsPolicyHref}
                </Link>
              </>
            ) : (
              "."
            )}
          </Typography>
        </Paper>

        {/* Payment Policy — as per company website */}
        <Paper elevation={2} sx={{ p: 2, mb: 2, background: "#e3f2fd" }}>
          <Typography
            fontWeight="bold"
            sx={{
              color: "#1565c0",
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Payments fontSize="small" /> Payment Policy
          </Typography>
          <Typography variant="body2" sx={{ ml: 0 }}>
            As per company website
            {paymentPolicyHref ? (
              <>
                {": "}
                <Link
                  href={paymentPolicyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="always"
                >
                  {paymentPolicyHref}
                </Link>
              </>
            ) : (
              "."
            )}
          </Typography>
        </Paper>

        {/* Cancellation & Refund Policy */}
        {cancellationArray.length > 0 &&
          cancellationArray.some((item) => item && item !== "") && (
            <Paper elevation={2} sx={{ p: 2, mb: 2, background: "#fff3e0" }}>
              <Typography
                fontWeight="bold"
                sx={{
                  color: "#e65100",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <MoneyOff fontSize="small" /> 🔄 Cancellation & Refund Policy
              </Typography>
              {cancellationArray.map(
                (item, idx) =>
                  item &&
                  item !== "" && (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{ mb: 0.5, ml: 2 }}
                    >
                      • {item}
                    </Typography>
                  ),
              )}
            </Paper>
          )}

        {/* Terms & Conditions — link from company */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, background: "#f5f5f5" }}>
          <Typography
            fontWeight="bold"
            sx={{
              color: "#424242",
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Description fontSize="small" /> Terms &amp; Conditions
          </Typography>
          <Typography variant="body2" sx={{ ml: 0 }}>
            As per company website
            {termsConditionsHref ? (
              <>
                {": "}
                <Link
                  href={termsConditionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="always"
                >
                  {termsConditionsHref}
                </Link>
              </>
            ) : (
              "."
            )}
          </Typography>
        </Paper>

        {/* Footer Section */}
        <Divider sx={{ my: 2 }} />
        <Box textAlign="center">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mb: 1,
              flexWrap: "wrap",
            }}
          >
            {imageElements.logo && (
              <img
                src={imageElements.logo}
                alt="Company Logo"
                style={{ height: "40px", width: "auto", objectFit: "contain" }}
                crossOrigin="anonymous"
              />
            )}
          </Box>
          {footerAddress && footerAddress !== "N/A" && (
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              📍 {footerAddress}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 1,
            }}
          >
            {footerPhone && footerPhone !== "N/A" && (
              <Typography
                variant="caption"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                📞 {footerPhone}
              </Typography>
            )}
            {footerEmail && footerEmail !== "N/A" && (
              <Typography
                variant="caption"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                ✉️ {footerEmail}
              </Typography>
            )}
            {footerWebsite && footerWebsite !== "N/A" && (
              <Typography
                variant="caption"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                🌐 {footerWebsite}
              </Typography>
            )}
          </Box>
          {footerContact && footerContact !== "N/A" && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              👤 Contact Person: {footerContact}
              {footerContactDesignation ? ` (${footerContactDesignation})` : ""}
            </Typography>
          )}
          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 2, color: "#999", fontSize: "10px" }}
          >
            This is a computer generated quotation. No signature required.
          </Typography>
          <Typography
            variant="caption"
            display="block"
            sx={{ color: "#999", fontSize: "9px", mt: 0.5 }}
          >
            © {new Date().getFullYear()} {footerCompany}. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h6" fontWeight="bold">
            📄 Quotation Preview - {customerName}
          </Typography>

          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="pdf-company-select-label">Company</InputLabel>
              <Select
                labelId="pdf-company-select-label"
                value={selectedCompanyId}
                label="Company"
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                disabled={loadingCompanies}
              >
                {companyOptions.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              onClick={handlePrint}
              startIcon={<Print />}
              variant="outlined"
              disabled={!renderComplete}
            >
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              startIcon={
                loading ? <CircularProgress size={20} /> : <Download />
              }
              variant="contained"
              disabled={loading || !renderComplete}
              sx={{
                background: "#667eea",
                "&:hover": { background: "#5a67d8" },
              }}
            >
              {loading ? "Generating PDF..." : "Download PDF"}
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>

        {(!imagesLoaded || !renderComplete) && open && (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading all content and images...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we prepare your quotation
            </Typography>
          </Box>
        )}

        <Box
          ref={printRef}
          sx={{
            maxHeight: "70vh",
            overflowY: "auto",
            bgcolor: "#fff",
            display: imagesLoaded && renderComplete ? "block" : "none",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": { background: "#555" },
          }}
        >
          <PDFContent />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Close />} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationPDFDialog;
