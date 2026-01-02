import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';
import CreatePost from './CreatePost';
import PostCard from './PostCard';

const Feed = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showTrending, setShowTrending] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [filter, page, showTrending]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = user?.token;
      
      let url = showTrending 
        ? `/api/posts/trending?limit=20`
        : `/api/posts/feed?role=${filter}&page=${page}&limit=10`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (showTrending) {
        setPosts(data);
      } else {
        // Sort startups by stage if filtering by startup role
        let posts = data.posts;
        if (filter === 'startup') {
          const stageOrder = {
            'Idea': 1,
            'Pre-Seed': 2,
            'Seed': 3,
            'Series A': 4,
            'Series B': 5,
            'Series C': 6,
            'Series D': 7,
            'Series E+': 8,
            'Post-IPO': 9
          };
          
          posts = posts.sort((a, b) => {
            const stageA = stageOrder[a.author?.fundingStage] || 999;
            const stageB = stageOrder[b.author?.fundingStage] || 999;
            return stageA - stageB;
          });
        }
        setPosts(posts);
        setTotalPages(data.totalPages);
      }
      
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  return (
    <div>
      <Navbar />
      
      <div className="container">
        <div className="feed-container">
          <CreatePost onPostCreated={handlePostCreated} />

      <div className="feed-filters">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('all'); setPage(1); setShowTrending(false); }}
          >
            All Posts
          </button>
          <button
            className={filter === 'student' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('student'); setPage(1); setShowTrending(false); }}
          >
            Students
          </button>
          <button
            className={filter === 'freelancer' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('freelancer'); setPage(1); setShowTrending(false); }}
          >
            Freelancers
          </button>
          <button
            className={filter === 'startup' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('startup'); setPage(1); setShowTrending(false); }}
          >
            Startups
          </button>
          <button
            className={filter === 'investor' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => { setFilter('investor'); setPage(1); setShowTrending(false); }}
          >
            Investors
          </button>
          <button
            className={showTrending ? 'filter-btn trending active' : 'filter-btn trending'}
            onClick={() => { setShowTrending(!showTrending); setPage(1); }}
          >
            🔥 Trending
          </button>
        </div>
      </div>

      <div className="posts-list">
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">No posts to show</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          ))
        )}
      </div>

      {!showTrending && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
