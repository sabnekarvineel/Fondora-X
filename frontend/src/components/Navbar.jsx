import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleBack = () => {
        navigate(-1);
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const isHomePage = location.pathname === '/feed' || location.pathname === '/';

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <div className="navbar-left">
                    {!isHomePage && (
                        <button className="back-btn" onClick={handleBack} title="Go Back">
                            ← Back
                        </button>
                    )}
                    <Link to="/feed" className="navbar-brand">

                        <h1>Fondora-X</h1>
                    </Link>
                </div>

                <button className="hamburger-btn" onClick={toggleMenu}>
                    {menuOpen ? '✕' : '☰'}
                </button>

                <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
                    <button className="close-menu-btn" onClick={closeMenu}>
                        ✕ Close
                    </button>

                    {user?.role !== 'admin' && (
                        <div className="notification-wrapper-mobile">
                            <NotificationDropdown />
                        </div>
                    )}

                    <div className="navbar-links">
                        {user?.role === 'admin' ? (
                            <>
                                <Link
                                    to="/admin"
                                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Admin
                                </Link>
                                <Link
                                    to="/settings"
                                    className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    ⚙️ Settings
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/feed"
                                    className={`nav-link ${isActive('/feed') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/search"
                                    className={`nav-link ${isActive('/search') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Search
                                </Link>
                                <Link
                                    to="/messages"
                                    className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Messages
                                </Link>
                                <Link
                                    to="/jobs"
                                    className={`nav-link ${isActive('/jobs') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Jobs
                                </Link>
                                {(user?.role === 'startup' || user?.role === 'investor') && (
                                    <Link
                                        to="/funding"
                                        className={`nav-link ${isActive('/funding') ? 'active' : ''}`}
                                        onClick={closeMenu}
                                    >
                                        Funding
                                    </Link>
                                )}
                                <Link
                                    to={`/profile/${user?._id}`}
                                    className={`nav-link ${isActive(`/profile/${user?._id}`) ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    👤 Profile
                                </Link>
                                <Link
                                    to="/settings"
                                    className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    ⚙️ Settings
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="navbar-actions">
                        {user?.role !== 'admin' && (
                            <div className="notification-wrapper-desktop">
                                <NotificationDropdown />
                            </div>
                        )}
                        <button onClick={() => { logout(); closeMenu(); }} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>

                {menuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
            </div>
        </nav>
    );
};

export default Navbar;
