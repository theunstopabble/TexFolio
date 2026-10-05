import { isProTemplate } from "@texfolio/shared";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

interface TemplateSelectorProps {
  currentTemplate: string;
  onSelect: (templateId: string) => void;
  // isSaving?: boolean; // Removed unused prop
}

/**
 * Gating comes from `@texfolio/shared`, not a per-card boolean: the API checks
 * the same predicate on create/update/PDF, so a hardcoded `isPremium` here could
 * drift and let the picker offer something the server then rejects.
 */
const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Clean, professional, and ATS-friendly. Best for corporate jobs.",
    color: "bg-slate-100",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Sleek headers, icons, and accent colors. Stands out.",
    color: "bg-blue-50",
  },
  {
    id: "faangpath",
    name: "FAANGPath Pro",
    description:
      "FAANG-style template. Perfect for tech roles at top companies.",
    color: "bg-emerald-50",
  },
  {
    id: "developer",
    name: "Developer Pro",
    description:
      "Ultra-compact 1-page design, small-caps headers, fine-tuned 9pt font. Gautam's exact template.",
    color: "bg-indigo-50",
  },
] as const;

const TemplateSelector = ({
  currentTemplate,
  onSelect,
}: TemplateSelectorProps) => {
  const { user } = useAuth();
  // simplified check
  const userIsPro = user?.isPro || false;

  const handleSelect = (templateId: string) => {
    if (isProTemplate(templateId) && !userIsPro) {
      return; // Prevent selection
    }
    onSelect(templateId);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Choose Template</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => {
          const isSelected = currentTemplate === template.id;
          const isPremium = isProTemplate(template.id);
          const isLocked = isPremium && !userIsPro;

          return (
            <div key={template.id} className="relative">
              {/* A real <button>: the old <div onClick> was unreachable by
                  keyboard. Locked cards are `disabled`, so Tab skips the dead
                  card and lands on the Upgrade link below it instead. */}
              <button
                type="button"
                onClick={() => handleSelect(template.id)}
                disabled={isLocked}
                aria-pressed={isSelected}
                aria-label={`${template.name} template${isPremium ? " (Pro)" : ""}`}
                className={`relative block w-full text-left rounded-xl border-2 p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-100 hover:border-slate-300"
                } ${isLocked ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
              >
              {/* Premium Badge */}
              {isPremium && (
                <div className="absolute -top-3 -right-3">
                  {userIsPro ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200">
                      Pro Unlocked
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      👑 Pro Only
                    </span>
                  )}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 text-blue-600 bg-white rounded-full p-1 shadow-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center text-xl`}
                >
                  {template.id === "classic"
                    ? "📄"
                    : template.id === "faangpath"
                      ? "🚀"
                      : template.id === "developer"
                        ? "⚡"
                        : "🎨"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{template.name}</h4>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {template.description}
              </p>
              </button>

              {/* Outside the button: an <a> inside a <button> is invalid
                  (interactive content may not nest) and traps keyboard users. */}
              {isLocked && (
                <Link
                  to="/pricing"
                  className="mt-1.5 inline-block text-xs text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
                >
                  Upgrade to Unlock
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
