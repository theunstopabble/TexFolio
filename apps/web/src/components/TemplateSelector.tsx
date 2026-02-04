import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import clsx from "clsx";

interface TemplateSelectorProps {
  currentTemplate: string;
  onSelect: (templateId: string) => void;
  // isSaving?: boolean; // Removed unused prop
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic Reader",
    description:
      "Clean, professional, and ATS-friendly. Best for corporate jobs.",
    isPremium: false,
    color: "bg-slate-100",
  },
  {
    id: "premium",
    name: "Modern Pro",
    description: "Sleek headers, icons, and accent colors. Stands out.",
    isPremium: true,
    color: "bg-blue-50",
  },
  {
    id: "faangpath",
    name: "FAANGPath Pro",
    description:
      "FAANG-style template. Perfect for tech roles at top companies.",
    isPremium: true,
    color: "bg-emerald-50",
  },
];

const TemplateSelector = ({
  currentTemplate,
  onSelect,
}: TemplateSelectorProps) => {
  const { user } = useAuth();
  // simplified check
  const userIsPro = user?.isPro || false;

  const handleSelect = (templateId: string, isPremium: boolean) => {
    if (isPremium && !userIsPro) {
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
          const isLocked = template.isPremium && !userIsPro;

          return (
            <div
              key={template.id}
              onClick={() => handleSelect(template.id, template.isPremium)}
              className={clsx(
                "relative rounded-xl border-2 p-4 cursor-pointer transition-all",
                isSelected
                  ? "border-blue-600 bg-blue-50/50"
                  : "border-slate-100 hover:border-slate-300",
                isLocked && "opacity-75 cursor-not-allowed",
              )}
            >
              {/* Premium Badge */}
              {template.isPremium && (
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
                      : "🎨"}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{template.name}</h4>
                  {isLocked && (
                    <Link
                      to="/pricing"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Upgrade to Unlock
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {template.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
