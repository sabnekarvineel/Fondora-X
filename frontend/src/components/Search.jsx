import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import Navbar from "./Navbar";
import SearchResults from "./SearchResults";

// ✅ Backend URL
const API = import.meta.env.VITE_API_URL;

const Search = () => {
  const { user } = useContext(AuthContext);

  const [searchType, setSearchType] = useState("users");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    role: "",
    location: "",
    skills: "",
    minInvestment: "",
    maxInvestment: "",
    minHourlyRate: "",
    maxHourlyRate: "",
    startupStage: "",
    services: "",
    technology: "",
    service: "",
    minRate: "",
    maxRate: "",
    stage: "",
    minFunding: "",
    maxFunding: "",
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  // ✅ WAIT FOR USER
  useEffect(() => {
    if (user?.token) {
      fetchAvailableOptions();
    }
  }, [user]);

  const fetchAvailableOptions = async () => {
    if (!user?.token) return;

    try {
      const [skillsRes, locationsRes] = await Promise.all([
        axios.get(`${API}/api/search/available-skills`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API}/api/search/available-locations`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      // ✅ SAFE SET
      setAvailableSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);
      setAvailableLocations(
        Array.isArray(locationsRes.data) ? locationsRes.data : []
      );
    } catch (err) {
      console.error("Search options error:", err);
      setAvailableSkills([]);
      setAvailableLocations([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!user?.token) return;

    setLoading(true);

    try {
      let url = "";
      let params = {};

      switch (searchType) {
        case "users":
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

        case "skills":
          url = `${API}/api/search/skills`;
          params = { skill: query };
          break;

        case "projects":
          url = `${API}/api/search/projects`;
          params = { query, technology: filters.technology };
          break;

        case "startups":
          url = `${API}/api/search/startups`;
          params = {
            query,
            stage: filters.stage,
            minFunding: filters.minFunding,
            maxFunding: filters.maxFunding,
          };
          break;

        case "freelancers":
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
          ([_, v]) => v !== "" && v !== null && v !== undefined
        )
      );

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: cleanParams,
      });

      // ✅ SAFE RESULT SET
      setResults(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search error:", err);
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
      role: "",
      location: "",
      skills: "",
      minInvestment: "",
      maxInvestment: "",
      minHourlyRate: "",
      maxHourlyRate: "",
      startupStage: "",
      services: "",
      technology: "",
      service: "",
      minRate: "",
      maxRate: "",
      stage: "",
      minFunding: "",
      maxFunding: "",
    });
    setQuery("");
    setResults([]);
  };

  return (
    <div>
      <Navbar />

      <div className="search-container">
        <h2>Search & Discover</h2>

        <form onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${searchType}`}
          />
          <button disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <SearchResults
          results={Array.isArray(results) ? results : []}
          searchType={searchType}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Search;
