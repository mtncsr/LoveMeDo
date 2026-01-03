import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import type { ScreenElement } from '../types/model';
import {
    Trash2, Type, Palette, MoveUp, MoveDown,
    Bold, Underline, Italic, Minus, Plus,
    Sparkles, Image as ImageIcon, X, FolderOpen,
    AlignLeft, AlignCenter, AlignRight
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

const STICKERS = ['⭐', '❤️', '🎉', '🎈', '🎁', '💝', '💖', '✨', '🌟', '🎊', '🎂', '🍰', '🎵', '🎶', '💕', '💗', '→', '←', '↑', '↓', '➜', '➤', '➔', '➨'];

export const ElementEditingMenu: React.FC<Props> = ({ element }) => {
    const { activeScreenId, setMediaLibraryOpen, setSelectedElementId } = useUIStore();
    const { updateElement, removeElement } = useProjectStore();
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // 'color' | 'backgroundColor' | 'frameColor' | null
    const [showAnimationPicker, setShowAnimationPicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showFrameShapePicker, setShowFrameShapePicker] = useState(false);

    // Close dropdowns when clicking outside - handled by global click listener or relying on UI behavior
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(`.${styles.menu}`)) {
                setShowColorPicker(null);
                setShowAnimationPicker(false);
                setShowFontPicker(false);
                setShowStickerPicker(false);
                setShowFrameShapePicker(false);
            }
        };

        if (showColorPicker || showAnimationPicker || showFontPicker || showStickerPicker || showFrameShapePicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showColorPicker, showAnimationPicker, showFontPicker, showStickerPicker, showFrameShapePicker]);

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
        // Keep picker open for easier experimentation
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

    const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
        updateElement(activeScreenId, element.id, {
            styles: { ...element.styles, textAlign: align }
        });
    };

    const handleStickerSelect = (sticker: string) => {
        updateElement(activeScreenId, element.id, {
            metadata: { ...element.metadata, sticker }
        });
        setShowStickerPicker(false);
    };

    const renderTextFeatures = () => (
        <>
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
            <button
                className={`${styles.menuButton} ${element.styles.textAlign === 'left' ? styles.active : ''}`}
                onClick={() => handleTextAlignChange('left')}
                title="Align Left"
            >
                <AlignLeft size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textAlign === 'center' ? styles.active : ''}`}
                onClick={() => handleTextAlignChange('center')}
                title="Align Center"
            >
                <AlignCenter size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textAlign === 'right' ? styles.active : ''}`}
                onClick={() => handleTextAlignChange('right')}
                title="Align Right"
            >
                <AlignRight size={18} />
            </button>
        </>
    );

    return (
        <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
            {/* Contents Button (First for easy access) */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery') && (
                <button
                    className={`${styles.menuButton} ${styles.contentsButton}`}
                    onClick={() => {
                        if (activeScreenId) {
                            setMediaLibraryOpen(true, 'manage', {
                                elementId: element.id,
                                screenId: activeScreenId,
                                elementType: element.type as 'image' | 'video' | 'gallery'
                            });
                        }
                    }}
                    title="Contents"
                >
                    <FolderOpen size={18} />
                    <span className={styles.buttonLabel}>Contents</span>
                </button>
            )}

            {/* Text/Button Features */}
            {(element.type === 'text' || element.type === 'button' || element.type === 'long-text') && renderTextFeatures()}

            {/* Button Sticker Selector */}
            {element.type === 'button' && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowStickerPicker(!showStickerPicker)}
                        title="Sticker"
                    >
                        <Sparkles size={18} />
                    </button>
                    {showStickerPicker && (
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
                </div>
            )}

            {/* Colors */}
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

            {(element.type === 'text' || element.type === 'button') && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowColorPicker(showColorPicker === 'backgroundColor' ? null : 'backgroundColor')}
                        title="Background Color"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Palette size={18} />
                            <span style={{ fontSize: '10px', marginLeft: '-6px', marginTop: '8px' }}>BG</span>
                        </div>
                    </button>
                    {showColorPicker === 'backgroundColor' && (
                        <div className={styles.colorPicker}>
                            <div className={styles.colorPickerHeader}>
                                <span>Background</span>
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

            {/* Frame Color & Shape */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery' || element.type === 'long-text' || (element.type === 'button' && element.metadata?.frameShape)) && (
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
                                onChange={(e) => {
                                    handleColorChange(e.target.value);
                                }}
                                className={styles.colorInput}
                            />
                        </div>
                    )}
                </div>
            )}

            {element.type === 'button' && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowFrameShapePicker(!showFrameShapePicker)}
                        title="Frame Shape"
                    >
                        <ImageIcon size={18} />
                    </button>
                    {showFrameShapePicker && (
                        <div className={styles.dropdown}>
                            <button
                                className={`${styles.dropdownItem} ${!element.metadata?.frameShape ? styles.active : ''}`}
                                onClick={() => {
                                    const newMetadata = { ...element.metadata };
                                    delete newMetadata.frameShape;
                                    updateElement(activeScreenId!, element.id, { metadata: newMetadata });
                                    setShowFrameShapePicker(false);
                                }}
                            >
                                None
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${element.metadata?.frameShape === 'heart' ? styles.active : ''}`}
                                onClick={() => {
                                    updateElement(activeScreenId!, element.id, {
                                        metadata: { ...element.metadata, frameShape: 'heart' }
                                    });
                                    setShowFrameShapePicker(false);
                                }}
                            >
                                ❤️ Heart
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${element.metadata?.frameShape === 'star' ? styles.active : ''}`}
                                onClick={() => {
                                    updateElement(activeScreenId!, element.id, {
                                        metadata: { ...element.metadata, frameShape: 'star' }
                                    });
                                    setShowFrameShapePicker(false);
                                }}
                            >
                                ⭐ Star
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${element.metadata?.frameShape === 'circle' ? styles.active : ''}`}
                                onClick={() => {
                                    updateElement(activeScreenId!, element.id, {
                                        metadata: { ...element.metadata, frameShape: 'circle' }
                                    });
                                    setShowFrameShapePicker(false);
                                }}
                            >
                                ⭕ Circle
                            </button>
                            <button
                                className={`${styles.dropdownItem} ${element.metadata?.frameShape === 'diamond' ? styles.active : ''}`}
                                onClick={() => {
                                    updateElement(activeScreenId!, element.id, {
                                        metadata: { ...element.metadata, frameShape: 'diamond' }
                                    });
                                    setShowFrameShapePicker(false);
                                }}
                            >
                                💎 Diamond
                            </button>
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

            <div className={styles.separator} />

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
