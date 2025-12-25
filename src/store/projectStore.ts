import { create } from 'zustand';
import type { Project, Screen, ScreenElement, MediaItem } from '../types/model';

interface ProjectState {
    project: Project | null;

    // Actions
    setProject: (project: Project) => void;
    updateGlobalConfig: (config: Partial<Project['config']>) => void;

    // Screen Actions
    addScreen: (screen: Screen) => void;
    updateScreen: (screenId: string, updates: Partial<Screen>) => void;
    removeScreen: (screenId: string) => void;
    reorderScreens: (startIndex: number, endIndex: number) => void;

    // Element Actions
    addElement: (screenId: string, element: ScreenElement) => void;
    updateElement: (screenId: string, elementId: string, updates: Partial<ScreenElement>) => void;
    removeElement: (screenId: string, elementId: string) => void;

    // Media Actions
    addMediaItem: (item: MediaItem) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    project: null,

    setProject: (project) => set({ project }),

    addMediaItem: (item) =>
        set((state) => (state.project ? {
            project: {
                ...state.project,
                mediaLibrary: { ...state.project.mediaLibrary, [item.id]: item },
                updatedAt: Date.now()
            }
        } : {})),

    updateGlobalConfig: (config) =>
        set((state) => (state.project ? {
            project: {
                ...state.project,
                config: { ...state.project.config, ...config },
                updatedAt: Date.now(),
            }
        } : {})),

    addScreen: (screen) =>
        set((state) => (state.project ? {
            project: {
                ...state.project,
                screens: [...state.project.screens, screen],
                updatedAt: Date.now(),
            }
        } : {})),

    updateScreen: (screenId, updates) =>
        set((state) => (state.project ? {
            project: {
                ...state.project,
                screens: state.project.screens.map((s) =>
                    s.id === screenId ? { ...s, ...updates } : s
                ),
                updatedAt: Date.now(),
            }
        } : {})),

    removeScreen: (screenId) =>
        set((state) => (state.project ? {
            project: {
                ...state.project,
                screens: state.project.screens.filter((s) => s.id !== screenId),
                updatedAt: Date.now(),
            }
        } : {})),

    reorderScreens: (startIndex, endIndex) =>
        set((state) => {
            if (!state.project) return {};
            const newScreens = Array.from(state.project.screens);
            const [reorderedItem] = newScreens.splice(startIndex, 1);
            newScreens.splice(endIndex, 0, reorderedItem);
            return {
                project: {
                    ...state.project,
                    screens: newScreens,
                    updatedAt: Date.now(),
                },
            };
        }),

    addElement: (screenId, element) =>
        set((state) => {
            if (!state.project) return {};
            return {
                project: {
                    ...state.project,
                    screens: state.project.screens.map((s) =>
                        s.id === screenId
                            ? { ...s, elements: [...s.elements, element] }
                            : s
                    ),
                    updatedAt: Date.now(),
                },
            };
        }),

    updateElement: (screenId, elementId, updates) =>
        set((state) => {
            if (!state.project) return {};
            return {
                project: {
                    ...state.project,
                    screens: state.project.screens.map((s) =>
                        s.id === screenId
                            ? {
                                ...s,
                                elements: s.elements.map((el) =>
                                    el.id === elementId ? { ...el, ...updates } : el
                                ),
                            }
                            : s
                    ),
                    updatedAt: Date.now(),
                },
            };
        }),

    removeElement: (screenId, elementId) =>
        set((state) => {
            if (!state.project) return {};
            return {
                project: {
                    ...state.project,
                    screens: state.project.screens.map((s) =>
                        s.id === screenId
                            ? {
                                ...s,
                                elements: s.elements.filter((el) => el.id !== elementId),
                            }
                            : s
                    ),
                    updatedAt: Date.now(),
                },
            };
        }),
}));
