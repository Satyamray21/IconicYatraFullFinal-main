import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "./Routes/PublicRoute";
import MainRoute from "./Routes/MainRoute";
import NotFound from "./Pages/NotFound";
import { setProfile } from "./features/user/userSlice";
import { useDispatch } from "react-redux";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const user = params.get("user");

    if (token && user) {
      const parsedUser = JSON.parse(user);

      const normalizedUser = {
        ...parsedUser,
        fullName: parsedUser.fullName || parsedUser.name,
        userRole: parsedUser.userRole || parsedUser.role
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("userRole", normalizedUser.userRole);

      dispatch(setProfile(normalizedUser));
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedStoredUser = JSON.parse(storedUser);

        const normalizedStoredUser = {
          ...parsedStoredUser,
          fullName: parsedStoredUser.fullName || parsedStoredUser.name,
          userRole: parsedStoredUser.userRole || parsedStoredUser.role
        };

        dispatch(setProfile(normalizedStoredUser));
      }
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />} />
      <Route path="/*" element={<MainRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
