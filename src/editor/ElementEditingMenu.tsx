import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import type { ScreenElement } from '../types/model';
import {
    Trash2, Type, Palette, MoveUp, MoveDown, 
    Bold, Underline, Italic, Minus, Plus,
    Sparkles, Image as ImageIcon, X
} from 'lucide-react';
import styles from './ElementEditingMenu.module.css';

interface Props {
    element: ScreenElement;
}

const ANIMATIONS = [
    { value: 'none', label: 'None' },
    { value: 'float', label: 'Float' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'fade', label: 'Fade' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'slide', label: 'Slide' },
    { value: 'rotate', label: 'Rotate' },
];

const FONTS = [
    { value: 'var(--font-body)', label: 'Body' },
    { value: 'var(--font-heading)', label: 'Heading' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier' },
];

const COMMON_COLORS = [
    '#000000', '#FFFFFF', '#FF4D6D', '#4A90E2', '#50C878',
    '#FFD700', '#FF6B35', '#9B59B6', '#E74C3C', '#3498DB',
    '#2ECC71', '#F39C12', '#E67E22', '#95A5A6', '#34495E',
];

const STICKERS = ['⭐', '❤️', '🎉', '🎈', '🎁', '💝', '💖', '✨', '🌟', '🎊', '🎂', '🍰', '🎵', '🎶', '💕', '💗'];

export const ElementEditingMenu: React.FC<Props> = ({ element }) => {
    const { activeScreenId, setSelectedElementId } = useUIStore();
    const { updateElement, removeElement } = useProjectStore();
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // 'color' | 'backgroundColor' | 'frameColor' | null
    const [showAnimationPicker, setShowAnimationPicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    // Position menu below element by finding it in the DOM
    useEffect(() => {
        const findElement = () => {
            // Find the element by data attribute
            const elementEl = document.querySelector(`[data-element-id="${element.id}"]`) as HTMLElement;
            if (elementEl && menuRef.current) {
                // Find the canvas wrapper (parent container)
                const canvasWrapper = elementEl.closest('[data-device]') as HTMLElement;
                if (!canvasWrapper) return;
                
                const elementRect = elementEl.getBoundingClientRect();
                const wrapperRect = canvasWrapper.getBoundingClientRect();
                const menuRect = menuRef.current.getBoundingClientRect();
                
                // Calculate position relative to canvas wrapper
                const relativeTop = elementRect.bottom - wrapperRect.top;
                const relativeLeft = elementRect.left - wrapperRect.left + (elementRect.width / 2) - (menuRect.width / 2);
                
                // Keep menu within bounds
                const maxLeft = wrapperRect.width - menuRect.width;
                const clampedLeft = Math.max(0, Math.min(maxLeft, relativeLeft));
                
                setMenuPosition({
                    top: relativeTop + 8,
                    left: clampedLeft
                });
            }
        };

        // Try to find element immediately and on resize
        findElement();
        const interval = setInterval(findElement, 100);
        window.addEventListener('resize', findElement);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', findElement);
        };
    }, [element.id]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowColorPicker(null);
                setShowAnimationPicker(false);
                setShowFontPicker(false);
                setShowStickerPicker(false);
            }
        };

        if (showColorPicker || showAnimationPicker || showFontPicker || showStickerPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showColorPicker, showAnimationPicker, showFontPicker, showStickerPicker]);

    if (!activeScreenId) return null;

    const handleDelete = () => {
        removeElement(activeScreenId, element.id);
        setSelectedElementId(null);
    };

    const handleMoveLayer = (direction: 'front' | 'back') => {
        const currentZIndex = element.styles.zIndex || 10;
        const newZIndex = direction === 'front' ? currentZIndex + 1 : Math.max(1, currentZIndex - 1);
        updateElement(activeScreenId, element.id, {
            styles: { ...element.styles, zIndex: newZIndex }
        });
    };

    const handleColorChange = (color: string) => {
        if (!showColorPicker) return;
        updateElement(activeScreenId, element.id, {
            styles: { ...element.styles, [showColorPicker]: color }
        });
        setShowColorPicker(null);
    };

    const handleAnimationChange = (animation: string) => {
        updateElement(activeScreenId, element.id, {
            styles: { ...element.styles, animation }
        });
        setShowAnimationPicker(false);
    };

    const handleFontChange = (font: string) => {
        updateElement(activeScreenId, element.id, {
            styles: { ...element.styles, fontFamily: font }
        });
        setShowFontPicker(false);
    };

    const handleFontSizeChange = (delta: number) => {
        const currentSize = element.styles.fontSize || 24;
        const newSize = Math.max(8, Math.min(200, currentSize + delta));
        updateElement(activeScreenId, element.id, {
            styles: { ...element.styles, fontSize: newSize }
        });
    };

    const handleTextStyleToggle = (style: 'bold' | 'underline' | 'italic') => {
        const updates: any = { ...element.styles };
        
        if (style === 'bold') {
            updates.fontWeight = element.styles.fontWeight === 'bold' ? 'normal' : 'bold';
        } else if (style === 'underline') {
            updates.textDecoration = element.styles.textDecoration === 'underline' ? 'none' : 'underline';
        } else if (style === 'italic') {
            updates.fontStyle = element.styles.fontStyle === 'italic' ? 'normal' : 'italic';
        }
        
        updateElement(activeScreenId, element.id, { styles: updates });
    };

    const handleStickerSelect = (sticker: string) => {
        updateElement(activeScreenId, element.id, {
            metadata: { ...element.metadata, sticker }
        });
        setShowStickerPicker(false);
    };

    const handleTitleChange = (title: string) => {
        updateElement(activeScreenId, element.id, {
            metadata: { ...element.metadata, title: title || undefined }
        });
    };

    const handleSubtitleChange = (subtitle: string) => {
        updateElement(activeScreenId, element.id, {
            metadata: { ...element.metadata, subtitle: subtitle || undefined }
        });
    };

    const handleEditText = () => {
        setIsEditingText(true);
        // Focus will be handled by contentEditable in ElementRenderer
    };

    const renderTextFeatures = () => (
        <>
            <button
                className={styles.menuButton}
                onClick={handleEditText}
                title="Edit Text"
            >
                <Type size={18} />
            </button>
            <button
                className={styles.menuButton}
                onClick={() => setShowFontPicker(!showFontPicker)}
                title="Font"
            >
                <Type size={18} />
            </button>
            <div className={styles.fontSizeControl}>
                <button
                    className={styles.menuButton}
                    onClick={() => handleFontSizeChange(-2)}
                    title="Decrease Size"
                >
                    <Minus size={14} />
                </button>
                <span className={styles.fontSizeValue}>{element.styles.fontSize || 24}px</span>
                <button
                    className={styles.menuButton}
                    onClick={() => handleFontSizeChange(2)}
                    title="Increase Size"
                >
                    <Plus size={14} />
                </button>
            </div>
            <button
                className={`${styles.menuButton} ${element.styles.fontWeight === 'bold' ? styles.active : ''}`}
                onClick={() => handleTextStyleToggle('bold')}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textDecoration === 'underline' ? styles.active : ''}`}
                onClick={() => handleTextStyleToggle('underline')}
                title="Underline"
            >
                <Underline size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.fontStyle === 'italic' ? styles.active : ''}`}
                onClick={() => handleTextStyleToggle('italic')}
                title="Italic"
            >
                <Italic size={18} />
            </button>
        </>
    );

    return (
        <div
            ref={menuRef}
            className={styles.menu}
            data-editing-menu="true"
            style={{
                position: 'absolute',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Text/Button Features */}
            {(element.type === 'text' || element.type === 'button' || element.type === 'long-text') && renderTextFeatures()}

            {/* Button Sticker Selector */}
            {element.type === 'button' && (
                <button
                    className={styles.menuButton}
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    title="Sticker"
                >
                    <Sparkles size={18} />
                </button>
            )}

            {/* Text/Button Color Picker */}
            {(element.type === 'text' || element.type === 'button' || element.type === 'long-text') && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowColorPicker(showColorPicker === 'color' ? null : 'color')}
                        title="Text Color"
                    >
                        <Palette size={18} />
                    </button>
                    {showColorPicker === 'color' && (
                        <div className={styles.colorPicker}>
                            <div className={styles.colorPickerHeader}>
                                <span>Text Color</span>
                                <button onClick={() => setShowColorPicker(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className={styles.colorSwatches}>
                                {COMMON_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleColorChange(color)}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={element.styles.color || '#000000'}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className={styles.colorInput}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Background Color (for text/button) */}
            {(element.type === 'text' || element.type === 'button') && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowColorPicker(showColorPicker === 'backgroundColor' ? null : 'backgroundColor')}
                        title="Background Color"
                    >
                        <Palette size={18} />
                    </button>
                    {showColorPicker === 'backgroundColor' && (
                        <div className={styles.colorPicker}>
                            <div className={styles.colorPickerHeader}>
                                <span>Background Color</span>
                                <button onClick={() => setShowColorPicker(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className={styles.colorSwatches}>
                                {COMMON_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleColorChange(color)}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={element.styles.backgroundColor || '#FFFFFF'}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className={styles.colorInput}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Frame Color (for gallery items) */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery' || element.type === 'long-text') && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowColorPicker(showColorPicker === 'frameColor' ? null : 'frameColor')}
                        title="Frame Color"
                    >
                        <ImageIcon size={18} />
                    </button>
                    {showColorPicker === 'frameColor' && (
                        <div className={styles.colorPicker}>
                            <div className={styles.colorPickerHeader}>
                                <span>Frame Color</span>
                                <button onClick={() => setShowColorPicker(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className={styles.colorSwatches}>
                                {COMMON_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleColorChange(color)}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={element.styles.frameColor || '#000000'}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className={styles.colorInput}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Animation Selector */}
            <div className={styles.dropdownContainer}>
                <button
                    className={styles.menuButton}
                    onClick={() => setShowAnimationPicker(!showAnimationPicker)}
                    title="Animation"
                >
                    <Sparkles size={18} />
                </button>
                {showAnimationPicker && (
                    <div className={styles.dropdown}>
                        {ANIMATIONS.map(anim => (
                            <button
                                key={anim.value}
                                className={`${styles.dropdownItem} ${element.styles.animation === anim.value ? styles.active : ''}`}
                                onClick={() => handleAnimationChange(anim.value)}
                            >
                                {anim.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Font Selector */}
            {showFontPicker && (element.type === 'text' || element.type === 'button' || element.type === 'long-text') && (
                <div className={styles.dropdown}>
                    {FONTS.map(font => (
                        <button
                            key={font.value}
                            className={`${styles.dropdownItem} ${element.styles.fontFamily === font.value ? styles.active : ''}`}
                            onClick={() => handleFontChange(font.value)}
                        >
                            {font.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Sticker Picker (for buttons) */}
            {showStickerPicker && element.type === 'button' && (
                <div className={styles.stickerPicker}>
                    <div className={styles.stickerPickerHeader}>
                        <span>Sticker</span>
                        <button onClick={() => setShowStickerPicker(false)}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className={styles.stickerGrid}>
                        {STICKERS.map(sticker => (
                            <button
                                key={sticker}
                                className={styles.stickerButton}
                                onClick={() => handleStickerSelect(sticker)}
                            >
                                {sticker}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Gallery Title/Subtitle Editors */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery' || element.type === 'long-text') && (
                <>
                    <input
                        type="text"
                        placeholder="Title"
                        value={element.metadata?.title || ''}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className={styles.textInput}
                    />
                    <input
                        type="text"
                        placeholder="Subtitle"
                        value={element.metadata?.subtitle || ''}
                        onChange={(e) => handleSubtitleChange(e.target.value)}
                        className={styles.textInput}
                    />
                </>
            )}

            {/* Layer Controls */}
            <button
                className={styles.menuButton}
                onClick={() => handleMoveLayer('front')}
                title="Move to Front"
            >
                <MoveUp size={18} />
            </button>
            <button
                className={styles.menuButton}
                onClick={() => handleMoveLayer('back')}
                title="Move to Back"
            >
                <MoveDown size={18} />
            </button>

            {/* Delete */}
            <button
                className={`${styles.menuButton} ${styles.deleteButton}`}
                onClick={handleDelete}
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};

