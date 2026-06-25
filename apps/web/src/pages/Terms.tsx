import SeoMeta from "../components/SeoMeta";
import { organizationSchema } from "../lib/structuredData";

const Terms = () => {
  return (
    <>
      <SeoMeta
        title="Terms of Service - Usage Terms & Policies"
        description="TexFolio Terms of Service - Read the terms and conditions for using our AI-powered LaTeX resume builder platform."
        canonicalUrl="https://texfolio.vercel.app/terms"
        keywords="terms of service, terms and conditions, resume builder terms"
        jsonLd={[organizationSchema]}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Last updated: March 2026
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using TexFolio, you agree to be bound by these
              Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              2. Service Description
            </h2>
            <p>
              TexFolio is an AI-powered LaTeX resume builder that provides:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Resume creation and editing tools</li>
              <li>AI-powered resume analysis and coaching</li>
              <li>LaTeX PDF generation</li>
              <li>ATS compatibility checking</li>
              <li>Cover letter generation</li>
              <li>Templates and formatting tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              3. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials. You must provide accurate information when
              creating an account. You are responsible for all activity that
              occurs under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              4. Free vs Pro Accounts
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Free accounts:</strong> Limited to 1 resume, basic
                templates, and PDF export.
              </li>
              <li>
                <strong>Pro accounts:</strong> Unlimited resumes, premium
                templates, AI features, and priority support. Pro is a lifetime
                purchase at a one-time fee.
              </li>
              <li>
                Payments are processed securely via Razorpay. Refunds are handled
                on a case-by-case basis.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to bypass rate limits or security measures</li>
              <li>Upload malicious content or attempt to exploit the system</li>
              <li>
                Use AI features to generate misleading or fraudulent content
              </li>
              <li>
                Reverse engineer, decompile, or disassemble the service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              6. AI-Generated Content
            </h2>
            <p>
              AI-generated content (resume analysis, cover letters, bullet
              points) is provided as a tool to assist you. You are solely
              responsible for reviewing and verifying all AI-generated content
              before use. TexFolio makes no guarantees about the accuracy or
              effectiveness of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              7. Intellectual Property
            </h2>
            <p>
              Your resume content remains your intellectual property. TexFolio's
              templates, code, and branding are owned by the developer. You may
              not copy, modify, or redistribute TexFolio's templates or software
              without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              TexFolio is provided "as is" without warranties of any kind. The
              developer is not liable for any damages arising from your use of
              the service, including but not limited to lost employment
              opportunities or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              9. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these terms at any time. Users will
              be notified of material changes via email or through the platform.
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>
              For questions about these terms, contact{" "}
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

export default Terms;
