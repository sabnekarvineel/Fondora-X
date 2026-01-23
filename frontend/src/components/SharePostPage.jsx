import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';

const API = import.meta.env.VITE_API_URL;

const SharePostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await axios.get(`${API}/api/posts/${postId}`);
        setPost(data);
        
        // Set Open Graph meta tags for social sharing
        if (data) {
          document.title = `${data.author?.name}'s Post - Fondora-X`;
          
          // Update meta tags for social media preview
          const metaTags = {
            'og:title': `${data.author?.name}'s Post`,
            'og:description': data.content.substring(0, 155),
            'og:type': 'article',
            'og:url': window.location.href,
            'twitter:card': 'summary_large_image',
            'twitter:title': `${data.author?.name}'s Post`,
            'twitter:description': data.content.substring(0, 155),
          };

          // Set image if available
          let imageUrl = null;
          if (data.mediaItems && data.mediaItems.length > 0 && data.mediaItems[0].type === 'image') {
            imageUrl = data.mediaItems[0].url;
          } else if (data.mediaUrls && data.mediaUrls.length > 0) {
            imageUrl = data.mediaUrls[0];
          } else if (data.mediaUrl && data.mediaType === 'image') {
            imageUrl = data.mediaUrl;
          }

          if (imageUrl) {
            metaTags['og:image'] = imageUrl;
            metaTags['twitter:image'] = imageUrl;
          }

          // Apply meta tags
          Object.entries(metaTags).forEach(([key, value]) => {
            let element = document.querySelector(`meta[property="${key}"]`) ||
                         document.querySelector(`meta[name="${key}"]`);
            if (!element) {
              element = document.createElement('meta');
              if (key.startsWith('og:')) {
                element.setAttribute('property', key);
              } else {
                element.setAttribute('name', key);
              }
              document.head.appendChild(element);
            }
            element.setAttribute('content', value);
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="share-post-container">
            <p>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="share-post-container">
            <p className="error">{error || 'Post not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="share-post-container">
          <div className="share-post-card">
            {/* Author Info */}
            <div className="share-post-header">
              <div className="share-post-author">
                <img
                  src={post.author?.profilePhoto || '/default-avatar.png'}
                  alt={post.author?.name}
                  className="share-post-avatar"
                />
                <div>
                  <h3>{post.author?.name}</h3>
                  <p className="share-post-role">{post.author?.role}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="share-post-content">
              <p>{post.content}</p>
            </div>

            {/* Media Grid */}
            {(post.mediaItems?.length > 0 || post.mediaUrls?.length > 0 || post.mediaUrl) && (
              <div className={`share-media-grid grid-${Math.min(post.mediaItems?.length || post.mediaUrls?.length || 1, 4)}`}>
                {post.mediaItems?.map((item, index) => (
                  <div key={index} className="share-media-item">
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        controls
                        className="share-media"
                        title={`Video ${index + 1}`}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={`Media ${index + 1}`}
                        className="share-media"
                      />
                    )}
                  </div>
                )) || post.mediaUrls?.map((url, index) => (
                  <div key={index} className="share-media-item">
                    <img src={url} alt={`Media ${index + 1}`} className="share-media" />
                  </div>
                )) || (post.mediaUrl && (
                  <div className="share-media-item">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} controls className="share-media" />
                    ) : (
                      <img src={post.mediaUrl} alt="Post media" className="share-media" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="share-post-stats">
              <span>{post.likes?.length || 0} likes</span>
              <span>{post.comments?.length || 0} comments</span>
              <span>{post.shares?.length || 0} shares</span>
            </div>

            {/* CTA */}
            <div className="share-post-cta">
              <p>View and comment on this post on Fondora-X</p>
              <a href={`${window.location.origin}/feed`} className="share-cta-btn">
                Open on Fondora-X →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePostPage;
