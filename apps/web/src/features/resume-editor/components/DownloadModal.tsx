import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { buildResumeFileName, downloadTextFile } from "../../../lib/download";
import { buildResumeText } from "../lib/resumeText";
import type { ResumeFormData } from "../types";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current form values — exports are taken from these, not the server copy. */
  data: ResumeFormData;
  /** True while the server is compiling the PDF (LaTeX can take ~2 min). */
  downloading: boolean;
  onDownloadPdf: () => void;
}

type Format = "pdf" | "txt" | "json";

const OPTIONS: {
  id: Format;
  icon: string;
  label: string;
  hint: string;
}[] = [
  {
    id: "pdf",
    icon: "📄",
    label: "PDF",
    hint: "Typeset by LaTeX — what recruiters expect to receive.",
  },
  {
    id: "txt",
    icon: "📝",
    label: "Plain text",
    hint: "For pasting into application forms that reject attachments.",
  },
  {
    id: "json",
    icon: "🧾",
    label: "JSON",
    hint: "Machine-readable backup — re-importable and diffable.",
  },
];

/**
 * Format chooser for the download action.
 *
 * The button used to go straight to the LaTeX compile, which takes up to two
 * minutes and only ever produced a PDF — so a user who needed a plain-text
 * version to paste into an application form had no path to one at all.
 */
export const DownloadModal = ({
  isOpen,
  onClose,
  data,
  downloading,
  onDownloadPdf,
}: DownloadModalProps) => {
  const base = () =>
    buildResumeFileName(data.personalInfo?.fullName, data.title);

  const handle = (format: Format) => {
    if (format === "pdf") {
      // Modal stays open: the compile is long enough that closing it would
      // leave the button's only feedback (its spinner) invisible.
      onDownloadPdf();
      return;
    }
    if (format === "txt") {
      downloadTextFile(
        buildResumeText(data),
        base().replace(/\.pdf$/i, ".txt"),
        "text/plain;charset=utf-8",
      );
    } else {
      downloadTextFile(
        `${JSON.stringify(data, null, 2)}\n`,
        base().replace(/\.pdf$/i, ".json"),
        "application/json;charset=utf-8",
      );
    }
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={downloading ? () => {} : onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium leading-6 text-slate-900"
                >
                  Download resume
                </DialogTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {data.title || "Choose a format"}
                </p>

                <div className="mt-4 space-y-2" role="list">
                  {OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handle(option.id)}
                      disabled={downloading}
                      className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="text-xl"
                        >
                          {option.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">
                            {option.id === "pdf" && downloading
                              ? "⏳ Compiling PDF… (up to 2 min)"
                              : option.label}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {option.hint}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={downloading}
                  >
                    {downloading ? "Compiling…" : "Cancel"}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DownloadModal;
