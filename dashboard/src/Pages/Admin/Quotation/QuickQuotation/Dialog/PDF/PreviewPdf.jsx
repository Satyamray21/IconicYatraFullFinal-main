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

const QuotationPDFDialog = ({
  open,
  onClose,
  quotation,
  pdfHeading = "CUSTOM QUOTATION",
  onSendMail,
}) => {
  const printRef = useRef();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageElements, setImageElements] = useState({});
  const [renderComplete, setRenderComplete] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [emailContentMode, setEmailContentMode] = useState("short");
  const [globalPolicyDefaults, setGlobalPolicyDefaults] = useState({
    inclusions: [],
    exclusions: [],
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: "",
  });

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
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

  // Convert remote image to data URL
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
          if (
            typeof dataUrl !== "string" ||
            !dataUrl.startsWith("data:image")
          ) {
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
        const data = res?.data?.data || res?.data || {};
        setGlobalPolicyDefaults({
          inclusions: Array.isArray(data?.inclusions) ? data.inclusions : [],
          exclusions: Array.isArray(data?.exclusions) ? data.exclusions : [],
          paymentPolicy:
            typeof data?.paymentPolicy === "string" ? data.paymentPolicy : "",
          cancellationPolicy:
            typeof data?.cancellationPolicy === "string"
              ? data.cancellationPolicy
              : "",
          termsAndConditions:
            typeof data?.termsAndConditions === "string"
              ? data.termsAndConditions
              : "",
        });
      } catch (err) {
        console.error("Failed to fetch global settings for PDF:", err);
        setGlobalPolicyDefaults({
          inclusions: [],
          exclusions: [],
          paymentPolicy: "",
          cancellationPolicy: "",
          termsAndConditions: "",
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
  /** Same totals appear in Payment Summary — hide from the pricing table. */
  const isTotalsRowDuplicatedInPaymentSummary = (row) => {
    const label = String(row?.destination || "")
      .toLowerCase()
      .trim();
    return (
      label.includes("final package totals") ||
      label.includes("total quotation cost")
    );
  };
  const finalPackageTotalsRow = hotelPricingRows.find((row) =>
    String(row?.destination || "")
      .toLowerCase()
      .includes("final package totals"),
  );
  const totalCostRow =
    finalPackageTotalsRow ||
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
  const effectiveTotal =
    totalFromHotelRow ?? totalFromPricing ?? totalFromFooter ?? 0;
  const standardTotal = toNumber(totalCostRow?.standard);
  const deluxeTotal = toNumber(totalCostRow?.deluxe);
  const superiorTotal = toNumber(totalCostRow?.superior);

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

  const fallbackInclusions = [
    "Welcome Drink on Arrival.",
    "Sanitised Private Vehicle AC for Sightseeing as per State Norms.",
    "Hotel Category Standard Type or Similar.",
    "Accommodation on Double Sharing Basis.",
    "Daily Complementary Breakfast as per Hotel Menu.",
    "Pick Up & Drop Facility From Airport/Railway Station.",
    "All Sightseeing as per places given or state norms on Private Basis.",
  ];

  const fallbackCancellationPolicy = [
    "Cancellation Policy:",
    "• 30 days or more before departure: 25% of total tour cost",
    "• 29 - 20 days before departure: 50% of total tour cost",
    "• 19 - 10 days before departure: 75% of total tour cost",
    "• Less than 10 days before departure: 100% of total tour cost",
    "",
    "Refund Policy:",
    "• All refunds will be processed within 15-20 working days",
    "• Refund will be credited to the same payment method used at the time of booking",
    "• Bank charges, if any, will be deducted from the refund amount",
    "• No refund for unused services (hotel, transport, sightseeing, etc.)",
    "• In case of flight cancellations, airline refund policy will apply",
    "",
    "Note: The cancellation policy may vary during peak season (Dec-Jan), festivals, and long weekends.",
  ];

  const policiesInclusions = getValue(quotationData, "policies.inclusions", []);
  const additionalServices = Array.isArray(
    getRawValue(quotationData, "additionalServices"),
  )
    ? getRawValue(quotationData, "additionalServices")
    : [];
  const includedAdditionalServiceLines = additionalServices
    .filter((s) => String(s?.included || "").toLowerCase() === "yes")
    .map((s) => String(s?.particulars || "").trim())
    .filter(Boolean);
  const policiesCancellationPolicy = getValue(
    quotationData,
    "policies.cancellationPolicy",
    [],
  );

  const rawDays = getRawValue(quotationData, "days");
  const days = Array.isArray(rawDays) ? rawDays : [];
  const bannerImage = getValue(quotationData, "bannerImage", "");
  const hotelPricingData = hotelPricingRows.filter(
    (row) => !isTotalsRowDuplicatedInPaymentSummary(row),
  );

  const normalizePricingCell = (value) =>
    String(value ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  /** Hide placeholder hotel names (TBD etc.), but keep ₹ amounts. */
  const isTbdLikeHotelName = (value) => {
    const text = normalizePricingCell(value);
    if (!text || text === "-" || text === "—") return false;
    if (text.startsWith("₹")) return false;
    const compact = text.replace(/[\s._\-–—]/g, "").toUpperCase();
    if (compact === "TBD" || compact === "TBA") return true;
    if (/\bTBD\b/i.test(text)) return true;
    if (/\bTBA\b/i.test(text)) return true;
    if (/^tbd\b/i.test(text)) return true;
    return false;
  };

  const isSummaryPricingRow = (row) => {
    const label = String(row?.destination || "").toLowerCase();
    return (
      label.includes("quotation cost") ||
      label.includes("igst") ||
      label.includes("transportation") ||
      (label.includes("hotel") && label.includes("cost")) ||
      label.includes("final package")
    );
  };
  const getDestinationLabel = (row) =>
    String(row?.destination || "")
      .toLowerCase()
      .trim();
  const isTransportationCostRow = (row) => {
    const label = getDestinationLabel(row);
    return label.includes("transportation") && label.includes("cost");
  };
  const isHotelCostRow = (row) => {
    const label = getDestinationLabel(row);
    return label.includes("hotel") && label.includes("cost");
  };
  const parseNightsCount = (value) => {
    const match = String(value ?? "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  };
  const totalTripNights = hotelPricingData
    .filter((row) => !isSummaryPricingRow(row))
    .reduce((sum, row) => sum + parseNightsCount(row?.nights), 0);
  const getNightsCellValue = (row) => {
    if (isTransportationCostRow(row) && totalTripNights > 0) {
      return `${totalTripNights + 1} D`;
    }
    if (isHotelCostRow(row) && totalTripNights > 0) {
      return `${totalTripNights} N`;
    }
    const txt = String(row?.nights || "-").trim();
    return txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : "-";
  };
  const isCurrencyCell = (value) => {
    const text = String(value || "").trim();
    return text.startsWith("₹") || /^rs\.?\s+/i.test(text);
  };
  const hasHotelNameValue = (value) => {
    const text = normalizePricingCell(value);
    if (!text || text === "-") return false;
    if (text === "—") return false;
    if (isTbdLikeHotelName(text)) return false;
    if (text.startsWith("₹")) return false;
    return true;
  };
  const isDestinationHotelPricingRow = (row) => !isSummaryPricingRow(row);
  const renderHotelCellValue = (row, key) => {
    const value = row?.[key];
    if (isSummaryPricingRow(row)) return value || "-";
    const v = normalizePricingCell(value);
    if (!v) return "";
    if (isTbdLikeHotelName(v)) return "";
    if (isCurrencyCell(v)) return v;
    if (!hasHotelNameValue(value)) return "";
    const text = v;
    const firstUpper = text.charAt(0).toUpperCase() + text.slice(1);
    return `${firstUpper} / Similar`;
  };
  const toHeaderLabel = (header) => {
    if (header === "destination") return "Destination";
    if (header === "nights") return "Nights";
    if (header === "standard") return "Standard";
    if (header === "deluxe") return "Deluxe";
    if (header === "superior") return "Superior";
    return String(header || "");
  };
  const showStandardCol = hotelPricingData.some(
    (row) =>
      isDestinationHotelPricingRow(row) && hasHotelNameValue(row?.standard),
  );
  const showDeluxeCol = hotelPricingData.some(
    (row) =>
      isDestinationHotelPricingRow(row) && hasHotelNameValue(row?.deluxe),
  );
  const showSuperiorCol = hotelPricingData.some(
    (row) =>
      isDestinationHotelPricingRow(row) && hasHotelNameValue(row?.superior),
  );
  const visiblePackageColumns = [
    showStandardCol,
    showDeluxeCol,
    showSuperiorCol,
  ].filter(Boolean).length;

  const inclusionArray = Array.isArray(policiesInclusions)
    ? policiesInclusions
    : typeof policiesInclusions === "string"
      ? policiesInclusions.split("\n").filter((s) => s.trim())
      : typeof policiesInclusions === "object"
        ? Object.values(policiesInclusions)
        : [];
  const exclusionArray = Array.isArray(globalPolicyDefaults.exclusions)
    ? globalPolicyDefaults.exclusions
    : [];
  const paymentPolicyArray =
    typeof globalPolicyDefaults.paymentPolicy === "string"
      ? globalPolicyDefaults.paymentPolicy.split("\n").filter((s) => s.trim())
      : [];
  const globalCancellationArray =
    typeof globalPolicyDefaults.cancellationPolicy === "string"
      ? globalPolicyDefaults.cancellationPolicy
          .split("\n")
          .filter((s) => s.trim())
      : [];

  const finalInclusionArray =
    globalPolicyDefaults.inclusions?.length > 0
      ? globalPolicyDefaults.inclusions
      : fallbackInclusions;
  const finalInclusionArrayWithServices = [
    ...finalInclusionArray,
    ...includedAdditionalServiceLines.map(
      (line) => `${line} (Additional Service Included)`,
    ),
  ];
  const finalExclusionArray = exclusionArray.filter((item) =>
    String(item || "").trim(),
  );
  const finalPaymentPolicyArray = paymentPolicyArray.filter((item) =>
    String(item || "").trim(),
  );

  const omitRedundantCancellationBodyLine = (line) => {
    const s = String(line || "").trim();
    if (!s) return false;
    if (/iconicyatra\.com\/cancellationandrefundpolicy/i.test(s)) return false;
    if (
      /must\s+visit\s+our\s+website\s+for\s+more\s+details\s+about\s+cancellation\s+policy/i.test(
        s,
      )
    ) {
      return false;
    }
    return true;
  };

  const finalCancellationArray = (
    globalCancellationArray.length > 0
      ? globalCancellationArray
      : fallbackCancellationPolicy
  ).filter(omitRedundantCancellationBodyLine);

  const normalizeWebUrl = (value) => {
    if (value === undefined || value === null) return "";
    const s = String(value).trim();
    if (!s || s === "N/A") return "";
    if (/^https?:\/\//i.test(s)) return s;
    return "";
  };

  // Get company website URL for Terms & Conditions
  const companyWebsiteUrl =
    normalizeWebUrl(selectedCompany?.companyWebsite) ||
    normalizeWebUrl(footerWebsite) ||
    "#";

  /** Full T&C page from company master (preferred over generic website). */
  const companyTermsUrl =
    normalizeWebUrl(selectedCompany?.termsConditions) || companyWebsiteUrl;

  const companyPaymentLink = normalizeWebUrl(selectedCompany?.paymentLink);

  const netBankingPayeeName =
    String(selectedCompany?.companyName || "").trim() ||
    (footerCompany && footerCompany !== "N/A"
      ? String(footerCompany).trim()
      : "");

  const companyCancellationUrl = normalizeWebUrl(
    selectedCompany?.cancellationPolicy,
  );

  // Pre-load all images as base64 with compression
  useEffect(() => {
    const loadAllImages = async () => {
      if (!open) return;

      setRenderComplete(false);
      const loadedImages = {};

      if (logoUrl && typeof logoUrl === "string" && logoUrl !== "null") {
        const base64Logo = await convertToBase64(logoUrl, true);
        if (base64Logo) {
          loadedImages.logo = base64Logo;
        }
      }

      if (bannerImage && typeof bannerImage === "string") {
        const base64Banner = await convertToBase64(bannerImage, true);
        if (base64Banner) loadedImages.banner = base64Banner;
      }

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const imgUrl =
          day?.image &&
          typeof day.image === "object" &&
          (typeof day.image.preview === "string"
            ? day.image.preview
            : typeof day.image.url === "string"
              ? day.image.url
              : "");
        if (imgUrl) {
          const base64DayImage = await convertToBase64(imgUrl, true);
          if (base64DayImage) loadedImages[`day_${i}`] = base64DayImage;
        }
      }

      setImageElements(loadedImages);
      setImagesLoaded(true);

      setTimeout(() => {
        setRenderComplete(true);
      }, 500);
    };

    if (open) {
      loadAllImages();
    }
  }, [open, logoUrl, bannerImage, days, convertToBase64]);

  const handleDownloadPDF = async ({ shouldDownload = true } = {}) => {
    try {
      setLoading(true);
      setError("");

      if (!renderComplete) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const pageElements = printRef.current.querySelectorAll(".pdf-page");

      if (pageElements.length === 0) {
        throw new Error("No pages found");
      }

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pageWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < pageElements.length; i++) {
        const page = pageElements[i];

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "-9999px";
        tempContainer.style.width = "800px";
        tempContainer.style.backgroundColor = "#ffffff";
        document.body.appendChild(tempContainer);

        const clone = page.cloneNode(true);
        tempContainer.appendChild(clone);

        const images = clone.querySelectorAll("img");
        for (const img of images) {
          const alt = img.getAttribute("alt");
          if (alt === "Company Logo" && imageElements.logo) {
            img.src = imageElements.logo;
          } else if (alt === "Banner" && imageElements.banner) {
            img.src = imageElements.banner;
          } else if (alt && alt.startsWith("Day ")) {
            // Extract day number from alt text
            const dayMatch = alt.match(/Day (\d+)/);
            if (dayMatch) {
              const dayIndex = parseInt(dayMatch[1]) - 1;
              if (imageElements[`day_${dayIndex}`]) {
                img.src = imageElements[`day_${dayIndex}`];
              }
            }
          }
        }

        const linkRectToMm = (anchorEl) => {
          if (!anchorEl) return null;
          const rect = anchorEl.getBoundingClientRect();
          const pageRect = page.getBoundingClientRect();
          return {
            x: (rect.left - pageRect.left) * 0.264583,
            y: (rect.top - pageRect.top) * 0.264583,
            width: rect.width * 0.264583,
            height: rect.height * 0.264583,
          };
        };

        const termsLinkEl =
          i === pageElements.length - 1
            ? clone.querySelector('a[data-pdf-link="terms"]')
            : null;
        const cancellationLinkEl =
          i === pageElements.length - 1
            ? clone.querySelector('a[data-pdf-link="cancellation"]')
            : null;

        const termsLinkPosition = linkRectToMm(termsLinkEl);
        const cancellationLinkPosition = linkRectToMm(cancellationLinkEl);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: false,
          allowTaint: false,
        });

        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          "FAST",
        );

        if (i === pageElements.length - 1) {
          if (termsLinkPosition) {
            const termsUrl =
              companyTermsUrl !== "#"
                ? companyTermsUrl
                : "https://www.iconicyatra.com";
            pdf.link(
              termsLinkPosition.x,
              termsLinkPosition.y,
              termsLinkPosition.width,
              termsLinkPosition.height,
              { url: termsUrl },
            );
          }
          if (cancellationLinkPosition && companyCancellationUrl) {
            pdf.link(
              cancellationLinkPosition.x,
              cancellationLinkPosition.y,
              cancellationLinkPosition.width,
              cancellationLinkPosition.height,
              { url: companyCancellationUrl },
            );
          }
        }
      }

      for (let i = 1; i <= pageElements.length; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${pageElements.length}`,
          pageWidth - 30,
          pageHeight - 10,
        );
      }

      pdf.setProperties({
        title: `${customerName}_Quotation_${reference || Date.now()}`,
        subject: `Travel Quotation for ${customerName}`,
        author: footerCompany,
        creator: "Iconic Yatra Travel Management System",
      });

      const fileName = `${customerName.replace(/\s/g, "_")}_Quotation_${reference || Date.now()}.pdf`;
      if (shouldDownload) {
        pdf.save(fileName);
      }

      const blob = pdf.output("blob");
      const contentBase64 = await blobToBase64(blob);
      return {
        filename: fileName,
        contentBase64,
        mimeType: "application/pdf",
      };
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("PDF generation failed: " + (err.message || "Please try again"));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSendMailWithPdf = async () => {
    if (typeof onSendMail !== "function") return;
    const payload = await handleDownloadPDF({ shouldDownload: false });
    if (!payload?.contentBase64) return;
    onSendMail({
      pdfAttachment: payload,
      previewPdfMode: emailContentMode === "short",
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const content = printRef.current.cloneNode(true);

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
            }
          </style>
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

  // Split days into chunks of 2 per page
  const chunkSize = 2;
  const dayChunks = [];
  for (let i = 0; i < days.length; i += chunkSize) {
    dayChunks.push(days.slice(i, i + chunkSize));
  }

  // Render individual day card with full content
  const renderDayCard = (day, globalIndex) => (
    <div
      key={globalIndex}
      style={{ marginBottom: "25px", pageBreakInside: "avoid" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {imageElements[`day_${globalIndex}`] && (
          <img
            src={imageElements[`day_${globalIndex}`]}
            alt={`Day ${globalIndex + 1}`}
            style={{
              width: "100%",
              height: "250px",
              objectFit: "cover",
            }}
          />
        )}
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div
              style={{ fontWeight: "bold", color: "#667eea", fontSize: "18px" }}
            >
              Day {globalIndex + 1}: {day.title || `Day ${globalIndex + 1}`}
            </div>
            {(day.date || day.dayDate) &&
              (day.date !== "N/A" || day.dayDate !== "N/A") && (
                <span
                  style={{
                    background: "#667eea",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {day.dayDate || day.date}
                </span>
              )}
          </div>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              marginTop: "10px",
              whiteSpace: "pre-wrap",
              color: "#333",
            }}
          >
            {day.description || "No description available"}
          </div>
          {(day.meal || (day.hotel && day.hotel !== "N/A")) && (
            <div
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "15px",
                paddingTop: "12px",
                borderTop: "1px solid #e0e0e0",
                flexWrap: "wrap",
              }}
            >
              {day.meal && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#555",
                    background: "#f5f5f5",
                    padding: "5px 12px",
                    borderRadius: "20px",
                  }}
                >
                  <span>🍽️</span> Meal: {day.meal}
                </div>
              )}
              {day.hotel && day.hotel !== "N/A" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#555",
                    background: "#f5f5f5",
                    padding: "5px 12px",
                    borderRadius: "20px",
                  }}
                >
                  <span>🏨</span> Hotel: {day.hotel}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // PAGE 1: Company Logo, Ref, Quotation Name, Banner, Customer Details, Pickup, Accommodation
  const Page1 = () => (
    <div
      className="pdf-page"
      style={{
        padding: "25px",
        position: "relative",
        background: "#fff",
        minHeight: "297mm",
      }}
    >
      {/* Header with Logo */}
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "15px",
          }}
        >
          {imageElements.logo ? (
            <img
              src={imageElements.logo}
              alt="Company Logo"
              style={{ height: "80px", width: "auto", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ color: "white", fontWeight: "bold", fontSize: "32px" }}
              >
                {footerCompany.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
          Travel. Explore. Experience.
        </div>
        <div>
          <h3 style={{ margin: 0, color: "#667eea", fontSize: "20px" }}>
            {pdfHeading}
          </h3>
          {reference && reference !== "N/A" && (
            <div style={{ fontSize: "12px", marginTop: "8px", color: "#555" }}>
              Ref No: {reference}
            </div>
          )}
          {date && date !== "N/A" && (
            <div style={{ fontSize: "12px", color: "#555" }}>Date: {date}</div>
          )}
        </div>
      </div>

      <Divider sx={{ my: 2 }} />

      {/* Banner Image */}
      {imageElements.banner && (
        <div style={{ marginBottom: "25px" }}>
          <img
            src={imageElements.banner}
            alt="Banner"
            style={{
              width: "100%",
              height: "220px",
              objectFit: "cover",
              borderRadius: "12px",
            }}
          />
          <div style={{ marginTop: "15px", textAlign: "center" }}>
            <h2 style={{ margin: 0, color: "#667eea", fontSize: "22px" }}>
              {quotationTitle}
            </h2>
            {destinationSummary && destinationSummary !== "N/A" && (
              <div
                style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}
              >
                {destinationSummary}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Details */}
      <div
        style={{
          padding: "18px",
          background: "linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "12px",
            fontSize: "16px",
            color: "#667eea",
          }}
        >
          👤 Customer Details
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <div>
            <div style={{ fontWeight: "bold", fontSize: "15px" }}>
              {customerName}
            </div>
            {customerLocation && customerLocation !== "N/A" && (
              <div
                style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}
              >
                📍 {customerLocation}
              </div>
            )}
          </div>
          <div>
            {customerPhone && customerPhone !== "N/A" && (
              <div style={{ fontSize: "13px", marginBottom: "5px" }}>
                📞 {customerPhone}
              </div>
            )}
            {customerEmail && customerEmail !== "N/A" && (
              <div style={{ fontSize: "13px" }}>✉️ {customerEmail}</div>
            )}
          </div>
        </div>
      </div>

      {/* Pickup and Accommodation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "18px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            padding: "18px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "12px",
              fontSize: "16px",
              color: "#667eea",
            }}
          >
            ✈️ Pickup Details
          </div>
          {pickupArrival && pickupArrival !== "N/A" ? (
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>
              🛬 Arrival: {pickupArrival}
            </div>
          ) : (
            <div style={{ fontSize: "14px", color: "#999" }}>Not specified</div>
          )}
          {pickupDeparture && pickupDeparture !== "N/A" ? (
            <div style={{ fontSize: "14px" }}>
              🛫 Departure: {pickupDeparture}
            </div>
          ) : (
            <div style={{ fontSize: "14px", color: "#999" }}>
              Departure not specified
            </div>
          )}
        </div>
        <div
          style={{
            padding: "18px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "12px",
              fontSize: "16px",
              color: "#667eea",
            }}
          >
            🏨 Accommodation
          </div>
          {hotelGuests && hotelGuests !== "N/A" && (
            <div style={{ fontSize: "14px", marginBottom: "6px" }}>
              👥 Guests: {hotelGuests}
            </div>
          )}
          {hotelRooms && hotelRooms !== "N/A" && (
            <div style={{ fontSize: "14px", marginBottom: "6px" }}>
              🛏️ Rooms: {hotelRooms}
            </div>
          )}
          {hotelType && hotelType !== "N/A" && (
            <div style={{ fontSize: "14px", marginBottom: "6px" }}>
              ⭐ Hotel Type: {hotelType}
            </div>
          )}
          {hotelMealPlan && hotelMealPlan !== "N/A" && (
            <div style={{ fontSize: "14px", marginBottom: "6px" }}>
              🍽️ Meal Plan: {hotelMealPlan}
            </div>
          )}
          {hotelDestination && hotelDestination !== "N/A" && (
            <div style={{ fontSize: "14px" }}>
              📍 Destination: {hotelDestination}
            </div>
          )}
          {!hotelGuests && !hotelRooms && !hotelType && !hotelMealPlan && (
            <div style={{ fontSize: "14px", color: "#999" }}>Not specified</div>
          )}
        </div>
      </div>

      {/* General Itinerary Note */}
      {hotelItinerary && hotelItinerary !== "N/A" && (
        <div
          style={{
            padding: "15px",
            background: "#fff8e1",
            borderRadius: "8px",
            marginTop: "10px",
            borderLeft: "4px solid #ffc107",
          }}
        >
          <div
            style={{ fontSize: "13px", color: "#856404", lineHeight: "1.6" }}
          >
            <strong>📝 Note:</strong> {hotelItinerary}
          </div>
        </div>
      )}
    </div>
  );

  // Itinerary Pages - 2 days per page with full content
  const ItineraryPages = () => {
    return dayChunks.map((chunk, pageIndex) => (
      <div
        key={`itinerary-page-${pageIndex}`}
        className="pdf-page"
        style={{ padding: "25px", background: "#fff", minHeight: "297mm" }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "22px",
            marginBottom: "25px",
            borderBottom: "3px solid #667eea",
            paddingBottom: "12px",
            color: "#333",
          }}
        >
          📋 Detailed Itinerary
        </div>
        {chunk.map((day, dayIndex) =>
          renderDayCard(day, pageIndex * chunkSize + dayIndex),
        )}
      </div>
    ));
  };

  // Combined Page: Pricing + Payment Summary + Inclusion Policy
  const CombinedPricingPage = () => (
    <div
      className="pdf-page"
      style={{ padding: "25px", background: "#fff", minHeight: "297mm" }}
    >
      {/* Hotel & Package Pricing Section */}
      {hotelPricingData && hotelPricingData.length > 0 && (
        <div style={{ marginBottom: "35px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "20px",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            🏨 Hotel & Package Pricing
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#667eea" }}>
                  {[
                    { key: "destination", show: true },
                    { key: "nights", show: true },
                    { key: "standard", show: showStandardCol },
                    { key: "deluxe", show: showDeluxeCol },
                    { key: "superior", show: showSuperiorCol },
                  ]
                    .filter((h) => h.show)
                    .map((h) => (
                      <th
                        key={h.key}
                        style={{
                          color: "white",
                          padding: "14px",
                          textAlign: "left",
                          fontWeight: "bold",
                          textTransform: "none",
                        }}
                      >
                        {toHeaderLabel(h.key)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {hotelPricingData
                .filter(
    (row) =>
      !isTransportationCostRow(row) &&
      !isHotelCostRow(row)
  ).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>
                      {(() => {
                        const txt = String(row?.destination || "-").trim();
                        return txt
                          ? txt.charAt(0).toUpperCase() + txt.slice(1)
                          : "-";
                      })()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {getNightsCellValue(row)}
                    </td>
                    {showStandardCol && (
                      <td style={{ padding: "12px" }}>
                        {renderHotelCellValue(row, "standard")}
                      </td>
                    )}
                    {showDeluxeCol && (
                      <td style={{ padding: "12px" }}>
                        {renderHotelCellValue(row, "deluxe")}
                      </td>
                    )}
                    {showSuperiorCol && (
                      <td style={{ padding: "12px" }}>
                        {renderHotelCellValue(row, "superior")}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Summary Section */}
      <div style={{ marginBottom: "35px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "20px",
            marginBottom: "20px",
            borderBottom: "3px solid #667eea",
            paddingBottom: "10px",
            color: "#333",
          }}
        >
          💰 Payment Summary
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "#667eea" }}>
                <th
                  style={{
                    color: "white",
                    padding: "14px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Particulars
                </th>
                <th
                  style={{
                    color: "white",
                    padding: "14px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {visiblePackageColumns > 1 ? (
                <>
                  {showStandardCol && standardTotal > 0 && (
                    <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        Total Package Cost (Standard)
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {formatCurrency(standardTotal)}
                      </td>
                    </tr>
                  )}
                  {showDeluxeCol && deluxeTotal > 0 && (
                    <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        Total Package Cost (Deluxe)
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {formatCurrency(deluxeTotal)}
                      </td>
                    </tr>
                  )}
                  {showSuperiorCol && superiorTotal > 0 && (
                    <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        Total Package Cost (Superior)
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {formatCurrency(superiorTotal)}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                effectiveTotal > 0 && (
                  <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>Total Package Cost</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {formatCurrency(effectiveTotal)}
                    </td>
                  </tr>
                )
              )}
              {visiblePackageColumns <= 1 &&
                pricingDiscount &&
                pricingDiscount !== "N/A" &&
                pricingDiscount !== "₹ 0" &&
                pricingDiscount !== 0 && (
                  <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>Discount</td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#2e7d32",
                      }}
                    >
                      -{formatCurrency(pricingDiscount)}
                    </td>
                  </tr>
                )}
              {visiblePackageColumns <= 1 &&
                pricingGst &&
                pricingGst !== "N/A" &&
                pricingGst !== "₹ 0" &&
                pricingGst !== 0 && (
                  <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>GST</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {formatCurrency(pricingGst)}
                    </td>
                  </tr>
                )}
              {visiblePackageColumns <= 1 && (
                <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                  <td style={{ padding: "14px", fontSize: "16px" }}>
                    Grand Total
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      textAlign: "right",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#667eea",
                    }}
                  >
                    {formatCurrency(effectiveTotal)}
                  </td>
                </tr>
              )}
              {footerReceived &&
                footerReceived !== "N/A" &&
                footerReceived !== "₹ 0" &&
                footerReceived !== 0 && (
                  <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>Amount Received</td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        color: "#2e7d32",
                        fontWeight: "bold",
                      }}
                    >
                      {formatCurrency(footerReceived)}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Net banking: beneficiary name matches selected company */}
      {netBankingPayeeName && (
        <div style={{ marginBottom: "35px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "16px",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            🏦 Net Banking / NEFT / RTGS
          </div>
          <div
            style={{
              padding: "18px",
              background: "#f3f6ff",
              borderRadius: "12px",
              borderLeft: "4px solid #667eea",
              fontSize: "14px",
              lineHeight: "1.7",
              color: "#333",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              Please transfer funds in favor of{" "}
              <strong style={{ color: "#667eea" }}>
                {netBankingPayeeName}
              </strong>
              . Use this name exactly as the account / beneficiary name when
              paying via net banking, NEFT, RTGS, or IMPS.
            </div>
            {companyPaymentLink && (
              <div style={{ marginTop: "12px" }}>
                <span style={{ fontWeight: "600" }}>Online payment: </span>
                <Link
                  href={companyPaymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ fontWeight: "bold", wordBreak: "break-all" }}
                >
                  {companyPaymentLink}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inclusion Policy Section */}
      {finalInclusionArrayWithServices.length > 0 && (
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "20px",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            ✅ Inclusion Policy
          </div>
          <div
            style={{
              padding: "18px",
              background: "#e8f5e9",
              borderRadius: "12px",
              borderLeft: "4px solid #2e7d32",
            }}
          >
            {finalInclusionArrayWithServices.map(
              (item, idx) =>
                item &&
                item !== "" && (
                  <div
                    key={idx}
                    style={{
                      fontSize: "13px",
                      marginLeft: "20px",
                      marginBottom: "8px",
                      lineHeight: "1.5",
                    }}
                  >
                    • {item}
                  </div>
                ),
            )}
          </div>
        </div>
      )}
    </div>
  );

  // SINGLE PAGE: Exclusion, Payment, Cancellation & Refund, Terms & Conditions, and Footer
  const PoliciesAndFooterPage = () => (
    <div
      className="pdf-page"
      style={{
        padding: "25px",
        background: "#fff",
        minHeight: "297mm",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Exclusion Policy */}
      {finalExclusionArray.length > 0 && (
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "15px",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            ❌ Exclusion Policy
          </div>
          <div
            style={{
              padding: "15px",
              background: "#ffebee",
              borderRadius: "12px",
              borderLeft: "4px solid #c62828",
            }}
          >
            {finalExclusionArray.map(
              (item, idx) =>
                item &&
                item !== "" && (
                  <div
                    key={idx}
                    style={{
                      fontSize: "13px",
                      marginLeft: "20px",
                      marginBottom: "6px",
                      lineHeight: "1.5",
                    }}
                  >
                    • {item}
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Payment Policy */}
      {finalPaymentPolicyArray.length > 0 && (
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "15px",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            💳 Payment Policy
          </div>
          <div
            style={{
              padding: "15px",
              background: "#e3f2fd",
              borderRadius: "12px",
              borderLeft: "4px solid #1565c0",
            }}
          >
            {finalPaymentPolicyArray.map(
              (item, idx) =>
                item &&
                item !== "" && (
                  <div
                    key={idx}
                    style={{
                      fontSize: "13px",
                      marginLeft: "20px",
                      marginBottom: "6px",
                      lineHeight: "1.5",
                    }}
                  >
                    • {item}
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Cancellation & Refund Policy */}
      {(finalCancellationArray.length > 0 || companyCancellationUrl) && (
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "15px",
              borderBottom: "3px solid #667eea",
              paddingBottom: "10px",
              color: "#333",
            }}
          >
            <MoneyOff sx={{ mr: 1 }} /> Cancellation & Refund Policy
          </div>
          <div
            style={{
              padding: "15px",
              background: "#fff3e0",
              borderRadius: "12px",
              borderLeft: "4px solid #e65100",
            }}
          >
            {companyCancellationUrl && (
              <div
                style={{
                  fontSize: "13px",
                  marginBottom: "12px",
                  textAlign: "center",
                  lineHeight: "1.6",
                  padding: "8px",
                  background: "#fff",
                  borderRadius: "8px",
                }}
              >
                Full cancellation & refund policy:{" "}
                <a
                  data-pdf-link="cancellation"
                  href={companyCancellationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1565c0",
                    textDecoration: "underline",
                    fontWeight: "bold",
                    wordBreak: "break-all",
                  }}
                >
                  {companyCancellationUrl}
                </a>
              </div>
            )}
            {finalCancellationArray.map(
              (item, idx) =>
                item &&
                item !== "" && (
                  <div
                    key={idx}
                    style={{
                      fontSize: "13px",
                      marginLeft: item.startsWith("•") ? "20px" : "0px",
                      marginBottom: "6px",
                      lineHeight: "1.6",
                      fontWeight: item.includes("Policy:") ? "bold" : "normal",
                      marginTop: item.includes("Policy:") ? "8px" : "0px",
                    }}
                  >
                    {item}
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div style={{ marginBottom: "15px" }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "20px",
            marginBottom: "12px",
            borderBottom: "3px solid #667eea",
            paddingBottom: "8px",
            color: "#333",
          }}
        >
          <Description sx={{ mr: 1 }} /> Terms & Conditions
        </div>
        <div
          style={{
            padding: "12px",
            background: "#fafafa",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#555",
              lineHeight: "1.5",
              padding: "8px",
            }}
          >
            Full terms & conditions:{" "}
            <a
              data-pdf-link="terms"
              href={
                companyTermsUrl !== "#" ? companyTermsUrl : companyWebsiteUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#667eea",
                textDecoration: "underline",
                fontWeight: "bold",
                wordBreak: "break-all",
              }}
            >
              {companyTermsUrl !== "#"
                ? companyTermsUrl
                : companyWebsiteUrl !== "#"
                  ? companyWebsiteUrl
                  : "www.iconicyatra.com"}
            </a>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div
        style={{ marginTop: "35px", textAlign: "center", paddingTop: "0px" }}
      >
        {imageElements.logo && (
          <img
            src={imageElements.logo}
            alt="Company Logo"
            style={{ height: "45px", width: "auto", marginBottom: "8px" }}
          />
        )}
        {footerAddress && footerAddress !== "N/A" && (
          <div style={{ fontSize: "11px", marginBottom: "4px", color: "#666" }}>
            📍 {footerAddress}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "8px",
            fontSize: "11px",
            color: "#666",
          }}
        >
          {footerPhone && footerPhone !== "N/A" && <div>📞 {footerPhone}</div>}
          {footerEmail && footerEmail !== "N/A" && <div>✉️ {footerEmail}</div>}
          {footerWebsite && footerWebsite !== "N/A" && (
            <div>🌐 {footerWebsite}</div>
          )}
        </div>
        {footerContact && footerContact !== "N/A" && (
          <div style={{ fontSize: "11px", marginTop: "6px", color: "#666" }}>
            👤 Contact Person: {footerContact}
            {footerContactDesignation ? ` (${footerContactDesignation})` : ""}
          </div>
        )}
        <div style={{ fontSize: "9px", color: "#999", marginTop: "10px" }}>
          This is a computer generated quotation. No signature required.
        </div>
        <div style={{ fontSize: "9px", color: "#999", marginTop: "3px" }}>
          © {new Date().getFullYear()} {footerCompany}. All rights reserved.
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>
            📄 Quotation Preview - {customerName}
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Company</InputLabel>
              <Select
                value={selectedCompanyId}
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
            {typeof onSendMail === "function" && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Email Content</InputLabel>
                <Select
                  value={emailContentMode}
                  onChange={(e) => setEmailContentMode(e.target.value)}
                >
                  <MenuItem value="short">Short Intro Content</MenuItem>
                  <MenuItem value="full">Full Email Content</MenuItem>
                </Select>
              </FormControl>
            )}
            {typeof onSendMail === "function" && (
              <Button
                onClick={handleSendMailWithPdf}
                startIcon={<Email />}
                variant="outlined"
                disabled={!renderComplete || loading}
              >
                Send Mail
              </Button>
            )}
            <Button onClick={onClose} startIcon={<Close />} color="inherit">
              Close
            </Button>
          </div>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>

        {(!imagesLoaded || !renderComplete) && open && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "30px",
              minHeight: "400px",
            }}
          >
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2 }}>
              Loading all content and images...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we prepare your quotation
            </Typography>
          </div>
        )}

        <div
          ref={printRef}
          style={{
            maxHeight: "70vh",
            overflowY: "auto",
            background: "#fff",
            display: imagesLoaded && renderComplete ? "block" : "none",
          }}
        >
          <Page1 />
          {days.length > 0 && <ItineraryPages />}
          <CombinedPricingPage />
          <PoliciesAndFooterPage />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationPDFDialog;
