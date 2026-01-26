import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    role: "",
    mobile: "",
    companyName: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const navigate = useNavigate();
  const { role, mobile, companyName, password } = formData;

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
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-btn"),
          { theme: "outline", size: "large" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = (response) => {
    try {
      setError("");
      // Decode the JWT to get user info
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const userData = JSON.parse(jsonPayload);
      setGoogleUser({
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
        token: response.credential,
      });
    } catch (err) {
      setError("Failed to process Google sign-in");
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData({ ...formData, mobile: value });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!googleUser) {
      setError("Please sign in with Google first");
      return;
    }

    if (!role) {
      setError("Please select your role");
      return;
    }

    if (!mobile) {
      setError("Please enter your mobile number");
      return;
    }

    // Validate Indian mobile format (6-9 + 10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    // Validate password (optional but if provided, must be 6+ characters)
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate startup company name
    if (role === "startup" && !companyName) {
      setError("Please enter your company name");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          token: googleUser.token,
          role,
          mobile,
          password: password || null,
          companyName: role === "startup" ? companyName : null,
        }
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "/profile";
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <h1>Fondora-X</h1>
        <p>Connect. Innovate. Grow.</p>
      </div>

      <h2>Create Account</h2>

      {error && <div className="error-message">{error}</div>}

      {!googleUser ? (
        <div className="google-signup-section">
          <p style={{ marginBottom: "20px", textAlign: "center", color: "#666" }}>
            Sign up with your Google account to get started
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div id="google-signup-btn"></div>
          </div>
        </div>
      ) : (
        <>
          <div
            className="google-user-info"
            style={{
              padding: "15px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {googleUser.picture && (
              <img
                src={googleUser.picture}
                alt="Profile"
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  marginBottom: "10px",
                }}
              />
            )}
            <p style={{ fontWeight: "bold", margin: "5px 0" }}>
              {googleUser.name}
            </p>
            <p style={{ color: "#888", fontSize: "14px", margin: "5px 0" }}>
              {googleUser.email}
            </p>
            <button
              type="button"
              onClick={() => {
                setGoogleUser(null);
                setFormData({ role: "", mobile: "", companyName: "" });
              }}
              style={{
                marginTop: "10px",
                background: "none",
                border: "none",
                color: "#007bff",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "12px",
              }}
            >
              Use different account
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Role *</label>
              <select name="role" value={role} onChange={onChange} required>
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="freelancer">Freelancer</option>
                <option value="startup">Startup</option>
                <option value="investor">Investor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                value={mobile}
                onChange={onMobileChange}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label>Password (Optional - for backup login)</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Enter password (min 6 characters)"
              />
            </div>

            {/* Startup-specific fields */}
            {role === "startup" && (
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={companyName}
                  onChange={onChange}
                  placeholder="Enter company name"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
        </>
      )}

      <div className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Register;
