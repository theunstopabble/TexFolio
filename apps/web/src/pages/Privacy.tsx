import SeoMeta from "../components/SeoMeta";
import { organizationSchema } from "../lib/structuredData";

const Privacy = () => {
  return (
    <>
      <SeoMeta
        title="Privacy Policy"
        description="TexFolio Privacy Policy - Learn how we collect, use, and protect your personal data when you use our AI-powered LaTeX resume builder."
        canonicalUrl="https://texfolio.vercel.app/privacy"
        keywords="privacy policy, data protection, GDPR, resume builder privacy"
        jsonLd={[organizationSchema]}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Last updated: March 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              1. Information We Collect
            </h2>
            <p>
              When you use TexFolio, we collect information you provide directly:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Account Information:</strong> Name, email address, and
                profile picture when you sign up via Clerk authentication.
              </li>
              <li>
                <strong>Resume Data:</strong> All content you enter into resumes,
                including personal information, work history, education, skills,
                and projects.
              </li>
              <li>
                <strong>Payment Information:</strong> When you upgrade to Pro,
                payments are processed securely through Razorpay. We do not store
                credit card details.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, and
                interaction patterns to improve our service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              2. How We Use Your Data
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain the resume builder service</li>
              <li>
                To power AI features (resume analysis, cover letter generation,
                text improvement)
              </li>
              <li>To process payments and manage your account</li>
              <li>To send service-related communications</li>
              <li>To improve our AI models and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              3. AI & Data Processing
            </h2>
            <p>
              TexFolio uses AI services including Groq (Llama models) and NVIDIA
              NIM for resume analysis, cover letter generation, and content
              suggestions. Your resume data is processed by these services in
              real-time and is not used for model training. We implement
              circuit-breaking and rate limiting to ensure responsible AI usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              4. Data Sharing & Third Parties
            </h2>
            <p>We share data only with essential service providers:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Clerk:</strong> Authentication and user management
              </li>
              <li>
                <strong>MongoDB Atlas:</strong> Database hosting
              </li>
              <li>
                <strong>Razorpay:</strong> Payment processing
              </li>
              <li>
                <strong>Vercel:</strong> Frontend hosting and analytics
              </li>
              <li>
                <strong>Render:</strong> Backend API hosting
              </li>
              <li>
                <strong>Groq / NVIDIA:</strong> AI inference for resume features
              </li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              5. Data Security
            </h2>
            <p>
              We implement industry-standard security measures including TLS/SSL
              encryption, CORS hardening, rate limiting, input sanitization, and
              audit logging. Your resume data is stored securely in MongoDB Atlas
              with encryption at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              6. Your GDPR Rights
            </h2>
            <p>
              If you are a resident of the European Economic Area (EEA), you have
              the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Delete your data (right to be forgotten)</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-2">
              You can exercise these rights from your account settings or by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              7. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active.
              You can delete your account and associated data at any time through
              your profile settings. Resume data is retained for 30 days after
              account deletion for recovery purposes, then permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              8. Cookies
            </h2>
            <p>
              We use essential cookies for authentication (Clerk) and session
              management. We do not use tracking cookies or third-party
              advertising cookies. Vercel Analytics uses anonymized data
              collection.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              9. Contact
            </h2>
            <p>
              For privacy-related inquiries, contact the developer at{" "}
              <a
                href="https://gautam-kr.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                gautam-kr.vercel.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default Privacy;
