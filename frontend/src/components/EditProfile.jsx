import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

const EditProfile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState(''); // Track fetched role

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: '',
    location: '',
    skills: [],
    socialLinks: {
      website: '',
      github: '',
      linkedin: '',
    },
  });

  const [roleData, setRoleData] = useState({});
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user && user._id) {
      fetchProfile();
    }
  }, [user?._id]);

  const fetchProfile = async () => {
    if (!user || !user._id) {
      console.warn('User not authenticated or user._id is missing');
      return;
    }
    try {
      const { data } = await axios.get(`${API}/api/profile/${user._id}`);
      console.log("Profile data:", data);
      console.log("User role:", data.role);
      console.log("Startup profile:", data.startupProfile);
      
      // Store the role
      setUserRole(data.role);
      
      setFormData({
        name: data.name,
        bio: data.bio || '',
        location: data.location || '',
        skills: data.skills || [],
        socialLinks: data.socialLinks || { website: '', github: '', linkedin: '' },
      });
      
      if (data.role === 'student') {
        setRoleData(data.studentProfile || {});
      } else if (data.role === 'freelancer') {
        setRoleData(data.freelancerProfile || {});
      } else if (data.role === 'startup') {
        console.log("Setting startup role data:", data.startupProfile || {});
        setRoleData(data.startupProfile || {});
      } else if (data.role === 'investor') {
        setRoleData(data.investorProfile || {});
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSocialChange = (e) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
    });
  };

  const onRoleDataChange = (e) => {
    setRoleData({ ...roleData, [e.target.name]: e.target.value });
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = user?.token;
      const profileData = {
        ...formData,
      };

      if (userRole === 'student') {
        profileData.studentProfile = roleData;
      } else if (userRole === 'freelancer') {
        profileData.freelancerProfile = roleData;
      } else if (userRole === 'startup') {
        profileData.startupProfile = roleData;
      } else if (userRole === 'investor') {
        profileData.investorProfile = roleData;
      }

      await axios.put(`${API}/api/profile/update`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate(`/profile/${user._id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataImage = new FormData();
    formDataImage.append(type === 'photo' ? 'profilePhoto' : 'coverBanner', file);

    try {
      const token = user?.token;
      const endpoint = type === 'photo' ? `${API}/api/profile/upload/photo` : `${API}/api/profile/upload/banner`;
      await axios.post(endpoint, formDataImage, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(`${type === 'photo' ? 'Profile photo' : 'Cover banner'} uploaded successfully!`);
    } catch (error) {
      setError('Failed to upload image');
    }
  };

  return (
    <div className="container">
      <div className="edit-profile-container">
        <h2>Edit Profile</h2>
        <p style={{ color: '#666', fontSize: '12px' }}>Role: {userRole || 'Loading...'}</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

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

          <div className="form-group">
            <label>Skills</label>
            <div className="skills-input">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button type="button" onClick={addSkill} className="btn-add">
                Add
              </button>
            </div>
            <div className="skills-list">
              {formData.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  <button type="button" onClick={() => removeSkill(index)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <h3>Social Links</h3>
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
            <label>GitHub</label>
            <input
              type="url"
              name="github"
              value={formData.socialLinks.github}
              onChange={onSocialChange}
              placeholder="https://github.com/username"
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
          {userRole === 'startup' && (
            <>
              <h3>Startup Information</h3>
              
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={roleData.companyName || ''}
                  onChange={onRoleDataChange}
                  placeholder="Your company name"
                />
              </div>

              <div className="form-group">
                <label>Founder Name</label>
                <input
                  type="text"
                  name="founderName"
                  value={roleData.founderName || ''}
                  onChange={onRoleDataChange}
                  placeholder="Founder name"
                />
              </div>

              <div className="form-group">
                <label>Founder Mobile Number</label>
                <input
                  type="tel"
                  name="founderNumber"
                  value={roleData.founderNumber || ''}
                  onChange={onRoleDataChange}
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
                  onChange={onRoleDataChange}
                  placeholder="Co-founder name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Co-founder Mobile Number (Optional)</label>
                <input
                  type="tel"
                  name="coFounderNumber"
                  value={roleData.coFounderNumber || ''}
                  onChange={onRoleDataChange}
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
                  onChange={onRoleDataChange}
                  placeholder="Startup name"
                />
              </div>

              <div className="form-group">
                <label>Mission</label>
                <textarea
                  name="mission"
                  value={roleData.mission || ''}
                  onChange={onRoleDataChange}
                  rows="3"
                  placeholder="What is your startup's mission?"
                />
              </div>

              <div className="form-group">
                <label>Stage</label>
                <select name="stage" value={roleData.stage || ''} onChange={onRoleDataChange}>
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

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
