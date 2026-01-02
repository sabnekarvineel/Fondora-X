import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Navbar from './Navbar';
import SearchResults from './SearchResults';

// ✅ ADD THIS (only new line)
const API = import.meta.env.VITE_API_URL;

const Search = () => {
  const { user } = useContext(AuthContext);
  const [searchType, setSearchType] = useState('users');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    role: '',
    location: '',
    skills: '',
    minInvestment: '',
    maxInvestment: '',
    minHourlyRate: '',
    maxHourlyRate: '',
    startupStage: '',
    services: '',
    technology: '',
    service: '',
    minRate: '',
    maxRate: '',
    stage: '',
    minFunding: '',
    maxFunding: '',
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  // ✅ WAIT until user exists (no UI change)
  useEffect(() => {
    if (user?.token) {
      fetchAvailableOptions();
    }
  }, [user]);

  const fetchAvailableOptions = async () => {
    try {
      const token = user?.token;

      const [skillsRes, locationsRes] = await Promise.all([
        axios.get(`${API}/api/search/available-skills`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/api/search/available-locations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ SAFE ARRAYS (prevents .map crash)
      setAvailableSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
      setAvailableLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
    } catch (error) {
      console.error(error);
      setAvailableSkills([]);
      setAvailableLocations([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!user?.token) return;

    setLoading(true);

    try {
      const token = user?.token;
      let url = '';
      let params = {};

      switch (searchType) {
        case 'users':
          url = `${API}/api/search/users`;
          params = {
            query,
            role: filters.role,
            location: filters.location,
            skills: filters.skills,
            minInvestment: filters.minInvestment,
            maxInvestment: filters.maxInvestment,
            minHourlyRate: filters.minHourlyRate,
            maxHourlyRate: filters.maxHourlyRate,
            startupStage: filters.startupStage,
            services: filters.services,
          };
          break;

        case 'skills':
          url = `${API}/api/search/skills`;
          params = { skill: query };
          break;

        case 'projects':
          url = `${API}/api/search/projects`;
          params = { query, technology: filters.technology };
          break;

        case 'startups':
          url = `${API}/api/search/startups`;
          params = {
            query,
            stage: filters.stage,
            minFunding: filters.minFunding,
            maxFunding: filters.maxFunding,
          };
          break;

        case 'freelancers':
          url = `${API}/api/search/freelancers`;
          params = {
            query,
            service: filters.service,
            minRate: filters.minRate,
            maxRate: filters.maxRate,
          };
          break;

        default:
          break;
      }

      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([_, v]) => v !== '' && v !== null && v !== undefined
        )
      );

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: cleanParams,
      });

      // ✅ ALWAYS SET ARRAY
      if (Array.isArray(data?.users)) {
        setResults(data.users);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      role: '',
      location: '',
      skills: '',
      minInvestment: '',
      maxInvestment: '',
      minHourlyRate: '',
      maxHourlyRate: '',
      startupStage: '',
      services: '',
      technology: '',
      service: '',
      minRate: '',
      maxRate: '',
      stage: '',
      minFunding: '',
      maxFunding: '',
    });
    setQuery('');
    setResults([]);
  };

  return (
    <div>
      <Navbar />
      <div className="search-container">
        <div className="search-header">
          <h2>Search & Discover</h2>
          <p>Find students, freelancers, startups, investors, projects, and more</p>
        </div>

        <div className="search-type-selector">
          <button
            className={searchType === 'users' ? 'search-type-btn active' : 'search-type-btn'}
            onClick={() => setSearchType('users')}
          >
            Users
          </button>
          <button
            className={searchType === 'startups' ? 'search-type-btn active' : 'search-type-btn'}
            onClick={() => setSearchType('startups')}
          >
            Startups
          </button>
          <button
            className={searchType === 'freelancers' ? 'search-type-btn active' : 'search-type-btn'}
            onClick={() => setSearchType('freelancers')}
          >
            Freelancers
          </button>
          <button
            className={searchType === 'projects' ? 'search-type-btn active' : 'search-type-btn'}
            onClick={() => setSearchType('projects')}
          >
            Projects
          </button>
          <button
            className={searchType === 'skills' ? 'search-type-btn active' : 'search-type-btn'}
            onClick={() => setSearchType('skills')}
          >
            Skills
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${searchType}...`}
              className="search-input"
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>

          <div className="filters-section">
            {/* UI BELOW IS UNCHANGED */}
            {searchType === 'users' && (
              <>
                <div className="filter-group">
                  <label>Role</label>
                  <select name="role" value={filters.role} onChange={handleFilterChange}>
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="startup">Startup</option>
                    <option value="investor">Investor</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="Enter location"
                    list="locations"
                  />
                  <datalist id="locations">
                    {availableLocations.map((loc, index) => (
                      <option key={index} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div className="filter-group">
                  <label>Skills</label>
                  <input
                    type="text"
                    name="skills"
                    value={filters.skills}
                    onChange={handleFilterChange}
                    placeholder="e.g., React, Node.js"
                    list="skills"
                  />
                  <datalist id="skills">
                    {availableSkills.map((skill, index) => (
                      <option key={index} value={skill} />
                    ))}
                  </datalist>
                </div>
              </>
            )}
          </div>
        </form>

        <SearchResults
          results={results}
          searchType={searchType}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Search;
