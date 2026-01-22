import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { X } from 'lucide-react';
import styles from './AnimationSelector.module.css';

interface Props {
    onClose: () => void;
}

const SCREEN_ANIMATIONS = [
    { value: 'none', label: 'None', icon: '⚪' },
    { value: 'fade', label: 'Fade', icon: '✨' },
    { value: 'slide', label: 'Slide', icon: '➡️' },
];

const OVERLAY_OPTIONS = [
    { value: 'none', label: 'None', icon: '⚪' },
    { value: 'confetti', label: 'Confetti', icon: '🎉' },
    { value: 'hearts', label: 'Hearts', icon: '❤️' },
    { value: 'stars', label: 'Stars', icon: '⭐' },
    { value: 'fireworks', label: 'Fireworks', icon: '🎆' },
];

export const AnimationSelector: React.FC<Props> = ({ onClose }) => {
    const { project, updateScreen } = useProjectStore();
    const { activeScreenId } = useUIStore();

    if (!project || !activeScreenId) return null;

    const currentScreen = project.screens.find(s => s.id === activeScreenId);
    if (!currentScreen) return null;

    const handleAnimationChange = (animation: 'fade' | 'slide' | 'none') => {
        updateScreen(activeScreenId, {
            background: {
                ...currentScreen.background,
                animation
            }
        });
    };

    const handleOverlayChange = (overlay: string) => {
        updateScreen(activeScreenId, {
            background: {
                ...currentScreen.background,
                overlay: overlay === 'none' ? undefined : overlay
            }
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Select Animation</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.content}>
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Screen Animation</h4>
                        <div className={styles.optionsGrid}>
                            {SCREEN_ANIMATIONS.map((anim) => (
                                <button
                                    key={anim.value}
                                    className={`${styles.option} ${
                                        currentScreen.background.animation === anim.value ? styles.selected : ''
                                    }`}
                                    onClick={() => handleAnimationChange(anim.value as 'fade' | 'slide' | 'none')}
                                >
                                    <span className={styles.optionIcon}>{anim.icon}</span>
                                    <span className={styles.optionLabel}>{anim.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Background Overlay</h4>
                        <div className={styles.optionsGrid}>
                            {OVERLAY_OPTIONS.map((overlay) => (
                                <button
                                    key={overlay.value}
                                    className={`${styles.option} ${
                                        (currentScreen.background.overlay || 'none') === overlay.value ? styles.selected : ''
                                    }`}
                                    onClick={() => handleOverlayChange(overlay.value)}
                                >
                                    <span className={styles.optionIcon}>{overlay.icon}</span>
                                    <span className={styles.optionLabel}>{overlay.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
