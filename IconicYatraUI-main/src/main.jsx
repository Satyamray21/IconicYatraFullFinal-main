import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./Store/store.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </Provider>
  </StrictMode>
);
