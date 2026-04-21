import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  Link,
} from "@mui/material";
import {
  Download,
  Print,
  Close,
  Email,
  Flight,
  Person,
  Phone,
  LocationOn,
  Route,
  CheckCircle,
  Cancel,
  Payment,
  Warning,
  Description,
  MoneyOff,
  FlightTakeoff,
  FlightLand,
  Group,
} from "@mui/icons-material";
import axios from "../../../../../utils/axios";

const FlightQuotationPDFDialog = ({
  open,
  onClose,
  quotation,
  pdfHeading = "FLIGHT QUOTATION",
  onSendMail,
  initialEmailContentMode = "short",
  includePdfOnSend = true,
  autoSendForMail = false,
}) => {
  const printRef = useRef();
  const autoSendTriggeredRef = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [emailContentMode, setEmailContentMode] = useState("short");
  const [imageElements, setImageElements] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
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
   const normalizeWebUrl = (value) => {
    if (value === undefined || value === null) return "";
    const s = String(value).trim();
    if (!s || s === "N/A") return "";
    if (/^https?:\/\//i.test(s)) return s;
    return "";
  };
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

  const extractNumericValue = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.-]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const compressImage = (base64, maxWidth = 400, quality = 0.6) => {
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
        resolve(base64);
      };
      img.src = base64;
    });
  };

  const convertToBase64 = useCallback((url, compress = true) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      if (url.startsWith("data:image")) {
        if (compress) {
          compressImage(url, 400, 0.6).then(resolve);
        } else {
          resolve(url);
        }
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 8000);
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxWidth = 400;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.6);
          resolve(base64);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(null);
      };
      img.src = url;
    });
  }, []);

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
      }
    };
    fetchGlobalPolicyDefaults();
  }, [open]);

  const quotationData = quotation || {};
  const selectedCompany = companyOptions.find((c) => c?._id === selectedCompanyId) || null;
  
  const customerName = getValue(quotationData, "customer.name", "Guest");
  const customerLocation = getValue(quotationData, "customer.location");
  const customerPhone = getValue(quotationData, "customer.phone");
  const customerEmail = getValue(quotationData, "customer.email");
  const flightDetails = getValue(quotationData, "flightDetails", []);
  const tripType = getValue(quotationData, "tripType", "oneway");
  const guestInfo = getValue(quotationData, "guestInfo", "N/A");
  const adults = getValue(quotationData, "adults", 0);
  const children = getValue(quotationData, "children", 0);
  const infants = getValue(quotationData, "infants", 0);
  const quotationTitle = getValue(quotationData, "quotationTitle", "Flight Quotation");
  const destinationSummary = getValue(quotationData, "destinationSummary");
  const reference = getValue(quotationData, "reference");
  const date = getValue(quotationData, "date");
  const totalFare = extractNumericValue(getRawValue(quotationData, "totalFare"));
  const formattedTotalFare = formatCurrency(totalFare);
  const footerCompany = selectedCompany?.companyName || getValue(quotationData, "footer.company", "Iconic Yatra");
  const footerAddress = selectedCompany?.address || getValue(quotationData, "footer.address");
  const footerPhone = selectedCompany?.phone || getValue(quotationData, "footer.phone");
  const footerEmail = selectedCompany?.email || getValue(quotationData, "footer.email");
  const footerWebsite = selectedCompany?.companyWebsite || getValue(quotationData, "footer.website");
  const footerContact = selectedCompany?.authorizedSignatory?.name || getValue(quotationData, "footer.contact");
  const footerContactDesignation = selectedCompany?.authorizedSignatory?.designation || "";

  const getPoliciesArray = (policyValue) => {
    if (Array.isArray(policyValue)) return policyValue;
    if (typeof policyValue === "string" && policyValue.trim()) {
      return policyValue.split("\n").filter(line => line.trim());
    }
    return [];
  };

  const policiesInclusions = getPoliciesArray(getValue(quotationData, "policies.inclusions", []));
  const policiesExclusions = getPoliciesArray(getValue(quotationData, "policies.exclusions", []));
  const paymentPolicy = getValue(quotationData, "policies.paymentPolicy", "");
  const cancellationPolicyFromQuot = getPoliciesArray(getValue(quotationData, "policies.cancellationPolicy", []));
  const termsConditions = getValue(quotationData, "policies.terms", "");

  const finalInclusionArray = policiesInclusions.length > 0 ? policiesInclusions : globalPolicyDefaults.inclusions;
  const finalExclusionArray = policiesExclusions.length > 0 ? policiesExclusions : globalPolicyDefaults.exclusions;
  const finalPaymentPolicy = paymentPolicy || globalPolicyDefaults.paymentPolicy;
  const finalCancellationArray = cancellationPolicyFromQuot.length > 0 ? cancellationPolicyFromQuot : 
    (globalPolicyDefaults.cancellationPolicy ? globalPolicyDefaults.cancellationPolicy.split("\n").filter(line => line.trim()) : []);
  const finalTermsConditions = termsConditions || globalPolicyDefaults.termsAndConditions;

  const companyWebsiteUrl = selectedCompany?.companyWebsite || footerWebsite || "https://www.iconicyatra.com";
  const companyCancellationUrl = selectedCompany?.cancellationPolicy || "https://www.iconicyatra.com/cancellationandrefundpolicy";
 const companyTermsUrl = normalizeWebUrl(selectedCompany?.termsConditions) || companyWebsiteUrl;
  const companyPaymentLink = normalizeWebUrl(selectedCompany?.paymentLink);
  const netBankingPayeeName =
    String(selectedCompany?.companyName || "").trim() ||
    (footerCompany && footerCompany !== "N/A"
      ? String(footerCompany).trim()
      : "");
  const getTripTypeText = (type) => {
    if (type === "oneway") return "One Way Trip";
    if (type === "roundtrip") return "Round Trip";
    if (type === "multicity") return "Multi City Trip";
    return "One Way Trip";
  };

  useEffect(() => {
    const loadLogo = async () => {
      if (!open) return;
      const logo = selectedCompany?.logo || getValue(quotation, "logo");
      if (logo && typeof logo === "string") {
        const base64Logo = await convertToBase64(logo, true);
        if (base64Logo) {
          setImageElements({ logo: base64Logo });
        }
      } else {
        setImageElements({ logo: null });
      }
      setImagesLoaded(true);
    };
    loadLogo();
  }, [open, selectedCompany, quotation, convertToBase64]);

  useEffect(() => {
    if (open) {
      setEmailContentMode(initialEmailContentMode === "full" ? "full" : "short");
      setRenderComplete(false);
      const timer = setTimeout(() => {
        setRenderComplete(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [open, initialEmailContentMode]);

  const handleDownloadPDF = async ({ shouldDownload = true } = {}) => {
  try {
    setLoading(true);
    setError("");

    const html2pdf = (await import("html2pdf.js")).default;

    const element = printRef.current;

    if (!element) {
      throw new Error("Content not found");
    }

    const clone = element.cloneNode(true);

    const images = clone.querySelectorAll("img");
    for (const img of images) {
      const alt = img.getAttribute("alt");
      if (alt === "Company Logo" && imageElements.logo) {
        img.src = imageElements.logo;
      }
    }

    // remove forced page breaks
    const forcedPages = clone.querySelectorAll(".pdf-page");
    forcedPages.forEach((el) => {
      el.style.pageBreakAfter = "auto";
      el.style.breakAfter = "auto";
    });

    // prevent bad splits
    const avoidBreakElements = clone.querySelectorAll(
      "table, tr, td, .no-break"
    );
    avoidBreakElements.forEach((el) => {
      el.style.pageBreakInside = "avoid";
      el.style.breakInside = "avoid";
    });

    const opt = {
      margin: [5, 5, 15, 5], // ✅ reduced top margin
      filename: `${customerName.replace(/\s/g, "_")}_Flight_Quotation_${reference || Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
      },
    };

    const worker = html2pdf().set(opt).from(clone);

    const pdfBlob = await worker.outputPdf("blob");

    if (shouldDownload) {
      await worker.save();
    }

    const contentBase64 = await blobToBase64(pdfBlob);

    return {
      filename: opt.filename,
      contentBase64,
      mimeType: "application/pdf",
      size: pdfBlob.size,
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
    if (!includePdfOnSend) {
      onSendMail({
        previewPdfMode: false,
      });
      return;
    }
    const payload = await handleDownloadPDF({ shouldDownload: false });
    if (!payload?.contentBase64) return;
    onSendMail({
      pdfAttachment: payload,
      previewPdfMode: emailContentMode === "short",
    });
  };

  useEffect(() => {
    if (!open) {
      autoSendTriggeredRef.current = false;
      return;
    }
    if (!autoSendForMail) return;
    if (autoSendTriggeredRef.current) return;
    if (!renderComplete || !imagesLoaded || loading) return;
    autoSendTriggeredRef.current = true;
    handleSendMailWithPdf();
  }, [open, autoSendForMail, renderComplete, imagesLoaded, loading]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const content = printRef.current.cloneNode(true);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${customerName} - Flight Quotation</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', 'Arial', sans-serif; padding: 20px; background: white; }
            @media print {
              body { padding: 0; }
              .pdf-page {
                page-break-after: always;
                break-after: page;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = () => { window.print(); window.close(); };<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "N/A";
    }
  };

  // Flight Details Table Component - Fixed fare column width with page break avoidance
  const FlightDetailsTable = () => (
    <div style={{ 
      overflowX: "auto", 
      marginBottom: "25px",
      pageBreakInside: "avoid",
      breakInside: "avoid",
      position: "relative"
    }}>
      <div style={{ 
        marginBottom: "16px", 
        display: "flex", 
        alignItems: "center", 
        gap: "8px",
        pageBreakAfter: "avoid",
        breakAfter: "avoid"
      }}>
        <FlightTakeoff style={{ color: "#1976d2", fontSize: "24px" }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#1976d2" }}>
          Flight Details - {getTripTypeText(tripType)}
        </Typography>
      </div>
      <div style={{
        pageBreakInside: "avoid",
        breakInside: "avoid"
      }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse", 
          background: "#fff", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
          borderRadius: "8px", 
          overflow: "hidden",
          tableLayout: "fixed"
        }}>
          <thead>
            <tr style={{ background: "#1976d2" }}>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "8%" }}>Flight</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "10%" }}>From</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "10%" }}>To</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "12%" }}>Airline</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "10%" }}>Flight No</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "10%" }}>PNR</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "12%" }}>Departure Date</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "left", fontWeight: "bold", width: "12%" }}>Departure Time</th>
              <th style={{ color: "white", padding: "12px 8px", textAlign: "right", fontWeight: "bold", width: "16%" }}>Fare</th>
              
            </tr>
          </thead>
          <tbody>
            {flightDetails.map((flight, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>Flight {flight.flightNo || index + 1}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{flight.from || "N/A"}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{flight.to || "N/A"}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{flight.airline || "N/A"}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{flight.flightNumber || "N/A"}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{flight.pnr || "N/A"}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{formatDate(flight.departureDate)}</td>
                <td style={{ padding: "10px 8px", wordWrap: "break-word" }}>{formatTime(flight.departureTime)}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: "500", wordWrap: "break-word" }}>{formatCurrency(flight.fare)}</td>
              </tr>
            ))}
            <tr style={{ background: "#1976d2" }}>
              <td colSpan={8} style={{ padding: "12px", textAlign: "right", color: "white", fontWeight: "bold" }}>Total Fare</td>
              <td style={{ padding: "12px", textAlign: "right", color: "white", fontWeight: "bold" }}>{formattedTotalFare}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Inclusion Policy Component
  const InclusionPolicyComponent = () => (
    <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "#2e7d32", display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle /> Inclusion Policy
      </Typography>
      <div style={{ padding: "15px", background: "#e8f5e9", borderRadius: "12px", borderLeft: "4px solid #2e7d32" }}>
        {finalInclusionArray.map((item, idx) => (
          <div key={idx} style={{ fontSize: "13px", marginLeft: "20px", marginBottom: "8px", lineHeight: "1.5" }}>• {item}</div>
        ))}
      </div>
    </div>
  );

  // Exclusion Policy Component
  const ExclusionPolicyComponent = () => (
    <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "#c62828", display: "flex", alignItems: "center", gap: "8px" }}>
        <Cancel /> Exclusion Policy
      </Typography>
      <div style={{ padding: "15px", background: "#ffebee", borderRadius: "12px", borderLeft: "4px solid #c62828" }}>
        {finalExclusionArray.map((item, idx) => (
          <div key={idx} style={{ fontSize: "13px", marginLeft: "20px", marginBottom: "8px", lineHeight: "1.5" }}>• {item}</div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ fontWeight: "bold", fontSize: "18px", color: "#1976d2" }}>
            <Flight sx={{ mr: 1, verticalAlign: "middle" }} />
            Flight Quotation Preview - {customerName}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Company</InputLabel>
              <Select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} disabled={loadingCompanies}>
                {companyOptions.map((c) => <MenuItem key={c._id} value={c._id}>{c.companyName}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={handlePrint} startIcon={<Print />} variant="outlined" size="small" disabled={!renderComplete}>Print</Button>
            <Button onClick={() => handleDownloadPDF({ shouldDownload: true })} startIcon={loading ? <span style={{ width: 20 }}>⏳</span> : <Download />} variant="contained" size="small" disabled={loading || !renderComplete} sx={{ background: "#1976d2" }}>
              {loading ? "Generating..." : "Download PDF"}
            </Button>
            {typeof onSendMail === "function" && (
              <>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Email Content</InputLabel>
                  <Select value={emailContentMode} onChange={(e) => setEmailContentMode(e.target.value)}>
                    <MenuItem value="short">Short Content</MenuItem>
                    <MenuItem value="full">Full Content</MenuItem>
                  </Select>
                </FormControl>
                <Button onClick={handleSendMailWithPdf} startIcon={<Email />} variant="outlined" size="small" disabled={!renderComplete || loading}>Send Mail</Button>
              </>
            )}
            <Button onClick={onClose} startIcon={<Close />} color="inherit" size="small">Close</Button>
          </div>
        </div>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, bgcolor: "#f0f0f0" }}>
        {(!imagesLoaded || !renderComplete) && open && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✈️</div>
            <Typography variant="h6">Loading quotation preview...</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Please wait while we prepare your document</Typography>
          </div>
        )}
        <div ref={printRef} style={{ display: imagesLoaded && renderComplete ? "block" : "none" }}>
          
          {/* PAGE 1: Header, Customer Details, Passenger Details, Flight Details */}
          <div className="pdf-page" style={{ padding: "30px", background: "#fff", minHeight: "297mm", pageBreakAfter: "always", breakAfter: "page" }}>
            {/* Header with Logo */}
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              {imageElements.logo ? (
                <img src={imageElements.logo} alt="Company Logo" style={{ height: "70px", width: "auto", marginBottom: "15px" }} />
              ) : (
                <div style={{ 
                  width: "70px", 
                  height: "70px", 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                  borderRadius: "50%", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  marginBottom: "15px"
                }}>
                  <span style={{ color: "white", fontWeight: "bold", fontSize: "28px" }}>{footerCompany.charAt(0)}</span>
                </div>
              )}
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#2c3e50", letterSpacing: 1 }}>{footerCompany}</Typography>
              <Typography variant="caption" color="textSecondary">Travel. Explore. Experience.</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: "#1976d2", mb: 1 }}>{pdfHeading}</Typography>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", fontSize: "12px", color: "#666" }}>
                <span><strong>Ref No:</strong> {reference}</span>
                <span><strong>Date:</strong> {date}</span>
              </div>
            </div>

            {/* Quotation Title */}
            <div style={{ textAlign: "center", marginBottom: "25px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#e65100" }}>{quotationTitle}</Typography>
              {destinationSummary && destinationSummary !== "N/A" && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>{destinationSummary}</Typography>
              )}
            </div>

            {/* Customer Details Card */}
            <div style={{ 
              padding: "20px", 
              background: "linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)", 
              borderRadius: "12px", 
              marginBottom: "20px",
              border: "1px solid #e0e0e0"
            }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "#667eea" }}>
                <Person sx={{ mr: 1, verticalAlign: "middle" }} /> Customer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="textSecondary">Client Name</Typography>
                  <Typography variant="body1" fontWeight="bold">{customerName}</Typography>
                  {customerLocation && <Typography variant="body2" sx={{ mt: 1 }}><LocationOn sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} /> {customerLocation}</Typography>}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  {customerPhone && <><Typography variant="body2" color="textSecondary">Mobile</Typography><Typography variant="body1"><Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} /> {customerPhone}</Typography></>}
                  {customerEmail && <Typography variant="body2" sx={{ mt: 1 }}><Email sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} /> {customerEmail}</Typography>}
                </Grid>
              </Grid>
            </div>

            {/* Passenger Details */}
            <div style={{ 
              padding: "18px", 
              background: "#fff", 
              borderRadius: "12px", 
              border: "1px solid #e0e0e0",
              marginBottom: "20px"
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#1976d2" }}>
                <Group sx={{ mr: 1, verticalAlign: "middle" }} /> Passenger Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="textSecondary">Adults</Typography>
                  <Typography variant="body1" fontWeight="bold">{adults}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="textSecondary">Children</Typography>
                  <Typography variant="body1" fontWeight="bold">{children}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="textSecondary">Infants</Typography>
                  <Typography variant="body1" fontWeight="bold">{infants}</Typography>
                </Grid>
              </Grid>
            </div>

            {/* Flight Details Section */}
            <FlightDetailsTable />
          </div>

          {/* PAGE 2: Policies + Terms & Conditions + Footer */}
          <div className="pdf-page" style={{ padding: "30px", background: "#fff", minHeight: "297mm" }}>
            <div style={{ 
              fontWeight: "bold", 
              fontSize: "22px", 
              marginBottom: "25px", 
              borderBottom: "3px solid #667eea", 
              paddingBottom: "10px", 
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <Description /> Policies & Terms
            </div>

            {/* Inclusion Policy */}
            <InclusionPolicyComponent />

            {/* Exclusion Policy */}
            <ExclusionPolicyComponent />

            {/* Payment Policy */}
            {finalPaymentPolicy && (
              <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "#1565c0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Payment /> Payment Policy
                </Typography>
                <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "12px", borderLeft: "4px solid #1565c0" }}>
                  <div style={{ fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{finalPaymentPolicy}</div>
                </div>
              </div>
            )}
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
            {/* Cancellation & Refund Policy with Link */}
            <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "#e65100", display: "flex", alignItems: "center", gap: "8px" }}>
                <MoneyOff /> Cancellation & Refund Policy
              </Typography>
              <div style={{ padding: "15px", background: "#fff3e0", borderRadius: "12px", borderLeft: "4px solid #e65100" }}>
                {finalCancellationArray.map((item, idx) => (
                  <div key={idx} style={{ fontSize: "13px", marginLeft: item.startsWith("•") ? "20px" : "0px", marginBottom: "6px", lineHeight: "1.6" }}>
                    {item}
                  </div>
                ))}
                <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #e0a800", fontSize: "13px", textAlign: "center" }}>
                  Full cancellation & refund policy:{" "}
                  <a 
                    href={companyCancellationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1565c0", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    {companyCancellationUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div style={{ marginBottom: "40px", breakInside: "avoid", pageBreakInside: "avoid" }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: "#333", display: "flex", alignItems: "center", gap: "8px" }}>
                <Description /> Terms & Conditions
              </Typography>
              <div style={{ padding: "15px", background: "#fafafa", borderRadius: "12px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.6", padding: "8px" }}>
                  As per company website{" "}
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
            <div style={{ textAlign: "center", marginTop: "auto", paddingTop: "20px", borderTop: "1px solid #e0e0e0" }}>
              {imageElements.logo && (
                <div style={{ marginBottom: "15px" }}>
                  <img src={imageElements.logo} alt="Company Logo" style={{ height: "40px", width: "auto", opacity: 0.8 }} />
                </div>
              )}
              {footerAddress && <div style={{ fontSize: "11px", color: "#666", marginBottom: "5px" }}>📍 {footerAddress}</div>}
              <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap", marginBottom: "8px", fontSize: "11px", color: "#666" }}>
                {footerPhone && <span>📞 {footerPhone}</span>}
                {footerEmail && <span>✉️ {footerEmail}</span>}
                {footerWebsite && <span>🌐 {footerWebsite}</span>}
              </div>
              {footerContact && <div style={{ fontSize: "10px", color: "#666", marginTop: "5px" }}>👤 Contact: {footerContact}{footerContactDesignation ? ` (${footerContactDesignation})` : ""}</div>}
              <div style={{ fontSize: "9px", color: "#999", marginTop: "10px" }}>This is a computer generated quotation. No signature required.</div>
              <div style={{ fontSize: "9px", color: "#999", marginTop: "3px" }}>© {new Date().getFullYear()} {footerCompany}. All rights reserved.</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlightQuotationPDFDialog;