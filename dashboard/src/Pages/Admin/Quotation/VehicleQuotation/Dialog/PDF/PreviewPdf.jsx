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
  TextField,
} from "@mui/material";
import {
  Download,
  Print,
  Close,
  Email,
  DirectionsCar,
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
} from "@mui/icons-material";
import axios from "../../../../../../utils/axios";

const VehicleQuotationPDFDialog = ({
  open,
  onClose,
  quotation,
  pdfHeading = "VEHICLE QUOTATION",
  onSendMail,
  autoSendForMail = false,
}) => {
  const printRef = useRef();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [renderComplete, setRenderComplete] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [emailContentMode, setEmailContentMode] = useState("short");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [imageElements, setImageElements] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [globalPolicyDefaults, setGlobalPolicyDefaults] = useState({
    inclusions: [],
    exclusions: [],
    paymentPolicy: "",
    cancellationPolicy: "",
    termsAndConditions: "",
  });
  const autoSendTriggeredRef = useRef(false);

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
  const normalizeWebUrl = (value) => {
    if (value === undefined || value === null) return "";
    const s = String(value).trim();
    if (!s || s === "N/A") return "";
    if (/^https?:\/\//i.test(s)) return s;
    return "";
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

  const extractGstPercentage = (gstValue) => {
    if (typeof gstValue === "string") {
      const match = gstValue.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        return parseFloat(match[1]);
      }
      const num = parseFloat(gstValue.replace(/[^0-9.-]/g, ""));
      if (!isNaN(num)) return num;
    }
    if (typeof gstValue === "number") return gstValue;
    return 5;
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

  // Get quotation data first
  const quotationData = quotation || {};
  
  // Find selected company after companyOptions are loaded
  const selectedCompany = companyOptions.find((c) => c?._id === selectedCompanyId) || null;

  // Extract all values after quotationData is defined
  const customerName = getValue(quotationData, "customer.name", "Guest");
  const customerLocation = getValue(quotationData, "customer.location");
  const customerPhone = getValue(quotationData, "customer.phone");
  const customerEmail = getValue(quotationData, "customer.email");
  const pickupArrival = getValue(quotationData, "pickup.arrival");
  const pickupDeparture = getValue(quotationData, "pickup.departure");
  const hotelGuests = getValue(quotationData, "hotel.guests");
  const hotelType = getValue(quotationData, "hotel.hotelType");
  const hotelDestination = getValue(quotationData, "hotel.destination");
  const hotelItinerary = getValue(quotationData, "hotel.itinerary");
  const quotationTitle = getValue(quotationData, "quotationTitle", "Vehicle Quotation");
  const destinationSummary = getValue(quotationData, "destinationSummary");
  const reference = getValue(quotationData, "reference");
  const date = getValue(quotationData, "date");
  const pricingTotal = getRawValue(quotationData, "pricing.total");
  const pricingDiscount = getRawValue(quotationData, "pricing.discount");
  const pricingGst = getRawValue(quotationData, "pricing.gst");
  const footerCompany = selectedCompany?.companyName || getValue(quotationData, "footer.company", "Iconic Yatra");
  const footerAddress = selectedCompany?.address || getValue(quotationData, "footer.address");
  const footerPhone = selectedCompany?.phone || getValue(quotationData, "footer.phone");
  const footerEmail = selectedCompany?.email || getValue(quotationData, "footer.email");
  const footerWebsite = selectedCompany?.companyWebsite || getValue(quotationData, "footer.website");
  const footerContact = selectedCompany?.authorizedSignatory?.name || getValue(quotationData, "footer.contact");
  const footerContactDesignation = selectedCompany?.authorizedSignatory?.designation || "";
  const footerReceived = getValue(quotationData, "footer.received", "₹ 0");
  const days = getValue(quotationData, "days", []);
  
  // Handle policies - support both array and string formats
  const getPoliciesArray = (policyValue) => {
    if (Array.isArray(policyValue)) return policyValue;
    if (typeof policyValue === "string" && policyValue.trim()) {
      return policyValue.split("\n").filter(line => line.trim());
    }
    return [];
  };
  
  // Get policies from quotation data with fallback to global defaults
  const policiesInclusions = getPoliciesArray(getValue(quotationData, "policies.inclusions", []));
  const policiesExclusions = getPoliciesArray(getValue(quotationData, "policies.exclusions", []));
  const paymentPolicy = getValue(quotationData, "policies.paymentPolicy", "");
  const cancellationPolicyFromQuot = getPoliciesArray(getValue(quotationData, "policies.cancellationPolicy", []));
  const termsConditions = getValue(quotationData, "policies.terms", "");
  
  // Use global defaults as fallbacks
  const finalInclusionArray = policiesInclusions.length > 0 ? policiesInclusions : globalPolicyDefaults.inclusions;
  const finalExclusionArray = policiesExclusions.length > 0 ? policiesExclusions : globalPolicyDefaults.exclusions;
  const finalPaymentPolicy = paymentPolicy || globalPolicyDefaults.paymentPolicy;
  const finalCancellationArray = cancellationPolicyFromQuot.length > 0 ? cancellationPolicyFromQuot : 
    (globalPolicyDefaults.cancellationPolicy ? globalPolicyDefaults.cancellationPolicy.split("\n").filter(line => line.trim()) : []);
  const finalTermsConditions = termsConditions || globalPolicyDefaults.termsAndConditions;

  // Calculate totals - extract numeric values properly
  const totalAmount = extractNumericValue(pricingTotal);
  const discountAmount = extractNumericValue(pricingDiscount);
  
  // Calculate amount after discount
  const amountAfterDiscount = totalAmount - discountAmount;
  
  // Get GST percentage (default to 5%)
  const gstPercentage = extractGstPercentage(pricingGst);
  
  // Calculate GST amount as percentage of the amount after discount
  const gstAmount = (amountAfterDiscount * gstPercentage) / 100;
  
  const receivedAmount = extractNumericValue(footerReceived);
  const finalTotal = amountAfterDiscount + gstAmount;
  const balanceAmount = finalTotal - receivedAmount;

  // Get company website URL for Terms & Conditions link
  const companyWebsiteUrl = selectedCompany?.companyWebsite || footerWebsite || "https://www.iconicyatra.com";
  const companyCancellationUrl = selectedCompany?.cancellationPolicy || "https://www.iconicyatra.com/cancellationandrefundpolicy";
  const companyTermsUrl = normalizeWebUrl(selectedCompany?.termsConditions) || companyWebsiteUrl;
  const companyPaymentLink = normalizeWebUrl(selectedCompany?.paymentLink);
  const netBankingPayeeName =
    String(selectedCompany?.companyName || "").trim() ||
    (footerCompany && footerCompany !== "N/A"
      ? String(footerCompany).trim()
      : "");


  // Load logo from selected company
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
      setRenderComplete(false);
      const timer = setTimeout(() => {
        setRenderComplete(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleDownloadPDF = async ({ shouldDownload = true } = {}) => {
    try {
      setLoading(true);
      setError("");

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
        compress: true,
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
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 300));

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: false,
          allowTaint: false,
        });

        document.body.removeChild(tempContainer);

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeightPx = (pageHeight * canvas.width) / imgWidth;
        const sliceCount = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

        for (let sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
          const startY = Math.floor(sliceIndex * pageHeightPx);
          const sliceHeightPx = Math.min(
            Math.floor(pageHeightPx),
            canvas.height - startY,
          );

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeightPx;
          const sliceCtx = sliceCanvas.getContext("2d");
          sliceCtx.drawImage(
            canvas,
            0,
            startY,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx,
          );

          const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
          const sliceHeightMm = (sliceHeightPx * imgWidth) / canvas.width;

          if (i > 0 || sliceIndex > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            sliceImgData,
            "JPEG",
            0,
            0,
            imgWidth,
            sliceHeightMm,
            undefined,
            "FAST",
          );
        }
      }

      for (let i = 1; i <= pageElements.length; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageElements.length}`, pageWidth - 30, pageHeight - 10);
      }

      pdf.setProperties({
        title: `${customerName}_Vehicle_Quotation_${reference || Date.now()}`,
        subject: `Vehicle Quotation for ${customerName}`,
        author: footerCompany,
        creator: "Iconic Yatra Travel Management System",
      });

      const fileName = `${customerName.replace(/\s/g, "_")}_Vehicle_Quotation_${reference || Date.now()}.pdf`;
      
      if (shouldDownload) {
        pdf.save(fileName);
      }

      const blob = pdf.output("blob");
      const contentBase64 = await blobToBase64(blob);
      return {
        filename: fileName,
        contentBase64,
        mimeType: "application/pdf",
        size: blob.size,
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
      to: String(recipientEmail || "").trim(),
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
          <title>${customerName} - Vehicle Quotation</title>
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

  const renderDayCard = (day, globalIndex) => (
    <div key={globalIndex} style={{ marginBottom: "20px", breakInside: "avoid", pageBreakInside: "avoid" }}>
      <div style={{ 
        background: "#fff", 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        border: "1px solid #e0e0e0"
      }}>
        <div style={{ 
          padding: "15px 20px", 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <strong style={{ fontSize: "16px" }}>📍 {day.title || `Day ${globalIndex + 1}`}</strong>
            {(day.date || day.dayDate) && (
              <span style={{ 
                background: "rgba(255,255,255,0.2)", 
                padding: "4px 12px", 
                borderRadius: "20px", 
                fontSize: "11px",
                fontWeight: "bold"
              }}>
                📅 {day.dayDate || day.date}
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#333", whiteSpace: "pre-wrap" }}>
            {day.description || "No description available"}
          </div>
        </div>
      </div>
    </div>
  );

  // Cost Summary Table Component
  const CostSummaryTable = () => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#1976d2" }}>
            <th style={{ color: "white", padding: "14px", textAlign: "left", fontWeight: "bold" }}>Particulars</th>
            <th style={{ color: "white", padding: "14px", textAlign: "right", fontWeight: "bold" }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
            <td style={{ padding: "12px" }}>Total Package Cost</td>
            <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(totalAmount)}</td>
          </tr>
          {discountAmount > 0 && (
            <tr style={{ borderBottom: "1px solid #e0e0e0", background: "#fff3e0" }}>
              <td style={{ padding: "12px", color: "#e65100" }}>Discount</td>
              <td style={{ padding: "12px", textAlign: "right", color: "#e65100" }}>-{formatCurrency(discountAmount)}</td>
            </tr>
          )}
          
          <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
            <td style={{ padding: "12px" }}>GST @ {gstPercentage}%</td>
            <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(gstAmount)}</td>
          </tr>
          <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
            <td style={{ padding: "14px", fontSize: "16px" }}>Grand Total</td>
            <td style={{ padding: "14px", textAlign: "right", fontSize: "16px", fontWeight: "bold", color: "#1976d2" }}>{formatCurrency(finalTotal)}</td>
          </tr>
          {receivedAmount > 0 && (
            <>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={{ padding: "12px", color: "#2e7d32" }}>Amount Received</td>
                <td style={{ padding: "12px", textAlign: "right", color: "#2e7d32", fontWeight: "bold" }}>{formatCurrency(receivedAmount)}</td>
              </tr>
              <tr style={{ background: "#f5f5f5" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>Balance Amount</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold", color: "#ed6c02" }}>{formatCurrency(balanceAmount)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  // Inclusion Policy Component
  const InclusionPolicyComponent = () => (
    <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle style={{ color: "#2e7d32" }} />
        <span style={{ fontSize: "16px", fontWeight: "bold", color: "#2e7d32" }}>Inclusion Policy</span>
      </div>
      <div style={{ 
        padding: "15px", 
        background: "#e8f5e9", 
        borderRadius: "12px", 
        borderLeft: "4px solid #2e7d32",
        display: "block",
        width: "100%"
      }}>
        {finalInclusionArray.length > 0 ? (
          finalInclusionArray.map((item, idx) => (
            <div key={idx} style={{ fontSize: "13px", marginLeft: "20px", marginBottom: "8px", lineHeight: "1.5", display: "block" }}>• {item}</div>
          ))
        ) : (
          <div style={{ fontSize: "13px", marginLeft: "20px", lineHeight: "1.5" }}>• No inclusions specified</div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ fontWeight: "bold", fontSize: "18px", color: "#1976d2" }}>
            <DirectionsCar sx={{ mr: 1, verticalAlign: "middle" }} />
            Vehicle Quotation Preview - {customerName}
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
                <TextField
                  size="small"
                  label="Email ID"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  sx={{ minWidth: 240 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Email Content</InputLabel>
                  <Select value={emailContentMode} onChange={(e) => setEmailContentMode(e.target.value)}>
                    <MenuItem value="short">Short Content</MenuItem>
                    <MenuItem value="full">Full Content</MenuItem>
                  </Select>
                </FormControl>
                <Button onClick={handleSendMailWithPdf} startIcon={<Email />} variant="outlined" size="small" disabled={!renderComplete || loading}>
                  {autoSendForMail && loading ? "Preparing..." : "Send Mail"}
                </Button>
              </>
            )}
            <Button onClick={onClose} startIcon={<Close />} color="inherit" size="small">Close</Button>
          </div>
        </div>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, bgcolor: "#f0f0f0" }}>
        {(!imagesLoaded || !renderComplete) && open && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚐</div>
            <Typography variant="h6">Loading quotation preview...</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Please wait while we prepare your document</Typography>
          </div>
        )}
        <div ref={printRef} style={{ display: imagesLoaded && renderComplete ? "block" : "none" }}>
          
          {/* PAGE 1: Header, Customer Details, Vehicle Info */}
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

            {/* Pickup & Drop Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={{ padding: "18px", background: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#1976d2" }}>
                  <Route sx={{ mr: 1, verticalAlign: "middle" }} /> Pickup Details
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{pickupArrival || "Not specified"}</Typography>
              </div>
              <div style={{ padding: "18px", background: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#1976d2" }}>
                  <DirectionsCar sx={{ mr: 1, verticalAlign: "middle" }} /> Drop Details
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{pickupDeparture || "Not specified"}</Typography>
              </div>
            </div>

            {/* Vehicle Information */}
            <div style={{ 
              padding: "20px", 
              background: "#fff", 
              borderRadius: "12px", 
              border: "1px solid #e0e0e0",
              marginBottom: "20px"
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#1976d2" }}>
                <DirectionsCar sx={{ mr: 1, verticalAlign: "middle" }} /> Vehicle Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="textSecondary">Vehicle Type</Typography>
                  <Typography variant="body1" fontWeight="bold">{hotelType || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="textSecondary">Number of Guests</Typography>
                  <Typography variant="body1" fontWeight="bold">{hotelGuests || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="textSecondary">Destination</Typography>
                  <Typography variant="body1" fontWeight="bold">{hotelDestination || "N/A"}</Typography>
                </Grid>
              </Grid>
            </div>

            {/* Itinerary Note */}
            {hotelItinerary && hotelItinerary !== "N/A" && (
              <div style={{ 
                padding: "15px", 
                background: "#fff8e1", 
                borderRadius: "8px", 
                borderLeft: "4px solid #ffc107",
                fontSize: "13px",
                color: "#856404"
              }}>
                <strong>📝 Note:</strong> {hotelItinerary}
              </div>
            )}
          </div>

          {/* PAGE 2: Itinerary Plan + Cost Summary (Inclusion Policy removed from here) */}
          <div className="pdf-page" style={{ padding: "30px", background: "#fff", minHeight: "297mm", pageBreakAfter: "always", breakAfter: "page" }}>
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
              <Description /> Itinerary Plan
            </div>
            
            {days.map((day, index) => renderDayCard(day, index))}
            
            {/* Cost Summary Table */}
            <div style={{ marginTop: "30px" }}>
              <div style={{ 
                fontWeight: "bold", 
                fontSize: "20px", 
                marginBottom: "20px", 
                borderBottom: "3px solid #667eea", 
                paddingBottom: "10px", 
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <Payment /> Cost Summary
              </div>
              <CostSummaryTable />
            </div>
          </div>

          {/* PAGE 3 (LAST PAGE): Inclusion Policy + Exclusion Policy + Payment Policy + Cancellation & Refund Policy + Terms & Conditions + Footer */}
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

            {/* Inclusion Policy - Now on PAGE 3 */}
            <InclusionPolicyComponent />

            {/* Exclusion Policy */}
            {finalExclusionArray.length > 0 && (
              <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
                <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cancel style={{ color: "#c62828" }} />
                  <span style={{ fontSize: "16px", fontWeight: "bold", color: "#c62828" }}>Exclusion Policy</span>
                </div>
                <div style={{ padding: "15px", background: "#ffebee", borderRadius: "12px", borderLeft: "4px solid #c62828", display: "block", width: "100%" }}>
                  {finalExclusionArray.map((item, idx) => (
                    <div key={idx} style={{ fontSize: "13px", marginLeft: "20px", marginBottom: "8px", lineHeight: "1.5", display: "block" }}>• {item}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Policy */}
            {finalPaymentPolicy && (
              <div style={{ marginBottom: "25px", breakInside: "avoid", pageBreakInside: "avoid" }}>
                <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Payment style={{ color: "#1565c0" }} />
                  <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1565c0" }}>Payment Policy</span>
                </div>
                <div style={{ padding: "15px", background: "#e3f2fd", borderRadius: "12px", borderLeft: "4px solid #1565c0", display: "block", width: "100%" }}>
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
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MoneyOff style={{ color: "#e65100" }} />
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#e65100" }}>Cancellation & Refund Policy</span>
              </div>
              <div style={{ padding: "15px", background: "#fff3e0", borderRadius: "12px", borderLeft: "4px solid #e65100", display: "block", width: "100%" }}>
                {finalCancellationArray.map((item, idx) => (
                  <div key={idx} style={{ fontSize: "13px", marginLeft: item.startsWith("•") ? "20px" : "0px", marginBottom: "6px", lineHeight: "1.6", display: "block" }}>
                    {item}
                  </div>
                ))}
                <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed #e0a800", fontSize: "13px", textAlign: "center", display: "block" }}>
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
            <div style={{ marginBottom: "10px", breakInside: "avoid", pageBreakInside: "avoid" }}>
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Description style={{ color: "#333" }} />
                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>Terms & Conditions</span>
              </div>
              <div style={{ padding: "15px", background: "#fafafa", borderRadius: "12px", border: "1px solid #e0e0e0", textAlign: "center", display: "block", width: "100%" }}>
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
            <div style={{ textAlign: "center" }}>
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

export default VehicleQuotationPDFDialog;