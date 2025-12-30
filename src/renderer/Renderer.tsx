import React, { useState, useEffect, useRef } from 'react';
import type { Project } from '../types/model';
import { ScreenRenderer } from './ScreenRenderer';
import { Lightbox } from './Lightbox';
import { useUIStore } from '../store/uiStore';
import styles from './styles.module.css';

interface Props {
    project: Project;
    mode: 'templatePreview' | 'editor' | 'export';
    activeScreenId?: string; // Controlled mode (Editor)
    onScreenChange?: (screenId: string) => void;
    onElementSelect?: (elementId: string) => void;
    onElementUpdate?: (elementId: string, changes: any) => void; // Using any for partial Element
    onAddElement?: (element: import('../types/model').ScreenElement, callback?: (elementId: string) => void) => void; // For creating elements in editor mode, with optional callback
    className?: string;
    device?: 'mobile' | 'desktop'; // For template preview mode
    selectedElementId?: string; // Selected element ID for editor mode
}

export const Renderer: React.FC<Props> = ({
    project,
    mode,
    activeScreenId: propScreenId,
    onElementSelect,
    onElementUpdate,
    onAddElement,
    className,
    device,
    selectedElementId
}) => {
    const { setMediaLibraryOpen } = useUIStore();
    
    // State for internal navigation (Preview/Export)
    const [internalActiveId, setInternalActiveId] = useState<string>(
        project.screens[0]?.id || ''
    );
    const [navHistory, setNavHistory] = useState<string[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [lightboxItems, setLightboxItems] = useState<{ type: 'image' | 'text', content: string }[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState<number>(0);

    // Music playback refs
    const globalAudioRef = useRef<HTMLAudioElement | null>(null);
    const screenAudioRef = useRef<HTMLAudioElement | null>(null);
    const [shouldPlayGlobalMusic, setShouldPlayGlobalMusic] = useState(false);
    const [isGlobalMusicPausedForVideo, setIsGlobalMusicPausedForVideo] = useState(false);
    const videoRefsRef = useRef<Set<HTMLVideoElement>>(new Set());

    // Determine which screen to show
    const activeId = mode === 'editor' && propScreenId ? propScreenId : internalActiveId;
    let activeScreen = project.screens.find(s => s.id === activeId);

    // Fallback: if active screen not found, use first screen (safety check)
    if (!activeScreen && project.screens.length > 0) {
        activeScreen = project.screens[0];
        // Sync the internal state if in preview mode
        if (mode !== 'editor' && internalActiveId !== activeScreen.id) {
            setInternalActiveId(activeScreen.id);
        }
    }

    // Sync internal state if prop changes in editor (though usually unused)
    useEffect(() => {
        if (propScreenId && mode === 'editor') {
            setInternalActiveId(propScreenId);
        }
    }, [propScreenId, mode]);

    // Handle global music - only play when shouldPlayGlobalMusic is true and not paused for video
    useEffect(() => {
        if (mode === 'editor') return; // No music in editor

        if (project.config.globalMusic && shouldPlayGlobalMusic && !isGlobalMusicPausedForVideo) {
            const audioItem = project.mediaLibrary[project.config.globalMusic];
            if (audioItem && audioItem.type === 'audio') {
                // Stop any screen music
                if (screenAudioRef.current) {
                    screenAudioRef.current.pause();
                    screenAudioRef.current = null;
                }

                // Play global music
                if (!globalAudioRef.current || globalAudioRef.current.src !== audioItem.data) {
                    if (globalAudioRef.current) {
                        globalAudioRef.current.pause();
                    }
                    const audio = new Audio(audioItem.data);
                    audio.loop = true;
                    audio.volume = 0.7;
                    audio.play().catch(err => console.warn('Audio play failed:', err));
                    globalAudioRef.current = audio;
                } else if (globalAudioRef.current.paused) {
                    // Resume if paused
                    globalAudioRef.current.play().catch(err => console.warn('Audio play failed:', err));
                }
            }
        } else {
            // Pause global music if should not play or paused for video
            if (globalAudioRef.current && (!shouldPlayGlobalMusic || isGlobalMusicPausedForVideo)) {
                globalAudioRef.current.pause();
            }
        }

        return () => {
            // Don't cleanup on unmount - let cleanup happen in the main cleanup effect
        };
    }, [project.config.globalMusic, mode, project.mediaLibrary, shouldPlayGlobalMusic, isGlobalMusicPausedForVideo]);

    // Cleanup global music when config changes or component unmounts
    useEffect(() => {
        if (!project.config.globalMusic) {
            if (globalAudioRef.current) {
                globalAudioRef.current.pause();
                globalAudioRef.current = null;
            }
            setShouldPlayGlobalMusic(false);
        }
    }, [project.config.globalMusic]);

    // Handle per-screen music (only if no global music)
    useEffect(() => {
        if (mode === 'editor') return; // No music in editor
        if (project.config.globalMusic) {
            // Stop screen music if global music exists
            if (screenAudioRef.current) {
                screenAudioRef.current.pause();
                screenAudioRef.current = null;
            }
            return;
        }

        const currentScreen = project.screens.find(s => s.id === activeId);
        
        // Stop previous screen music immediately
        if (screenAudioRef.current) {
            screenAudioRef.current.pause();
            screenAudioRef.current = null;
        }

        // Play current screen music immediately if it exists
        if (currentScreen?.music) {
            const audioItem = project.mediaLibrary[currentScreen.music];
            if (audioItem && audioItem.type === 'audio') {
                const audio = new Audio(audioItem.data);
                audio.loop = true;
                audio.volume = 0.7;
                audio.play().catch(err => console.warn('Audio play failed:', err));
                screenAudioRef.current = audio;
            }
        }

        return () => {
            // Cleanup on screen change - stop music immediately
            if (screenAudioRef.current) {
                screenAudioRef.current.pause();
                screenAudioRef.current = null;
            }
        };
    }, [activeId, project.screens, project.mediaLibrary, project.config.globalMusic, mode]);

    // Video playback detection - pause/resume global music
    useEffect(() => {
        if (mode === 'editor') return;

        const handleVideoPlay = () => {
            if (globalAudioRef.current && !globalAudioRef.current.paused && shouldPlayGlobalMusic) {
                globalAudioRef.current.pause();
                setIsGlobalMusicPausedForVideo(true);
            }
        };

        const checkAndResumeMusic = () => {
            // Check if any video is still playing
            let anyVideoPlaying = false;
            videoRefsRef.current.forEach(video => {
                if (!video.paused && !video.ended) {
                    anyVideoPlaying = true;
                }
            });

            if (!anyVideoPlaying && isGlobalMusicPausedForVideo && shouldPlayGlobalMusic) {
                setIsGlobalMusicPausedForVideo(false);
            }
        };

        const handleVideoPause = () => {
            checkAndResumeMusic();
        };

        const handleVideoEnd = () => {
            checkAndResumeMusic();
        };

        // Add event listeners to all videos
        const videos = Array.from(videoRefsRef.current);
        videos.forEach(video => {
            video.addEventListener('play', handleVideoPlay);
            video.addEventListener('pause', handleVideoPause);
            video.addEventListener('ended', handleVideoEnd);
        });

        // Also check on mount/update in case videos are already playing
        checkAndResumeMusic();

        return () => {
            videos.forEach(video => {
                video.removeEventListener('play', handleVideoPlay);
                video.removeEventListener('pause', handleVideoPause);
                video.removeEventListener('ended', handleVideoEnd);
            });
        };
    }, [mode, isGlobalMusicPausedForVideo, shouldPlayGlobalMusic, activeId]);

    // Clear video refs when screen changes
    useEffect(() => {
        videoRefsRef.current.clear();
    }, [activeId]);

    const handleNavigate = (target: string) => {
        if (mode === 'editor') return;

        if (target === 'back') {
            if (navHistory.length > 0) {
                const prev = navHistory[navHistory.length - 1];
                setNavHistory(prevHistory => prevHistory.slice(0, -1));
                setInternalActiveId(prev);
            } else {
                const index = project.screens.findIndex(s => s.id === activeId);
                if (index > 0) {
                    setInternalActiveId(project.screens[index - 1].id);
                }
            }
        } else if (target === 'menu') {
            setIsMenuOpen(true);
        } else if (target === 'nav-screen') {
            // Navigate directly to navigation screen (last screen)
            const navScreen = project.screens[project.screens.length - 1];
            if (navScreen && navScreen.type === 'navigation') {
                setNavHistory(prev => [...prev, activeId]);
                setInternalActiveId(navScreen.id);
                setIsMenuOpen(false);
            }
        } else if (target === 'next') {
            // Logic for 'next' screen (start experience) - trigger global music
            const index = project.screens.findIndex(s => s.id === activeId);
            if (index < project.screens.length - 1) {
                // Start global music when navigating from overlay screen (start button pressed)
                const currentScreen = project.screens[index];
                if (currentScreen.type === 'overlay' && project.config.globalMusic) {
                    setShouldPlayGlobalMusic(true);
                }
                setInternalActiveId(project.screens[index + 1].id);
            }
        } else {
            // Go to specific screen
            setNavHistory(prev => [...prev, activeId]);
            setInternalActiveId(target);
            setIsMenuOpen(false);
        }
    };

    // Helper to resolve media ID to actual URL/data URL
    const resolveMediaUrl = (content: string): string => {
        if (project.mediaLibrary[content]) {
            return project.mediaLibrary[content].data;
        }
        return content; // Already a URL
    };

    const handleElementClick = (elementId: string) => {
        const el = activeScreen?.elements.find(e => e.id === elementId);
        console.log('handleElementClick called with elementId:', elementId, 'element found:', !!el, 'mode:', mode);

        // In editor mode, just select the element (content manager opens via Contents button in menu)
        if (mode === 'editor') {
            console.log('Calling onElementSelect with:', elementId);
            onElementSelect?.(elementId);
            return;
        }

        // Handle lightbox interactions (Images, Galleries, Long Text) for preview/export modes
        // Check if element is media or long text
        const isClickable = el?.type === 'image' ||
            el?.type === 'gallery' ||
            el?.type === 'long-text';

        if (isClickable) {
            // Collect all displayable items from the screen
            const allItems: { type: 'image' | 'text', content: string, id: string }[] = [];

            activeScreen?.elements.forEach((elem) => {
                if (elem.type === 'image') {
                    const heroImageUrl = resolveMediaUrl(elem.content);
                    if (heroImageUrl && heroImageUrl.trim() !== '') {
                        allItems.push({ type: 'image', content: heroImageUrl, id: elem.id });
                    }
                } else if (elem.type === 'gallery') {
                    let galleryImages: string[] = [];
                    try {
                        galleryImages = JSON.parse(elem.content);
                        if (!Array.isArray(galleryImages)) galleryImages = [elem.content];
                    } catch {
                        galleryImages = [elem.content];
                    }

                    galleryImages.forEach((imgId, imgIndex) => {
                        const imageUrl = resolveMediaUrl(imgId);
                        if (imageUrl && imageUrl.trim() !== '') {
                            // Add images as belonging to this gallery ID but they are individual items in lightbox
                            // Store gallery element ID and image index for proper starting position
                            allItems.push({ 
                                type: 'image', 
                                content: imageUrl, 
                                id: `${elem.id}_${imgIndex}` // Include index to identify specific image
                            });
                        }
                    });
                } else if (elem.type === 'long-text') {
                    allItems.push({ type: 'text', content: elem.content, id: elem.id });
                }
            });

            // Find starting index
            let startIndex = 0;

            // If clicked explicit element, find it in the list
            if (el?.type === 'image' || el?.type === 'long-text') {
                // Determine index by matching ID
                // Note: duplicates (like multiple images from same gallery ID) need care, 
                // but direct "image" or "long-text" usually maps 1:1
                const index = allItems.findIndex(item => item.id === el.id);
                if (index !== -1) startIndex = index;
            } else if (el?.type === 'gallery') {
                // If clicked a gallery, check if we have a specific image index from the click
                // (stored temporarily when main image is clicked)
                const clickedImageIndex = (el as any).__currentImageIndex;
                if (clickedImageIndex !== undefined) {
                    // Find the specific image by gallery ID and index
                    const index = allItems.findIndex(item => item.id === `${el.id}_${clickedImageIndex}`);
                    if (index !== -1) {
                        startIndex = index;
                    } else {
                        // Fallback to first image of gallery
                        const index = allItems.findIndex(item => item.id.startsWith(el.id + '_'));
                        if (index !== -1) startIndex = index;
                    }
                    // Clean up the temporary property
                    delete (el as any).__currentImageIndex;
                } else {
                    // Default: start at first image of gallery (when clicking gallery container, not main image)
                    const index = allItems.findIndex(item => item.id.startsWith(el.id + '_'));
                    if (index !== -1) startIndex = index;
                }
            }

            if (allItems.length > 0) {
                setLightboxItems(allItems);
                setLightboxIndex(startIndex);
            }
        } else if (mode === 'editor') {
            // For non-image elements in editor, just select
            onElementSelect?.(elementId);
        } else {
            // Other interactions in preview/export mode
            if (el?.type === 'button' && el.metadata?.action === 'navigate') {
                // Button navigation handled elsewhere
            }
        }
    };

    if (!activeScreen) return <div className={styles.error}>No Screen Found</div>;

    return (
        <div
            className={`${styles.rendererContainer} ${className || ''}`}
            data-mode={mode}
            data-device={device}
        >
            <ScreenRenderer
                screen={activeScreen}
                mode={mode}
                isActive={true}
                onNavigate={handleNavigate}
                onElementClick={handleElementClick}
                onElementUpdate={onElementUpdate}
                onAddElement={onAddElement}
                allScreens={project.screens}
                currentScreenIndex={project.screens.findIndex(s => s.id === activeId)}
                selectedElementId={selectedElementId}
                device={device}
                project={project}
                onVideoRef={(videoRef) => {
                    if (videoRef) {
                        videoRefsRef.current.add(videoRef);
                    }
                }}
                onVideoUnref={(videoRef) => {
                    if (videoRef) {
                        videoRefsRef.current.delete(videoRef);
                    }
                }}
                key={activeScreen.id}
            />

            {/* Navigation Overlay (Menu) */}
            {isMenuOpen && (
                <div className={styles.menuOverlay}>
                    <div className={styles.menuClose} onClick={() => setIsMenuOpen(false)}>×</div>
                    <div className={styles.menuList}>
                        {project.screens.map((screen, index) => (
                            <div
                                key={screen.id}
                                className={styles.menuItem}
                                onClick={() => handleNavigate(screen.id)}
                            >
                                <span className={styles.menuIndex}>{index + 1}</span>
                                {screen.title}
                            </div>
                        ))}
                        {/* Always show navigation screen (last screen) prominently */}
                        {project.screens.length > 0 && (() => {
                            const lastScreen = project.screens[project.screens.length - 1];
                            if (lastScreen.type === 'navigation') {
                                return (
                                    <div
                                        key={`nav-${lastScreen.id}`}
                                        className={styles.menuItem}
                                        onClick={() => handleNavigate('nav-screen')}
                                        style={{ fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.3)', marginTop: '8px', paddingTop: '16px' }}
                                    >
                                        <span className={styles.menuIndex}>★</span>
                                        {lastScreen.title}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            )}

            {lightboxItems.length > 0 && (
                <Lightbox
                    items={lightboxItems}
                    currentIndex={lightboxIndex}
                    onClose={() => {
                        setLightboxItems([]);
                        setLightboxIndex(0);
                    }}
                    onNavigate={(index) => {
                        if (index >= 0 && index < lightboxItems.length) {
                            setLightboxIndex(index);
                        }
                    }}
                />
            )}
        </div>
    );
};
