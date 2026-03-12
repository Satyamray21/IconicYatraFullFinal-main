import { BrowserRouter } from 'react-router-dom';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MainRoutes from './Routes/MainRoutes';
import ScrollToTop from "../src/ScrollToTop";
import { getCompany } from "./Features/companyUISlice";
import { captureTrackingParams } from "./Utils/captureTrackingParams";

function App() {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.companyUI);

  useEffect(() => {
    if (status === "idle") {
      dispatch(getCompany());
    }
  }, [dispatch, status]);
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
