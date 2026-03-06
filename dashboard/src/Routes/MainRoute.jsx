import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Container,
  Box,
  LinearProgress,
  Button,
} from "@mui/material";

import DashboardLayout from "../Layout/DashboardLayout";

/* ========================== */
/*        LAZY IMPORTS        */
/* ========================== */

// Dashboard
const Dashboard = lazy(() => import("../Pages/Admin/Dashboard"));

// Lead
const LeadCard = lazy(() => import("../Pages/Admin/Lead/LeadCard"));
const LeadForm = lazy(() => import("../Pages/Admin/Lead/Form/LeadForm"));
const LeadCreationFlow = lazy(() =>
  import("../Pages/Admin/Lead/Form/LeadCreationFlow")
);
const LeadEditForm = lazy(() =>
  import("../Pages/Admin/Lead/Form/LeadEditForm")
);

// Hotel
const HotelCard = lazy(() => import("../Pages/Admin/Hotel/HotelCard"));
const HotelForm = lazy(() => import("../Pages/Admin/Hotel/Form/HotelForm"));
const HotelEditForm = lazy(() =>
  import("../Pages/Admin/Hotel/Form/HotelEditForm")
);

// Tour Package
const PackageCard = lazy(() =>
  import("../Pages/Admin/TourPackage/PackageCard")
);
const MultiStepPackageForm = lazy(() =>
  import("../Pages/Admin/TourPackage/Form/MultiStepPackageForm")
);
const PackageForm = lazy(() =>
  import("../Pages/Admin/TourPackage/Form/PackageForm")
);
const PackageEditForm = lazy(() =>
  import("../Pages/Admin/TourPackage/Form/PackagrEditForm")
);

// Associates
const AssociatesCard = lazy(() =>
  import("../Pages/Admin/Associates/AssociatesCard")
);
const AssociatesForm = lazy(() =>
  import("../Pages/Admin/Associates/Form/AssociatesForm")
);
const AssociatesEditFrom = lazy(() =>
  import("../Pages/Admin/Associates/Form/AssociatesEditFrom")
);

// Staff
const StaffCard = lazy(() => import("../Pages/Admin/Staff/StaffCard"));
const StaffForm = lazy(() => import("../Pages/Admin/Staff/Form/StaffForm"));
const StaffEditForm = lazy(() =>
  import("../Pages/Admin/Staff/Form/EditStaff"));

const CompanyWebsiteEnquiry=lazy(()=>import("../Components/CompanyWebsiteEnquiry"));
// Payments
const PaymentsCard = lazy(() =>
  import("../Pages/Admin/Payments/PaymentsCard")
);
const PaymentsForm = lazy(() =>
  import("../Pages/Admin/Payments/Form/PaymentsForm")
);
const PaymentEdit = lazy(() =>
  import("../Pages/Admin/Payments/Form/PaymentEdit")
);

// Invoice
const InvoiceCard = lazy(() =>
  import("../Pages/Admin/Invoice/InvoiceCard")
);
const InvoiceForm = lazy(() =>
  import("../Pages/Admin/Invoice/Form/InvoiceForm")
);
const InvoiceEditForm = lazy(() =>
  import("../Pages/Admin/Invoice/Form/InvoiceEditForm")
);
const InvoiceGeneration = lazy(() =>
  import("../Pages/Admin/Invoice/Dialog/InvoicePdf/InvoiceGeneration")
);
const InvoiceView = lazy(() => import("../Components/InvoiceView"));

// Profile
const EditProfile = lazy(() =>
  import("../Pages/Admin/User/EditProfile")
);
const Profile = lazy(() => import("../Pages/Admin/Profile/Profile"));

