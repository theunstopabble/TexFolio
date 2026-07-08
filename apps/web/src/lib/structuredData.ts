const BASE_URL = "https://texfolio.vercel.app";
const AUTHOR_URL = "https://gautam-kr.vercel.app";

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

export const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TexFolio",
  url: BASE_URL,
  description:
    "Build professional, ATS-friendly LaTeX resumes in minutes with AI assistance. Built with React 19, Hono, and LangGraph.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  author: {
    "@type": "Person",
    name: "Gautam Kumar",
    url: AUTHOR_URL,
  },
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
