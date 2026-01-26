import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load Google Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large" }
        );
      }
    };

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      setError("");
      setLoading(true);
      console.log("🔐 Google login attempt...");
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        { token: response.credential }
      );
      console.log("✅ Login successful, token:", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setLoading(false);
      // Redirect after a brief delay to ensure state updates
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.message || "Google login failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <h1>Fondora-X</h1>
        <p>Connect. Innovate. Grow.</p>
      </div>

      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}

      {/* Primary Google Login */}
      <div style={{ marginBottom: "30px" }}>
        <p
          style={{
            marginBottom: "20px",
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Sign in with your Google account
        </p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div id="google-signin-btn"></div>
        </div>
      </div>

      <div className="auth-switch">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;
