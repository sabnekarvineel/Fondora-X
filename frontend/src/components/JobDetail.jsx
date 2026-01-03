import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';

const API = import.meta.env.VITE_API_URL;

const JobDetail = () => {
  const { id } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applications, setApplications] = useState([]);

  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resume: '',
    portfolio: '',
    proposedRate: '',
  });

  useEffect(() => {
    fetchJobDetails();
    checkApplicationStatus();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.get(`${API}/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJob(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load job details');
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const token = user?.token;
      if (!token || !id) return; // Guard: no token or job id
      
      const { data } = await axios.get(`${API}/api/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Defensive: check every step of the chain
      const applied = data && Array.isArray(data) && data.some(app => {
        return app && 
               typeof app === 'object' && 
               app.job && 
               typeof app.job === 'object' && 
               app.job._id === id;
      });
      setHasApplied(applied || false);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = user?.token;
      const { data } = await axios.get(`${API}/api/applications/job/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Guard: Validate all required data exists before submitting
    if (!job || !job._id) {
      setError('Job data is not loaded. Please refresh and try again.');
      return;
    }

    if (!user || !user._id || !user.token) {
      setError('Please log in to apply for this job');
      return;
    }

    if (job.status !== 'open') {
      setError('This job is no longer accepting applications');
      return;
    }

    // Validate required form fields
    if (!applicationData.coverLetter?.trim()) {
      setError('Cover letter is required');
      return;
    }

    try {
      const token = user.token;
      
      // Use job._id (string from useParams) directly, not as object
      const jobId = typeof id === 'string' ? id : job._id;
      
      await axios.post(
        `${API}/api/applications/apply`,
        {
          jobId: jobId,
          ...applicationData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Application submitted successfully!');
      setHasApplied(true);
      setShowApplicationForm(false);
      setApplicationData({
        coverLetter: '',
        resume: '',
        portfolio: '',
        proposedRate: '',
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit application';
      setError(errorMessage);
      console.error('Apply error:', err);
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      const token = user?.token;
      await axios.put(
        `${API}/api/applications/${applicationId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchApplications();
      setSuccess(`Application status updated to ${status}`);
    } catch (error) {
      setError('Failed to update application status');
    }
  };

  useEffect(() => {
    // Guard: Check all objects exist before accessing nested properties
    if (job && job.postedBy && user && user._id && job.postedBy._id === user._id) {
      fetchApplications();
    }
  }, [job, user]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!job) return <div className="error">Job not found</div>;

  // Guard: Ensure nested objects exist before accessing properties
  const isOwner = job && job.postedBy && user && job.postedBy._id === user._id;
  const canApply = user && (user.role === 'student' || user.role === 'freelancer') && !isOwner;

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="job-detail-container">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="job-detail-header">
            <div className="job-detail-title-section">
              <h1>{job.title}</h1>
              <div className="job-detail-meta">
                <span className="badge">{job.type}</span>
                <span className="badge">{job.category.replace('-', ' ')}</span>
                <span className="badge">{job.locationType}</span>
                <span className="badge">{job.experienceLevel}</span>
                <span className={`status-badge ${job.status}`}>{job.status}</span>
              </div>
            </div>

            <div className="job-poster-card">
              <img
                src={job.postedBy?.profilePhoto || '/default-avatar.png'}
                alt={job.postedBy?.name}
                className="poster-avatar-large"
              />
              <div>
                <Link to={`/profile/${job.postedBy._id}`} className="poster-name-link">
                  {job.postedBy?.startupProfile?.startupName || job.postedBy?.name}
                </Link>
                <p className="poster-role">{job.postedBy?.role}</p>
              </div>
            </div>
          </div>

          <div className="job-detail-content">
            <section className="job-section">
              <h3>Job Description</h3>
              <p>{job.description}</p>
            </section>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="job-section">
                <h3>Responsibilities</h3>
                <ul>
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </section>
            )}

            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <section className="job-section">
                <h3>Required Skills</h3>
                <div className="skills-list">
                  {job.skillsRequired.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="job-section">
              <h3>Job Details</h3>
              <div className="job-details-grid">
                {job.budget && (
                  <div className="detail-item">
                    <strong>Budget:</strong>
                    <span>{job.budget.min} - {job.budget.max}</span>
                  </div>
                )}
                {job.duration && (
                  <div className="detail-item">
                    <strong>Duration:</strong>
                    <span>{job.duration.value} {job.duration.unit}</span>
                  </div>
                )}
                {job.location && (
                  <div className="detail-item">
                    <strong>Location:</strong>
                    <span>{job.location}</span>
                  </div>
                )}
                <div className="detail-item">
                  <strong>Applications:</strong>
                  <span>{job.applications?.length || 0}</span>
                </div>
              </div>
            </section>

            {canApply && (
              <section className="job-section">
                {hasApplied ? (
                  <div className="already-applied">
                    <p>✓ You have already applied for this job</p>
                  </div>
                ) : job && job.status === 'open' ? (
                  <>
                    {!showApplicationForm ? (
                      <button
                        className="btn btn-primary btn-large"
                        onClick={() => setShowApplicationForm(true)}
                        disabled={!job || !job._id || !user || !user._id} // Disable until data loads
                      >
                        Apply for this Job
                      </button>
                    ) : (
                      <div className="application-form">
                        <h3>Submit Your Application</h3>
                        <form onSubmit={handleApply}>
                          <div className="form-group">
                            <label>Cover Letter *</label>
                            <textarea
                              value={applicationData.coverLetter}
                              onChange={(e) =>
                                setApplicationData({
                                  ...applicationData,
                                  coverLetter: e.target.value,
                                })
                              }
                              rows="6"
                              required
                              placeholder="Why are you a great fit for this position?"
                            />
                          </div>

                          <div className="form-group">
                            <label>Resume Link</label>
                            <input
                              type="url"
                              value={applicationData.resume}
                              onChange={(e) =>
                                setApplicationData({
                                  ...applicationData,
                                  resume: e.target.value,
                                })
                              }
                              placeholder="https://your-resume-link.com"
                            />
                          </div>

                          <div className="form-group">
                            <label>Portfolio Link</label>
                            <input
                              type="url"
                              value={applicationData.portfolio}
                              onChange={(e) =>
                                setApplicationData({
                                  ...applicationData,
                                  portfolio: e.target.value,
                                })
                              }
                              placeholder="https://your-portfolio.com"
                            />
                          </div>

                          {job.type === 'freelance' && (
                            <div className="form-group">
                              <label>Proposed Rate ($/hr)</label>
                              <input
                                type="number"
                                value={applicationData.proposedRate}
                                onChange={(e) =>
                                  setApplicationData({
                                    ...applicationData,
                                    proposedRate: e.target.value,
                                  })
                                }
                                placeholder="Your hourly rate"
                              />
                            </div>
                          )}

                          <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                              Submit Application
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => setShowApplicationForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="job-closed">
                    <p>This job is no longer accepting applications</p>
                  </div>
                )}
              </section>
            )}

            {isOwner && applications.length > 0 && (
              <section className="job-section">
                <h3>Applications ({applications.length})</h3>
                <div className="applications-list">
                  {applications.map((application) => (
                    <div key={application._id} className="application-card">
                      <div className="application-header">
                        <div className="applicant-info">
                          <img
                            src={application.applicant?.profilePhoto || '/default-avatar.png'}
                            alt={application.applicant?.name}
                            className="applicant-avatar"
                          />
                          <div>
                            <Link
                              to={`/profile/${application.applicant._id}`}
                              className="applicant-name"
                            >
                              {application.applicant?.name}
                            </Link>
                            <p className="applicant-role">{application.applicant?.role}</p>
                          </div>
                        </div>
                        <span className={`status-badge ${application.status}`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="application-content">
                        <p><strong>Cover Letter:</strong></p>
                        <p>{application.coverLetter}</p>
                        {application.resume && (
                          <p>
                            <strong>Resume:</strong>{' '}
                            <a href={application.resume} target="_blank" rel="noopener noreferrer">
                              View Resume
                            </a>
                          </p>
                        )}
                        {application.portfolio && (
                          <p>
                            <strong>Portfolio:</strong>{' '}
                            <a href={application.portfolio} target="_blank" rel="noopener noreferrer">
                              View Portfolio
                            </a>
                          </p>
                        )}
                        {application.proposedRate && (
                          <p><strong>Proposed Rate:</strong> {application.proposedRate}/hr</p>
                        )}
                      </div>

                      {application.status === 'pending' && (
                        <div className="application-actions">
                          <button
                            className="btn btn-success"
                            onClick={() => handleUpdateStatus(application._id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleUpdateStatus(application._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
