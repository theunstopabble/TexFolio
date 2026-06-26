import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SeoMeta from "../components/SeoMeta";
import {
  websiteSchema,
  organizationSchema,
  faqSchema,
  howToSchema,
  personSchema,
} from "../lib/structuredData";

const howToSteps = [
  { step: "1", title: "Choose a Template", desc: "Select from FAANG-ready, Premium, or Classic LaTeX templates optimized for ATS compatibility.", color: "bg-blue-50 text-blue-600" },
  { step: "2", title: "Fill in Your Details", desc: "Enter your experience, education, and skills. Or import your LinkedIn profile with AI parsing.", color: "bg-purple-50 text-purple-600" },
  { step: "3", title: "Optimize with AI", desc: "Use our AI coach to analyze your resume across 4 dimensions: Content, ATS, Format, and Impact.", color: "bg-green-50 text-green-600" },
  { step: "4", title: "Export as PDF", desc: "Render your resume with real LaTeX for professional-grade typography and download instantly.", color: "bg-amber-50 text-amber-600" },
  { step: "5", title: "Practice with AI", desc: "Take your resume to InterviewMinds and practice with realistic AI mock interviews tailored to your skills and target roles.", color: "bg-emerald-50 text-emerald-600" },
];

const faqItems = [
  {
    question: "What is TexFolio and how does it work?",
    answer:
      "TexFolio is an AI-powered LaTeX resume builder that helps you create professional, ATS-friendly resumes. You fill in your details, our AI helps optimize the content, and we render it using real LaTeX for perfect formatting. No coding required.",
  },
  {
    question: "Is TexFolio free to use?",
    answer:
      "Yes, TexFolio offers a free plan that includes 1 resume, basic LaTeX templates, and PDF export. The Pro plan at ₹499/lifetime unlocks unlimited resumes, premium FAANG-ready templates, AI coach analysis, cover letter generation, and advanced features.",
  },
  {
    question: "What is ATS and why does it matter?",
    answer:
      "ATS (Applicant Tracking System) is software used by 95% of large companies to screen resumes. TexFolio includes built-in ATS compatibility checking that analyzes your resume against key criteria and provides actionable scores and suggestions to improve your pass rate.",
  },
  {
    question: "How does the AI resume coach work?",
    answer:
      "Our AI coach uses LangGraph multi-agent architecture to analyze your resume across 4 dimensions: Content quality, ATS compatibility, Format/structure, and Overall impact. It provides a score (0-100) and specific recommendations for improvement, powered by NVIDIA NIM and Groq LLMs.",
  },
  {
    question: "What makes TexFolio different from other resume builders?",
    answer:
      "Unlike HTML-to-PDF converters, we use real LaTeX (TinyTeX) for professional-grade typography and precise formatting. We combine this with multi-agent AI analysis, FAANG-inspired templates, and enterprise-grade security. Our resumes are both beautiful and ATS-friendly.",
  },
  {
    question: "Can I import my LinkedIn profile?",
    answer:
      "Yes, you can export your LinkedIn profile as a PDF and import it directly into TexFolio. Our AI parser extracts your work history, education, skills, and more - saving you hours of manual data entry.",
  },
  {
    question: "Is my data secure and private?",
    answer:
      "Absolutely. Your data is encrypted at rest in MongoDB Atlas. We implement TLS/SSL, CORS hardening, rate limiting, and audit logging. We never sell your data and are GDPR compliant with full data export and deletion capabilities.",
  },
  {
    question: "What templates are available?",
    answer:
      "We offer Premium (modern tech/business), Classic (traditional/academic), and FAANGPath (optimized for top tech companies) templates. Each is LaTeX-rendered, ATS-friendly, and fully customizable. More templates are coming soon.",
  },
  {
    question: "Can I practice interviews after building my resume?",
    answer:
      "Yes! TexFolio integrates with InterviewMinds — an AI-powered mock interview platform. Once your resume is ready, you can practice with realistic AI interviews tailored to your skills and target roles. It's the perfect next step in your job preparation journey.",
  },
];

