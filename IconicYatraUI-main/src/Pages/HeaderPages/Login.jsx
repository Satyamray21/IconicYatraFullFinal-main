import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  InputAdornment,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Email,
  Lock,
  Google,
  Facebook,
  Apple,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../Features/authSlice";
import ForgotPasswordModal from "../../Pages/HeaderPages/ForgotPasswordModal";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;

    try {
      const res = await dispatch(loginUser({ email, password })).unwrap();

      const token = res.token;
      const user = res.user;

      const adminUrl = import.meta.env.VITE_ADMIN_URL;

      window.location.replace(
        `${adminUrl}/?token=${token}&user=${encodeURIComponent(
          JSON.stringify(user),
        )}`,
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <>
      <Grid container sx={{ minHeight: "100vh" }}>
        {/* LEFT SIDE */}
        <Grid
          size={{ xs: 12, md: 6.5 }}
          sx={{
            backgroundImage:
              "url('https://damoclesjournal.com/wp-content/uploads/2022/02/0x0.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            textAlign: "center",
            p: 3,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(0, 0, 0, 0.6)",
              zIndex: 1,
            }}
          />
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Brush Script MT', cursive",
                fontWeight: "bold",
              }}
            >
              Iconic Yatra
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Travel is the only purchase that enriches you in ways
              <br />
              beyond material wealth
            </Typography>
          </Box>
        </Grid>

        {/* RIGHT SIDE */}
        <Grid
          size={{ xs: 12, md: 5.5 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            bgcolor: "#fff",
          }}
        >
          <Paper
            elevation={0}
            sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Button
                onClick={() => navigate("/")}
                sx={{ minWidth: "auto", color: "#1976d2" }}
              >
                <ArrowCircleLeftIcon fontSize="large" />
              </Button>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#1976d2",
                  flexGrow: 1,
                  textAlign: "center",
                }}
              >
                Welcome
              </Typography>
              <Box sx={{ width: 40 }} />
            </Box>

            <Typography variant="body2" sx={{ mb: 4 }}>
              Login with email or staff username
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              margin="normal"
              placeholder="Email or staff username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown} // <-- ENTER key handling
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              variant="outlined"
              margin="normal"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown} // <-- ENTER key handling
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && <Typography color="error">{error}</Typography>}

            <Typography
              variant="body2"
              sx={{
                textAlign: "right",
                mt: 1,
                color: "text.secondary",
                cursor: "pointer",
              }}
              onClick={() => setForgotOpen(true)}
            >
              Forgot your password?
            </Typography>

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 3, py: 1.2, fontWeight: "bold" }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "LOGIN"}
            </Button>

            <Divider sx={{ my: 3 }}>OR</Divider>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <IconButton color="error">
                <Google />
              </IconButton>
              <IconButton sx={{ color: "#1877f2" }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: "#000" }}>
                <Apple />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={forgotOpen}
        handleClose={() => setForgotOpen(false)}
      />
    </>
  );
};

export default LoginPage;
