const BASE_URL = "https://texfolio.vercel.app";
const AUTHOR_URL = "https://gautam-kr.vercel.app";
// One stable @id for Gautam Kumar across every schema block — the static
// WebApplication in index.html, personSchema() and organizationSchema.founder
// all describe the same human, so crawlers merge them instead of seeing two
// conflicting Person entities. It is the author's own site: a real, resolvable
// URL that is already the `url` field of all three blocks, so no fragment or
// invented path is needed.
const PERSON_ID = AUTHOR_URL;

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TexFolio",
  url: BASE_URL,
  description:
    "AI-powered LaTeX resume builder. Create professional, ATS-friendly resumes in minutes.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TexFolio",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description:
    "AI-Powered LaTeX Resume Builder SaaS platform.",
  founder: {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Gautam Kumar",
    url: AUTHOR_URL,
    jobTitle: "Full-Stack Developer | Solo-shipped SaaS Products | AI Integration",
    sameAs: [
      "https://github.com/theunstopabble",
      "https://www.linkedin.com/in/gautamkr62",
      AUTHOR_URL,
    ],
  },
  sameAs: [
    "https://github.com/theunstopabble/TexFolio",
    "https://www.linkedin.com/in/gautamkr62",
  ],
};

export function howToSchema(steps: { step: string; title: string; desc: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Build a Resume with TexFolio",
    description:
      "Build a standout resume in four simple steps with TexFolio's AI-powered platform.",
    step: steps.map((s) => ({
      "@type": "HowToStep",
      position: parseInt(s.step),
      name: s.title,
      text: s.desc,
    })),
  };
}

export function faqSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productSchema(
  name: string,
  description: string,
  price: string,
  currency = "INR",
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    },
  };
}

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Gautam Kumar",
    url: AUTHOR_URL,
    jobTitle: "Full-Stack Developer | Solo-shipped SaaS Products | AI Integration",
    description:
      "Full-stack developer and AI engineer specializing in React, TypeScript, LangChain, and LLM-powered applications.",
    sameAs: [
      "https://github.com/theunstopabble",
      "https://www.linkedin.com/in/gautamkr62",
      AUTHOR_URL,
    ],
    knowsAbout: [
      "React",
      "TypeScript",
      "Node.js",
      "LangChain",
      "Large Language Models",
      "MongoDB",
      "LaTeX",
      "Resume Optimization",
      "ATS Compatibility",
    ],
  };
}
