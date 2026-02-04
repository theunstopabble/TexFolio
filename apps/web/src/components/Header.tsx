import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const NavLink = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`text-sm lg:text-base font-extrabold transition-all duration-200 px-3 py-2 lg:px-5 lg:py-2.5 rounded-full no-underline tracking-wide whitespace-nowrap ${
        isActive
          ? "bg-blue-600/10 text-blue-800"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location, isMobileMenuOpen]);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group no-underline shrink-0"
          >
            <div className="bg-gradient-to-tr from-blue-700 to-purple-700 text-white p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
              TexFolio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/templates">Templates</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>

            {user && (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/resumes">My Resumes</NavLink>
              </>
            )}
          </nav>

          {/* User Actions & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  to="/create"
                  className="hidden sm:inline-flex bg-slate-900 text-white text-sm lg:text-base font-bold px-4 py-2 lg:px-5 lg:py-2.5 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline whitespace-nowrap"
                >
                  + New
                </Link>
                {/* Mobile "+" Button */}
                <Link
                  to="/create"
                  className="sm:hidden bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition-all shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </Link>

                <div className="h-8 w-px bg-slate-200 hidden sm:block shrink-0"></div>

                {/* User Menu */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center text-blue-700 font-extrabold text-sm ring-2 ring-white shadow-sm overflow-hidden shrink-0">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user.name || "U").charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-800 hidden lg:block group-hover:text-blue-700 transition-colors max-w-[100px] truncate">
                    {(user.name || "User").split(" ")[0]}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="hidden sm:block text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 hover:rotate-90 transform duration-200 shrink-0"
                  title="Logout"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-900 font-bold text-sm lg:text-base px-4 py-2 lg:px-5 lg:py-2.5 rounded-full hover:bg-slate-50 transition-all no-underline"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-slate-900 text-white text-sm lg:text-base font-bold px-5 py-2 lg:px-6 lg:py-2.5 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              {isMobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/templates">Templates</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/resumes">My Resumes</NavLink>

              <button
                onClick={logout}
                className="flex items-center gap-2 text-red-600 font-extrabold px-5 py-2.5 rounded-full hover:bg-red-50 transition-all text-left w-full"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Sign Up</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
