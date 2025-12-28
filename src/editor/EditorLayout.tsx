import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { Renderer } from '../renderer/Renderer';
import { ArrowLeft, Sparkles, Plus, Smartphone, Monitor, Minus, ZoomIn } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './EditorLayout.module.css';
import ElementsMenu from './ElementsMenu';
import MediaLibraryModal from './MediaLibraryModal';
import { ElementEditingMenu } from './ElementEditingMenu';

const EditorLayout: React.FC = () => {
    const { project, updateScreen, updateElement, addScreen } = useProjectStore();
    const {
        setMode, activeScreenId, setActiveScreenId, setSelectedElementId,
        selectedElementId, isMediaLibraryOpen, mediaLibraryMode, contentManagerContext
    } = useUIStore();
    const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('mobile');
    const [zoom, setZoom] = useState(100);
    const [isZoomExpanded, setIsZoomExpanded] = useState(false);

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

        if (elementType === 'image') {
            // Single selection for hero images - store media ID
            const mediaId = typeof mediaIdOrArray === 'string' ? mediaIdOrArray : mediaIdOrArray[0];
            if (mediaId && project.mediaLibrary[mediaId]) {
                updateElement(screenId, elementId, { content: mediaId });
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
                        <button
                            key={screen.id}
                            className={`${styles.tab} ${activeScreenId === screen.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveScreenId(screen.id)}
                        >
                            <span className={styles.tabIndex}>{index + 1}</span>
                            <span className={styles.tabTitle}>{screen.title}</span>
                        </button>
                    ))}
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
                            selectedElementId={selectedElementId || undefined}
                        />

                        {/* Element Editing Menu */}
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
                </div>
            </div>

            {/* Bottom Elements Menu */}
            <div className={styles.bottomMenu}>
                <ElementsMenu />
            </div>

            {/* Media Library Overlay */}
            {isMediaLibraryOpen && <MediaLibraryModal onSelect={handleMediaSelect} />}

        </div>
    );
};

export default EditorLayout;
