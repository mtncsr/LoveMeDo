import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { Type, Image as ImageIcon, Video, Smile, MousePointerClick, LayoutTemplate, Circle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './ElementsMenu.module.css';

const ElementsMenu: React.FC = () => {
    const { activeScreenId, setMode } = useUIStore();
    const { addElement } = useProjectStore();

    if (!activeScreenId) return null;

    const handleAdd = (type: 'text' | 'button' | 'sticker' | 'image' | 'video' | 'long-text' | 'shape') => {
        let content = '';
        let size = { width: 40, height: 10 };
        let elementStyles: any = { color: 'var(--color-text)', fontSize: 24, textAlign: 'center' };

        switch (type) {
            case 'text':
                content = 'New Text';
                break;
            case 'button':
                content = 'Click Me';
                size = { width: 30, height: 8 };
                elementStyles = { ...elementStyles, backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 999 };
                break;
            case 'sticker':
                content = '⭐'; // Default
                elementStyles = { ...elementStyles, fontSize: 48 };
                break;
            case 'image':
                // Placeholder image
                content = 'https://via.placeholder.com/300';
                size = { width: 80, height: 40 };
                break;
            case 'video':
                // Placeholder video - user needs to assign via media library
                content = '';
                size = { width: 80, height: 45 };
                break;
            case 'long-text':
                content = 'Enter your long text here...\n\nThis text container can be expanded and scrolled.';
                size = { width: 80, height: 30 };
                elementStyles = { ...elementStyles, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8 };
                break;
            case 'shape':
                content = '';
                size = { width: 20, height: 20 };
                elementStyles = { ...elementStyles, backgroundColor: '#ccc', borderRadius: 0 };
                break;
        }

        addElement(activeScreenId, {
            id: uuidv4(),
            type,
            content,
            position: { x: 50, y: 50 },
            size,
            styles: elementStyles
        });
    };

    return (
        <div className={styles.container}>
            <button className={styles.item} onClick={() => handleAdd('text')}>
                <div className={styles.iconBox}><Type size={20} /></div>
                <span>Text</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('image')}>
                <div className={styles.iconBox}><ImageIcon size={20} /></div>
                <span>Image</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('sticker')}>
                <div className={styles.iconBox}><Smile size={20} /></div>
                <span>Sticker</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('button')}>
                <div className={styles.iconBox}><MousePointerClick size={20} /></div>
                <span>Button</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('video')}>
                <div className={styles.iconBox}><Video size={20} /></div>
                <span>Video</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('long-text')}>
                <div className={styles.iconBox}><LayoutTemplate size={20} /></div>
                <span>Long Text</span>
            </button>
            <button className={styles.item} onClick={() => handleAdd('shape')}>
                <div className={styles.iconBox}><Circle size={20} /></div>
                <span>Shape</span>
            </button>
        </div>
    );
};

export default ElementsMenu;
