import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { Trash2, Type, Palette, Copy, Image as ImageIcon, Minus, Plus, Sparkles } from 'lucide-react';
import styles from './Toolbar.module.css';

const Toolbar: React.FC = () => {
    const { selectedElementId, activeScreenId, setSelectedElementId, setMediaLibraryOpen } = useUIStore();
    const { project, updateElement, removeElement, addElement, updateScreen } = useProjectStore();
    const [isEditingText, setIsEditingText] = useState(false);
    const [editTextValue, setEditTextValue] = useState('');

    if (!selectedElementId || !activeScreenId || !project) return null;

    const currentScreen = project.screens.find(s => s.id === activeScreenId);
    const element = currentScreen?.elements.find(e => e.id === selectedElementId);

    if (!element) return null;

    const handleDelete = () => {
        removeElement(activeScreenId, selectedElementId);
        setSelectedElementId(null);
    };

    const handleDuplicate = () => {
        const newElement = {
            ...element,
            id: crypto.randomUUID(),
            position: {
                x: element.position.x + 5,
                y: element.position.y + 5
            }
        };
        addElement(activeScreenId, newElement);
    };

    const handleChangeColor = () => {
        // Simple prompt for now
        const color = prompt('Enter color (hex or name):', element.styles.color);
        if (color) {
            updateElement(activeScreenId, selectedElementId, { styles: { ...element.styles, color } });
        }
    };

    const handleEditText = () => {
        if (element.type === 'text' || element.type === 'button' || element.type === 'long-text') {
            setEditTextValue(element.content);
            setIsEditingText(true);
        }
    };

    const handleSaveText = () => {
        updateElement(activeScreenId, selectedElementId, { content: editTextValue });
        setIsEditingText(false);
    };

    const handleCancelText = () => {
        setIsEditingText(false);
        setEditTextValue('');
    };

    const handleFontSizeChange = (delta: number) => {
        const currentSize = element.styles.fontSize || 24;
        const newSize = Math.max(8, Math.min(200, currentSize + delta));
        updateElement(activeScreenId, selectedElementId, {
            styles: { ...element.styles, fontSize: newSize }
        });
    };

    const handleBackgroundEffect = (effect: 'confetti' | 'hearts' | 'stars' | 'fireworks' | 'none') => {
        if (currentScreen) {
            updateScreen(activeScreenId, {
                background: {
                    ...currentScreen.background,
                    overlay: effect === 'none' ? undefined : effect
                }
            });
        }
    };

    const handleOpenMedia = () => {
        setMediaLibraryOpen(true, 'select');
    };

    if (isEditingText) {
        return (
            <div className={styles.toolbar}>
                <div className={styles.label}>Edit Text</div>
                <div className={styles.divider} />
                <textarea
                    value={editTextValue}
                    onChange={(e) => setEditTextValue(e.target.value)}
                    className={styles.textInput}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleSaveText();
                        } else if (e.key === 'Escape') {
                            handleCancelText();
                        }
                    }}
                />
                <div className={styles.buttonRow}>
                    <button className={styles.toolBtn} onClick={handleSaveText} title="Save (Ctrl+Enter)">
                        Save
                    </button>
                    <button className={styles.toolBtn} onClick={handleCancelText} title="Cancel (Esc)">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.toolbar}>
            <div className={styles.label}>{element.type}</div>
            <div className={styles.divider} />

            {(element.type === 'text' || element.type === 'button' || element.type === 'long-text') && (
                <>
                    <button className={styles.toolBtn} onClick={handleEditText} title="Edit Text">
                        <Type size={18} />
                    </button>
                    <div className={styles.fontSizeControl}>
                        <button className={styles.toolBtn} onClick={() => handleFontSizeChange(-2)} title="Decrease Font Size">
                            <Minus size={16} />
                        </button>
                        <span className={styles.fontSizeValue}>{element.styles.fontSize || 24}px</span>
                        <button className={styles.toolBtn} onClick={() => handleFontSizeChange(2)} title="Increase Font Size">
                            <Plus size={16} />
                        </button>
                    </div>
                </>
            )}

            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery') && (
                <button className={styles.toolBtn} onClick={handleOpenMedia} title="Change Media">
                    <ImageIcon size={18} />
                </button>
            )}

            <button className={styles.toolBtn} onClick={handleChangeColor} title="Color">
                <Palette size={18} />
            </button>

            <button className={styles.toolBtn} onClick={handleDuplicate} title="Duplicate">
                <Copy size={18} />
            </button>

            <div className={styles.divider} />

            {/* Background Effects (for screen) */}
            <div className={styles.dropdown}>
                <button className={styles.toolBtn} title="Background Effects">
                    <Sparkles size={18} />
                </button>
                <div className={styles.dropdownContent}>
                    <button onClick={() => handleBackgroundEffect('none')}>None</button>
                    <button onClick={() => handleBackgroundEffect('confetti')}>Confetti</button>
                    <button onClick={() => handleBackgroundEffect('hearts')}>Hearts</button>
                    <button onClick={() => handleBackgroundEffect('stars')}>Stars</button>
                    <button onClick={() => handleBackgroundEffect('fireworks')}>Fireworks</button>
                </div>
            </div>

            <button className={`${styles.toolBtn} ${styles.deleteBtn}`} onClick={handleDelete} title="Delete">
                <Trash2 size={18} />
            </button>
        </div>
    );
};

export default Toolbar;
