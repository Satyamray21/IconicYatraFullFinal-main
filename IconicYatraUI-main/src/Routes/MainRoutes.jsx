// src/MainRoutes.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from '../Components/Layout';

import Payment from '../Pages/HeaderPages/Payment';
import Service from '../Pages/HeaderPages/Service';
import Home from '../Pages/HomePages/Home';
import PackageCard from '../Components/PackageCard';
import Holidays from '../Pages/HomePages/Holidays';
import Testimonial from '../Pages/HomePages/Testimonial';
import Contects from '../Pages/HomePages/Contects';
import FeaturedPackages from '../Components/FeaturedPackages';
import FixDeparture from '../Pages/HomePages/FixDeparture';
import TigerSafari from '../Pages/HomePages/TigerSafari';
import Domestic from '../Pages/HomePages/Domestic';
import International from '../Pages/HomePages/International';
import SpecialPackages from '../Components/SpecialPackages';
import PackageDetail from '../Components/PackageDetails';
import IconicLandingPage from '../Pages/LandingPage/IconicLandingPage';
import Support from '../Pages/HomePages/Support';
import WhyChooseUs from '../Components/WhyChooseUs';
import DomesticPackage from '../Components/DomesticPackage';
import HolidaysPackages from '../Components/HolidaysPackages';
import Gallery from '../Components/Gallery';
import Yatra from '../Pages/HomePages/Yatra';
import AllHolidaysPackages from '../Pages/HomePages/AllHolidaysPackages';
import AllLatestPackages from '../Pages/HomePages/AllLatestPackages';
import About from "../Components/About";
import Gellary from "../Components/GellaryFooter";
import Careers from "../Components/Careers";
import Testimonials from "../Components/Testimonials"
import CancellationRefundPolicy from "../Components/CancellationRefundPolicy";
import InternationalPackageDetail from '../Components/InternationalPackageDetail';
import ForgotPasswordModal from '../Pages/HeaderPages/ForgotPasswordModal';
import TermConditions from '../Components/Term&Conditions';
import CancellationPolicy from '../Components/CancelationPolicy';
import PrivacyPolicy from '../Components/PrivacyPolicy';
import LoginPage from '../Pages/HeaderPages/Login';
import LatestBlog from '../Components/LatestBlog';
import BlogDetail from '../Components/LatestBlogDetail'; 
import SpecialPackageDetail from '../Components/SpecialPackageDetail';
import ThankYouPage from '../Pages/HomePages/ThankYou';
import PaymentFailed from '../Pages/HomePages/PaymentFailed';
import PaymentSuccess from '../Pages/HomePages/PaymentSuccess';
import EasebuzzPayment from '../Pages/HeaderPages/EasebuzzPayment';
const MainRoutes = () => {
  return (
    <Routes>
      {/* Exact paths first */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Package detail route - should come before other dynamic routes */}
      <Route path="/package/:packageId" element={<Layout><PackageDetail /></Layout>} />

      {/* Other specific routes */}
      <Route path="/payment" element={<Layout><Payment /></Layout>} />
      <Route path="/services" element={<Layout><Service /></Layout>} />
      <Route path="/package-card" element={<Layout><PackageCard /></Layout>} />
      <Route path="/holidays" element={<Layout><Holidays /></Layout>} />
      <Route path="/testimonial" element={<Layout><Testimonial /></Layout>} />
      <Route path="/contact" element={<Layout><Contects /></Layout>} />
      <Route path="/featured-packages" element={<Layout><FeaturedPackages /></Layout>} />
      <Route path="/all-latest-packages" element={<Layout><AllLatestPackages /></Layout>} />
      <Route path="/special-packages" element={<Layout><SpecialPackages /></Layout>} />
      <Route path="/support" element={<Layout><Support /></Layout>} />
      <Route path="/why-choose-us" element={<Layout><WhyChooseUs /></Layout>} />
      <Route path="/domestic-packages" element={<Layout><DomesticPackage /></Layout>} />
      <Route path="/holiday-packages" element={<Layout><HolidaysPackages /></Layout>} />
      <Route path="/all-packages" element={<Layout><AllHolidaysPackages /></Layout>} />
      <Route path="/spiritual-tour" element={<Layout><Yatra /></Layout>} />
      <Route path="/gallary" element={<Layout><Gallery /></Layout>} />
      <Route path="/aboutus" element={<Layout><About /></Layout>} />
      <Route path="/gallery" element={<Layout><Gellary /></Layout>} />
      <Route path="/careers" element={<Layout><Careers /></Layout>} />
      <Route path="/testimonials" element={<Layout><Testimonials /></Layout>} />
      <Route path="/cancellation-refundpolicy" element={<Layout><CancellationRefundPolicy /></Layout>} />

      {/* Dynamic routes - should come after specific routes */}
      <Route path="/fixed/:destination" element={<Layout><FixDeparture /></Layout>} />
      <Route path="/safari/:destination" element={<Layout><TigerSafari /></Layout>} />
      <Route path="/domestic" element={<Layout><Domestic /></Layout>} />
      <Route path="/domestic/:destination" element={<Layout><Domestic /></Layout>} />
      <Route path="/international" element={<Layout><International /></Layout>} />
      <Route path="/international/:destination" element={<Layout><International /></Layout>} />
      <Route path="/internationalpackage/:packageId" element={<Layout><InternationalPackageDetail /></Layout>}
      />
      <Route path="/forgate-pasdsword" element={<Layout><ForgotPasswordModal /></Layout>} />
      <Route path="/terms-conditions" element={<Layout><TermConditions /></Layout>} />
      <Route path="/cancellationandrefundpolicy" element={<Layout><CancellationPolicy /></Layout>} />
      <Route path="/privacypolicy" element={<Layout><PrivacyPolicy /></Layout>} />

      <Route path="/latestblogs" element={<Layout><LatestBlog /></Layout>} />
      <Route path="/latestblogs/:slug" element={<Layout><BlogDetail /></Layout>} />
      <Route path="/special-package-details/:packageId" element={<Layout><SpecialPackageDetail /></Layout>} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failed" element={<PaymentFailed />} />
       <Route path="/easebuzz" element={<EasebuzzPayment />} />
      {/* 404 route - should be last */}
      <Route path="*" element={<Layout><div>Page Not Found</div></Layout>} />
       <Route path="/thank-you" element={<Layout><ThankYouPage /></Layout>} />
        <Route path="/:slug" element={<IconicLandingPage />} />
    </Routes>
  );
};

export default MainRoutes;