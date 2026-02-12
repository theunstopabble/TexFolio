import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="mb-6 group">
      <div
        {...listeners}
        className="absolute -left-8 top-6 cursor-move p-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <circle cx="4" cy="6" r="1"></circle>
            <circle cx="4" cy="12" r="1"></circle>
            <circle cx="4" cy="18" r="1"></circle>
          </svg>
        </span>
      </div>
      {children}
    </div>
  );
}
