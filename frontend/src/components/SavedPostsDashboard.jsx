import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';
import PostCard from './PostCard';
import EngagementDashboard from './EngagementDashboard';

const API = import.meta.env.VITE_API_URL;

const SavedPostsDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('saved');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      switch (activeTab) {
        case 'saved':
          endpoint = '/api/posts/my/saved';
          break;
        case 'liked':
          endpoint = '/api/posts/my/liked';
          break;
        case 'commented':
          endpoint = '/api/posts/my/commented';
          break;
        default:
          endpoint = '/api/posts/my/saved';
      }

      const { data } = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'saved':
        return 'Saved Posts';
      case 'liked':
        return 'Liked Posts';
      case 'commented':
        return 'Commented Posts';
      default:
        return 'My Posts';
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="saved-dashboard">
          <div className="dashboard-header">
            <h1>My Activity</h1>
            <p>View your saved, liked, and commented posts</p>
          </div>

          <EngagementDashboard />

          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Posts ({posts.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
              onClick={() => setActiveTab('liked')}
            >
              Liked Posts ({posts.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'commented' ? 'active' : ''}`}
              onClick={() => setActiveTab('commented')}
            >
              Commented Posts ({posts.length})
            </button>
          </div>

          <div className="dashboard-content">
            <h2>{getTabTitle()}</h2>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <div className="loading">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="no-posts">
                <p>
                  {activeTab === 'saved' && "You haven't saved any posts yet"}
                  {activeTab === 'liked' && "You haven't liked any posts yet"}
                  {activeTab === 'commented' && "You haven't commented on any posts yet"}
                </p>
              </div>
            ) : (
              <div className="posts-grid">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handlePostDeleted}
                    onUpdate={handlePostUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPostsDashboard;
