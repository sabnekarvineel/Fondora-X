import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import Navbar from "./Navbar";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

// ✅ Backend URL (Render)
const API = import.meta.env.VITE_API_URL;

const Feed = () => {
  const { user } = useContext(AuthContext);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showTrending, setShowTrending] = useState(false);

  // ✅ Fetch only when user + token exist
  useEffect(() => {
    if (user?.token) {
      fetchPosts();
    }
  }, [user, filter, page, showTrending]);

  const fetchPosts = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);

      const url = showTrending
        ? `${API}/api/posts/trending?limit=20`
        : `${API}/api/posts/feed?role=${filter}&page=${page}&limit=10`;

      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (showTrending) {
        // ✅ Trending is a direct array
        setPosts(Array.isArray(data) ? data : []);
        setTotalPages(1);
      } else {
        // ✅ Normal feed structure safety
        let fetchedPosts = Array.isArray(data?.posts) ? data.posts : [];

        // ✅ Sort startups by funding stage
        if (filter === "startup") {
          const stageOrder = {
            Idea: 1,
            "Pre-Seed": 2,
            Seed: 3,
            "Series A": 4,
            "Series B": 5,
            "Series C": 6,
            "Series D": 7,
            "Series E+": 8,
            "Post-IPO": 9,
          };

          fetchedPosts = [...fetchedPosts].sort((a, b) => {
            const stageA = stageOrder[a?.author?.fundingStage] || 999;
            const stageB = stageOrder[b?.author?.fundingStage] || 999;
            return stageA - stageB;
          });
        }

        setPosts(fetchedPosts);
        setTotalPages(data?.totalPages || 1);
      }
    } catch (error) {
      console.error("Feed fetch error:", error);
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
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

  return (
    <div>
      <Navbar />

      <div className="container">
        <div className="feed-container">
          <CreatePost onPostCreated={handlePostCreated} />

          {/* Filters */}
          <div className="feed-filters">
            <div className="filter-buttons">
              {["all", "student", "freelancer", "startup", "investor"].map(
                (role) => (
                  <button
                    key={role}
                    className={
                      filter === role && !showTrending
                        ? "filter-btn active"
                        : "filter-btn"
                    }
                    onClick={() => {
                      setFilter(role);
                      setPage(1);
                      setShowTrending(false);
                    }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                )
              )}

              <button
                className={
                  showTrending
                    ? "filter-btn trending active"
                    : "filter-btn trending"
                }
                onClick={() => {
                  setShowTrending(!showTrending);
                  setPage(1);
                }}
              >
                🔥 Trending
              </button>
            </div>
          </div>

          {/* Posts */}
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

          {/* Pagination */}
          {!showTrending && totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => p + 1)}
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
