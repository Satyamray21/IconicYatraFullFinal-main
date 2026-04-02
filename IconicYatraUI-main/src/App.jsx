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
const { status: companyStatus } = useSelector((state) => state.companyUI);
const { status: homeStatus } = useSelector((state) => state.homePage);

  useEffect(() => {
  if (companyStatus === "idle") {
    dispatch(getCompany());
  }
}, [dispatch, companyStatus]);

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
