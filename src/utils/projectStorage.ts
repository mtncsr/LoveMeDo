import type { Project } from '../types/model';

const STORAGE_KEY = 'lovemedo_projects';

export interface SavedProject {
    id: string;
    name: string;
    project: Project;
    savedAt: number;
    updatedAt: number;
}

/**
 * Get all saved projects from localStorage
 */
export function getSavedProjects(): SavedProject[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const projects = JSON.parse(stored);
        return Array.isArray(projects) ? projects : [];
    } catch (error) {
        console.error('Error loading saved projects:', error);
        return [];
    }
}

/**
 * Save a project to localStorage
 */
export function saveProject(project: Project, name?: string): void {
    try {
        const savedProjects = getSavedProjects();
        const projectName = name || project.config.title || `Project ${new Date().toLocaleDateString()}`;
        
        // Check if project already exists (by ID)
        const existingIndex = savedProjects.findIndex(p => p.project.id === project.id);
        
        const savedProject: SavedProject = {
            id: project.id,
            name: projectName,
            project: project,
            savedAt: existingIndex >= 0 ? savedProjects[existingIndex].savedAt : Date.now(),
            updatedAt: Date.now()
        };

        if (existingIndex >= 0) {
            // Update existing project
            savedProjects[existingIndex] = savedProject;
        } else {
            // Add new project
            savedProjects.push(savedProject);
        }

        // Sort by updatedAt (most recent first)
        savedProjects.sort((a, b) => b.updatedAt - a.updatedAt);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
    } catch (error) {
        console.error('Error saving project:', error);
        throw error;
    }
}

/**
 * Delete a saved project from localStorage
 */
export function deleteSavedProject(projectId: string): void {
    try {
        const savedProjects = getSavedProjects();
        const filtered = savedProjects.filter(p => p.id !== projectId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

/**
 * Load a project from localStorage by ID
 */
export function loadProject(projectId: string): Project | null {
    try {
        const savedProjects = getSavedProjects();
        const saved = savedProjects.find(p => p.id === projectId);
        return saved ? saved.project : null;
    } catch (error) {
        console.error('Error loading project:', error);
        return null;
    }
}

/**
 * Rename a saved project
 */
export function renameProject(projectId: string, newName: string): void {
    try {
        const savedProjects = getSavedProjects();
        const projectIndex = savedProjects.findIndex(p => p.id === projectId);
        if (projectIndex >= 0) {
            savedProjects[projectIndex].name = newName;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
        }
    } catch (error) {
        console.error('Error renaming project:', error);
        throw error;
    }
}

