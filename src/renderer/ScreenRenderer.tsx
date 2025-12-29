import React, { useMemo } from 'react';
import type { Screen, ScreenElement, Project } from '../types/model';
import { ElementRenderer } from './ElementRenderer';
import { ArrowLeft, Menu } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './styles.module.css';
import { calculateLayout } from '../templates/registry';
import { OverlayManager } from './Overlays';

interface Props {
    screen: Screen;
    mode: 'templatePreview' | 'editor' | 'export';
    isActive: boolean;
    onNavigate: (target: string) => void;
    onElementClick?: (elementId: string) => void;
    onElementUpdate?: (elementId: string, changes: Partial<ScreenElement>) => void;
    onAddElement?: (element: ScreenElement, callback?: (elementId: string) => void) => void; // For creating elements in editor mode, with optional callback
    allScreens?: Screen[]; // For navigation grid
    currentScreenIndex?: number; // For next button
    selectedElementId?: string; // Selected element ID for editor mode
    device?: 'mobile' | 'desktop'; // Device type for responsive layout
    project?: Project; // Project for media resolution
}

export const ScreenRenderer: React.FC<Props> = ({ screen, mode, isActive, onNavigate, onElementClick, onElementUpdate, onAddElement, allScreens = [], currentScreenIndex, selectedElementId, device = 'mobile', project }) => {
    if (!isActive) return null;

    const { background, elements, type, title } = screen;

    // Recalculate layout for content screens based on device
    // This ensures responsive behavior (mobile vs desktop)
    const processedElements = useMemo(() => {
        if (type === 'content') {
            const result = calculateLayout(elements, device);
            return result;
        }
        return elements;
    }, [elements, type, device]);

    // Sort elements by zIndex (background is always 0)
    const sortedElements = [...processedElements].sort((a, b) => {
        const aZ = a.styles?.zIndex || 10;
        const bZ = b.styles?.zIndex || 10;
        return aZ - bZ;
    });

    // Check if there's a next screen (including navigation screen)
    const hasNextScreen = currentScreenIndex !== undefined &&
        allScreens.length > 0 &&
        currentScreenIndex < allScreens.length - 1;

    // Check if screen has any button elements with navigation to 'next' (excluding hidden ones)
    const hasNavigationButtons = sortedElements.some(
        el => el.type === 'button' && 
        el.metadata?.action === 'navigate' && 
        el.metadata?.target === 'next' &&
        !el.metadata?.hidden
    );
    
    // Find the navigation button element for styling (including hidden ones used for automatic next button)
    const navButtonElement = sortedElements.find(
        el => el.type === 'button' && 
        el.metadata?.action === 'navigate' && 
        el.metadata?.target === 'next'
    );

    // Render Background
    const renderBackground = () => {
        const style: React.CSSProperties = {
            backgroundColor: background.type === 'solid' ? background.value : undefined,
            backgroundImage: background.type === 'gradient' ? background.value : undefined,
        };

        return (
            <div className={styles.background} style={style}>
                {background.type === 'image' && <img src={background.value} alt="bg" loading="eager" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {background.overlay && background.overlay !== 'none' && (
                    <div className={styles.backgroundOverlay}>
                        {background.overlay === 'confetti' ? '🎉' :
                            background.overlay === 'hearts' ? '❤️' :
                                background.overlay === 'stars' ? '⭐' :
                                    background.overlay === 'fireworks' ? '🎆' :
                                        background.overlay === 'bubbles' ? '🫧' :
                                            background.overlay}
                    </div>
                )}
                <OverlayManager type={background.overlay} />
            </div>
        );
    };

    const handleElementClick = (element: ScreenElement) => {
        if (mode === 'editor') {
            onElementClick?.(element.id);
        } else {
            // In preview/export mode, handle image/gallery clicks for lightbox
            if (element.type === 'image' || element.type === 'gallery') {
                onElementClick?.(element.id);
            } else if (element.type === 'button' && element.metadata?.action === 'navigate') {
                const target = element.metadata.target;
                if (target === 'next') {
                    // Navigate to next screen (for Start Experience button)
                    onNavigate('next');
                } else {
                    onNavigate(target);
                }
            }
        }
    };

    const handleScreenClick = (e: React.MouseEvent) => {
        if (mode === 'editor' && e.target === e.currentTarget) {
            // Deselect when clicking on screen background
            onElementClick?.('');
        }
    };

    return (
        <div className={styles.screenContainer} onClick={handleScreenClick}>
            {renderBackground()}

            {/* Navigation Bar (Middle screens only) */}
            {type === 'content' && (
                <div className={styles.navigationBar}>
                    <button className={styles.navButton} onClick={() => onNavigate('back')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className={styles.screenTitle}>{title}</div>
                    <button
                        className={styles.navButton}
                        onClick={() => {
                            // Hamburger menu should navigate to navigation screen
                            const navScreen = allScreens[allScreens.length - 1];
                            if (navScreen && navScreen.type === 'navigation') {
                                onNavigate('nav-screen');
                            } else {
                                onNavigate('menu');
                            }
                        }}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            )}

            {/* Navigation Pills (for navigation type screens) */}
            {type === 'navigation' && (
                <div className={styles.navigationPills}>
                    {allScreens.map((navScreen, index) => (
                        <button
                            key={navScreen.id}
                            className={styles.navPill}
                            onClick={() => mode !== 'editor' && onNavigate(navScreen.id)}
                            style={{ cursor: mode === 'editor' ? 'default' : 'pointer' }}
                        >
                            <span className={styles.navPillNumber}>{index + 1}</span>
                            <span className={styles.navPillTitle}>{navScreen.title}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Elements */}
            {sortedElements.map(el => {
                // Skip rendering hidden navigation button elements (used only for styling the automatic next button)
                if (el.type === 'button' && el.metadata?.action === 'navigate' && el.metadata?.target === 'next' && el.metadata?.hidden) {
                    return null;
                }
                return (
                    <ElementRenderer
                        key={el.id}
                        element={el}
                        mode={mode}
                        isSelected={selectedElementId === el.id}
                        onClick={() => handleElementClick(el)}
                        onUpdate={onElementUpdate}
                        screenType={type}
                        device={device}
                        project={project}
                        hasNextButton={type === 'content' && hasNextScreen && (mode === 'editor' || !hasNavigationButtons)}
                    />
                );
            })}

            {/* Next Button (for content screens only, at bottom) - always show in editor mode, otherwise only if no navigation button elements exist */}
            {type === 'content' && hasNextScreen && (mode === 'editor' || !hasNavigationButtons) && (
                <div className={styles.nextButtonContainer}>
                    <button
                        className={styles.nextButton}
                        data-automatic-next-button="true"
                        data-nav-button-id={navButtonElement?.id || ''}
                        style={{
                            cursor: 'pointer',
                            ...(navButtonElement?.styles ? {
                                backgroundColor: navButtonElement.styles.backgroundColor || 'rgba(255, 255, 255, 0.9)',
                                color: navButtonElement.styles.color || 'var(--color-primary)',
                                fontSize: navButtonElement.styles.fontSize ? `${navButtonElement.styles.fontSize}px` : undefined,
                                fontWeight: navButtonElement.styles.fontWeight || 600,
                            } : {})
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (mode === 'editor') {
                                // In editor mode, find or create a navigation button element
                                const existingNavButton = sortedElements.find(
                                    el => el.type === 'button' && 
                                    el.metadata?.action === 'navigate' && 
                                    el.metadata?.target === 'next'
                                );
                                
                                if (existingNavButton) {
                                    // Select existing navigation button
                                    console.log('Found existing nav button, selecting:', existingNavButton.id);
                                    onElementClick?.(existingNavButton.id);
                                } else if (onAddElement) {
                                    console.log('Creating new nav button');
                                    // Create a hidden navigation button element for styling the automatic next button
                                    const newButton: ScreenElement = {
                                        id: uuidv4(),
                                        type: 'button',
                                        content: 'Next →',
                                        position: { x: -100, y: -100 }, // Position off-screen (hidden)
                                        size: { width: 30, height: 8 },
                                        styles: {
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            color: 'var(--color-primary)',
                                            borderRadius: 999,
                                            fontSize: 16,
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            shadow: true
                                        },
                                        metadata: {
                                            action: 'navigate',
                                            target: 'next',
                                            hidden: true // Mark as hidden so it doesn't render
                                        }
                                    };
                                    // Add element - selection will be handled by onAddElement callback
                                    onAddElement(newButton);
                                }
                            } else {
                                // In preview/export mode, navigate
                                onNavigate('next');
                            }
                        }}
                    >
                        {navButtonElement?.content || 'Next →'}
                    </button>
                </div>
            )}
        </div>
    );
};
