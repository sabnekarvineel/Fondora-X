import { useState } from 'react';
import { restoreKeysWithPassword } from '../services/keySyncService.js';

const KeyRestoreModal = ({ serverKeys, onSuccess, onSkip, onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRestore = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!password.trim()) {
        throw new Error('Please enter your password');
      }

      const result = await restoreKeysWithPassword(password, serverKeys);

      if (result.success) {
        // Clear password from memory
        setPassword('');
        onSuccess();
      } else {
        setError(result.message || 'Failed to restore keys. Wrong password?');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while restoring keys');
      console.error('Key restore error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setPassword('');
    onSkip();
  };

  return (
    <div className="key-restore-modal-overlay">
      <style>{`
        .key-restore-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .key-restore-modal {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .key-restore-header {
          margin-bottom: 20px;
        }

        .key-restore-header h2 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
        }

        .key-restore-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }

        .key-restore-info {
          background: #f0f7ff;
          border-left: 4px solid #2196F3;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-size: 13px;
          color: #0d47a1;
        }

        .key-restore-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .key-restore-password-group {
          position: relative;
        }

        .key-restore-password-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-size: 14px;
          font-weight: 500;
        }

        .key-restore-password-wrapper {
          position: relative;
          display: flex;
        }

        .key-restore-password-group input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .key-restore-password-group input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .key-restore-toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-size: 18px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .key-restore-toggle-password:hover {
          color: #333;
        }

        .key-restore-error {
          padding: 12px;
          background: #ffebee;
          border: 1px solid #ef5350;
          border-radius: 6px;
          color: #c62828;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .key-restore-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .key-restore-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .key-restore-btn-restore {
          background: #2196F3;
          color: white;
        }

        .key-restore-btn-restore:hover:not(:disabled) {
          background: #1976D2;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .key-restore-btn-restore:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .key-restore-btn-skip {
          background: #f5f5f5;
          color: #666;
        }

        .key-restore-btn-skip:hover:not(:disabled) {
          background: #eeeeee;
        }

        .key-restore-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .key-restore-loading {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #2196F3;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .key-restore-hint {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
          line-height: 1.4;
        }
      `}</style>

      <div className="key-restore-modal">
        <div className="key-restore-header">
          <h2>Restore Encryption Keys</h2>
          <p>
            We found your encrypted message keys from another device. Enter your
            password to restore them and decrypt your messages.
          </p>
        </div>

        <div className="key-restore-info">
          Your encryption keys are safely stored on the server, encrypted with
          your password. Only you can decrypt them.
        </div>

        {error && <div className="key-restore-error">{error}</div>}

        <form onSubmit={handleRestore} className="key-restore-form">
          <div className="key-restore-password-group">
            <label htmlFor="restore-password">Password</label>
            <div className="key-restore-password-wrapper">
              <input
                id="restore-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="key-restore-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                tabIndex="-1"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="key-restore-hint">
              This password is used only to decrypt your keys. It's never sent to the server.
            </div>
          </div>

          <div className="key-restore-buttons">
            <button
              type="submit"
              className="key-restore-btn key-restore-btn-restore"
              disabled={loading || !password.trim()}
            >
              {loading && <span className="key-restore-loading"></span>}
              {loading ? 'Restoring...' : 'Restore Keys'}
            </button>
            <button
              type="button"
              className="key-restore-btn key-restore-btn-skip"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KeyRestoreModal;