// Quotation
const QuotationCard = lazy(() =>
  import("../Pages/Admin/Quotation/QuotationCard")
);
const VehicleQuotation = lazy(() =>
  import("../Pages/Admin/Quotation/VehicleQuotation/VehicleQuotation")
);
const HotelQuotationMain = lazy(() =>
  import("../Pages/Admin/Quotation/HotelQuotation/hotelQuotationMain")
);
const FlightQuotation = lazy(() =>
  import("../Pages/Admin/Quotation/FlightQuotation/flightquotation")
);
const QuickQuotation = lazy(() =>
  import("../Pages/Admin/Quotation/QuickQuotation/quickquotation")
);
const EditQuickQuotation = lazy(() =>
  import("../Pages/Admin/Quotation/QuickQuotation/EditQuickQuotation")
);
const FullQuotation = lazy(() =>
  import("../Pages/Admin/Quotation/FullQuotation/FullQuotationMain")
);
const CustomQuotation = lazy(() =>
  import("../Pages/Admin/Quotation/CustomQuotation/CustomQuotationMain")
);

// Finalize
const FlightFinalize = lazy(() =>
  import("../Pages/Admin/Quotation/FlightQuotation/FlightFinalize")
);
const VehicleFinalize = lazy(() =>
  import("../Pages/Admin/Quotation/VehicleQuotation/VehicleFinalize")
);
const HotelFinalize = lazy(() =>
  import("../Pages/Admin/Quotation/HotelQuotation/HotelFinalize")
);
const CustomFinalize = lazy(() =>
  import("../Pages/Admin/Quotation/CustomQuotation/CustomFinalize")
);
const QuickFinalize = lazy(() =>
  import("../Pages/Admin/Quotation/QuickQuotation/QuickFinalize")
);

const GlobalSettings = lazy(()=>
import("../Pages/Admin/Profile/components/GlobalSettings")
);

const CompanyForm =lazy(()=>
import("../Pages/Admin/Profile/components/CompanyForm")
);
const InsideCompanyList =lazy(()=>
import("../Pages/Admin/Profile/components/InsideCompanyList")
);
/* ========================== */
/*        MAIN ROUTE          */
/* ========================== */

