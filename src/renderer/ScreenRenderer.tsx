import React, { useMemo } from 'react';
import type { Screen, ScreenElement } from '../types/model';
import { ElementRenderer } from './ElementRenderer';
import { ArrowLeft, Menu } from 'lucide-react';
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
    allScreens?: Screen[]; // For navigation grid
    currentScreenIndex?: number; // For next button
    selectedElementId?: string; // Selected element ID for editor mode
    device?: 'mobile' | 'desktop'; // Device type for responsive layout
}

export const ScreenRenderer: React.FC<Props> = ({ screen, mode, isActive, onNavigate, onElementClick, onElementUpdate, allScreens = [], currentScreenIndex, selectedElementId, device = 'mobile' }) => {
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
                    />
                );
            })}

            {/* Next Button (for content screens only, at bottom) */}
            {type === 'content' && hasNextScreen && mode !== 'editor' && (
                <div className={styles.nextButtonContainer}>
                    <button
                        className={styles.nextButton}
                        onClick={() => onNavigate('next')}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};
