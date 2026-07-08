import SeoMeta from "../components/SeoMeta";
import { personSchema, organizationSchema } from "../lib/structuredData";

const About = () => {
  return (
    <>
      <SeoMeta
        title="About TexFolio - AI-Powered LaTeX Resume Builder"
        description="Learn about TexFolio - the AI-powered LaTeX resume builder by Gautam Kumar. Helping professionals create standout resumes with AI and LaTeX precision."
        canonicalUrl="https://texfolio.vercel.app/about"
        keywords="about texfolio, AI resume builder, gautam kumar, latex resume, resume builder team"
        jsonLd={[personSchema(), organizationSchema]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            About TexFolio
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Combining AI intelligence with LaTeX precision to help professionals
            build resumes that get results.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Our Mission
          </h2>
          <p className="text-slate-700 leading-relaxed">
            TexFolio was created to bridge the gap between AI-powered career
            tools and professional document quality. Most resume builders produce
            generic, poorly-formatted PDFs. We combine advanced AI (LangGraph
            agents, NVIDIA NIM, Groq) with real LaTeX rendering to produce
            resumes that are both ATS-friendly and visually stunning.
          </p>
        </div>

        {/* What Sets Us Apart */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            What Sets TexFolio Apart
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Real LaTeX Rendering",
                desc: "Unlike HTML-to-PDF converters, we use actual LaTeX (TinyTeX) for professional-grade typography, precise margins, and beautiful formatting.",
              },
              {
                title: "Multi-Agent AI Coach",
                desc: "Our LangGraph-powered AI coach analyzes your resume across 4 dimensions: Content, ATS Compatibility, Format, and Impact - giving you actionable feedback.",
              },
              {
                title: "FAANG-Ready Templates",
                desc: "Templates designed based on patterns used at top tech companies (Google, Meta, Amazon, Apple, Netflix).",
              },
              {
                title: "ATS Optimization",
                desc: "Built-in ATS compatibility checking ensures your resume passes Applicant Tracking Systems used by 95% of large companies.",
              },
              {
                title: "Enterprise Features",
                desc: "Organizations with RBAC, audit logging, API keys, and GDPR compliance for teams and businesses.",
              },
              {
                title: "Privacy First",
                desc: "Your data is encrypted at rest. We never sell your information. GDPR compliant with full data export and deletion capabilities.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100"
              >
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Creator */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Built by Gautam Kumar
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              GK
            </div>
            <div>
              <p className="text-slate-700 leading-relaxed mb-4">
                TexFolio is a solo project built by{" "}
                <strong>Gautam Kumar</strong>, a Full-Stack Developer | Solo-shipped SaaS Products | AI Integration
                Engineer. With expertise in React, TypeScript, LangChain,
                MongoDB, and LaTeX, Gautam built TexFolio to demonstrate
                production-level SaaS architecture while solving a real problem:
                helping professionals create better resumes.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://gautam-kr.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-4 py-2 bg-white rounded-full border border-slate-200 font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  Portfolio
                </a>
                <a
                  href="https://github.com/theunstopabble"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-4 py-2 bg-white rounded-full border border-slate-200 font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/gautamkr62/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-4 py-2 bg-white rounded-full border border-slate-200 font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Built with React 19, Hono v4, MongoDB, LangChain, NVIDIA NIM, and
            LaTeX. Deployed on Vercel + Render.
          </p>
          <a
            href="https://github.com/theunstopabble/TexFolio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline mt-1 inline-block"
          >
            View source code on GitHub →
          </a>
        </div>
      </div>
    </>
  );
};

export default About;
