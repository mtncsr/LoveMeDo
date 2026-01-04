import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import {
    Type, Image as ImageIcon, Video, Smile, MousePointerClick,
    LayoutTemplate, Circle, Music, Sparkles, BoxSelect,
    ArrowLeft, Monitor
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './ElementsMenu.module.css';

const ElementsMenu: React.FC = () => {
    const { activeScreenId, setMediaLibraryOpen, setStickerPickerOpen } = useUIStore();
    const { addElement } = useProjectStore();
    const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'button' | 'shape'>('none');

    if (!activeScreenId) return null;

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
            case 'background':
                // Special case: Background isn't an element, it modifies screen.
                // But user asked for "Background Element".
                // Actually "Background Element that controls the entire screen's background".
                // This implies updating screen.background.
                // We should probably open a Background Selector instead of adding an element.
                return;
        }

        addElement(activeScreenId, {
            id: uuidv4(),
            type,
            content,
            position,
            size,
            styles: elementStyles,
            metadata: metadata || {}
        });

        setActiveSubMenu('none');
    };

    const handleMediaClick = (type: 'image' | 'video' | 'music') => {
        if (activeScreenId) {
            setMediaLibraryOpen(true, 'select', {
                screenId: activeScreenId,
                elementType: type
            });
        }
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
            <button className={styles.item} onClick={() => handleMediaClick('image')}>
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

            <button className={styles.item} onClick={() => {
                // Trigger background selector - simpler to use existing media library for now or just generic background
                // User asked for "Background Selector with all template backgrounds".
                // Use media library? Or separate logic.
                // For now, placeholder.
                alert("Background Selector to be implemented");
            }}>
                <div className={styles.iconBox}><Monitor size={20} /></div>
                <span>Backgrnd</span>
            </button>
            <button className={styles.item} onClick={() => {
                // Trigger Animations Selector
                alert("Animations Selector to be implemented");
            }}>
                <div className={styles.iconBox}><Sparkles size={20} /></div>
                <span>Anim</span>
            </button>
        </div>
    );
};

export default ElementsMenu;
