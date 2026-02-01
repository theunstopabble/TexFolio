import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group w-fit">
              <div className="bg-gradient-to-tr from-blue-600 to-purple-600 text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
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
              <span className="text-2xl font-bold text-white">TexFolio</span>
            </Link>
            <p className="text-slate-500 max-w-sm mb-6">
              The professional resume builder that combines AI intelligence with
              LaTeX precision. Get hired faster.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-white font-bold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/templates"
                  className="hover:text-blue-400 transition-colors"
                >
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-blue-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <span className="text-slate-600 cursor-not-allowed">
                  Enterprise
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-600 cursor-not-allowed">Blog</span>
              </li>
              <li>
                <span className="text-slate-600 cursor-not-allowed">
                  ATS Checker
                </span>
              </li>
              <li>
                <span className="text-slate-600 cursor-not-allowed">
                  Help Center
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-600 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-600 cursor-not-allowed">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} TexFolio. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {/* Social Placeholders */}
            {["Twitter", "GitHub", "LinkedIn"].map((social) => (
              <span
                key={social}
                className="text-slate-600 hover:text-white cursor-pointer transition-colors text-sm font-medium"
              >
                {social}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
