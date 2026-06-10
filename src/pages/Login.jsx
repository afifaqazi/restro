import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../firebase";
import { getUserByUid } from "../models/userModel";
import { showToast } from "../helpers/toast";
import { isValidEmail, isValidPassword } from "../helpers/validators";
import { showLoader, hideLoader } from "../helpers/loader";

export default function Login({ user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const navigate = useNavigate();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const AUTH_ERRORS = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled. Contact your admin.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid credentials. Please check and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  };

  const friendlyError = (code) => {
    return AUTH_ERRORS[code] || "Something went wrong. Please try again.";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password || !isValidPassword(password)) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsBusy(true);
    showLoader();

    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserByUid(firebaseUser.uid, firebaseUser.email);

      if (!profile) {
        setErrorMsg("Account not configured. Contact your admin.");
        await auth.signOut();
        setIsBusy(false);
        hideLoader();
        return;
      }

      if (profile.status !== true) {
        setErrorMsg("Your account is inactive. Contact your admin.");
        await auth.signOut();
        setIsBusy(false);
        hideLoader();
        return;
      }

      sessionStorage.setItem("restro_user", JSON.stringify(profile));
      showToast(`Welcome back, ${profile.name || profile.displayName || "User"}!`, "success");
      
      // Navigate to dashboard
      navigate("/dashboard");
      
    } catch (err) {
      console.error("Login error:", err);
      const msg = friendlyError(err.code);
      setErrorMsg(msg);
      showToast(msg, "error");
    } finally {
      setIsBusy(false);
      hideLoader();
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-card__brand">
          <div className="auth-card__brand-icon">
            <i className="bi bi-shop"></i>
          </div>
          <h1 className="auth-card__title">Restro POS</h1>
          <p className="auth-card__subtitle">Sign in to your account</p>
        </div>

        {/* Form */}
        <form id="loginForm" className="auth-form" onSubmit={handleLogin} noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="emailInput">Email address</label>
            <input
              type="email"
              id="emailInput"
              className="form-control form-control-brand"
              placeholder="you@restaurant.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="passwordInput">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="passwordInput"
                className="form-control form-control-brand"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label="Show password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          {/* Inline error */}
          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 small" role="alert">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button type="submit" id="loginBtn" className="btn btn-brand mt-2" disabled={isBusy}>
            {isBusy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
