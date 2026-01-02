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
      <p>Total Users: {analytics?.totalUsers || 0}</p>
    </div>
  );
};

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
