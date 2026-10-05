import { useState, useRef, useMemo, type KeyboardEvent, type ChangeEvent } from "react";
import { LABEL_CLASS } from "./sections/formStyles";

interface TagChipsProps {
  value: string; // comma-separated string
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  id: string;
  label?: string;
  error?: boolean;
  ariaDescribedBy?: string;
}

/**
 * High-performance, user-friendly tag chips input.
 * Supports:
 * - Direct typing with instant comma or Enter key tag conversion
 * - Pasting multiple comma-separated skills
 * - One-click interactive suggestion pills
 * - Single-click tag removal
 */
export const TagChips = ({
  value = "",
  onChange,
  suggestions = [],
  placeholder = "Type skills (press comma or Enter to add)",
  maxTags = 30,
  id,
  label,
  error,
  ariaDescribedBy,
}: TagChipsProps) => {
  // Derive tags from value prop (controlled component pattern)
  const tags = useMemo(() => {
    if (!value) return [];
    return value
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
  }, [value]);

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTags = (tagsToAdd: string[]) => {
    const currentLower = new Set(tags.map((t: string) => t.toLowerCase()));
    const newItems: string[] = [];

    for (const raw of tagsToAdd) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (tags.length + newItems.length >= maxTags) break;
      if (!currentLower.has(trimmed.toLowerCase())) {
        currentLower.add(trimmed.toLowerCase());
        newItems.push(trimmed);
      }
    }

    if (newItems.length > 0) {
      const updated = [...tags, ...newItems];
      onChange(updated.join(", "));
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updated = tags.filter((t: string) => t.toLowerCase() !== tagToRemove.toLowerCase());
    onChange(updated.join(", "));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Real-time comma separation: typing "React," or pasting "Python, Go, Docker"
    if (val.includes(",")) {
      const parts = val.split(",");
      const toAdd = parts.slice(0, -1);
      const remaining = parts[parts.length - 1];

      if (toAdd.length > 0) {
        addTags(toAdd);
      }
      setInputValue(remaining.trimStart());
      return;
    }

    setInputValue(val);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTags([inputValue]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTags([inputValue]);
      setInputValue("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const isAlreadyAdded = tags.some(
      (t: string) => t.toLowerCase() === suggestion.toLowerCase(),
    );
    if (isAlreadyAdded) {
      removeTag(suggestion);
    } else {
      addTags([suggestion]);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}

      {/* Main Tag Chips Input Box */}
      <div
        className={`flex flex-wrap gap-1.5 p-2 bg-white border rounded-lg transition-colors min-h-[42px] cursor-text ${
          error
            ? "border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-400"
            : "border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag: string) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200 animate-fade-in"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 p-0.5 rounded-full hover:bg-blue-200 text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center justify-center leading-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : "Add more (press comma)..."}
          className="flex-1 min-w-[140px] bg-transparent border-none focus:ring-0 p-0 py-1 text-sm outline-none text-slate-800 placeholder:text-slate-400"
          disabled={tags.length >= maxTags}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? "true" : undefined}
        />
      </div>

      {/* Interactive Suggestion Pills */}
      {suggestions.length > 0 && (
        <div className="pt-1">
          <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center justify-between">
            <span>Quick Suggestions (click to add/remove):</span>
            <span className="text-[10px] text-slate-400">Type comma to add custom</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {suggestions.map((suggestion: string) => {
              const isSelected = tags.some(
                (t: string) => t.toLowerCase() === suggestion.toLowerCase(),
              );
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`text-xs px-2 py-0.5 rounded-md border transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  }`}
                >
                  {isSelected ? `✓ ${suggestion}` : `+ ${suggestion}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ariaDescribedBy && (
        <p id={ariaDescribedBy} className="text-xs text-slate-500">
          Press <strong>Enter</strong> or <strong>comma (,)</strong> to add custom skills, or click suggestions above.
        </p>
      )}
    </div>
  );
};

export default TagChips;