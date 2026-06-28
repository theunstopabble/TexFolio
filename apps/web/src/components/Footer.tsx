import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group w-fit">
              <img
                src="/logo.png"
                alt="TexFolio"
                width={40}
                height={40}
                loading="lazy"
                className="h-10 w-10 object-contain group-hover:scale-110 transition-transform"
              />
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
                <Link
                  to="/about"
                  className="hover:text-blue-400 transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Connect</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/theunstopabble"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/gautamkr62/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://gautam-kr.vercel.app"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-blue-400 transition-colors"
                >
                  Portfolio
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} TexFolio. All rights reserved.
          </p>
          <p className="text-sm">
            Built by{" "}
            <a
              href="https://gautam-kr.vercel.app"
              target="_blank"
              rel="noopener"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              title="Gautam Kumar — Full-Stack Developer | Solo-shipped 4 SaaS Products | AI Integration
"
            >
              Gautam Kumar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
