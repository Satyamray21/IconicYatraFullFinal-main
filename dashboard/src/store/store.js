import { configureStore } from '@reduxjs/toolkit';
import LeadReducer from "../features/leads/leadSlice"
import StaffReducer from "../features/staff/staffSlice"
import AssociateReducer from "../features/associate/associateSlice"
import paymentReducer from "../features/payment/paymentSlice"
import hotelReducer from "../features/hotel/hotelSlice";
import locationReducer from "../features/location/locationSlice"
import packageReducer from "../features/package/packageSlice";
import cityReducer from "../features/allcities/citySlice";
import profileReducer from "../features/user/userSlice";
import vehicleQuotationReducer from "../features/quotation/vehicleQuotationSlice"
import flightQuotationReducer from "../features/quotation/flightQuotationSlice"
import hotelQuotationReducer from "../features/quotation/hotelQuotation"
import quickQuotationReducer from "../features/quotation/quickQuotationSlice";
import customQuotationReducer from "../features/quotation/customQuotationSlice"
import fullQuotationReducer from "../features/quotation/fullQuotationSlice"
import invoiceReducer from "../features/invoice/invoiceSlice"
import bankReducer from "../features/bank/bankSlice.js"
import companyUIReducer from "../features/companyUI/companyUISlice.js"
import galleryReducer from "../features/gallery/gallerySlice";
import companyReducer from "../features/company/InsideCompany";
export const store = configureStore({
  reducer: {
    leads: LeadReducer,
    staffs: StaffReducer,
    associate: AssociateReducer,
    payment: paymentReducer,
    hotel: hotelReducer,
    location: locationReducer,
    packages: packageReducer,
    cities: cityReducer,
    profile: profileReducer,
    vehicleQuotation: vehicleQuotationReducer,
    flightQuotation: flightQuotationReducer,
    hotelQuotation: hotelQuotationReducer,
    bank: bankReducer,
    quickQuotation: quickQuotationReducer,
    customQuotation: customQuotationReducer,
    fullQuotation: fullQuotationReducer,
    invoice: invoiceReducer,
    companyUI:companyUIReducer,
    gallery: galleryReducer,
    company: companyReducer,
  },
});

export default store;
