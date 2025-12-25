import React from 'react';
import type { Screen, ScreenElement } from '../types/model';
import { ElementRenderer } from './ElementRenderer';
import { ArrowLeft, Menu } from 'lucide-react';
import styles from './styles.module.css';

interface Props {
    screen: Screen;
    mode: 'templatePreview' | 'editor' | 'export';
    isActive: boolean;
    onNavigate: (target: string) => void;
    onElementClick?: (elementId: string) => void;
    onElementUpdate?: (elementId: string, changes: Partial<ScreenElement>) => void;
    allScreens?: Screen[]; // For navigation grid
}

export const ScreenRenderer: React.FC<Props> = ({ screen, mode, isActive, onNavigate, onElementClick, onElementUpdate, allScreens = [] }) => {
    if (!isActive) return null;

    const { background, elements, type, title } = screen;

    // Render Background
    const renderBackground = () => {
        const style: React.CSSProperties = {
            backgroundColor: background.type === 'solid' ? background.value : undefined,
            backgroundImage: background.type === 'gradient' ? background.value : undefined,
        };

        return (
            <div className={styles.background} style={style}>
                {background.type === 'image' && <img src={background.value} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {background.overlay === 'confetti' && <div className={styles.backgroundOverlay}>🎉</div>}
                {background.overlay === 'hearts' && <div className={styles.backgroundOverlay}>❤️</div>}
                {background.overlay === 'stars' && <div className={styles.backgroundOverlay}>⭐</div>}
                {background.overlay === 'fireworks' && <div className={styles.backgroundOverlay}>🎆</div>}
            </div>
        );
    };

    const handleElementClick = (element: ScreenElement) => {
        if (mode === 'editor') {
            onElementClick?.(element.id);
        } else {
            if (element.type === 'button' && element.metadata?.action === 'navigate') {
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

    return (
        <div className={styles.screenContainer}>
            {renderBackground()}

            {/* Navigation Bar (Middle screens only) */}
            {type === 'content' && (
                <div className={styles.navigationBar}>
                    <button className={styles.navButton} onClick={() => onNavigate('back')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className={styles.screenTitle}>{title}</div>
                    <button className={styles.navButton} onClick={() => onNavigate('menu')}>
                        <Menu size={24} />
                    </button>
                </div>
            )}

            {/* Navigation Grid (for navigation type screens) */}
            {type === 'navigation' && (
                <div className={styles.navigationGrid}>
                    {allScreens.map((navScreen, index) => (
                        <button
                            key={navScreen.id}
                            className={styles.navGridItem}
                            onClick={() => mode !== 'editor' && onNavigate(navScreen.id)}
                            style={{ cursor: mode === 'editor' ? 'default' : 'pointer' }}
                        >
                            <div className={styles.navGridNumber}>{index + 1}</div>
                            <div className={styles.navGridTitle}>{navScreen.title}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Elements */}
            {elements.map(el => (
                <ElementRenderer
                    key={el.id}
                    element={el}
                    mode={mode}
                    onClick={() => handleElementClick(el)}
                    onUpdate={onElementUpdate}
                />
            ))}
        </div>
    );
};
