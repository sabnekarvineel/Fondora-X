import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validating, setValidating] = useState(true);

  const { password, confirmPassword } = formData;

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
      setValidating(false);
    } else {
      setValidating(false);
    }
  }, [token]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API}/api/auth/reset-password/${token}`, {
        password,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setFormData({ password: '', confirmPassword: '' });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Link may have expired.');
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-container">
        <div className="auth-logo">
          <h1>Fondora-X</h1>
          <p>Reset Your Password</p>
        </div>
        <p style={{ color: '#666', textAlign: 'center' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <h1>Fondora-X</h1>
        <p>Reset Your Password</p>
      </div>

      <h2>Create New Password</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
        Enter a new password for your account.
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Enter new password"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            placeholder="Confirm password"
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="auth-switch">
        Back to <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
