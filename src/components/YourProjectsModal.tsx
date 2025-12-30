import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { getSavedProjects, deleteSavedProject, renameProject, type SavedProject } from '../utils/projectStorage';
import { X, Trash2, FolderOpen, Calendar, Edit2, Check, X as XIcon } from 'lucide-react';
import styles from './YourProjectsModal.module.css';

export const YourProjectsModal: React.FC = () => {
    const setYourProjectsOpen = useUIStore(state => state.setYourProjectsOpen);
    const setMode = useUIStore(state => state.setMode);
    const setProject = useProjectStore(state => state.setProject);
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editName, setEditName] = useState<string>('');

    useEffect(() => {
        // Load saved projects when modal opens
        setSavedProjects(getSavedProjects());
    }, []);

    const handleLoadProject = (savedProject: SavedProject) => {
        setProject(savedProject.project);
        setMode('editor');
        setYourProjectsOpen(false);
    };

    const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation(); // Prevent triggering load
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteSavedProject(projectId);
            setSavedProjects(getSavedProjects());
        }
    };

    const handleStartRename = (e: React.MouseEvent, project: SavedProject) => {
        e.stopPropagation(); // Prevent triggering load
        setEditingProjectId(project.id);
        setEditName(project.name);
    };

    const handleCancelRename = () => {
        setEditingProjectId(null);
        setEditName('');
    };

    const handleSaveRename = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation(); // Prevent triggering load
        if (editName.trim()) {
            try {
                renameProject(projectId, editName.trim());
                setSavedProjects(getSavedProjects());
                setEditingProjectId(null);
                setEditName('');
            } catch (error) {
                console.error('Failed to rename project:', error);
                alert('Failed to rename project. Please try again.');
            }
        } else {
            handleCancelRename();
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.overlay} onClick={() => setYourProjectsOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Your Projects</h2>
                    <button className={styles.closeBtn} onClick={() => setYourProjectsOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {savedProjects.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FolderOpen size={64} className={styles.emptyIcon} />
                            <h3>No saved projects yet</h3>
                            <p>Save your projects from the editor to continue working on them later.</p>
                        </div>
                    ) : (
                        <div className={styles.projectsGrid}>
                            {savedProjects.map((savedProject) => (
                                <div
                                    key={savedProject.id}
                                    className={styles.projectCard}
                                    onClick={() => !editingProjectId && handleLoadProject(savedProject)}
                                >
                                    <div className={styles.cardHeader}>
                                        {editingProjectId === savedProject.id ? (
                                            <div className={styles.renameInputContainer}>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSaveRename(e, savedProject.id);
                                                        } else if (e.key === 'Escape') {
                                                            handleCancelRename();
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={styles.renameInput}
                                                    autoFocus
                                                />
                                                <button
                                                    className={styles.renameSaveBtn}
                                                    onClick={(e) => handleSaveRename(e, savedProject.id)}
                                                    title="Save"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    className={styles.renameCancelBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelRename();
                                                    }}
                                                    title="Cancel"
                                                >
                                                    <XIcon size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className={styles.projectName}>{savedProject.name}</h3>
                                                <div className={styles.cardActions}>
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={(e) => handleStartRename(e, savedProject)}
                                                        title="Rename project"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={(e) => handleDeleteProject(e, savedProject.id)}
                                                        title="Delete project"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Screens:</span>
                                            <span className={styles.infoValue}>{savedProject.project.screens.length}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <Calendar size={14} />
                                            <span className={styles.infoValue}>
                                                {formatDate(savedProject.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <button className={styles.loadBtn}>
                                            <FolderOpen size={16} />
                                            <span>Continue Editing</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

