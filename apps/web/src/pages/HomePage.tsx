import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-16 sm:pt-20 pb-24 sm:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-purple-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 right-0 w-[500px] sm:w-[800px] h-[400px] sm:h-[600px] bg-blue-200/30 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-medium text-slate-600">
              New: Advanced AI Editor & FAANG Templates 🚀
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 sm:mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Build your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Dream Resume
            </span>
            <br />
            with LaTeX & AI.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 px-2">
            Create professional, ATS-friendly resumes in minutes. No coding
            required. Powered by advanced AI and rendered in beautiful LaTeX.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              {user ? "Go to Dashboard" : "Start Building for Free"}
            </Link>
            <Link
              to="/templates"
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>👀</span> View Templates
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-16 sm:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Everything you need to get hired
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4">
              Our platform combines the power of AI with the precision of LaTeX
              to give you the competitive edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Writing",
                desc: "Generate professional summaries and bullet points tailored to your job title instantly.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: "📄",
                title: "LaTeX Precision",
                desc: "Visuals that standard editors can't match. Perfect margins, fonts, and formatting every time.",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: "🎯",
                title: "ATS Friendly",
                desc: "Built to pass Applicant Tracking Systems. Get a real-time score and improvements.",
                color: "bg-green-50 text-green-600",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-5 sm:p-8 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl mb-4 sm:mb-6 ${feature.color} group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust/Social Proof */}
      {/* Trust/Social Proof removed as requested */}
    </div>
  );
};

export default HomePage;
