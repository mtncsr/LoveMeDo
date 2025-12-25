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
}

export const Renderer: React.FC<Props> = ({
    project,
    mode,
    activeScreenId: propScreenId,
    onElementSelect,
    onElementUpdate,
    className
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
    const activeScreen = project.screens.find(s => s.id === activeId);

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

    const handleElementClick = (elementId: string) => {
        if (mode === 'editor') {
            onElementSelect?.(elementId);
        } else {
            // Preview/Export interactions
            const el = activeScreen?.elements.find(e => e.id === elementId);
            if (el?.type === 'gallery' || el?.type === 'image') {
                let images: string[] = [];
                if (el.type === 'gallery') {
                    try {
                        images = JSON.parse(el.content);
                        if (!Array.isArray(images)) images = [el.content];
                    } catch {
                        images = [el.content];
                    }
                } else {
                    images = [el.content];
                }
                
                if (images.length > 0) {
                    setLightboxImages(images);
                    setLightboxIndex(0);
                    setLightboxSrc(images[0]);
                }
            }
        }
    };

    if (!activeScreen) return <div className={styles.error}>No Screen Found</div>;

    return (
        <div className={`${styles.rendererContainer} ${className || ''}`}>
            <ScreenRenderer
                screen={activeScreen}
                mode={mode}
                isActive={true}
                onNavigate={handleNavigate}
                onElementClick={handleElementClick}
                onElementUpdate={onElementUpdate}
                allScreens={project.screens}
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
                        {/* Always ensure navigation screen (last screen) is accessible */}
                        {project.screens.length > 0 && (() => {
                            const lastScreen = project.screens[project.screens.length - 1];
                            // If last screen is navigation and not already in list (shouldn't happen, but ensure it's there)
                            if (lastScreen.type === 'navigation') {
                                const isAlreadyListed = project.screens.some(s => s.id === lastScreen.id);
                                if (!isAlreadyListed) {
                                    return (
                                        <div
                                            key={`nav-${lastScreen.id}`}
                                            className={styles.menuItem}
                                            onClick={() => handleNavigate(lastScreen.id)}
                                            style={{ fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.3)', marginTop: '8px', paddingTop: '16px' }}
                                        >
                                            <span className={styles.menuIndex}>★</span>
                                            {lastScreen.title}
                                        </div>
                                    );
                                }
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
