import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');

  const [feedbackData, setFeedbackData] = useState({
    subject: '',
    message: '',
    type: 'bug', // bug, feature, general
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificationsEnabled(data.notificationsEnabled);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const token = user?.token;
      await axios.put(
        '/api/settings/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.put(
        '/api/settings/toggle-notifications',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotificationsEnabled(data.notificationsEnabled);
      setSuccess(data.message);
    } catch (err) {
      setError('Failed to update notification settings');
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword) {
      setError('Please enter your password to deactivate account');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = user?.token;
      await axios.put(
        '/api/settings/deactivate',
        { password: deactivatePassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Account deactivated successfully. You will be logged out.');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate account');
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (!feedbackData.subject || !feedbackData.message) {
      setError('Please fill in all feedback fields');
      return;
    }

    setFeedbackSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = user?.token;
      await axios.post(
        '/api/feedback',
        {
          ...feedbackData,
          userId: user?._id,
          userEmail: user?.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Thank you! Your feedback has been submitted successfully.');
      setFeedbackData({
        subject: '',
        message: '',
        type: 'bug',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="container">
        <div className="settings-container">
          <h2>⚙️ Settings & Privacy</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="settings-section">
            <h3> Edit Profile</h3>
            <p>Update your profile information, skills, and role-specific details.</p>
            <Link to={`/profile/${user?._id}`} className="btn">
              Go to Profile (Edit from there)
            </Link>
          </div>

          <div className="settings-section">
            <h3>🔒 Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                  minLength="6"
                />
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>

          <div className="settings-section">
            <h3>🔔 Notifications</h3>
            <div className="notification-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={handleToggleNotifications}
                />
                <span style={{ marginLeft: '10px' }}>
                  Enable notifications
                </span>
              </label>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                {notificationsEnabled
                  ? 'You will receive notifications for follows, likes, comments, and messages.'
                  : 'Notifications are currently disabled.'}
              </p>
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h3>⚠️ Deactivate Account</h3>
            <p>
              Deactivating your account will hide your profile and prevent others from seeing your
              content.
            </p>

            {!showDeactivateConfirm ? (
              <button
                className="btn btn-danger"
                onClick={() => setShowDeactivateConfirm(true)}
              >
                Deactivate Account
              </button>
            ) : (
              <div className="deactivate-modal-overlay">
                <div className="deactivate-modal">
                  <div className="modal-header">
                    <h4>⚠️ This action cannot be undone</h4>
                    <button
                      className="modal-close"
                      onClick={() => {
                        setShowDeactivateConfirm(false);
                        setDeactivatePassword('');
                        setError('');
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="modal-content">
                    <p className="warning-text">
                      When you deactivate your account:
                    </p>
                    <ul className="warning-list">
                      <li>All your posts will be permanently deleted</li>
                      <li>All your messages will be permanently deleted</li>
                      <li>Your profile will no longer be visible</li>
                      <li>Your account data cannot be recovered</li>
                    </ul>

                    <div className="form-group">
                      <label>Enter your password to confirm</label>
                      <input
                        type="password"
                        value={deactivatePassword}
                        onChange={(e) => setDeactivatePassword(e.target.value)}
                        placeholder="Password"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowDeactivateConfirm(false);
                        setDeactivatePassword('');
                        setError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleDeactivateAccount}
                      disabled={loading || !deactivatePassword}
                    >
                      {loading ? 'Deactivating...' : 'Deactivate Permanently'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="settings-section feedback-section">
            <h3> Send us Feedback</h3>
            <p>Help us improve! Share your feedback, bug reports, or feature requests.</p>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label>Feedback Type</label>
                <select
                  value={feedbackData.type}
                  onChange={(e) => setFeedbackData({ ...feedbackData, type: e.target.value })}
                >
                  <option value="bug"> Bug Report</option>
                  <option value="feature"> Feature Request</option>
                  <option value="general"> General Feedback</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={feedbackData.subject}
                  onChange={(e) => setFeedbackData({ ...feedbackData, subject: e.target.value })}
                  placeholder="Brief subject of your feedback"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={feedbackData.message}
                  onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                  placeholder="Detailed feedback or description"
                  rows="5"
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={feedbackSubmitting}>
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>

          <div className="settings-section contact-section">
            <h3> Contact Us</h3>
            <p>Have questions or need help? Reach out to us through any of these channels:</p>

            <div className="contact-info">
              <div className="contact-item">
                <h4> Email Support</h4>
                <p>
                  <a href="mailto:sabnekarvineel862@gmail.com">sabnekarvineel862@gmail.com</a>
                </p>
                <span className="contact-detail">For general inquiries and support</span>
              </div>

              <div className="contact-item">
                <h4> Report a Bug</h4>
                <p>
                  <a href="mailto:sabnekarvineel862@gmail.com">sabnekarvineel862@gmail.com</a>
                </p>
                <span className="contact-detail">Report issues or technical problems</span>
              </div>

              <div className="contact-item">
                <h4> Business Inquiries</h4>
                <p>
                  <a href="mailto:sabnekarvineel862@gmail.com">sabnekarvineel862@gmail.com</a>
                </p>
                <span className="contact-detail">For partnerships and collaborations</span>
              </div>

              <div className="contact-item">
                <h4> Social Media</h4>
                <div className="social-links">
                  <a href="https://www.linkedin.com/in/sabnekar-vineel/" target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </div>
              </div>


            </div>
          </div>
          </div>
          </div>

      <style jsx>{`
        .settings-container {
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
        }

        .settings-section {
          background: white;
          padding: 30px;
          margin-bottom: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .settings-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 20px;
        }

        .settings-section p {
          color: #666;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .notification-toggle {
          padding: 15px;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .danger-zone {
          border: 2px solid #ff4444;
        }

        .danger-zone h3 {
          color: #ff4444;
        }

        .btn {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        }

        .btn:hover {
          background: #0056b3;
        }

        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-danger {
          background: #ff4444;
        }

        .btn-danger:hover {
          background: #cc0000;
        }

        .deactivate-modal-overlay {
           position: fixed;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           background: rgba(0, 0, 0, 0.6);
           display: flex;
           justify-content: center;
           align-items: center;
           z-index: 1000;
         }

         .deactivate-modal {
           background: white;
           border-radius: 8px;
           box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
           max-width: 500px;
           width: 90%;
           max-height: 90vh;
           overflow-y: auto;
           animation: slideIn 0.3s ease-out;
         }

         @keyframes slideIn {
           from {
             transform: translateY(-50px);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }

         .modal-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 20px;
           border-bottom: 1px solid #eee;
         }

         .modal-header h4 {
           margin: 0;
           color: #d32f2f;
           font-size: 18px;
         }

         .modal-close {
           background: none;
           border: none;
           font-size: 24px;
           cursor: pointer;
           color: #999;
           padding: 0;
           width: 30px;
           height: 30px;
           display: flex;
           align-items: center;
           justify-content: center;
         }

         .modal-close:hover {
           color: #333;
         }

         .modal-content {
           padding: 20px;
         }

         .warning-text {
           font-weight: 600;
           color: #333;
           margin-bottom: 15px;
         }

         .warning-list {
           list-style: none;
           padding: 0;
           margin-bottom: 20px;
         }

         .warning-list li {
           padding: 8px 0;
           padding-left: 30px;
           color: #d32f2f;
           position: relative;
           font-size: 14px;
         }

         .warning-list li:before {
           content: '✓';
           position: absolute;
           left: 0;
           font-weight: bold;
         }

         .modal-footer {
           display: flex;
           gap: 10px;
           justify-content: flex-end;
           padding: 20px;
           border-top: 1px solid #eee;
         }

         .btn-secondary {
           background: #6c757d;
         }

         .btn-secondary:hover {
           background: #5a6268;
         }

         .error-message {
           background: #ffebee;
           color: #c62828;
           padding: 12px;
           border-radius: 4px;
           margin-bottom: 20px;
         }

         .success-message {
           background: #e8f5e9;
           color: #2e7d32;
           padding: 12px;
           border-radius: 4px;
           margin-bottom: 20px;
         }

         .feedback-section {
           background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
           border-left: 4px solid #4CAF50;
         }

         .feedback-section h3 {
           color: #333;
         }

         textarea {
           width: 100%;
           padding: 10px;
           border: 1px solid #ddd;
           border-radius: 4px;
           font-size: 14px;
           font-family: inherit;
           resize: vertical;
         }

         textarea:focus {
           outline: none;
           border-color: #4CAF50;
           box-shadow: 0 0 5px rgba(76, 175, 80, 0.2);
         }

         select {
           width: 100%;
           padding: 10px;
           border: 1px solid #ddd;
           border-radius: 4px;
           font-size: 14px;
           background: white;
           cursor: pointer;
         }

         select:focus {
           outline: none;
           border-color: #4CAF50;
           box-shadow: 0 0 5px rgba(76, 175, 80, 0.2);
         }

         .contact-section {
           background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
           border-left: 4px solid #ff9800;
         }

         .contact-section h3 {
           color: #333;
         }

         .contact-info {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
           gap: 20px;
           margin-top: 20px;
         }

         .contact-item {
           background: white;
           padding: 20px;
           border-radius: 8px;
           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
           transition: transform 0.3s, box-shadow 0.3s;
         }

         .contact-item:hover {
           transform: translateY(-5px);
           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
         }

         .contact-item.full-width {
           grid-column: 1 / -1;
         }

         .contact-item h4 {
           margin: 0 0 12px 0;
           color: #333;
           font-size: 16px;
         }

         .contact-item p {
           margin: 5px 0;
           color: #666;
           line-height: 1.6;
         }

         .contact-item a {
           color: #4CAF50;
           text-decoration: none;
           font-weight: 500;
           transition: color 0.3s;
         }

         .contact-item a:hover {
           color: #45a049;
           text-decoration: underline;
         }

         .contact-detail {
           display: block;
           margin-top: 8px;
           font-size: 12px;
           color: #999;
           font-style: italic;
         }

         .social-links {
           display: flex;
           gap: 12px;
           flex-wrap: wrap;
           margin-top: 10px;
         }

         .social-links a {
           display: inline-block;
           padding: 8px 16px;
           background: #4CAF50;
           color: white;
           border-radius: 4px;
           text-decoration: none;
           font-size: 13px;
           transition: all 0.3s;
         }

         .social-links a:hover {
           background: #45a049;
           transform: translateY(-2px);
           box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
         }

         @media (max-width: 768px) {
           .contact-info {
             grid-template-columns: 1fr;
           }

           .contact-item.full-width {
             grid-column: 1;
           }
         }
         `}</style>
    </div>
  );
};

export default Settings;
