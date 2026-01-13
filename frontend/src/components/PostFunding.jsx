import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';

const API = import.meta.env.VITE_API_URL;

const PostFunding = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    linkedin: '',
    fundingAmount: '',
    currency: 'USD',
    stage: 'seed',
    industry: '',
    country: '',
    city: '',
    registrationNumber: '',
    registrationType: 'other',
    yearsOfOperation: '',
    employees: '',
    pitchDeck: '',
    businessPlan: '',
    valuation: '',
    equityOffered: '',
    useOfFunds: '',
    currentRevenue: '',
    projectedRevenue: '',
    currentCustomers: '',
    projectedCustomers: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Guard: validate user is authenticated before making API call
    if (!user || !user._id || !user.token) {
      setError('You must be logged in to post a funding request');
      setLoading(false);
      return;
    }

    try {
      const token = user.token;
      const requestData = {
        title: formData.title,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        linkedin: formData.linkedin,
        fundingAmount: parseInt(formData.fundingAmount),
        currency: formData.currency,
        stage: formData.stage,
        industry: formData.industry,
        country: formData.country,
        city: formData.city,
        registrationNumber: formData.registrationNumber,
        registrationType: formData.registrationType,
        yearsOfOperation: formData.yearsOfOperation ? parseInt(formData.yearsOfOperation) : 0,
        employees: formData.employees ? parseInt(formData.employees) : 0,
        pitchDeck: formData.pitchDeck,
        businessPlan: formData.businessPlan,
        valuation: formData.valuation ? parseInt(formData.valuation) : undefined,
        equityOffered: formData.equityOffered ? parseFloat(formData.equityOffered) : undefined,
        useOfFunds: formData.useOfFunds,
        revenue: {
          current: formData.currentRevenue ? parseInt(formData.currentRevenue) : 0,
          projected: formData.projectedRevenue ? parseInt(formData.projectedRevenue) : 0,
        },
        customers: {
          current: formData.currentCustomers ? parseInt(formData.currentCustomers) : 0,
          projected: formData.projectedCustomers ? parseInt(formData.projectedCustomers) : 0,
        },
      };

      await axios.post(`${API}/api/funding`, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh dashboard and navigate
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post funding request');
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
      <div className="post-funding-container">
        <h2> Post Funding Request</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Seed Round for AI-Powered Healthcare Platform"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Describe your startup, the problem you're solving, and why you need funding..."
            />
          </div>

          <h3>Contact Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="contact@startup.com"
              />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+1-555-0123"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://startup.com"
              />
            </div>

            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/startup"
              />
            </div>
          </div>

          <h3>Company Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Country *</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                placeholder="e.g., United States"
              />
            </div>

            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="e.g., San Francisco"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g., ABC123456"
              />
            </div>

            <div className="form-group">
              <label>Registration Type</label>
              <select name="registrationType" value={formData.registrationType} onChange={handleChange}>
                <option value="sole-proprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="private-ltd">Private Ltd</option>
                <option value="public-ltd">Public Ltd</option>
                <option value="llc">LLC</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Years of Operation</label>
              <input
                type="number"
                name="yearsOfOperation"
                value={formData.yearsOfOperation}
                onChange={handleChange}
                placeholder="2"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Number of Employees</label>
              <input
                type="number"
                name="employees"
                value={formData.employees}
                onChange={handleChange}
                placeholder="50"
                min="0"
              />
            </div>
          </div>

          <h3>Funding Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Funding Amount</label>
              <input
                type="number"
                name="fundingAmount"
                value={formData.fundingAmount}
                onChange={handleChange}
                required
                placeholder="500000"
              />
            </div>

            <div className="form-group">
              <label>Currency</label>
              <select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Funding Stage *</label>
              <select name="stage" value={formData.stage} onChange={handleChange} required>
                <option value="idea">Idea</option>
                <option value="seed">Seed</option>
                <option value="series-a">Series A</option>
                <option value="series-b">Series B</option>
                <option value="series-c">Series C</option>
                <option value="series-d">Series D</option>
              </select>
            </div>

            <div className="form-group">
              <label>Industry *</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                placeholder="e.g., HealthTech, FinTech, EdTech"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company Valuation</label>
              <input
                type="number"
                name="valuation"
                value={formData.valuation}
                onChange={handleChange}
                placeholder="5000000"
              />
            </div>

            <div className="form-group">
              <label>Equity Offered (%)</label>
              <input
                type="number"
                name="equityOffered"
                value={formData.equityOffered}
                onChange={handleChange}
                placeholder="10"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Pitch Deck URL</label>
            <input
              type="url"
              name="pitchDeck"
              value={formData.pitchDeck}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="form-group">
            <label>Business Plan URL</label>
            <input
              type="url"
              name="businessPlan"
              value={formData.businessPlan}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="form-group">
            <label>Use of Funds</label>
            <textarea
              name="useOfFunds"
              value={formData.useOfFunds}
              onChange={handleChange}
              rows="4"
              placeholder="Explain how you plan to use the funding..."
            />
          </div>

          <h3>Traction</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Current Revenue</label>
              <input
                type="number"
                name="currentRevenue"
                value={formData.currentRevenue}
                onChange={handleChange}
                placeholder="100000"
              />
            </div>

            <div className="form-group">
              <label>Projected Revenue</label>
              <input
                type="number"
                name="projectedRevenue"
                value={formData.projectedRevenue}
                onChange={handleChange}
                placeholder="500000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Customers</label>
              <input
                type="number"
                name="currentCustomers"
                value={formData.currentCustomers}
                onChange={handleChange}
                placeholder="1000"
              />
            </div>

            <div className="form-group">
              <label>Projected Customers</label>
              <input
                type="number"
                name="projectedCustomers"
                value={formData.projectedCustomers}
                onChange={handleChange}
                placeholder="5000"
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Posting...' : 'Post Funding Request'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default PostFunding;
