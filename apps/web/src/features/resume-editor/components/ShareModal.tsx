import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import toast from "react-hot-toast";

export const ShareModal = ({
  isOpen,
  onClose,
  isPublic,
  shareId,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  isPublic: boolean;
  shareId?: string;
  onToggle: () => void;
}) => {
  const publicUrl = shareId ? `${window.location.origin}/r/${shareId}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied!");
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Share Resume
                </Dialog.Title>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      Public Access
                    </span>
                    <button
                      onClick={onToggle}
                      aria-label={
                        isPublic
                          ? "Disable public access"
                          : "Enable public access"
                      }
                      title={
                        isPublic
                          ? "Disable public access"
                          : "Enable public access"
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                        isPublic ? "bg-purple-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`${
                          isPublic ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </div>

                  {isPublic && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Anyone with this link can view your resume:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={publicUrl}
                          aria-label="Public Resume Link"
                          className="flex-1 rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          onClick={copyToClipboard}
                          title="Copy Link"
                          className="rounded-md bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200"
                        >
                          Copy
                        </button>
                      </div>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-2 text-xs text-blue-600 hover:underline text-center"
                      >
                        Open Link ↗️
                      </a>
                    </div>
                  )}

                  {!isPublic && (
                    <p className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-md">
                      🔒 Your resume is currently private. Enable Public Access
                      to share it.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
