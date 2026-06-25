import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import OrganizationSwitcher from "./OrganizationSwitcher";

const NavLink = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`shrink-0 text-sm lg:text-[0.8125rem] xl:text-sm font-extrabold transition-all duration-200 px-2 py-1 lg:px-2.5 lg:py-1.5 xl:px-3.5 xl:py-2 rounded-full no-underline tracking-wide whitespace-nowrap ${isActive
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

  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20">
        <div className="flex items-center justify-between h-full gap-1 md:gap-2">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1 group no-underline shrink-0"
          >
            <img
              src="/logo.png"
              alt="TexFolio"
              width={28}
              height={28}
              fetchPriority="high"
              className="h-7 w-7 object-contain rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200"
            />
            <span className="text-sm md:text-base xl:text-lg font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
              TexFolio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
            <div className="flex items-center gap-0.5 flex-wrap justify-center">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/templates">Templates</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>

              {user && (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/resumes">My Resumes</NavLink>
                  <NavLink to="/organizations">Organizations</NavLink>
                </>
              )}
            </div>
          </nav>

          {/* User Actions & Mobile Toggle */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-1 md:gap-2">
                {/* +New Button - hidden on smallest screens, icon on md, full on lg+ */}
                <Link
                  to="/create"
                  className="hidden sm:inline-flex bg-slate-900 text-white text-sm lg:text-[0.8125rem] xl:text-sm font-bold px-2.5 py-1.5 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline whitespace-nowrap shrink-0 items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span className="hidden lg:inline">New</span>
                </Link>

                <div className="h-6 w-px bg-slate-200 shrink-0" />

                <OrganizationSwitcher />

                <div className="h-6 w-px bg-slate-200 shrink-0" />

                {/* User Menu */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group shrink-0"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center text-blue-700 font-extrabold text-xs md:text-sm ring-2 ring-white shadow-sm overflow-hidden shrink-0">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.name || "User"}
                        width={32}
                        height={32}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user.name || "U").charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-800 hidden lg:block group-hover:text-blue-700 transition-colors max-w-[80px] truncate">
                    {(user.name || "User").split(" ")[0]}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1.5 md:p-2 rounded-full hover:bg-red-50 shrink-0"
                  title="Logout"
                  aria-label="Logout"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
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
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/login"
                  className="shrink-0 text-slate-600 hover:text-slate-900 font-bold text-sm lg:text-[0.8125rem] xl:text-sm px-2.5 py-1.5 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 rounded-full hover:bg-slate-50 transition-all no-underline"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="shrink-0 bg-slate-900 text-white text-sm lg:text-[0.8125rem] xl:text-sm font-bold px-3 py-1.5 lg:px-3.5 lg:py-1.5 xl:px-5 xl:py-2 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 md:p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer active:scale-95"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
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
                  width="22"
                  height="22"
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
        <div className="lg:hidden absolute top-16 md:top-20 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl p-4 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/templates">Templates</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>

          {user ? (
            <>
              <div className="border-t border-slate-100 pt-2">
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/resumes">My Resumes</NavLink>
                <NavLink to="/organizations">Organizations</NavLink>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <Link
                  to="/create"
                  className="flex items-center gap-2 font-extrabold px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all w-full no-underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
                  New Resume
                </Link>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-red-600 font-extrabold px-5 py-2.5 rounded-full hover:bg-red-50 transition-all text-left w-full"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="border-t border-slate-100 pt-2">
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Sign Up</NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
