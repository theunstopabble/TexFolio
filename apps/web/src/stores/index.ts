// Re-export all stores from a single entry point
export { useResumeStore, type ResumeData } from "./resumeStore";
export {
  useUIStore,
  useActiveTab,
  useModal,
  useIsSaving,
  useIsLoading,
} from "./uiStore";
