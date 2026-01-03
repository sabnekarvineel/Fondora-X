import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSuccess('Password reset link has been sent to your email address.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">
      
        <h1>Fondora-X</h1>
        <p>Reset Your Password</p>
      </div>

      <h2>Forgot Password</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="auth-switch">
        Remember your password? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;