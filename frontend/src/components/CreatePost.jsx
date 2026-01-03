import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;


const CreatePost = ({ onPostCreated }) => {
  const { user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const token = user?.token;
      let mediaUrls = [];
      let mediaItems = [];
      let mediaUrl = '';
      let mediaType = 'none';

      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => {
          formData.append('media', file);
        });

                const uploadRes = await axios.post(
            `${API}/api/posts/upload/multiple`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );


        mediaUrls = uploadRes.data.mediaUrls;
        mediaItems = uploadRes.data.mediaItems;
        // Set first media as primary for backward compatibility
        if (mediaUrls.length > 0) {
          mediaUrl = mediaUrls[0];
          mediaType = mediaItems[0]?.type || 'image';
        }
      }

      const { data } = await axios.post(
          `${API}/api/posts`,
          {
            content,
            mediaUrl,
            mediaUrls,
            mediaItems,
            mediaType,
            taggedUsers,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );


      onPostCreated(data);
      setContent('');
      setMediaFiles([]);
      setMediaPreview([]);
      setTaggedUsers([]);
      setSearchQuery('');
      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMediaFiles(files);
      
      // For async preview generation (images and videos)
      const previewPromises = files.map((file) => {
        return new Promise((resolve) => {
          const isVideo = file.type.startsWith('video');
          
          if (isVideo) {
            // For videos, create a thumbnail from the first frame
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
              video.currentTime = 0;
            };
            video.onseeked = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0);
              resolve({
                preview: canvas.toDataURL(),
                type: 'video',
                fileName: file.name,
              });
            };
            video.src = URL.createObjectURL(file);
          } else {
            // For images, load directly
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                preview: reader.result,
                type: 'image',
                fileName: file.name,
              });
            };
            reader.readAsDataURL(file);
          }
        });
      });
      
      Promise.all(previewPromises).then((previews) => {
        setMediaPreview(previews);
      });
    }
  };

  const removeImage = (index) => {
    const updatedFiles = mediaFiles.filter((_, i) => i !== index);
    const updatedPreviews = mediaPreview.filter((_, i) => i !== index);
    setMediaFiles(updatedFiles);
    setMediaPreview(updatedPreviews);
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      const token = user?.token;
          const { data } = await axios.get(
        `${API}/api/search/quick-search`,
        {
          params: { query },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Filter out already tagged users
      const filtered = data.filter(u => !taggedUsers.includes(u._id));
      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addTaggedUser = (userId, userName) => {
    if (!taggedUsers.includes(userId)) {
      setTaggedUsers([...taggedUsers, userId]);
      setSearchQuery('');
      setAvailableUsers([]);
    }
  };

  const removeTaggedUser = (userId) => {
    setTaggedUsers(taggedUsers.filter(id => id !== userId));
  };

  return (
    <div className="create-post-card">
      <h3>Create a Post</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows="4"
          maxLength="2000"
        />
        
        {/* Tag Users Section */}
        <div className="tag-users-section">
          <button
            type="button"
            className="tag-toggle-btn"
            onClick={() => setShowUserSearch(!showUserSearch)}
            title="Tag users in this post"
          >
             Tag Users ({taggedUsers.length})
          </button>

          {showUserSearch && (
            <div className="user-tagging-container">
              <input
                type="text"
                placeholder="Search users to tag..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="tag-search-input"
              />

              {searchQuery && availableUsers.length > 0 && (
                <div className="tag-users-dropdown">
                  {availableUsers.map(u => (
                    <div
                      key={u._id}
                      className="tag-user-item"
                      onClick={() => addTaggedUser(u._id, u.name)}
                    >
                      <img
                        src={u.profilePhoto || '/default-avatar.png'}
                        alt={u.name}
                        className="tag-user-avatar"
                      />
                      <div>
                        <p>{u.name}</p>
                        <span>{u.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {taggedUsers.length > 0 && (
                <div className="tagged-users-display">
                  {taggedUsers.map(userId => {
                    const taggedUser = availableUsers.find(u => u._id === userId) || 
                                      { _id: userId, name: 'Loading...' };
                    return (
                      <span key={userId} className="tagged-user-tag">
                        {taggedUser.name}
                        <button
                          type="button"
                          onClick={() => removeTaggedUser(userId)}
                          className="remove-tag-btn"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Media Preview Grid */}
        {mediaPreview.length > 0 && (
          <div className="media-preview-grid">
            {mediaPreview.map((item, index) => (
              <div key={index} className="media-preview-item">
                <img src={item.preview} alt={`Preview ${index + 1}`} />
                {item.type === 'video' && (
                  <div className="video-badge">
                    <span>🎬 Video</span>
                  </div>
                )}
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(index)}
                  title={`Remove ${item.type}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="post-actions">
          <div className="file-input-wrapper">
            <label htmlFor="media-upload" className="file-label">
              📎 Add Media (Images/Videos up to 10)
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {mediaFiles.length > 0 && (
              <span className="file-name">{mediaFiles.length} image(s) selected</span>
            )}
          </div>
          
          <button type="submit" className="btn" disabled={uploading}>
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
