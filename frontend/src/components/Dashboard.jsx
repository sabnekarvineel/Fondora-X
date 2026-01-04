import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import Feed from "./Feed";
import Navbar from "./Navbar";

// ✅ Backend URL (Render)
const API = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch dashboard only when user + token exist
  useEffect(() => {
    if (!user?.token) return;

    if (user.role === "admin") {
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(
        `${API}/api/dashboard/overview`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setDashboardData(data || {});
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard");
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Centralized rendering logic
  const renderRoleDashboard = () => {
    if (loading) {
      return <div className="loading">Loading dashboard...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    // Admin handled separately
    if (user?.role === "admin") {
      return <AdminDashboard />;
    }

    // Fallback → Feed
    if (!dashboardData) {
      return <Feed />;
    }

    switch (user?.role) {
      case "student":
        return <StudentDashboard data={dashboardData} />;
      case "freelancer":
        return <FreelancerDashboard data={dashboardData} />;
      case "startup":
        return <StartupDashboard data={dashboardData} />;
      case "investor":
        return <InvestorDashboard data={dashboardData} />;
      default:
        return <Feed />;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">{renderRoleDashboard()}</div>
    </div>
  );
};

/* =========================
   ROLE DASHBOARDS
========================= */

const StudentDashboard = ({ data }) => {
  const stats = data?.stats || {};

  return (
    <div className="role-dashboard">
      <h2>🎓 Student Dashboard</h2>

      <div className="dashboard-stats">
        <Stat title="Total Applications" value={stats.totalApplications} />
        <Stat title="Pending" value={stats.pendingApplications} />
        <Stat title="Accepted" value={stats.acceptedApplications} />
        <Stat title="Followers" value={stats.followers} />
      </div>

      <div className="dashboard-section">
        <h3>📋 Suggested Internships</h3>
        <div className="dashboard-grid">
          {data.suggestedJobs?.slice(0, 3).map((job) => (
            <Link key={job._id} to={`/jobs/${job._id}`} className="dashboard-card">
              <h4>{job.title}</h4>
              <p>{job.postedBy?.startupProfile?.startupName || job.postedBy?.name}</p>
              <span className="card-tag">{job.type}</span>
            </Link>
          ))}
        </div>
        <Link to="/jobs" className="view-all-link">View all opportunities →</Link>
      </div>

      <div className="dashboard-section">
        <h3>💼 Recent Applications</h3>
        {data.applications?.length > 0 ? (
          <div className="applications-list">
            {data.applications.map((app) => (
              <div key={app._id} className="application-item">
                <span>{app.job?.title}</span>
                <span className={`status-badge ${app.status}`}>{app.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No applications yet</p>
        )}
      </div>

      <style jsx>{DashboardStyles}</style>
    </div>
  );
};

const FreelancerDashboard = ({ data }) => {
  const stats = data?.stats || {};

  return (
    <div className="role-dashboard">
      <h2>💼 Freelancer Dashboard</h2>

      <div className="dashboard-stats">
        <Stat title="Active Projects" value={stats.activeProjects} />
        <Stat title="Hourly Rate" value={`${data?.hourlyRate || 0}/hr`} />
        <Stat title="Services Posted" value={stats.servicesPosted} />
        <Stat title="Rating" value={`${stats.averageRating || 0} ⭐`} />
      </div>

      <div className="dashboard-section">
        <h3>🔍 Search Projects</h3>
        <div className="dashboard-grid">
          {data.suggestedProjects?.slice(0, 3).map((job) => (
            <Link key={job._id} to={`/jobs/${job._id}`} className="dashboard-card">
              <h4>{job.title}</h4>
              <p>{job.postedBy?.name}</p>
              <span className="card-tag">{job.budget?.min && `${job.budget.min}-${job.budget.max}`}</span>
            </Link>
          ))}
        </div>
        <Link to="/jobs" className="view-all-link">View all projects →</Link>
      </div>

      <div className="dashboard-section">
        <h3>📝 My Services</h3>
        {data.myJobs?.length > 0 ? (
          <div className="jobs-list">
            {data.myJobs.map((job) => (
              <div key={job._id} className="job-item">
                <span>{job.title}</span>
                <span>{job.applications?.length || 0} applications</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No services posted yet. <Link to="/jobs/post">Post a service</Link></p>
        )}
      </div>

      <style jsx>{DashboardStyles}</style>
    </div>
  );
};

const StartupDashboard = ({ data }) => {
  const stats = data?.stats || {};

  return (
    <div className="role-dashboard">
      <h2>🚀 Startup Dashboard</h2>

      <div className="dashboard-stats">
        <Stat title="Active Jobs" value={stats.activeJobs} />
        <Stat title="Applications" value={stats.totalApplications} />
        <Stat title="Funding Requests" value={stats.fundingRequests} />
        <Stat title="Investor Interests" value={stats.investorInterests} />
      </div>

      <div className="dashboard-section">
        <h3>📝 Job Postings</h3>
        {data.myJobs?.length > 0 ? (
          <div className="jobs-list">
            {data.myJobs.map((job) => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="job-item">
                <div>
                  <strong>{job.title}</strong>
                  <span className="job-meta">{job.type} • {job.status}</span>
                </div>
                <span className="applications-count">{job.applications?.length || 0} applicants</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>No jobs posted yet. <Link to="/jobs/post">Post a job</Link></p>
        )}
      </div>

      <div className="dashboard-section">
        <h3>💰 Funding Requests</h3>
        {data.myFundingRequests?.length > 0 ? (
          <div className="funding-list">
            {data.myFundingRequests.map((request) => (
              <Link key={request._id} to={`/funding/${request._id}`} className="funding-item">
                <div>
                  <strong>{request.title}</strong>
                  <span className="funding-meta">{request.fundingAmount.toLocaleString()}</span>
                </div>
                <span className="interests-count">{request.interests?.length || 0} interests</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>No funding requests yet. <Link to="/funding/post">Request funding</Link></p>
        )}
      </div>

      <style jsx>{DashboardStyles}</style>
    </div>
  );
};

const InvestorDashboard = ({ data }) => {
  const stats = data?.stats || {};

  return (
    <div className="role-dashboard">
      <h2>💎 Investor Dashboard</h2>

      <div className="dashboard-stats">
        <Stat title="Total Interests" value={stats.totalInterests} />
        <Stat title="Active Deals" value={stats.activeDeals} />
        <Stat title="Completed Deals" value={stats.completedDeals} />
        <Stat title="Portfolio Size" value={stats.portfolioSize} />
      </div>

      <div className="dashboard-section">
        <h3>🚀 Explore Startups</h3>
        <div className="dashboard-grid">
          {data.recommendedStartups?.slice(0, 3).map((request) => (
            <Link key={request._id} to={`/funding/${request._id}`} className="dashboard-card">
              <h4>{request.title}</h4>
              <p>{request.startup?.startupProfile?.startupName}</p>
              <span className="card-tag">{request.fundingAmount.toLocaleString()}</span>
            </Link>
          ))}
        </div>
        <Link to="/funding" className="view-all-link">View all opportunities →</Link>
      </div>

      <div className="dashboard-section">
        <h3>💡 My Interests</h3>
        {data.myInterests?.length > 0 ? (
          <div className="interests-list">
            {data.myInterests.map((interest) => (
              <div key={interest._id} className="interest-item">
                <div>
                  <strong>{interest.fundingRequest?.title}</strong>
                  <span className="interest-meta">
                    {interest.fundingRequest?.startup?.startupProfile?.startupName}
                  </span>
                </div>
                <span className={`status-badge ${interest.status}`}>{interest.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No interests yet. <Link to="/funding">Explore startups</Link></p>
        )}
      </div>

      <style jsx>{DashboardStyles}</style>
    </div>
  );
};

/* =========================
   ADMIN DASHBOARD
========================= */

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;

    const fetchAnalytics = async () => {
      try {
        const { data } = await axios.get(
          `${API}/api/admin/analytics`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setAnalytics(data || {});
      } catch (err) {
        console.error(err);
        setError("Failed to load admin analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) return <div className="loading">Loading admin dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="role-dashboard">
      <h2>🛡️ Admin Dashboard</h2>

      <div className="dashboard-stats">
        <Stat title="Total Users" value={analytics?.totalUsers || 0} />
        <Stat title="Total Posts" value={analytics?.totalPosts || 0} />
        <Stat title="Total Jobs" value={analytics?.totalJobs || 0} />
        <Stat title="Funding Requests" value={analytics?.totalFundingRequests || 0} />
        <Stat title="Verified Users" value={analytics?.verifiedUsers || 0} />
        <Stat title="Banned Users" value={analytics?.bannedUsers || 0} />
      </div>

      <div className="dashboard-section">
        <h3>📊 Platform Overview</h3>
        <div className="admin-overview">
          <div className="overview-item">
            <span className="label">Total Applications:</span>
            <span className="value">{analytics?.totalApplications || 0}</span>
          </div>
          <div className="overview-item">
            <span className="label">Investor Interests:</span>
            <span className="value">{analytics?.totalInvestorInterests || 0}</span>
          </div>
          <div className="overview-item">
            <span className="label">Verification Pending:</span>
            <span className="value">{(analytics?.totalUsers || 0) - (analytics?.verifiedUsers || 0)}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>👥 Users by Role</h3>
        <div className="role-distribution">
          {analytics?.usersByRole?.map((role) => (
            <div key={role._id} className="role-stat-card">
              <div className="role-icon">
                {role._id === 'student' && '👨‍🎓'}
                {role._id === 'freelancer' && '💼'}
                {role._id === 'startup' && '🚀'}
                {role._id === 'investor' && '💎'}
                {role._id === 'admin' && '🛡️'}
              </div>
              <div className="role-info">
                <h4>{role.count}</h4>
                <p>{role._id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>🆕 Recent Users</h3>
        {analytics?.recentUsers?.length > 0 ? (
          <div className="recent-users-list">
            {analytics.recentUsers.slice(0, 5).map((user) => (
              <div key={user._id} className="recent-user-item">
                <div>
                  <strong>{user.name}</strong>
                  <span className="user-email">{user.email}</span>
                </div>
                <div>
                  <span className="user-role">{user.role}</span>
                  <span className="user-date">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent users</p>
        )}
      </div>

      <div className="dashboard-section">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions">
          <Link to="/admin" className="action-card">
            <span className="action-icon">🛡️</span>
            <span className="action-title">Admin Panel</span>
            <span className="action-desc">Manage platform</span>
          </Link>
          <Link to="/settings" className="action-card">
            <span className="action-icon">⚙️</span>
            <span className="action-title">Settings</span>
            <span className="action-desc">Account settings</span>
          </Link>
        </div>
      </div>

      <style jsx>{DashboardStyles}</style>
    </div>
  );
};

/* =========================
   SHARED STYLES
========================= */

const DashboardStyles = `
  .admin-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .overview-item {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .overview-item .label {
    font-size: 14px;
    color: #666;
  }

  .overview-item .value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }

  .role-distribution {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .role-stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .role-icon {
    font-size: 36px;
  }

  .role-info h4 {
    margin: 0;
    font-size: 28px;
    color: #333;
  }

  .role-info p {
    margin: 5px 0 0 0;
    color: #666;
    text-transform: capitalize;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 15px;
  }

  .dashboard-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .dashboard-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dashboard-card h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #333;
  }

  .dashboard-card p {
    margin: 0 0 12px 0;
    color: #666;
    font-size: 14px;
  }

  .card-tag {
    display: inline-block;
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
  }

  .applications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }

  .application-item {
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
    background: #e3f2fd;
    color: #1976d2;
  }

  .status-badge.accepted {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .status-badge.pending {
    background: #fff3e0;
    color: #e65100;
  }

  .status-badge.rejected {
    background: #ffebee;
    color: #c62828;
  }

  .view-all-link {
    display: inline-block;
    margin-top: 15px;
    color: #1976d2;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .view-all-link:hover {
    color: #0d47a1;
  }

  .jobs-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }

  .job-item {
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .job-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .job-item strong {
    display: block;
    margin-bottom: 5px;
    color: #333;
  }

  .job-meta {
    color: #666;
    font-size: 13px;
  }

  .applications-count {
    color: #1976d2;
    font-weight: 600;
    font-size: 14px;
  }

  .funding-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }

  .funding-item {
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .funding-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .funding-item strong {
    display: block;
    margin-bottom: 5px;
    color: #333;
  }

  .funding-meta {
    color: #666;
    font-size: 13px;
  }

  .interests-count {
    color: #2e7d32;
    font-weight: 600;
    font-size: 14px;
  }

  .interests-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
  }

  .interest-item {
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .interest-item strong {
    display: block;
    margin-bottom: 5px;
    color: #333;
  }

  .interest-meta {
    color: #666;
    font-size: 13px;
  }

  .recent-users-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .recent-user-item {
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .recent-user-item strong {
    display: block;
    margin-bottom: 5px;
  }

  .user-email {
    color: #666;
    font-size: 14px;
  }

  .user-role {
    background: #e3f2fd;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    margin-right: 10px;
    text-transform: capitalize;
  }

  .user-date {
    color: #999;
    font-size: 13px;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 15px;
  }

  .action-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .action-icon {
    font-size: 48px;
  }

  .action-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }

  .action-desc {
    font-size: 13px;
    color: #666;
  }
`;

/* =========================
   SMALL HELPERS
========================= */

const Stat = ({ title, value }) => (
  <div className="stat-card">
    <h3>{value ?? 0}</h3>
    <p>{title}</p>
  </div>
);

export default Dashboard;
