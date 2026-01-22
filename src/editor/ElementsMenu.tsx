import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import {
    Type, Image as ImageIcon, Video, Smile, MousePointerClick,
    LayoutTemplate, Circle, Music, Sparkles,
    ArrowLeft, Monitor, FolderOpen
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './ElementsMenu.module.css';
import { BackgroundSelector } from './BackgroundSelector';
import { AnimationSelector } from './AnimationSelector';

const ElementsMenu: React.FC = () => {
    const { activeScreenId, setMediaLibraryOpen } = useUIStore();
    const { project, addElement } = useProjectStore();
    const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'button' | 'shape' | 'image'>('none');
    const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
    const [showAnimationSelector, setShowAnimationSelector] = useState(false);

    if (!activeScreenId || !project) return null;

    const isBlankTemplate = project.templateId === 'blank';

    const handleAdd = (type: 'text' | 'button' | 'sticker' | 'image' | 'video' | 'long-text' | 'shape' | 'gallery' | 'background', metadata?: any) => {
        let content = '';
        let size = { width: 40, height: 10 };
        let elementStyles: any = { color: 'var(--color-text)', fontSize: 24, textAlign: 'center' };
        let position = { x: 50, y: 50 };

        switch (type) {
            case 'text':
                content = 'New Text';
                break;
            case 'button':
                content = metadata?.label || 'Button';
                size = { width: 30, height: 8 };
                elementStyles = {
                    ...elementStyles,
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 999
                };
                if (metadata?.variant === 'sticker-only') {
                    // Sticker button logic
                    content = '⭐'; // Placeholder, user selects sticker
                    elementStyles = { ...elementStyles, backgroundColor: 'transparent', fontSize: 48 };
                    size = { width: 20, height: 10 };
                }
                break;
            case 'sticker':
                content = '⭐'; // Default
                elementStyles = { ...elementStyles, fontSize: 48 };
                break;
            case 'image':
                content = ''; // Placeholder
                size = { width: 80, height: 40 };
                break;
            case 'video':
                content = '';
                size = { width: 80, height: 45 };
                break;
            case 'long-text':
                content = 'Enter your long text here...\n\nThis text container can be expanded and scrolled.';
                size = { width: 80, height: 30 };
                elementStyles = { ...elementStyles, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '10px' };
                break;
            case 'shape':
                content = '';
                size = { width: 20, height: 20 };
                elementStyles = { ...elementStyles, backgroundColor: '#ccc', borderRadius: 0 };
                break;
            case 'gallery':
                content = '[]'; // Empty array for gallery
                size = { width: 90, height: 40 };
                // Store layout in styles
                if (metadata?.layout) {
                    elementStyles = { ...elementStyles, galleryLayout: metadata.layout };
                }
                break;
            case 'background':
                // Special case: Background isn't an element, it modifies screen.
                // But user asked for "Background Element".
                // Actually "Background Element that controls the entire screen's background".
                // This implies updating screen.background.
                // We should probably open a Background Selector instead of adding an element.
                return;
        }

        const newId = uuidv4();
        addElement(activeScreenId, {
            id: newId,
            type,
            content,
            position,
            size,
            styles: elementStyles,
            metadata: metadata || {}
        });

        if (type === 'gallery') {
            setMediaLibraryOpen(true, 'select', {
                screenId: activeScreenId,
                elementId: newId,
                elementType: 'gallery'
            });
        }

        setActiveSubMenu('none');
    };

    const handleMediaClick = (type: 'image' | 'video' | 'music') => {
        if (!activeScreenId) return;

        // Create placeholder element first
        const id = uuidv4();
        const position = { x: 50, y: 50 };
        let size = { width: 40, height: 40 };
        let content = '';

        if (type === 'image') {
            size = { width: 80, height: 40 };
        } else if (type === 'video') {
            size = { width: 80, height: 45 };
        } else if (type === 'music') {
            // Music is technically a background/global thing usually, or an invisible element?
            // If type is 'music', we might be adding screen music?
            // The Model has `music?: string` on Screen.
            // If we want to add an element, it is type='music'?
            // Model `ElementType` includes 'music'.
            size = { width: 10, height: 10 };
        }

        addElement(activeScreenId, {
            id,
            type: type as any,
            content,
            position,
            size,
            styles: { zIndex: 10 }
        });

        // Now open library for this element
        setMediaLibraryOpen(true, 'select', {
            screenId: activeScreenId,
            elementId: id,
            elementType: type
        });
    };

    // Sub-menus
    if (activeSubMenu === 'button') {
        return (
            <div className={styles.container}>
                <button className={styles.backButton} onClick={() => setActiveSubMenu('none')}>
                    <ArrowLeft size={16} /> Back
                </button>
                <button className={styles.item} onClick={() => handleAdd('button', { label: 'Click Me' })}>
                    <span>Standard</span>
                </button>
                <button className={styles.item} onClick={() => handleAdd('button', { variant: 'sticker-only' })}>
                    <span>Sticker Only</span>
                </button>
                <button className={styles.item} onClick={() => handleAdd('button', { action: 'navigate', label: 'Start' })}>
                    <span>Start Nav</span>
                </button>
                <button className={styles.item} onClick={() => handleAdd('button', { action: 'navigate', label: 'Next' })}>
                    <span>Next Nav</span>
                </button>
                <button className={styles.item} onClick={() => handleAdd('button', { action: 'back', label: 'Back' })}>
                    <span>Back Nav</span>
                </button>
            </div>
        );
    }

    if (activeSubMenu === 'image') {
        return (
            <div className={styles.container}>
                <button className={styles.backButton} onClick={() => setActiveSubMenu('none')}>
                    <ArrowLeft size={16} /> Back
                </button>
                <button className={styles.item} onClick={() => handleMediaClick('image')}>
                    {/* Reuse Image Icon */}
                    <div className={styles.iconBox}><ImageIcon size={20} /></div>
                    <span>Single Image</span>
                </button>
                <button className={styles.item} onClick={() => handleAdd('gallery', { layout: 'carousel' })}>
                    <div className={styles.iconBox}><LayoutTemplate size={20} /></div>
                    <span>Carousel</span>
                </button>
                <button className={styles.item} onClick={() => handleAdd('gallery', { layout: 'grid' })}>
                    <div className={styles.iconBox}><LayoutTemplate size={20} /></div>
                    <span>Scroll Grid</span>
                </button>
            </div>
        );
    }

    // For non-blank templates, show only 4 items
    if (!isBlankTemplate) {
        return (
            <>
                <div className={styles.container}>
                    <button className={styles.item} onClick={() => setShowBackgroundSelector(true)}>
                        <div className={styles.iconBox}><Monitor size={20} /></div>
                        <span>Background</span>
                    </button>
                    <button className={styles.item} onClick={() => setShowAnimationSelector(true)}>
                        <div className={styles.iconBox}><Sparkles size={20} /></div>
                        <span>Animation</span>
                    </button>
                    <button className={styles.item} onClick={() => handleAdd('sticker')}>
                        <div className={styles.iconBox}><Smile size={20} /></div>
                        <span>Sticker</span>
                    </button>
                    <button className={styles.item} onClick={() => {
                        // Open media library in manage mode for content manager
                        setMediaLibraryOpen(true, 'manage', {
                            screenId: activeScreenId,
                            elementId: null,
                            elementType: 'image' // Use image as default, but media library will show all tabs
                        });
                    }}>
                        <div className={styles.iconBox}><FolderOpen size={20} /></div>
                        <span>Content</span>
                    </button>
                </div>
                {showBackgroundSelector && (
                    <BackgroundSelector
                        onClose={() => setShowBackgroundSelector(false)}
                    />
                )}
                {showAnimationSelector && (
                    <AnimationSelector
                        onClose={() => setShowAnimationSelector(false)}
                    />
                )}
            </>
        );
    }

    // For blank template, show all elements
    return (
        <div className={styles.container}>
            <button className={styles.item} onClick={() => handleAdd('text')}>
                <div className={styles.iconBox}><Type size={20} /></div>
                <span>Text</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('long-text')}>
                <div className={styles.iconBox}><LayoutTemplate size={20} /></div>
                <span>Long Text</span>
            </button>
            <button className={styles.item} onClick={() => setActiveSubMenu('image')}>
                <div className={styles.iconBox}><ImageIcon size={20} /></div>
                <span>Image</span>
            </button>
            <button className={styles.item} onClick={() => handleMediaClick('video')}>
                <div className={styles.iconBox}><Video size={20} /></div>
                <span>Video</span>
            </button>
            <button
                className={styles.item}
                onClick={() => handleMediaClick('music')}
            >
                <div className={styles.iconBox}><Music size={20} /></div>
                <span>Music</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('sticker')}>
                <div className={styles.iconBox}><Smile size={20} /></div>
                <span>Sticker</span>
            </button>
            <button className={styles.item} onClick={() => setActiveSubMenu('button')}>
                <div className={styles.iconBox}><MousePointerClick size={20} /></div>
                <span>Button</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('shape')}>
                <div className={styles.iconBox}><Circle size={20} /></div>
                <span>Shape</span>
            </button>

            <button className={styles.item} onClick={() => setShowBackgroundSelector(true)}>
                <div className={styles.iconBox}><Monitor size={20} /></div>
                <span>Backgrnd</span>
            </button>
            <button className={styles.item} onClick={() => setShowAnimationSelector(true)}>
                <div className={styles.iconBox}><Sparkles size={20} /></div>
                <span>Anim</span>
            </button>
        </div>
    );
};

export default ElementsMenu;
