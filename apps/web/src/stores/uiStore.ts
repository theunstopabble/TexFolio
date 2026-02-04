import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ============================================
// UI State Types
// ============================================
type ActiveTab = "editor" | "preview";

interface ModalState {
  isOpen: boolean;
  type: "ai" | "ats" | "coverLetter" | "share" | "template" | null;
}

interface UIState {
  // Editor state
  activeTab: ActiveTab;
  isSaving: boolean;
  isLoading: boolean;

  // Mobile menu
  isMobileMenuOpen: boolean;

  // Modal state
  modal: ModalState;

  // Sidebar (for future)
  isSidebarOpen: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setSaving: (saving: boolean) => void;
  setLoading: (loading: boolean) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Modal actions
  openModal: (type: ModalState["type"]) => void;
  closeModal: () => void;

  // Sidebar actions
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

// ============================================
// Zustand Store
// ============================================
export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      activeTab: "editor",
      isSaving: false,
      isLoading: false,
      isMobileMenuOpen: false,
      modal: { isOpen: false, type: null },
      isSidebarOpen: true,

      // Tab actions
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Loading states
      setSaving: (saving) => set({ isSaving: saving }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Mobile menu
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),

      // Modal actions
      openModal: (type) => set({ modal: { isOpen: true, type } }),
      closeModal: () => set({ modal: { isOpen: false, type: null } }),

      // Sidebar
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
    }),
    { name: "UIStore" },
  ),
);

// ============================================
// Selector Hooks (for performance)
// ============================================
export const useActiveTab = () => useUIStore((state) => state.activeTab);
export const useModal = () => useUIStore((state) => state.modal);
export const useIsSaving = () => useUIStore((state) => state.isSaving);
export const useIsLoading = () => useUIStore((state) => state.isLoading);
