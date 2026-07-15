import { BrowserRouter } from 'react-router-dom';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MainRoutes from './Routes/MainRoutes';
import ScrollToTop from "../src/ScrollToTop";
import { getCompany } from "./Features/companyUISlice";
import { getHomePage } from "./Features/homePageSlice";
import { captureTrackingParams } from "./Utils/captureTrackingParams";

function App() {
  const dispatch = useDispatch();
const { data: companyData, status: companyStatus } = useSelector((state) => state.companyUI);
const { status: homeStatus } = useSelector((state) => state.homePage);

  useEffect(() => {
  if (companyStatus === "idle") {
    dispatch(getCompany());
  } else if (companyStatus === "succeeded" && companyData) {
    // Dynamic client-side SEO Injection
    // Uses baseCompany if available (from our recent backend update), otherwise fallback to company
    const baseCompany = companyData.baseCompany || companyData.company;
    if (baseCompany) {
      const title = baseCompany.seoTitle || `${baseCompany.companyName || 'Iconic Yatra'} | Tour Packages`;
      const description = baseCompany.seoDescription || `Explore premium tour packages with ${baseCompany.companyName || 'Iconic Yatra'}.`;
      const keywords = baseCompany.seoKeywords || `${baseCompany.companyName || 'Iconic Yatra'}, travel agency, tours`;
      const favicon = baseCompany.faviconUrl || "https://www.iconicyatra.com/logoiconic.jpg";

      document.title = title;
      
      const updateMetaTag = (name, content, attr = "name") => {
        let tag = document.querySelector(`meta[${attr}="${name}"]`);
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute(attr, name);
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", content);
      };

      updateMetaTag("title", title);
      updateMetaTag("description", description);
      updateMetaTag("keywords", keywords);
      updateMetaTag("og:title", title, "property");
      updateMetaTag("og:description", description, "property");
      updateMetaTag("twitter:title", title);
      updateMetaTag("twitter:description", description);

      const link = document.querySelector("link[rel*='icon']") || document.createElement("link");
      link.type = "image/jpeg";
      link.rel = "icon";
      link.href = favicon;
      document.head.appendChild(link);
    }
  }
}, [dispatch, companyStatus, companyData]);

useEffect(() => {
  if (homeStatus === "idle") {
    dispatch(getHomePage());
  }
}, [dispatch, homeStatus]);

  useEffect(() => {
    captureTrackingParams();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <MainRoutes />
    </BrowserRouter>
  );
}

export default App;
