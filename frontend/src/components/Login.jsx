import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [loginMethod, setLoginMethod] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { email, phone, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginIdentifier = loginMethod === 'email' ? email : phone;

    if (!loginIdentifier || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      await login(loginIdentifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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

      <div className="login-method-toggle">
        <button
          type="button"
          className={`toggle-btn ${loginMethod === 'email' ? 'active' : ''}`}
          onClick={() => setLoginMethod('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={`toggle-btn ${loginMethod === 'phone' ? 'active' : ''}`}
          onClick={() => setLoginMethod('phone')}
        >
          Phone
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {loginMethod === 'email' ? (
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
        ) : (
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={onChange}
              placeholder="Enter your phone number"
            />
          </div>
        )}
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
        <div className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="auth-switch">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default Login;
