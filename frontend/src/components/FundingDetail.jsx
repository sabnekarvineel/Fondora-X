import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';

const API = import.meta.env.VITE_API_URL;

const FundingDetail = () => {
  const { id } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [fundingRequest, setFundingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [interests, setInterests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const [interestData, setInterestData] = useState({
    message: '',
    proposedAmount: '',
    proposedEquity: '',
    terms: '',
  });

  useEffect(() => {
    fetchFundingDetails();
    checkInterestStatus();
  }, [id]);

  const fetchFundingDetails = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.get(`${API}/api/funding/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFundingRequest(data);
      setLoading(false);
      } catch (error) {
      setError('Failed to load funding request details');
      setLoading(false);
      }
      };

      const checkInterestStatus = async () => {
          try {
          const token = user?.token;
          const { data } = await axios.get(`${API}/api/investor-interest/my-interests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const expressed = data.some(interest => interest && interest.fundingRequest && interest.fundingRequest._id === id);
          setHasExpressedInterest(expressed);
        } catch (error) {
          console.error(error);
        }
      };

  const fetchInterests = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.get(`${API}/api/investor-interest/funding/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterests(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = user?.token;
      await axios.post(
        `${API}/api/investor-interest/express`,
        {
          fundingRequestId: id,
          ...interestData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Interest expressed successfully!');
      setHasExpressedInterest(true);
      setShowInterestForm(false);
      setInterestData({
        message: '',
        proposedAmount: '',
        proposedEquity: '',
        terms: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to express interest');
    }
  };

  const handleUpdateStatus = async (interestId, status) => {
    try {
      const token = user?.token;
      await axios.put(
        `${API}/api/investor-interest/${interestId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchInterests();
      setSuccess(`Interest status updated to ${status}`);
    } catch (error) {
      setError('Failed to update interest status');
    }
  };

  useEffect(() => {
    if (fundingRequest && fundingRequest.startup._id === user._id) {
      fetchInterests();
    }
  }, [fundingRequest]);

  const handleEdit = () => {
    setEditData(fundingRequest);
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = user?.token;
      const updateData = {
        title: editData.title,
        description: editData.description,
        fundingAmount: parseInt(editData.fundingAmount),
        currency: editData.currency,
        stage: editData.stage,
        industry: editData.industry,
        pitchDeck: editData.pitchDeck,
        valuation: editData.valuation ? parseInt(editData.valuation) : undefined,
        equityOffered: editData.equityOffered ? parseFloat(editData.equityOffered) : undefined,
        useOfFunds: editData.useOfFunds,
        status: editData.status,
      };

      const { data } = await axios.put(`${API}/api/funding/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFundingRequest(data);
      setIsEditing(false);
      setSuccess('Funding request updated successfully!');
      } catch (err) {
      setError(err.response?.data?.message || 'Failed to update funding request');
      }
      };

      const handleDelete = async () => {
      if (!window.confirm('Are you sure you want to delete this funding request? This action cannot be undone.')) {
      return;
      }

      try {
      const token = user?.token;
      await axios.delete(`${API}/api/funding/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/funding');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete funding request');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!fundingRequest) return <div className="error">Funding request not found</div>;

  const isOwner = fundingRequest.startup._id === user._id;
  const canExpressInterest = user.role === 'investor' && !isOwner;

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="funding-detail-container">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {isEditing && editData ? (
            <div className="funding-edit-form">
              <h2>Edit Funding Request</h2>
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    required
                    rows="6"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Funding Amount</label>
                    <input
                      type="number"
                      name="fundingAmount"
                      value={editData.fundingAmount}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Currency</label>
                    <select name="currency" value={editData.currency} onChange={handleEditChange}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Stage</label>
                    <select name="stage" value={editData.stage} onChange={handleEditChange}>
                      <option value="idea">Idea</option>
                      <option value="seed">Seed</option>
                      <option value="series-a">Series A</option>
                      <option value="series-b">Series B</option>
                      <option value="series-c">Series C</option>
                      <option value="series-d">Series D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={editData.industry}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valuation</label>
                    <input
                      type="number"
                      name="valuation"
                      value={editData.valuation}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Equity Offered (%)</label>
                    <input
                      type="number"
                      name="equityOffered"
                      value={editData.equityOffered}
                      onChange={handleEditChange}
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Pitch Deck URL</label>
                  <input
                    type="url"
                    name="pitchDeck"
                    value={editData.pitchDeck}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Use of Funds</label>
                  <textarea
                    name="useOfFunds"
                    value={editData.useOfFunds}
                    onChange={handleEditChange}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={editData.status} onChange={handleEditChange}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
          <div className="funding-detail-header">
            <div className="funding-detail-title-section">
              <h1>{fundingRequest.title}</h1>
              <div className="funding-detail-meta">
                <span className="badge">{fundingRequest.stage}</span>
                <span className="badge">{fundingRequest.industry}</span>
                <span className={`status-badge ${fundingRequest.status}`}>{fundingRequest.status}</span>
              </div>
              {isOwner && (
                <div className="funding-actions">
                  <button
                    onClick={handleEdit}
                    className="btn"
                    style={{
                      backgroundColor: '#0F766E',
                      color: 'white',
                      marginTop: '15px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                     Edit Request
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn"
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      marginTop: '15px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                     Delete Request
                  </button>
                </div>
              )}
            </div>

            <div className="startup-card">
              <img
                src={fundingRequest.startup?.profilePhoto || '/default-avatar.png'}
                alt={fundingRequest.startup?.name}
                className="startup-avatar-large"
              />
              <div>
                <Link to={`/profile/${fundingRequest.startup._id}`} className="startup-name-link">
                  {fundingRequest.startup?.startupProfile?.startupName || fundingRequest.startup?.name}
                </Link>
                <p className="startup-role">Startup</p>
              </div>
            </div>
          </div>

          <div className="funding-detail-content">
            <section className="funding-section">
              <h3>About This Opportunity</h3>
              <p>{fundingRequest.description}</p>
            </section>

            <section className="funding-section">
              <h3>Funding Details</h3>
              <div className="funding-details-grid">
                <div className="detail-item-large">
                  <strong>Seeking:</strong>
                  <span className="amount">{fundingRequest.fundingAmount?.toLocaleString()} {fundingRequest.currency}</span>
                </div>
                
                {fundingRequest.valuation && (
                  <div className="detail-item-large">
                    <strong>Valuation:</strong>
                    <span className="amount">{fundingRequest.valuation?.toLocaleString()} {fundingRequest.currency}</span>
                  </div>
                )}

                {fundingRequest.equityOffered && (
                  <div className="detail-item-large">
                    <strong>Equity Offered:</strong>
                    <span className="amount">{fundingRequest.equityOffered}%</span>
                  </div>
                )}

                {fundingRequest.useOfFunds && (
                  <div className="detail-item-large">
                    <strong>Use of Funds:</strong>
                    <span>{fundingRequest.useOfFunds}</span>
                  </div>
                )}
              </div>
            </section>

            {fundingRequest.pitchDeck && (
              <section className="funding-section">
                <h3>Pitch Deck</h3>
                <a
                  href={fundingRequest.pitchDeck}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                   View Pitch Deck
                </a>
              </section>
            )}

            {fundingRequest.milestones && fundingRequest.milestones.length > 0 && (
              <section className="funding-section">
                <h3>Milestones</h3>
                <ul className="milestones-list">
                  {fundingRequest.milestones.map((milestone, index) => (
                    <li key={index}>{milestone}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="funding-section">
              <div className="stats-row">
                <div className="stat-item">
                  <strong>{fundingRequest.interests?.length || 0}</strong>
                  <span>Interested Investors</span>
                </div>
                <div className="stat-item">
                  <strong>{fundingRequest.views || 0}</strong>
                  <span>Views</span>
                </div>
              </div>
            </section>

            {canExpressInterest && (
              <section className="funding-section">
                {hasExpressedInterest ? (
                  <div className="already-interested">
                    <p>✓ You have already expressed interest in this funding request</p>
                  </div>
                ) : fundingRequest.status === 'open' ? (
                  <>
                    {!showInterestForm ? (
                      <button
                        className="btn btn-primary btn-large"
                        onClick={() => setShowInterestForm(true)}
                      >
                        Express Interest
                      </button>
                    ) : (
                      <div className="interest-form">
                        <h3>Express Your Interest</h3>
                        <form onSubmit={handleExpressInterest}>
                          <div className="form-group">
                            <label>Message / Offer Details *</label>
                            <textarea
                              value={interestData.message}
                              onChange={(e) =>
                                setInterestData({
                                  ...interestData,
                                  message: e.target.value,
                                })
                              }
                              rows="6"
                              required
                              placeholder="Describe your offer and why you are interested in this startup..."
                            />
                          </div>

                          <div className="form-group">
                            <label>Proposed Investment Amount</label>
                            <input
                              type="number"
                              value={interestData.proposedAmount}
                              onChange={(e) =>
                                setInterestData({
                                  ...interestData,
                                  proposedAmount: e.target.value,
                                })
                              }
                              placeholder="Amount you're willing to invest"
                            />
                          </div>

                          <div className="form-group">
                            <label>Proposed Equity (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={interestData.proposedEquity}
                              onChange={(e) =>
                                setInterestData({
                                  ...interestData,
                                  proposedEquity: e.target.value,
                                })
                              }
                              placeholder="Equity percentage"
                            />
                          </div>

                          <div className="form-group">
                            <label>Terms and Conditions</label>
                            <textarea
                              value={interestData.terms}
                              onChange={(e) =>
                                setInterestData({
                                  ...interestData,
                                  terms: e.target.value,
                                })
                              }
                              rows="4"
                              placeholder="Any specific terms or conditions for this offer (e.g., Board seat, Voting rights)"
                            />
                          </div>

                          <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                              Submit Interest
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => setShowInterestForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="funding-closed">
                    <p>This funding request is no longer open</p>
                  </div>
                )}
              </section>
            )}

            {isOwner && interests.length > 0 && (
              <section className="funding-section">
                <h3>Investor Interests ({interests.length})</h3>
                <div className="interests-list">
                  {interests.map((interest) => (
                    <div key={interest._id} className="interest-card">
                      <div className="interest-header">
                        <div className="investor-info">
                          <img
                            src={interest.investor?.profilePhoto || '/default-avatar.png'}
                            alt={interest.investor?.name}
                            className="investor-avatar"
                          />
                          <div>
                            <Link
                              to={`/profile/${interest.investor._id}`}
                              className="investor-name"
                            >
                              {interest.investor?.name}
                            </Link>
                            <p className="investor-role">Investor</p>
                          </div>
                        </div>
                        <span className={`status-badge ${interest.status}`}>
                          {interest.status}
                        </span>
                      </div>

                      <div className="interest-content">
                        <p><strong>Message:</strong></p>
                        <p>{interest.message}</p>
                        {interest.proposedAmount && (
                          <p><strong>Proposed Amount:</strong> ${interest.proposedAmount?.toLocaleString()}</p>
                        )}
                        {interest.proposedEquity && (
                          <p><strong>Proposed Equity:</strong> {interest.proposedEquity}%</p>
                        )}
                        {interest.terms && (
                          <>
                            <p><strong>Terms:</strong></p>
                            <p>{interest.terms}</p>
                          </>
                        )}
                      </div>

                      {interest.status === 'pending' && (
                        <div className="interest-actions">
                          <button
                            className="btn btn-success"
                            onClick={() => handleUpdateStatus(interest._id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-warning"
                            onClick={() => handleUpdateStatus(interest._id, 'in-discussion')}
                          >
                            Discuss
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleUpdateStatus(interest._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundingDetail;