const HomePage = () => {
  const { user } = useAuth();

  return (
    <>
      <SeoMeta
        title="AI-Powered LaTeX Resume Builder"
        description="Build professional, ATS-friendly LaTeX resumes in minutes with AI assistance. No coding required. Beautifully rendered and optimized to get you hired."
        keywords="resume builder, AI resume, LaTeX resume, ATS friendly resume, professional resume builder, cover letter generator, resume templates, AI resume coach, free resume builder online"
        canonicalUrl="https://texfolio.vercel.app/"
        jsonLd={[
          websiteSchema,
          organizationSchema,
          personSchema(),
          howToSchema(howToSteps),
          faqSchema(faqItems),
        ]}
      />

      <div className="min-h-screen bg-slate-50 overflow-hidden">
        {/* Hero Section */}
        <div className="relative pt-16 sm:pt-20 pb-24 sm:pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-purple-200/30 rounded-full blur-3xl -z-10" />
          <div className="absolute top-20 right-0 w-[500px] sm:w-[800px] h-[400px] sm:h-[600px] bg-blue-200/30 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                New: Advanced AI Editor & FAANG Templates
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
                View Templates
              </Link>
              <a
                href="https://interviewminds.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold text-lg hover:from-emerald-400 hover:to-teal-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                🎤 Practice with AI
              </a>
            </div>
          </div>
        </div>

        {/* How It Works - AEO/GEO friendly step section */}
        <div className="py-16 sm:py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                How TexFolio Works
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4">
                Build a standout resume in four simple steps with our AI-powered
                platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
              {howToSteps.map((item) => (
                <div
                  key={item.step}
                  className="text-center p-6 rounded-2xl border border-slate-100 bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${item.color}`}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="py-16 sm:py-24 bg-slate-50 relative">
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
                {
                  icon: "📊",
                  title: "AI Coach Analysis",
                  desc: "Multi-agent AI analyzes your resume across Content, ATS, Format, and Impact dimensions.",
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  icon: "✍️",
                  title: "Cover Letter Generator",
                  desc: "Generate tailored cover letters matching your resume to any job description.",
                  color: "bg-rose-50 text-rose-600",
                },
                {
                  icon: "🔒",
                  title: "Enterprise Security",
                  desc: "RBAC organizations, audit logging, API keys, GDPR compliance, and encrypted storage.",
                  color: "bg-indigo-50 text-indigo-600",
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
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section - AEO / LLMO / AISEO optimized */}
        <div className="py-16 sm:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Everything you need to know about TexFolio's AI-powered resume
                builder.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <details
                  key={i}
                  className="group bg-slate-50 rounded-xl border border-slate-200 open:shadow-md transition-all"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm sm:text-base font-semibold text-slate-900 hover:text-blue-700 transition-colors">
                    {item.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* E-E-A-T: Expertise & Trust Section */}
        <div className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Built with Expertise, Trust, and Care
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Every aspect of TexFolio is designed to help you succeed in your
                job search while protecting your privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">
                    Frontend
                  </span>
                  <div className="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    React 19
                  </div>
                  <div className="text-lg font-bold text-slate-400">
                    + Hono v4
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  Modern, fast, type-safe tech stack for reliability and
                  performance
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">
                    AI Engine
                  </span>
                  <div className="text-4xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    LangGraph
                  </div>
                  <div className="text-lg font-bold text-slate-400">
                    + NVIDIA NIM
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  Production-grade AI with multi-agent architecture and
                  enterprise LLMs
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center hover:shadow-lg hover:border-purple-200 transition-all duration-300 group">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-purple-500 uppercase tracking-widest">
                    Security
                  </span>
                  <div className="text-4xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                    GDPR
                  </div>
                  <div className="text-lg font-bold text-slate-400">
                    + RBAC
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                  Enterprise security with audit logs, encryption, and privacy
                  compliance
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Learn more about TexFolio →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
