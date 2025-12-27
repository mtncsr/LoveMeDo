import React, { useState, useEffect, useRef } from 'react';
import type { Project } from '../types/model';
import { ScreenRenderer } from './ScreenRenderer';
import { Lightbox } from './Lightbox';
import styles from './styles.module.css';

interface Props {
    project: Project;
    mode: 'templatePreview' | 'editor' | 'export';
    activeScreenId?: string; // Controlled mode (Editor)
    onScreenChange?: (screenId: string) => void;
    onElementSelect?: (elementId: string) => void;
    onElementUpdate?: (elementId: string, changes: any) => void; // Using any for partial Element
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
    className,
    device,
    selectedElementId
}) => {
    // State for internal navigation (Preview/Export)
    const [internalActiveId, setInternalActiveId] = useState<string>(
        project.screens[0]?.id || ''
    );
    const [navHistory, setNavHistory] = useState<string[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState<number>(0);
    
    // Music playback refs
    const globalAudioRef = useRef<HTMLAudioElement | null>(null);
    const screenAudioRef = useRef<HTMLAudioElement | null>(null);

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

    // Handle global music
    useEffect(() => {
        if (mode === 'editor') return; // No music in editor
        
        if (project.config.globalMusic) {
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
                }
            }
        } else {
            // Stop global music if it exists
            if (globalAudioRef.current) {
                globalAudioRef.current.pause();
                globalAudioRef.current = null;
            }
        }
        
        return () => {
            if (globalAudioRef.current) {
                globalAudioRef.current.pause();
                globalAudioRef.current = null;
            }
        };
    }, [project.config.globalMusic, mode, project.mediaLibrary]);

    // Handle per-screen music (only if no global music)
    useEffect(() => {
        if (mode === 'editor') return; // No music in editor
        if (project.config.globalMusic) return; // No per-screen music if global exists
        
        const currentScreen = project.screens.find(s => s.id === activeId);
        if (currentScreen?.music) {
            const audioItem = project.mediaLibrary[currentScreen.music];
            if (audioItem && audioItem.type === 'audio') {
                // Stop previous screen music
                if (screenAudioRef.current) {
                    screenAudioRef.current.pause();
                    screenAudioRef.current = null;
                }
                
                // Play current screen music
                const audio = new Audio(audioItem.data);
                audio.loop = true;
                audio.volume = 0.7;
                audio.play().catch(err => console.warn('Audio play failed:', err));
                screenAudioRef.current = audio;
            }
        } else {
            // Stop screen music if screen has no music
            if (screenAudioRef.current) {
                screenAudioRef.current.pause();
                screenAudioRef.current = null;
            }
        }
        
        return () => {
            if (screenAudioRef.current) {
                screenAudioRef.current.pause();
                screenAudioRef.current = null;
            }
        };
    }, [activeId, project.screens, project.mediaLibrary, project.config.globalMusic, mode]);

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
            // Logic for 'next' screen (start experience)
            const index = project.screens.findIndex(s => s.id === activeId);
            if (index < project.screens.length - 1) {
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
        
        // Handle image clicks - open lightbox with hero + gallery images
        if (el?.type === 'image') {
            // Hero image clicked - collect hero image + all gallery images from same screen
            const allImages: string[] = [];
            let clickedImageIndex = 0;
            
            // Add the clicked hero image first
            const heroImageUrl = resolveMediaUrl(el.content);
            if (heroImageUrl && heroImageUrl.trim() !== '') {
                allImages.push(heroImageUrl);
                clickedImageIndex = 0;
            }
            
            // Then, collect all gallery images from the same screen
            activeScreen?.elements.forEach((elem) => {
                if (elem.type === 'gallery') {
                    let galleryImages: string[] = [];
                    try {
                        galleryImages = JSON.parse(elem.content);
                        if (!Array.isArray(galleryImages)) galleryImages = [elem.content];
                    } catch {
                        galleryImages = [elem.content];
                    }
                    
                    galleryImages.forEach((imgId) => {
                        const imageUrl = resolveMediaUrl(imgId);
                        if (imageUrl && imageUrl.trim() !== '') {
                            allImages.push(imageUrl);
                        }
                    });
                }
            });
            
            if (allImages.length > 0) {
                setLightboxImages(allImages);
                setLightboxIndex(clickedImageIndex);
                setLightboxSrc(allImages[clickedImageIndex]);
            }
            
            // In editor mode, still select the element for editing
            if (mode === 'editor') {
                onElementSelect?.(elementId);
            }
        } else if (el?.type === 'gallery') {
            // Gallery clicked - show gallery images only (existing behavior)
            let images: string[] = [];
            try {
                images = JSON.parse(el.content);
                if (!Array.isArray(images)) images = [el.content];
            } catch {
                images = [el.content];
            }
            
            // Resolve media IDs to URLs
            const resolvedImages = images.map(imgId => resolveMediaUrl(imgId)).filter(url => url && url.trim() !== '');
            
            if (resolvedImages.length > 0) {
                setLightboxImages(resolvedImages);
                setLightboxIndex(0);
                setLightboxSrc(resolvedImages[0]);
            }
            
            // In editor mode, still select the element for editing
            if (mode === 'editor') {
                onElementSelect?.(elementId);
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
                allScreens={project.screens}
                currentScreenIndex={project.screens.findIndex(s => s.id === activeId)}
                selectedElementId={selectedElementId}
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

            {lightboxSrc && (
                <Lightbox
                    imageSrc={lightboxSrc}
                    images={lightboxImages}
                    currentIndex={lightboxIndex}
                    onClose={() => {
                        setLightboxSrc(null);
                        setLightboxImages([]);
                        setLightboxIndex(0);
                    }}
                    onNavigate={(index) => {
                        if (index >= 0 && index < lightboxImages.length) {
                            setLightboxIndex(index);
                            setLightboxSrc(lightboxImages[index]);
                        }
                    }}
                />
            )}
        </div>
    );
};
