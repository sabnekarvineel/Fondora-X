import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';

const API = import.meta.env.VITE_API_URL;

const EditJob = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'job',
    category: 'web-development',
    skillsRequired: [],
    experienceLevel: 'beginner',
    location: '',
    locationType: 'remote',
    budgetMin: '',
    budgetMax: '',
    durationValue: '',
    durationUnit: 'months',
    deadline: '',
  });

  const [skillInput, setSkillInput] = useState('');

  // Fetch job details on mount
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = user?.token;
        const { data } = await axios.get(`${API}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Check if user is the job owner
        if (data.postedBy._id !== user?._id) {
          setError('You are not authorized to edit this job post');
          setFetching(false);
          setTimeout(() => navigate('/jobs'), 2000);
          return;
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          type: data.type || 'job',
          category: data.category || 'web-development',
          skillsRequired: data.skillsRequired || [],
          experienceLevel: data.experienceLevel || 'beginner',
          location: data.location || '',
          locationType: data.locationType || 'remote',
          budgetMin: data.budget?.min || '',
          budgetMax: data.budget?.max || '',
          durationValue: data.duration?.value || '',
          durationUnit: data.duration?.unit || 'months',
          deadline: data.deadline ? data.deadline.split('T')[0] : '',
        });
        setFetching(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job details');
        setFetching(false);
      }
    };

    if (jobId && user?.token) {
      fetchJob();
    }
  }, [jobId, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skillsRequired.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skillsRequired: [...formData.skillsRequired, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skillsRequired: formData.skillsRequired.filter((s) => s !== skill),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const token = user?.token;
      const jobData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        skillsRequired: formData.skillsRequired,
        experienceLevel: formData.experienceLevel,
        location: formData.location,
        locationType: formData.locationType,
        budget: {
          min: parseInt(formData.budgetMin),
          max: parseInt(formData.budgetMax),
        },
        duration: {
          value: parseInt(formData.durationValue),
          unit: formData.durationUnit,
        },
        deadline: formData.deadline || undefined,
      };

      await axios.put(`${API}/api/jobs/${jobId}`, jobData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage('Job post updated successfully!');
      setTimeout(() => navigate(`/jobs/${jobId}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading job details...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="post-job-container">
          <h2>Edit Job Post</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Senior React Developer"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="project">Project</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="data-science">Data Science</option>
                  <option value="ai-ml">AI/ML</option>
                  <option value="blockchain">Blockchain</option>
                  <option value="devops">DevOps</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Skills Required</label>
              <div className="skills-input">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add required skills"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill} className="btn-add">
                  Add
                </button>
              </div>
              <div className="skills-list">
                {formData.skillsRequired.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Experience Level</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location Type</label>
                <select name="locationType" value={formData.locationType} onChange={handleChange}>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {formData.locationType !== 'remote' && (
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Budget Min</label>
                <input
                  type="number"
                  name="budgetMin"
                  value={formData.budgetMin}
                  onChange={handleChange}
                  placeholder="5000"
                />
              </div>

              <div className="form-group">
                <label>Budget Max</label>
                <input
                  type="number"
                  name="budgetMax"
                  value={formData.budgetMax}
                  onChange={handleChange}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration</label>
                <input
                  type="number"
                  name="durationValue"
                  value={formData.durationValue}
                  onChange={handleChange}
                  placeholder="3"
                />
              </div>

              <div className="form-group">
                <label>Unit</label>
                <select name="durationUnit" value={formData.durationUnit} onChange={handleChange}>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Job Post'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => navigate(`/jobs/${jobId}`)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;
