import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const ShareModal = ({ post, isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [shareMethod, setShareMethod] = useState('messages');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Check this out!');
  const [shareStatus, setShareStatus] = useState(null);

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      const token = user?.token;
      const { data } = await axios.get('/api/search/quick-search', {
        params: { query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setShareStatus('Error searching users. Please try again.');
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const shareToMessages = async () => {
    if (selectedUsers.length === 0) {
      setShareStatus('Please select at least one user');
      setTimeout(() => setShareStatus(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const token = user?.token;
      let successCount = 0;
      let failureCount = 0;

      for (const userId of selectedUsers) {
        try {
          await axios.post(
            '/api/messages/send-direct',
            {
              recipientId: userId,
              content: message,
              postId: post._id,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          successCount++;
        } catch (err) {
          console.error(`Failed to send message to user ${userId}:`, err);
          failureCount++;
        }
      }

      if (successCount > 0) {
        const statusMsg = failureCount > 0 
          ? `Shared with ${successCount}/${selectedUsers.length} users`
          : `Post shared to ${successCount} user${successCount === 1 ? '' : 's'}!`;
        setShareStatus(statusMsg);
      } else {
        setShareStatus('Failed to share post. Please try again.');
      }

      setTimeout(() => {
        if (successCount > 0) {
          onClose();
        }
        setShareStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error sharing to messages:', error);
      setShareStatus('Error sharing post. Please try again.');
      setTimeout(() => setShareStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const shareToSocialMedia = (platform) => {
    const postUrl = `${window.location.origin}/feed`;
    const text = `Check out this post: "${post.content.substring(0, 100)}..."`;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = () => {
    const postUrl = `${window.location.origin}/feed`;
    navigator.clipboard.writeText(postUrl);
    setShareStatus('Link copied to clipboard!');
    setTimeout(() => setShareStatus(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Post</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {shareStatus && <div className="share-status">{shareStatus}</div>}

        <div className="modal-content">
          {/* Share Method Tabs */}
          <div className="share-tabs">
            <button
              className={`tab-btn ${shareMethod === 'messages' ? 'active' : ''}`}
              onClick={() => setShareMethod('messages')}
            >
               Messages
            </button>
            <button
              className={`tab-btn ${shareMethod === 'social' ? 'active' : ''}`}
              onClick={() => setShareMethod('social')}
            >
               Platforms
            </button>
            <button
              className={`tab-btn ${shareMethod === 'copy' ? 'active' : ''}`}
              onClick={() => setShareMethod('copy')}
            >
               Copy Link
            </button>
          </div>

          {/* Share to Messages */}
          {shareMethod === 'messages' && (
            <div className="share-section">
              <div className="search-users">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="search-input"
                />
              </div>

              {searchQuery && availableUsers.length > 0 && (
                <div className="users-list">
                  {availableUsers.map(u => (
                    <div
                      key={u._id}
                      className="user-item"
                      onClick={() => toggleUserSelection(u._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => toggleUserSelection(u._id)}
                      />
                      <img
                        src={u.profilePhoto || '/default-avatar.png'}
                        alt={u.name}
                        className="user-avatar"
                      />
                      <div>
                        <p className="user-name">{u.name}</p>
                        <p className="user-email">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div className="selected-users">
                  <p>Selected: {selectedUsers.length} user(s)</p>
                  <div className="selected-list">
                    {selectedUsers.map(userId => {
                      const user = availableUsers.find(u => u._id === userId);
                      return user ? (
                        <span key={userId} className="selected-tag">
                          {user.name}
                          <button
                            className="remove-btn"
                            onClick={() => toggleUserSelection(userId)}
                          >
                            ✕
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="message-input">
                <textarea
                  placeholder="Add a message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="3"
                  maxLength="500"
                />
              </div>

              <button
                className="btn btn-primary share-btn"
                onClick={shareToMessages}
                disabled={loading || selectedUsers.length === 0}
              >
                {loading ? 'Sharing...' : 'Share to Messages'}
              </button>
            </div>
          )}

          {/* Share to Social Media */}
          {shareMethod === 'social' && (
            <div className="share-section">
              <div className="social-buttons">
                <button
                  className="social-btn twitter"
                  onClick={() => shareToSocialMedia('twitter')}
                  title="Share on Twitter"
                >
                   Twitter
                </button>
                <button
                  className="social-btn facebook"
                  onClick={() => shareToSocialMedia('facebook')}
                  title="Share on Facebook"
                >
                   Facebook
                </button>
                <button
                  className="social-btn linkedin"
                  onClick={() => shareToSocialMedia('linkedin')}
                  title="Share on LinkedIn"
                >
                   LinkedIn
                </button>
                <button
                  className="social-btn whatsapp"
                  onClick={() => shareToSocialMedia('whatsapp')}
                  title="Share on WhatsApp"
                >
                   WhatsApp
                </button>
                <button
                  className="social-btn telegram"
                  onClick={() => shareToSocialMedia('telegram')}
                  title="Share on Telegram"
                >
                   Telegram
                </button>
              </div>
            </div>
          )}

          {/* Copy Link */}
          {shareMethod === 'copy' && (
            <div className="share-section">
              <div className="copy-link-section">
                <input
                  type="text"
                  value={`${window.location.origin}/feed`}
                  readOnly
                  className="link-input"
                />
                <button className="btn btn-secondary" onClick={copyToClipboard}>
                   Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