const MainRoute = () => {
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showExpiryAlert, setShowExpiryAlert] = useState(false);
  const [loading, setLoading] = useState(true);
   useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const userFromUrl = params.get("user");

    if (tokenFromUrl && userFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("user", userFromUrl);
      localStorage.setItem("sessionStart", Date.now().toString());

      // Remove token from URL (important for security)
      window.history.replaceState({}, document.title, "/");
    }
  }, []);
  /* ========================== */
  /*     AUTH CHECK LOGIC       */
  /* ========================== */

  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token || !user) {
        setIsAuthenticated(false);
        setIsAuthChecked(true);
        setLoading(false);
        return;
      }

      try {
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }

        setIsAuthenticated(true);
        setIsAuthChecked(true);

        const sessionStart = Number(localStorage.getItem("sessionStart"));
        const now = Date.now();

        if (!sessionStart || now - sessionStart > 10 * 60 * 60 * 1000) {
          localStorage.setItem("sessionStart", now.toString());
        }

        setLoading(false);
      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.clear();
        setIsAuthenticated(false);
        setIsAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [location]);

  /* ========================== */
  /*      SESSION TIMER         */
  /* ========================== */

  useEffect(() => {
    if (!isAuthenticated) return;

    const expiryTime = 10 * 60 * 60 * 1000;
    const alertBefore = 5 * 60 * 1000;

    const timer = setInterval(() => {
      const sessionStart = Number(localStorage.getItem("sessionStart"));
      const now = Date.now();
      const elapsed = now - sessionStart;
      const remaining = expiryTime - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        handleLogout();
        return;
      }

      setCountdown(Math.ceil(remaining / 1000));
      setShowExpiryAlert(remaining <= alertBefore);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setShowExpiryAlert(false);
    window.location.href = "https://iconicyatra.com/admin/login";
  };

  const handleExtendSession = () => {
    localStorage.setItem("sessionStart", Date.now().toString());
    setShowExpiryAlert(false);
  };

  /* ========================== */
  /*        LOADER              */
  /* ========================== */

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LinearProgress sx={{ width: "100%", maxWidth: 400 }} />
      </Container>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "https://iconicyatra.com/admin/login";
    return null;
  }

  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : null;

  /* ========================== */
  /*        RENDER              */
  /* ========================== */

  return (
    <DashboardLayout user={userData}>
      {showExpiryAlert && (
        <Container sx={{ position: "fixed", top: 20, width: "100%", zIndex: 9999 }}>
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={handleExtendSession}>
                EXTEND
              </Button>
            }
          >
            <AlertTitle>⚠️ Session Expiry Alert</AlertTitle>
            Your session will expire in{" "}
            <b>
              {Math.floor(countdown / 60)}:
              {(countdown % 60).toString().padStart(2, "0")}
            </b>
          </Alert>
        </Container>
      )}

      <Suspense
        fallback={
          <Box
            sx={{
              display: "flex",
              height: "100vh",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LinearProgress sx={{ width: "100%", maxWidth: 400 }} />
          </Box>
        }
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lead" element={<LeadCard />} />
          <Route path="/lead/leadform" element={<LeadForm />} />
          <Route path="/lead/leadtourform" element={<LeadCreationFlow />} />
          <Route path="/lead/leadeditform/:id" element={<LeadEditForm />} />
          <Route path="/hotel" element={<HotelCard />} />
          <Route path="/hotelform" element={<HotelForm />} />
          <Route path="/hotel/edit/:id" element={<HotelEditForm />} />
          <Route path="/tourpackage" element={<PackageCard />} />
          <Route path="/packageform" element={<MultiStepPackageForm />} />
          <Route path="/packageform-old" element={<PackageForm />} />
          <Route path="/tourpackage/packageeditform/:id" element={<PackageEditForm />} />
          <Route path="/associates" element={<AssociatesCard />} />
          <Route path="/associatesform" element={<AssociatesForm />} />
          <Route path="/associates/associateseditform/:associateId" element={<AssociatesEditFrom />} />
          <Route path="/staff" element={<StaffCard />} />
          <Route path="/staffform" element={<StaffForm />} />
          <Route path="/staff/staffeditform/:staffId" element={<StaffEditForm />} />
          <Route path="/payments" element={<PaymentsCard />} />
          <Route path="/payments-form" element={<PaymentsForm />} />
          <Route path="/payments-form/:id" element={<PaymentEdit />} />
          <Route path="/invoice" element={<InvoiceCard />} />
          <Route path="/invoiceform" element={<InvoiceForm />} />
          <Route path="/invoice/edit/:id" element={<InvoiceEditForm />} />
          <Route path="/invoice/generate/:id" element={<InvoiceGeneration />} />
          <Route path="/invoice-view/:id" element={<InvoiceView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/quotation" element={<QuotationCard />} />
          <Route path="/vehiclequotation" element={<VehicleQuotation />} />
          <Route path="/hotelquotation" element={<HotelQuotationMain />} />
          <Route path="/flightquotation" element={<FlightQuotation />} />
          <Route path="/quickquotation" element={<QuickQuotation />} />
          <Route path="/quickquotation/edit/:id" element={<EditQuickQuotation />} />
          <Route path="/fullquotation" element={<FullQuotation />} />
          <Route path="/customquotation" element={<CustomQuotation />} />
          <Route path="/flightfinalize/:id" element={<FlightFinalize />} />
          <Route path="/vehiclefinalize/:id" element={<VehicleFinalize />} />
          <Route path="/hotelfinalize/:id" element={<HotelFinalize />} />
          <Route path="/customfinalize/:id" element={<CustomFinalize />} />
          <Route path="/quickfinalize/:id" element={<QuickFinalize />} />
          <Route path="/terms&condition" element={<GlobalSettings />} />
          <Route path="/admin/inside-company" element={<InsideCompanyList />} />

<Route path="/admin/inside-company/add" element={<CompanyForm />} />
          
<Route
  path="/company-website-enquiry"
  element={<CompanyWebsiteEnquiry />}
/>
          <Route
            path="*"
            element={
              <Container sx={{ textAlign: "center", mt: 10 }}>
                <Alert severity="error">
                  <AlertTitle>Page Not Found</AlertTitle>
                  The page you're looking for doesn't exist.
                </Alert>
              </Container>
            }
          />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default MainRoute;