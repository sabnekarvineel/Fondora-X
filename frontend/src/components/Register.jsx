import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
    // Startup-specific fields
    companyName: "",
    founderName: "",
    founderNumber: "",
    coFounderName: "",
    coFounderNumber: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const { name, email, mobile, password, role, companyName, founderName, founderNumber, coFounderName, coFounderNumber } = formData;

  // ✅ handle input changes
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ handle mobile input separately (numbers only, max 10)
  const onMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData({ ...formData, mobile: value });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ required fields
    if (!name || !email || !mobile || !password || !role) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // ✅ startup-specific validation
    if (role === "startup") {
      if (!companyName || !founderName || !founderNumber) {
        setError("For Startup: Company Name, Founder Name, and Founder Number are required");
        setLoading(false);
        return;
      }
      // Validate founder number (10-digit Indian mobile)
      const founderMobileRegex = /^[6-9]\d{9}$/;
      if (!founderMobileRegex.test(founderNumber)) {
        setError("Founder Number must be a valid 10-digit Indian mobile number");
        setLoading(false);
        return;
      }
      // Validate co-founder number if provided
      if (coFounderNumber) {
        if (!coFounderName) {
          setError("Co-founder Name is required if Co-founder Number is provided");
          setLoading(false);
          return;
        }
        if (!founderMobileRegex.test(coFounderNumber)) {
          setError("Co-founder Number must be a valid 10-digit Indian mobile number");
          setLoading(false);
          return;
        }
      }
    }

    // ✅ password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // ✅ Indian mobile validation (6–9 + 10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      setLoading(false);
      return;
    }

    try {
      await register(name, email, mobile, password, role, {
        companyName: role === "startup" ? companyName : null,
        founderName: role === "startup" ? founderName : null,
        founderNumber: role === "startup" ? founderNumber : null,
        coFounderName: role === "startup" ? coFounderName : null,
        coFounderNumber: role === "startup" ? coFounderNumber : null,
      });
      navigate("/dashboard");
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

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <input
            type="tel"
            name="mobile"
            value={mobile}
            onChange={onMobileChange}   // ✅ restricted input
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Enter your password"
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <select name="role" value={role} onChange={onChange}>
            <option value="">Select your role</option>
            <option value="student">Student</option>
            <option value="freelancer">Freelancer</option>
            <option value="startup">Startup</option>
            <option value="investor">Investor</option>
          </select>
        </div>

        {/* ✅ Startup-specific fields */}
        {role === "startup" && (
          <>
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={companyName}
                onChange={onChange}
                placeholder="Enter company name"
              />
            </div>

            <div className="form-group">
              <label>Founder Name *</label>
              <input
                type="text"
                name="founderName"
                value={founderName}
                onChange={onChange}
                placeholder="Enter founder name"
              />
            </div>

            <div className="form-group">
              <label>Founder Mobile Number *</label>
              <input
                type="tel"
                name="founderNumber"
                value={founderNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setFormData({ ...formData, founderNumber: value });
                  }
                }}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>

            <div className="form-group">
              <label>Co-founder Name (Optional)</label>
              <input
                type="text"
                name="coFounderName"
                value={coFounderName}
                onChange={onChange}
                placeholder="Enter co-founder name (optional)"
              />
            </div>

            <div className="form-group">
              <label>Co-founder Mobile Number (Optional)</label>
              <input
                type="tel"
                name="coFounderNumber"
                value={coFounderNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setFormData({ ...formData, coFounderNumber: value });
                  }
                }}
                placeholder="10-digit mobile number (optional)"
                maxLength={10}
              />
            </div>
          </>
        )}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Register;
