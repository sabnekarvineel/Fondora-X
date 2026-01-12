import Post from '../models/Post.js';
import User from '../models/User.js';

// Get engagement dashboard data
export const getEngagementDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's posts
    const userPosts = await Post.find({ author: userId })
      .populate('author', 'name profilePhoto')
      .populate('likes', '_id')
      .populate('comments.user', 'name profilePhoto')
      .populate('shares', '_id')
      .sort({ createdAt: -1 });

    // Calculate posts statistics
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    const topPosts = [];

    userPosts.forEach((post) => {
      const likesCount = post.likes?.length || 0;
      const commentsCount = post.comments?.length || 0;
      const sharesCount = post.shares?.length || 0;

      totalLikes += likesCount;
      totalComments += commentsCount;
      totalShares += sharesCount;

      topPosts.push({
        id: post._id,
        title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
        content: post.content,
        likes: likesCount,
        comments: commentsCount,
        shares: sharesCount,
        views: post.views || 0,
        createdAt: post.createdAt,
      });
    });

    // Sort by likes and get top 5
    topPosts.sort((a, b) => b.likes - a.likes);
    const top5Posts = topPosts.slice(0, 5);

    // Calculate average engagement
    const avgLikesPerPost = userPosts.length > 0 ? (totalLikes / userPosts.length).toFixed(2) : 0;
    const avgCommentsPerPost = userPosts.length > 0 ? (totalComments / userPosts.length).toFixed(2) : 0;

    // Get user profile statistics
    const user = await User.findById(userId)
      .populate('followers', '_id')
      .select('followers following profilePhoto');

    const profileViews = await Post.aggregate([
      { $match: { author: userId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);

    const totalProfileViews = profileViews[0]?.totalViews || 0;
    const followers = user?.followers?.length || 0;

    // Calculate changes (mock data for now - in production, you'd track historical data)
    const viewsIncrease = Math.floor(Math.random() * 25 + 5);
    const followersGain = Math.floor(Math.random() * 10 + 1);

    // Response object
    const engagementData = {
      posts: {
        total: userPosts.length,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        avgLikesPerPost: parseFloat(avgLikesPerPost),
        avgCommentsPerPost: parseFloat(avgCommentsPerPost),
      },
      profile: {
        views: totalProfileViews,
        followers: followers,
        followersGain: followersGain,
        viewsIncrease: viewsIncrease,
      },
      topPosts: top5Posts,
    };

    res.status(200).json(engagementData);
  } catch (error) {
    console.error('Error fetching engagement dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching engagement dashboard',
      error: error.message,
    });
  }
};

// Get detailed post analytics
export const getPostAnalytics = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId)
      .populate('author', 'name')
      .populate('likes', '_id')
      .populate('comments.user', 'name profilePhoto')
      .populate('shares', '_id');

    // Verify ownership
    if (post.author._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this post analytics',
      });
    }

    const analytics = {
      postId: post._id,
      content: post.content,
      createdAt: post.createdAt,
      engagement: {
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        shares: post.shares?.length || 0,
        views: post.views || 0,
      },
      engagementRate: post.likes?.length > 0
        ? (((post.likes.length + (post.comments?.length || 0)) / (post.views || 1)) * 100).toFixed(2)
        : 0,
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post analytics',
      error: error.message,
    });
  }
};

// Get profile analytics
export const getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('followers', '_id')
      .select('followers following profilePhoto name bio');

    const userPosts = await Post.find({ author: userId });

    const totalViews = userPosts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalEngagement = userPosts.reduce(
      (sum, post) => sum + (post.likes?.length || 0) + (post.comments?.length || 0),
      0
    );

    const analytics = {
      profile: {
        name: user?.name,
        followers: user?.followers?.length || 0,
        following: user?.following?.length || 0,
        profileViews: totalViews,
      },
      posts: {
        total: userPosts.length,
        totalEngagement: totalEngagement,
        averageEngagementPerPost:
          userPosts.length > 0 ? (totalEngagement / userPosts.length).toFixed(2) : 0,
      },
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching profile analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile analytics',
      error: error.message,
    });
  }
};
