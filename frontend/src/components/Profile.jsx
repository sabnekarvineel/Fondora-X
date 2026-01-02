import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';
import PostCard from './PostCard';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [posts, setPosts] = useState([]);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [fundingRequests, setFundingRequests] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        location: '',
        skills: [],
        socialLinks: {
            website: '',
            github: '',
            linkedin: '',
        },
    });
    const [roleData, setRoleData] = useState({}); // For startup/student/freelancer/investor profile data
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        fetchProfile();
        fetchFundingRequests();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`/api/profile/${id}`);
            console.log('Profile data:', data); // Debug log
            setProfile(data);
            setPosts(data.posts || []);
            if (currentUser) {
                setIsFollowing(data.followers.some((f) => f._id === currentUser._id));
            }
            setFormData({
                name: data.name || '',
                bio: data.bio || '',
                location: data.location || '',
                skills: data.skills || [],
                socialLinks: data.socialLinks || { website: '', github: '', linkedin: '' },
            });
            
            // ✅ Load role-specific data
            if (data.role === 'startup') {
                setRoleData(data.startupProfile || {});
            } else if (data.role === 'student') {
                setRoleData(data.studentProfile || {});
            } else if (data.role === 'freelancer') {
                setRoleData(data.freelancerProfile || {});
            } else if (data.role === 'investor') {
                setRoleData(data.investorProfile || {});
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Profile fetch error:', error);
            setLoading(false);
        }
    };

    const fetchFundingRequests = async () => {
        try {
            const { data } = await axios.get(`/api/funding/user/${id}`);
            setFundingRequests(data || []);
        } catch (error) {
            console.error('Funding requests fetch error:', error);
        }
    };

    const handlePostDeleted = (postId) => {
        setPosts(posts.filter((post) => post._id !== postId));
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
    };

    const handleFollow = async () => {
        try {
            const token = currentUser?.token;
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            await axios.post(
                `/api/profile/${endpoint}/${id}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setIsFollowing(!isFollowing);
            fetchProfile();
        } catch (error) {
            console.error(error);
        }
    };

    const isOwnProfile = currentUser && currentUser._id === id;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSocialChange = (e) => {
        setFormData({
            ...formData,
            socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
        });
    };

    const addSkill = () => {
        if (skillInput.trim()) {
            setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
            setSkillInput('');
        }
    };

    const removeSkill = (index) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter((_, i) => i !== index),
        });
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataImage = new FormData();
        formDataImage.append(type === 'photo' ? 'profilePhoto' : 'coverBanner', file);

        try {
            const token = currentUser?.token;
            const endpoint = type === 'photo' ? '/api/profile/upload/photo' : '/api/profile/upload/banner';
            const response = await axios.post(endpoint, formDataImage, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSuccess(`${type === 'photo' ? 'Profile photo' : 'Cover banner'} uploaded successfully!`);
            setError('');
            fetchProfile();
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.response?.data?.message || 'Failed to upload image');
            setSuccess('');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = currentUser?.token;
            const profileData = {
                ...formData,
            };
            
            // ✅ Add role-specific data
            if (profile.role === 'startup') {
                profileData.startupProfile = roleData;
            } else if (profile.role === 'student') {
                profileData.studentProfile = roleData;
            } else if (profile.role === 'freelancer') {
                profileData.freelancerProfile = roleData;
            } else if (profile.role === 'investor') {
                profileData.investorProfile = roleData;
            }
            
            await axios.put('/api/profile/update', profileData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) return (
        <div>
            <Navbar />
            <div className="container">Loading...</div>
        </div>
    );

    if (!profile) return (
        <div>
            <Navbar />
            <div className="container">Profile not found</div>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div className="profile-page">
                <div
                    className="cover-banner"
                    style={{
                        backgroundImage: profile.coverBanner
                            ? `url(${profile.coverBanner})`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                />

                <div className="container">
                    <div className="profile-header">
                        <div className="profile-photo-container">
                            <img
                                src={profile.profilePhoto || '/default-avatar.png'}
                                alt={profile.name}
                                className="profile-photo-large"
                            />
                        </div>

                        <div className="profile-info">
                            <h1>
                                {profile.role === 'startup' && profile.startupProfile?.companyName
                                    ? profile.startupProfile.companyName
                                    : profile.name}
                            </h1>
                            <p className="role-badge">{profile.role}</p>
                            {profile.location && <p className="location">📍 {profile.location}</p>}

                            <div className="profile-actions">
                                {currentUser && currentUser._id !== profile._id && (
                                    <button className="btn btn-follow" onClick={handleFollow}>
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="profile-right-section">
                            <div className="follow-stats">
                                <button
                                    className="stat stat-button"
                                    onClick={() => setShowFollowersModal(true)}
                                >
                                    <strong>{profile.followers?.length || 0}</strong>
                                    <span>Followers</span>
                                </button>
                                <button
                                    className="stat stat-button"
                                    onClick={() => setShowFollowingModal(true)}
                                >
                                    <strong>{profile.following?.length || 0}</strong>
                                    <span>Following</span>
                                </button>
                            </div>

                            {isOwnProfile && (
                                <button
                                    className="btn btn-edit-profile-corner"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Cancel' : '✏️ Edit'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {isEditing && isOwnProfile ? (
                    <div className="edit-profile-section">
                        <h3>Edit Profile</h3>

                        <div className="image-uploads">
                            <div className="form-group">
                                <label>Profile Photo</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo')} />
                            </div>
                            <div className="form-group">
                                <label>Cover Banner</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                            </div>
                        </div>

                        <form onSubmit={onSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={formData.name} onChange={onChange} />
                            </div>

                            <div className="form-group">
                                <label>Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={onChange}
                                    rows="4"
                                    maxLength="500"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={onChange}
                                    placeholder="City, Country"
                                />
                            </div>

                            <h4>Social Links</h4>
                            <div className="form-group">
                                <label>Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.socialLinks.website}
                                    onChange={onSocialChange}
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>Instagram</label>
                                <input
                                    type="url"
                                    name="instagram"
                                    value={formData.socialLinks.github}
                                    onChange={onSocialChange}
                                    placeholder="https://instagram.com/username"
                                />
                            </div>

                            <div className="form-group">
                                <label>LinkedIn</label>
                                <input
                                    type="url"
                                    name="linkedin"
                                    value={formData.socialLinks.linkedin}
                                    onChange={onSocialChange}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>

                            {/* ✅ Startup-specific fields */}
                            {profile.role === 'startup' && (
                                <>
                                    <h4>Startup Information</h4>

                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={roleData.companyName || ''}
                                            onChange={(e) => setRoleData({ ...roleData, companyName: e.target.value })}
                                            placeholder="Your company name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Founder Name</label>
                                        <input
                                            type="text"
                                            name="founderName"
                                            value={roleData.founderName || ''}
                                            onChange={(e) => setRoleData({ ...roleData, founderName: e.target.value })}
                                            placeholder="Founder name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Founder Mobile Number</label>
                                        <input
                                            type="tel"
                                            name="founderNumber"
                                            value={roleData.founderNumber || ''}
                                            onChange={(e) => setRoleData({ ...roleData, founderNumber: e.target.value })}
                                            placeholder="10-digit mobile number"
                                            maxLength="10"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Co-founder Name (Optional)</label>
                                        <input
                                            type="text"
                                            name="coFounderName"
                                            value={roleData.coFounderName || ''}
                                            onChange={(e) => setRoleData({ ...roleData, coFounderName: e.target.value })}
                                            placeholder="Co-founder name (optional)"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Co-founder Mobile Number (Optional)</label>
                                        <input
                                            type="tel"
                                            name="coFounderNumber"
                                            value={roleData.coFounderNumber || ''}
                                            onChange={(e) => setRoleData({ ...roleData, coFounderNumber: e.target.value })}
                                            placeholder="10-digit mobile number (optional)"
                                            maxLength="10"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Startup Name</label>
                                        <input
                                            type="text"
                                            name="startupName"
                                            value={roleData.startupName || ''}
                                            onChange={(e) => setRoleData({ ...roleData, startupName: e.target.value })}
                                            placeholder="Startup name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Mission</label>
                                        <textarea
                                            name="mission"
                                            value={roleData.mission || ''}
                                            onChange={(e) => setRoleData({ ...roleData, mission: e.target.value })}
                                            rows="3"
                                            placeholder="What is your startup's mission?"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Stage</label>
                                        <select name="stage" value={roleData.stage || ''} onChange={(e) => setRoleData({ ...roleData, stage: e.target.value })}>
                                            <option value="">Select stage</option>
                                            <option value="idea">Idea</option>
                                            <option value="seed">Seed</option>
                                            <option value="series-a">Series A</option>
                                            <option value="series-b">Series B</option>
                                            <option value="series-c">Series C</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn" disabled={editLoading}>
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="profile-content">
                        {profile.bio && (
                            <div className="profile-section">
                                <h3>About</h3>
                                <p>{profile.bio}</p>
                            </div>
                        )}

                        {profile.socialLinks && (
                            <div className="profile-section">
                                <h3>Links</h3>
                                <div className="social-links">
                                    {profile.socialLinks.website && (
                                        <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                            Website
                                        </a>
                                    )}
                                    {profile.socialLinks.instagram && (
                                        <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                            Instagram
                                        </a>
                                    )}
                                    {profile.socialLinks.linkedin && (
                                        <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                            LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {profile.role === 'student' && profile.studentProfile && (
                            <>
                                {profile.studentProfile.projects && profile.studentProfile.projects.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Projects</h3>
                                        {profile.studentProfile.projects.map((project, index) => (
                                            <div key={index} className="project-item">
                                                <h4>{project.title}</h4>
                                                <p>{project.description}</p>
                                                {project.link && (
                                                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                                                        View Project
                                                    </a>
                                                )}
                                                {project.technologies && (
                                                    <div className="tech-tags">
                                                        {project.technologies.map((tech, i) => (
                                                            <span key={i} className="tech-tag">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {profile.role === 'freelancer' && profile.freelancerProfile && (
                            <>
                                {profile.freelancerProfile.services && profile.freelancerProfile.services.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Services</h3>
                                        <ul>
                                            {profile.freelancerProfile.services.map((service, index) => (
                                                <li key={index}>{service}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {profile.freelancerProfile.hourlyRate > 0 && (
                                    <div className="profile-section">
                                        <h3>Hourly Rate</h3>
                                        <p className="hourly-rate">${profile.freelancerProfile.hourlyRate}/hour</p>
                                    </div>
                                )}

                                {profile.freelancerProfile.portfolio && profile.freelancerProfile.portfolio.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Portfolio</h3>
                                        {profile.freelancerProfile.portfolio.map((item, index) => (
                                            <div key={index} className="portfolio-item">
                                                <h4>{item.title}</h4>
                                                <p>{item.description}</p>
                                                {item.link && (
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                        View Portfolio
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {profile.role === 'startup' && profile.startupProfile && (
                            <>
                                {profile.startupProfile.startupName && (
                                    <div className="profile-section">
                                        <h3>Startup</h3>
                                        <h2>{profile.startupProfile.startupName}</h2>
                                        <p className="startup-stage">Stage: {profile.startupProfile.stage}</p>
                                        {profile.startupProfile.mission && <p>{profile.startupProfile.mission}</p>}
                                    </div>
                                )}

                                {profile.startupProfile.teamMembers && profile.startupProfile.teamMembers.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Team</h3>
                                        {profile.startupProfile.teamMembers.map((member, index) => (
                                            <div key={index} className="team-member">
                                                <p>
                                                    <strong>{member.name}</strong> - {member.role}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {profile.startupProfile.openPositions && profile.startupProfile.openPositions.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Open Positions</h3>
                                        {profile.startupProfile.openPositions.map((position, index) => (
                                            <div key={index} className="position-item">
                                                <h4>{position.title}</h4>
                                                <p className="position-type">{position.type}</p>
                                                <p>{position.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {fundingRequests && fundingRequests.length > 0 && (
                                    <div className="profile-section funding-section">
                                        <h3> Funding Requests</h3>
                                        {fundingRequests.map((request) => (
                                            <div key={request._id} className="funding-request-card">
                                                <div className="funding-header">
                                                    <h4>{request.title}</h4>
                                                    <span className={`funding-status status-${request.status}`}>
                                                        {request.status}
                                                    </span>
                                                </div>
                                                <p className="funding-amount">
                                                     {request.fundingAmount.toLocaleString()} {request.currency}
                                                </p>
                                                <p className="funding-stage">
                                                    Stage: <strong>{request.stage}</strong>
                                                </p>
                                                {request.description && (
                                                    <p className="funding-description">{request.description}</p>
                                                )}
                                                <div className="funding-details">
                                                    {request.industry && (
                                                        <span className="detail-badge">📊 {request.industry}</span>
                                                    )}
                                                    {request.valuation && (
                                                        <span className="detail-badge">💵 Valuation: ${request.valuation.toLocaleString()}</span>
                                                    )}
                                                    {request.equityOffered && (
                                                        <span className="detail-badge">📈 Equity: {request.equityOffered}%</span>
                                                    )}
                                                </div>
                                                {request.interests && request.interests.length > 0 && (
                                                    <p className="investor-interest">
                                                        💬 {request.interests.length} investor interest(s)
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {profile.role === 'investor' && profile.investorProfile && (
                            <>
                                {profile.investorProfile.investmentFocus && profile.investorProfile.investmentFocus.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Investment Focus</h3>
                                        <div className="focus-list">
                                            {profile.investorProfile.investmentFocus.map((focus, index) => (
                                                <span key={index} className="focus-tag">
                                                    {focus}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile.investorProfile.portfolio && profile.investorProfile.portfolio.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Portfolio</h3>
                                        {profile.investorProfile.portfolio.map((item, index) => (
                                            <div key={index} className="portfolio-startup">
                                                <h4>{item.startupName}</h4>
                                                <p>Investment: ${item.investmentAmount?.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* User Posts Section */}
                {posts.length > 0 && (
                    <div className="profile-posts-section">
                        <h2>Posts ({posts.length})</h2>
                        <div className="profile-posts-list">
                            {posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onDelete={handlePostDeleted}
                                    onUpdate={handlePostUpdated}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Followers Modal */}
                {showFollowersModal && (
                    <div className="modal-overlay" onClick={() => setShowFollowersModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Followers</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowFollowersModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                {profile.followers && profile.followers.length > 0 ? (
                                    <div className="followers-list">
                                        {profile.followers.map((follower) => (
                                            <div key={follower._id} className="follower-item">
                                                <img
                                                    src={follower.profilePhoto || '/default-avatar.png'}
                                                    alt={follower.name}
                                                    className="follower-avatar"
                                                />
                                                <div className="follower-info">
                                                    <h4>{follower.name}</h4>
                                                    <p>{follower.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state">No followers yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Following Modal */}
                {showFollowingModal && (
                    <div className="modal-overlay" onClick={() => setShowFollowingModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Following</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowFollowingModal(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                {profile.following && profile.following.length > 0 ? (
                                    <div className="followers-list">
                                        {profile.following.map((followed) => (
                                            <div key={followed._id} className="follower-item">
                                                <img
                                                    src={followed.profilePhoto || '/default-avatar.png'}
                                                    alt={followed.name}
                                                    className="follower-avatar"
                                                />
                                                <div className="follower-info">
                                                    <h4>{followed.name}</h4>
                                                    <p>{followed.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-state">Not following anyone yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
