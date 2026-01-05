import React, { useEffect, useState } from 'react';
import type { Screen } from '../types/model';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { Renderer } from '../renderer/Renderer';
import { ArrowLeft, Sparkles, Plus, Smartphone, Monitor, Minus, ZoomIn, Save, Check, Trash2, Pencil, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './EditorLayout.module.css';
import ElementsMenu from './ElementsMenu';
import MediaLibraryModal from './MediaLibraryModal';
import { ElementEditingMenu } from './ElementEditingMenu';
import { YourProjectsModal } from '../components/YourProjectsModal';
import { saveProject, getSavedProjects } from '../utils/projectStorage';
import { useDevice } from '../hooks/useDevice';

const EditorLayout: React.FC = () => {
    const { project, updateScreen, updateElement, addScreen, addElement, removeScreen } = useProjectStore();
    const {
        setMode, activeScreenId, setActiveScreenId, setSelectedElementId,
        selectedElementId, isMediaLibraryOpen, mediaLibraryMode, contentManagerContext,
        isYourProjectsOpen, setYourProjectsOpen
    } = useUIStore();

    // Use device hook for accurate detection
    const { isMobile } = useDevice();
    const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>(() => isMobile ? 'mobile' : 'desktop');

    // Update view when device type changes
    useEffect(() => {
        setDeviceView(isMobile ? 'mobile' : 'desktop');
    }, [isMobile]);

    const [zoom, setZoom] = useState(100);
    const [isZoomExpanded, setIsZoomExpanded] = useState(false);
    const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
    const [editScreenTitle, setEditScreenTitle] = useState<string>('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
    const [isManageScreensMode, setManageScreensMode] = useState(false);

    // If no active screen, set to first one
    // Also validate that activeScreenId still exists in project after updates
    useEffect(() => {
        if (project && project.screens.length > 0) {
            if (!activeScreenId) {
                setActiveScreenId(project.screens[0].id);
            } else {
                // Validate that the active screen still exists
                const screenExists = project.screens.some(s => s.id === activeScreenId);
                if (!screenExists) {
                    setActiveScreenId(project.screens[0].id);
                }
            }
        }
    }, [project, activeScreenId, setActiveScreenId]);

    if (!project) return <div>No Project Loaded</div>;

    const currentScreen = project.screens.find(s => s.id === activeScreenId);

    const handleBack = () => {
        setMode('templates');
    };

    const handleCreate = () => {
        setMode('export');
    };

    const handleSaveProject = () => {
        if (!project) return;
        try {
            // Check if project is already saved
            const savedProjects = getSavedProjects();
            const isAlreadySaved = savedProjects.some(p => p.id === project.id);

            saveProject(project);

            if (isAlreadySaved) {
                // Quick save feedback
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                // First time save - open modal
                setYourProjectsOpen(true);
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            alert('Failed to save project. Please try again.');
        }
    };

    const handleStartEditScreen = (e: React.MouseEvent, screen: Screen) => {
        e.stopPropagation();
        setEditingScreenId(screen.id);
        setEditScreenTitle(screen.title);
    };

    const handleSaveScreenTitle = (screenId: string) => {
        if (editScreenTitle.trim()) {
            updateScreen(screenId, { title: editScreenTitle.trim() });
        }
        setEditingScreenId(null);
        setEditScreenTitle('');
    };

    const handleCancelEditScreen = () => {
        setEditingScreenId(null);
        setEditScreenTitle('');
    };

    const handleDeleteScreen = (screenId: string) => {
        if (project && project.screens.length <= 1) {
            alert('Cannot delete the last screen.');
            return;
        }

        removeScreen(screenId);

        // If deleted screen was active, activeScreenId useEffect will handle switching
        // But if it was the manage mode... keep manage mode on.
    };

    const handleMediaSelect = (mediaIdOrArray: string | string[]) => {
        if (!contentManagerContext) {
            // Legacy mode for backward compatibility
            if (mediaLibraryMode === 'select' && activeScreenId && selectedElementId) {
                const mediaId = typeof mediaIdOrArray === 'string' ? mediaIdOrArray : mediaIdOrArray[0];
                const mediaItem = project.mediaLibrary[mediaId];
                if (mediaItem) {
                    updateElement(activeScreenId, selectedElementId, { content: mediaItem.data });
                }
            }
            return;
        }

        const { elementId, screenId, elementType } = contentManagerContext;
        if (!screenId || !elementId) return;

        if (elementType === 'image' || elementType === 'video') {
            // Single selection for hero images and videos - store media ID
            const mediaId = typeof mediaIdOrArray === 'string' ? mediaIdOrArray : mediaIdOrArray[0];
            if (mediaId && project.mediaLibrary[mediaId]) {
                updateElement(screenId, elementId, { content: mediaId });
            } else {
                // Clear assignment when none selected
                updateElement(screenId, elementId, { content: '' });
            }
        } else if (elementType === 'gallery') {
            // Multiple selection for galleries - store as JSON array of media IDs
            const mediaIds = Array.isArray(mediaIdOrArray) ? mediaIdOrArray : [mediaIdOrArray];
            // Filter to only include valid media IDs from mediaLibrary
            const validMediaIds = mediaIds.filter(id => project.mediaLibrary[id]);
            if (validMediaIds.length > 0) {
                updateElement(screenId, elementId, { content: JSON.stringify(validMediaIds) });
            } else {
                // If no valid selections, clear the gallery
                updateElement(screenId, elementId, { content: JSON.stringify([]) });
            }
        }
    };

    return (
        <div className={styles.editorContainer}>
            {/* Top Bar */}
            <header className={styles.topBar}>
                <div className={styles.left}>
                    <button className={styles.iconBtn} onClick={handleBack}>
                        <ArrowLeft size={20} />
                    </button>
                </div>
                <div className={styles.center}>
                    <input
                        className={styles.screenTitleInput}
                        value={currentScreen?.title || ''}
                        onChange={(e) => activeScreenId && updateScreen(activeScreenId, { title: e.target.value })}
                        placeholder="Screen Title"
                    />
                </div>
                <div className={styles.right}>
                    <button
                        className={`${styles.saveBtn} ${saveStatus === 'saved' ? styles.saved : ''}`}
                        onClick={handleSaveProject}
                        disabled={saveStatus === 'saved'}
                    >
                        {saveStatus === 'saved' ? <Check size={18} /> : <Save size={18} />}
                        <span>{saveStatus === 'saved' ? 'Saved!' : 'Save Project'}</span>
                    </button>
                    <button className={styles.createBtn} onClick={handleCreate}>
                        <Sparkles size={18} />
                        <span>CREATE</span>
                    </button>
                </div>
            </header>

            {/* Screen Tabs */}
            <div className={styles.tabsContainer}>
                <div className={styles.tabsList}>
                    {project.screens.map((screen, index) => (
                        <div
                            key={screen.id}
                            className={`${styles.tab} ${activeScreenId === screen.id ? styles.activeTab : ''}`}
                            onClick={() => !editingScreenId && !isManageScreensMode && setActiveScreenId(screen.id)}
                            style={{ paddingRight: isManageScreensMode ? '4px' : '12px' }}
                        >
                            <span className={styles.tabIndex}>{index + 1}</span>
                            {editingScreenId === screen.id ? (
                                <input
                                    type="text"
                                    value={editScreenTitle}
                                    onChange={(e) => setEditScreenTitle(e.target.value)}
                                    onBlur={() => handleSaveScreenTitle(screen.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveScreenTitle(screen.id);
                                        } else if (e.key === 'Escape') {
                                            handleCancelEditScreen();
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={styles.tabTitleInput}
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className={styles.tabTitle}
                                    onDoubleClick={(e) => handleStartEditScreen(e, screen)}
                                    title={isManageScreensMode ? "Manage screen" : "Double-click to rename"}
                                >
                                    {screen.title}
                                </span>
                            )}

                            {/* Manage Mode Controls */}
                            {isManageScreensMode && (
                                <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                                    <button
                                        onClick={(e) => handleStartEditScreen(e, screen)}
                                        className={styles.iconBtn}
                                        style={{ width: '24px', height: '24px', padding: '4px' }}
                                        title="Rename"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to delete this screen?')) {
                                                handleDeleteScreen(screen.id);
                                            }
                                        }}
                                        className={styles.iconBtn}
                                        style={{ width: '24px', height: '24px', padding: '4px', color: '#ef233c' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {!isManageScreensMode && (
                        <button
                            className={styles.addScreenBtn}
                            onClick={() => {
                                const type = prompt('Screen type (overlay/content/navigation):', 'content') as 'overlay' | 'content' | 'navigation' | null;
                                if (type && ['overlay', 'content', 'navigation'].includes(type)) {
                                    const newScreen = {
                                        id: uuidv4(),
                                        title: `Screen ${project.screens.length + 1}`,
                                        type: type as 'overlay' | 'content' | 'navigation',
                                        background: {
                                            type: 'solid' as const,
                                            value: '#FFFFFF',
                                            animation: 'fade' as const
                                        },
                                        elements: []
                                    };
                                    addScreen(newScreen);
                                    setActiveScreenId(newScreen.id);
                                }
                            }}
                            title="Add Screen"
                        >
                            <Plus size={16} />
                        </button>
                    )}

                    <button
                        className={styles.iconBtn}
                        onClick={() => setManageScreensMode(!isManageScreensMode)}
                        title={isManageScreensMode ? "Done Editing" : "Manage Screens"}
                        style={{
                            marginLeft: '8px',
                            backgroundColor: isManageScreensMode ? '#e9ecef' : 'transparent',
                            color: isManageScreensMode ? 'var(--color-primary)' : 'var(--color-text-subtle)'
                        }}
                    >
                        {isManageScreensMode ? <Check size={16} /> : <Settings size={16} />}
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className={styles.workspace}>
                {/* Floating Device Toggle - Top Side */}
                <button
                    className={styles.floatingDeviceToggle}
                    onClick={() => setDeviceView(deviceView === 'mobile' ? 'desktop' : 'mobile')}
                    title={deviceView === 'mobile' ? 'Switch to Desktop' : 'Switch to Mobile'}
                >
                    {deviceView === 'mobile' ? <Smartphone size={18} /> : <Monitor size={18} />}
                </button>

                {/* Floating Zoom Control - Bottom Side */}
                <div
                    className={`${styles.zoomControl} ${isZoomExpanded ? styles.expanded : ''}`}
                    onMouseEnter={() => setIsZoomExpanded(true)}
                    onMouseLeave={() => setIsZoomExpanded(false)}
                >
                    <button
                        className={styles.zoomIconBtn}
                        onClick={() => setIsZoomExpanded(!isZoomExpanded)}
                        title="Zoom"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button
                        className={styles.zoomBtn}
                        onClick={() => setZoom(Math.max(25, zoom - 10))}
                        title="Zoom Out"
                    >
                        <Minus size={16} />
                    </button>
                    <input
                        type="range"
                        min="25"
                        max="200"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className={styles.zoomSlider}
                    />
                    <button
                        className={styles.zoomBtn}
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                        title="Zoom In"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div
                    className={styles.canvasContainer}
                    onClick={(e) => {
                        // Deselect if clicking directly on canvas container (gray area)
                        if (e.target === e.currentTarget) {
                            if (selectedElementId) {
                                setSelectedElementId(null);
                            }
                            return;
                        }

                        // Also check if clicking on canvas wrapper background (not on element or menu)
                        const target = e.target as HTMLElement;
                        const isElement = target.closest('[data-element-id]');
                        const isMenu = target.closest('[data-editing-menu]');
                        const isCanvasWrapper = target.closest(`.${styles.canvasWrapper}`);

                        // If clicking on canvas wrapper background (not element/menu), deselect
                        if (isCanvasWrapper && !isElement && !isMenu && selectedElementId) {
                            setSelectedElementId(null);
                        }
                    }}
                >
                    <div
                        className={styles.canvasWrapper}
                        data-device={deviceView}
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', position: 'relative' }}
                        onClick={(e) => {
                            // Deselect if clicking on canvas wrapper (not on element or menu)
                            const target = e.target as HTMLElement;
                            const isElement = target.closest('[data-element-id]');
                            const isMenu = target.closest('[data-editing-menu]');

                            if (!isElement && !isMenu && selectedElementId) {
                                setSelectedElementId(null);
                            }
                        }}
                    >
                        <Renderer
                            project={project}
                            mode="editor"
                            activeScreenId={activeScreenId || undefined}
                            className={styles.editorRenderer}
                            device={deviceView}
                            onElementSelect={(id) => setSelectedElementId(id || null)}
                            onElementUpdate={(id, changes) => activeScreenId && updateElement(activeScreenId, id, changes)}
                            onAddElement={(element, callback) => {
                                if (activeScreenId) {
                                    console.log('Adding element:', element.id, 'to screen:', activeScreenId);
                                    addElement(activeScreenId, element);
                                    // Directly set the selected element ID after adding
                                    // This ensures the design menu opens immediately
                                    setTimeout(() => {
                                        console.log('Setting selectedElementId to:', element.id);
                                        setSelectedElementId(element.id);
                                        // Also call the callback if provided
                                        if (callback) {
                                            callback(element.id);
                                        }
                                    }, 50);
                                }
                            }}
                            selectedElementId={selectedElementId || undefined}
                        />

                    </div>
                </div>

            </div>

            {/* Design Menu (Element Editing) - Fixed Bottom Bar */}
            <div className={styles.designMenuContainer}>
                {selectedElementId && activeScreenId && (() => {
                    const currentScreen = project.screens.find(s => s.id === activeScreenId);
                    const selectedElement = currentScreen?.elements.find(e => e.id === selectedElementId);
                    if (selectedElement) {
                        return (
                            <ElementEditingMenu
                                element={selectedElement}
                            />
                        );
                    }
                    return null;
                })()}
            </div>

            {/* Bottom Elements Menu */}
            <div className={styles.bottomMenu}>
                <ElementsMenu />
            </div>

            {/* Media Library Overlay */}
            {isMediaLibraryOpen && <MediaLibraryModal onSelect={handleMediaSelect} />}

            {/* Your Projects Modal */}
            {isYourProjectsOpen && <YourProjectsModal />}

        </div>
    );
};

export default EditorLayout;
