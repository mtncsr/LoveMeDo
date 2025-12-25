import { create } from 'zustand';

// App flow modes
export type AppMode = 'landing' | 'templates' | 'editor' | 'export';

interface UIState {
    mode: AppMode;
    setMode: (mode: AppMode) => void;

    // Editor specific
    activeScreenId: string | null;
    selectedElementId: string | null;
    isTemplatePreviewOpen: boolean;
    previewTemplateId: string | null;

    isMediaLibraryOpen: boolean;
    mediaLibraryMode: 'select' | 'manage'; // Select returns, Manage just views

    // Actions
    setActiveScreenId: (id: string | null) => void;
    setSelectedElementId: (id: string | null) => void;
    setTemplatePreviewOpen: (isOpen: boolean, templateId?: string) => void;
    setMediaLibraryOpen: (isOpen: boolean, mode?: 'select' | 'manage') => void;
}

export const useUIStore = create<UIState>((set) => ({
    mode: 'landing',
    setMode: (mode) => set({ mode }),

    activeScreenId: null,
    selectedElementId: null,
    isTemplatePreviewOpen: false,
    previewTemplateId: null,
    isMediaLibraryOpen: false,
    mediaLibraryMode: 'manage',

    setActiveScreenId: (id) => set({ activeScreenId: id }),
    setSelectedElementId: (id) => set({ selectedElementId: id }),

    setTemplatePreviewOpen: (isOpen, templateId) => set({
        isTemplatePreviewOpen: isOpen,
        previewTemplateId: isOpen ? templateId || null : null
    }),

    setMediaLibraryOpen: (isOpen, mode = 'manage') => set({
        isMediaLibraryOpen: isOpen,
        mediaLibraryMode: mode
    }),
}));
