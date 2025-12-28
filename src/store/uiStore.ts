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
    contentManagerContext: {
        elementId: string | null;
        screenId: string | null;
        elementType: 'image' | 'gallery' | 'video' | null;
    } | null;

    // Actions
    setActiveScreenId: (id: string | null) => void;
    setSelectedElementId: (id: string | null) => void;
    setTemplatePreviewOpen: (isOpen: boolean, templateId?: string) => void;
    setMediaLibraryOpen: (isOpen: boolean, mode?: 'select' | 'manage', context?: { elementId: string; screenId: string; elementType: 'image' | 'gallery' | 'video' }) => void;
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
    contentManagerContext: null,

    setActiveScreenId: (id) => set({ activeScreenId: id }),
    setSelectedElementId: (id) => set({ selectedElementId: id }),

    setTemplatePreviewOpen: (isOpen, templateId) => set({
        isTemplatePreviewOpen: isOpen,
        previewTemplateId: isOpen ? templateId || null : null
    }),

    setMediaLibraryOpen: (isOpen, mode = 'manage', context) => set({
        isMediaLibraryOpen: isOpen,
        mediaLibraryMode: mode,
        contentManagerContext: isOpen && context ? {
            elementId: context.elementId,
            screenId: context.screenId,
            elementType: context.elementType
        } : null
    }),
}));
