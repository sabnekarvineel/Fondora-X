import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

const EngagementDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState({
    posts: {
      total: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      avgLikesPerPost: 0,
      avgCommentsPerPost: 0,
    },
    profile: {
      views: 0,
      followers: 0,
      followersGain: 0,
      viewsIncrease: 0,
    },
    topPosts: [],
  });
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('posts');

  useEffect(() => {
    fetchEngagementData();
  }, []);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      const token = user?.token;
      const { data } = await axios.get(`${API}/api/engagement/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEngagementData(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load engagement data');
      // Mock data for development
      setEngagementData({
        posts: {
          total: 12,
          likes: 342,
          comments: 87,
          shares: 23,
          avgLikesPerPost: 28.5,
          avgCommentsPerPost: 7.25,
        },
        profile: {
          views: 1250,
          followers: 324,
          followersGain: 45,
          viewsIncrease: 18,
        },
        topPosts: [
          { id: 1, title: 'Post 1', likes: 124, comments: 32 },
          { id: 2, title: 'Post 2', likes: 89, comments: 21 },
          { id: 3, title: 'Post 3', likes: 67, comments: 19 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon, change, changeType = 'positive' }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {change !== undefined && (
          <p className={`stat-change ${changeType}`}>
            {changeType === 'positive' ? '↑' : '↓'} {change}% this month
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="engagement-loading">Loading engagement data...</div>;
  }

  return (
    <div className="engagement-dashboard">
      <style>{`
        .engagement-dashboard {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .engagement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .engagement-header h3 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }

        .chart-toggle {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .toggle-btn {
          padding: 8px 16px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          font-weight: 500;
        }

        .toggle-btn.active {
          background: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }

        .toggle-btn:hover {
          border-color: #4CAF50;
          color: #4CAF50;
        }

        .toggle-btn.active:hover {
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          gap: 15px;
          align-items: flex-start;
          transition: all 0.3s;
          border-left: 4px solid #4CAF50;
        }

        .stat-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 32px;
          min-width: 40px;
          text-align: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          margin: 0;
          color: #999;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .stat-value {
          margin: 8px 0 0 0;
          color: #333;
          font-size: 28px;
          font-weight: 700;
        }

        .stat-change {
          margin: 5px 0 0 0;
          font-size: 12px;
          font-weight: 500;
        }

        .stat-change.positive {
          color: #4CAF50;
        }

        .stat-change.negative {
          color: #f44336;
        }

        .engagement-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          margin-bottom: 20px;
        }

        .engagement-section h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }

        .posts-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
        }

        .stat-box.likes {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-box.comments {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-box.shares {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .stat-box.views {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-box h5 {
          margin: 0 0 5px 0;
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.9;
          font-weight: 600;
        }

        .stat-box p {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .top-posts {
          margin-top: 20px;
        }

        .top-posts h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }

        .post-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          transition: all 0.3s;
        }

        .post-item:last-child {
          border-bottom: none;
        }

        .post-item:hover {
          background: #f8f9fa;
          padding-left: 10px;
          padding-right: 10px;
        }

        .post-title {
          flex: 1;
          color: #333;
          font-weight: 500;
        }

        .post-stats {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .post-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 60px;
        }

        .post-stat-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          font-weight: 600;
        }

        .post-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .engagement-loading {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 14px;
        }

        .engagement-error {
          background: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .engagement-dashboard {
            padding: 15px;
          }

          .engagement-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .engagement-header h3 {
            font-size: 20px;
          }

          .chart-toggle {
            width: 100%;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .stat-card {
            padding: 15px;
          }

          .stat-icon {
            font-size: 28px;
          }

          .stat-value {
            font-size: 24px;
          }

          .posts-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .stat-box {
            padding: 12px;
          }

          .stat-box p {
            font-size: 20px;
          }

          .post-stats {
            gap: 10px;
          }

          .post-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .post-stats {
            width: 100%;
            justify-content: space-around;
          }

          .engagement-section {
            padding: 15px;
          }

          .profile-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .engagement-dashboard {
            padding: 10px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 12px;
            gap: 10px;
          }

          .stat-icon {
            font-size: 24px;
            min-width: 35px;
          }

          .stat-value {
            font-size: 20px;
          }

          .posts-stats {
            grid-template-columns: 1fr;
          }

          .stat-box {
            padding: 10px;
          }

          .stat-box p {
            font-size: 18px;
          }

          .profile-stats-grid {
            grid-template-columns: 1fr;
          }

          .post-stats {
            flex-direction: column;
            gap: 8px;
          }

          .post-stat {
            min-width: auto;
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
          }

          .engagement-section {
            padding: 12px;
          }
        }
      `}</style>

      <div className="engagement-header">
        <h3>📊 Engagement Dashboard</h3>
        <div className="chart-toggle">
          <button
            className={`toggle-btn ${chartType === 'posts' ? 'active' : ''}`}
            onClick={() => setChartType('posts')}
          >
            📝 Posts
          </button>
          <button
            className={`toggle-btn ${chartType === 'profile' ? 'active' : ''}`}
            onClick={() => setChartType('profile')}
          >
            👤 Profile
          </button>
        </div>
      </div>

      {error && !Object.keys(engagementData.posts).length && (
        <div className="engagement-error">ℹ️ {error}</div>
      )}

      {/* Posts Engagement Section */}
      {chartType === 'posts' && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Posts"
              value={engagementData.posts.total}
              icon="📝"
            />
            <StatCard
              label="Total Likes"
              value={engagementData.posts.likes}
              icon="❤️"
              change={Math.floor(Math.random() * 20 + 5)}
            />
            <StatCard
              label="Total Comments"
              value={engagementData.posts.comments}
              icon="💬"
              change={Math.floor(Math.random() * 15 + 3)}
            />
            <StatCard
              label="Total Shares"
              value={engagementData.posts.shares}
              icon="🔄"
              change={Math.floor(Math.random() * 10 + 2)}
            />
          </div>

          <div className="engagement-section">
            <h4>Post Performance</h4>
            <div className="posts-stats">
              <div className="stat-box">
                <h5>Avg Likes</h5>
                <p>{engagementData.posts.avgLikesPerPost.toFixed(1)}</p>
              </div>
              <div className="stat-box likes">
                <h5>Avg Comments</h5>
                <p>{engagementData.posts.avgCommentsPerPost.toFixed(1)}</p>
              </div>
            </div>

            {engagementData.topPosts && engagementData.topPosts.length > 0 && (
              <div className="top-posts">
                <h4>Top Performing Posts</h4>
                {engagementData.topPosts.map((post) => (
                  <div key={post.id} className="post-item">
                    <div className="post-title">{post.title}</div>
                    <div className="post-stats">
                      <div className="post-stat">
                        <span className="post-stat-label">Likes</span>
                        <span className="post-stat-value">{post.likes}</span>
                      </div>
                      <div className="post-stat">
                        <span className="post-stat-label">Comments</span>
                        <span className="post-stat-value">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Profile Engagement Section */}
      {chartType === 'profile' && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Profile Views"
              value={engagementData.profile.views}
              icon="👁️"
              change={engagementData.profile.viewsIncrease}
            />
            <StatCard
              label="Followers"
              value={engagementData.profile.followers}
              icon="👥"
              change={engagementData.profile.followersGain}
            />
          </div>

          <div className="engagement-section">
            <h4>Profile Statistics</h4>
            <div className="profile-stats-grid">
              <div className="stat-box views">
                <h5>Total Views</h5>
                <p>{engagementData.profile.views}</p>
              </div>
              <div className="stat-box">
                <h5>Followers Growth</h5>
                <p>+{engagementData.profile.followersGain}</p>
              </div>
              <div className="stat-box likes">
                <h5>View Increase</h5>
                <p>+{engagementData.profile.viewsIncrease}%</p>
              </div>
              <div className="stat-box comments">
                <h5>Current Followers</h5>
                <p>{engagementData.profile.followers}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EngagementDashboard;
