import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import type { ScreenElement } from '../types/model';
import {
    Trash2, Type, Palette, MoveUp, MoveDown,
    Bold, Underline, Italic, Minus, Plus,
    Sparkles, Image as ImageIcon, X, FolderOpen,
    AlignLeft, AlignCenter, AlignRight, Pipette
} from 'lucide-react';
import styles from './ElementEditingMenu.module.css';

// Extend Window interface for EyeDropper API
declare global {
    interface Window {
        EyeDropper?: any;
    }
}

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

    // Hue Selector Helper
    const [hue, setHue] = useState(0);

    // Close dropdowns when clicking outside - handled by global click listener or relying on UI behavior
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Improved check: if click is NOT inside a dropdown/picker
            if (
                !target.closest(`.${styles.menu}`) &&
                !target.closest(`.${styles.dropdown}`) &&
                !target.closest(`.${styles.colorPicker}`) &&
                !target.closest(`.${styles.stickerPicker}`)
            ) {
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

    // Generate colors based on hue
    const getColorsFromHue = (h: number) => [
        `hsl(${h}, 100%, 95%)`,
        `hsl(${h}, 100%, 85%)`,
        `hsl(${h}, 100%, 75%)`,
        `hsl(${h}, 100%, 65%)`,
        `hsl(${h}, 100%, 50%)`, // Pure
        `hsl(${h}, 80%, 40%)`,
        `hsl(${h}, 60%, 30%)`,
        `hsl(${h}, 40%, 20%)`,
        '#000000', '#FFFFFF'
    ];

    const currentPalette = showColorPicker ? getColorsFromHue(hue) : COMMON_COLORS;

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

    const handleEyedropper = async (target: 'color' | 'backgroundColor' | 'frameColor') => {
        if (!window.EyeDropper) {
            alert('Your browser does not support the EyeDropper API');
            return;
        }

        const eyeDropper = new window.EyeDropper();

        try {
            const result = await eyeDropper.open();
            if (target === 'color') {
                updateElement(activeScreenId, element.id, { styles: { ...element.styles, color: result.sRGBHex } });
            } else if (target === 'backgroundColor') {
                updateElement(activeScreenId, element.id, { styles: { ...element.styles, backgroundColor: result.sRGBHex } });
            } else if (target === 'frameColor') {
                updateElement(activeScreenId, element.id, { styles: { ...element.styles, frameColor: result.sRGBHex } });
            }
        } catch (e) {
            console.log('Eyedropper canceled');
        }
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
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowFontPicker(!showFontPicker); }}
                title="Font"
            >
                <Type size={18} />
            </button>
            <div className={styles.fontSizeControl}>
                <button
                    className={styles.menuButton}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleFontSizeChange(-2); }}
                    title="Decrease Size"
                >
                    <Minus size={14} />
                </button>
                <span className={styles.fontSizeValue}>{element.styles.fontSize || 24}px</span>
                <button
                    className={styles.menuButton}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleFontSizeChange(2); }}
                    title="Increase Size"
                >
                    <Plus size={14} />
                </button>
            </div>
            <button
                className={`${styles.menuButton} ${element.styles.fontWeight === 'bold' ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTextStyleToggle('bold'); }}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textDecoration === 'underline' ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTextStyleToggle('underline'); }}
                title="Underline"
            >
                <Underline size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.fontStyle === 'italic' ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTextStyleToggle('italic'); }}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textAlign === 'left' ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTextAlignChange('left'); }}
                title="Align Left"
            >
                <AlignLeft size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textAlign === 'center' ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTextAlignChange('center'); }}
                title="Align Center"
            >
                <AlignCenter size={18} />
            </button>
            <button
                className={`${styles.menuButton} ${element.styles.textAlign === 'right' ? styles.active : ''}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleTextAlignChange('right'); }}
                title="Align Right"
            >
                <AlignRight size={18} />
            </button>
        </>
    );

    return (
        <div className={styles.menu} onMouseDown={(e) => e.stopPropagation()} data-editing-menu="true">
            {/* Contents Button (First for easy access) */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery') && (
                <button
                    className={`${styles.menuButton} ${styles.contentsButton}`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
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
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowStickerPicker(!showStickerPicker); }}
                        title="Sticker"
                    >
                        <Sparkles size={18} />
                    </button>
                    {showStickerPicker && (
                        <div className={styles.stickerPicker} onMouseDown={(e) => e.stopPropagation()}>
                            <div className={styles.stickerPickerHeader}>
                                <span>Sticker</span>
                                <button onMouseDown={(e) => { e.stopPropagation(); setShowStickerPicker(false); }}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className={styles.stickerGrid}>
                                {STICKERS.map(sticker => (
                                    <button
                                        key={sticker}
                                        className={styles.stickerButton}
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleStickerSelect(sticker); }}
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
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowColorPicker(showColorPicker === 'color' ? null : 'color'); }}
                        title="Text Color"
                    >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Palette size={18} />
                            <div style={{
                                position: 'absolute',
                                bottom: -4,
                                left: 0,
                                right: 0,
                                height: 3,
                                backgroundColor: element.styles.color || '#000000',
                                borderRadius: 1
                            }} />
                        </div>
                    </button>
                    {showColorPicker === 'color' && (
                        <div className={styles.colorPicker} onMouseDown={(e) => e.stopPropagation()}>
                            <div className={styles.colorPickerHeader}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>Text Color</span>
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleEyedropper('color'); }}
                                        title="Pick Color from Screen"
                                    >
                                        <Pipette size={14} />
                                    </button>
                                </div>
                                <button onMouseDown={(e) => { e.stopPropagation(); setShowColorPicker(null); }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Hue Slider */}
                            <div className={styles.hueSliderContainer}>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={hue}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => setHue(parseInt(e.target.value))}
                                    className={styles.hueSlider}
                                    style={{ background: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)` }}
                                />
                            </div>

                            <div className={styles.colorSwatches}>
                                {currentPalette.map(color => (
                                    <button
                                        key={color}
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: color }}
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleColorChange(color); }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Background Color */}
            {(element.type === 'text' || element.type === 'button') && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowColorPicker(showColorPicker === 'backgroundColor' ? null : 'backgroundColor'); }}
                        title="Background Color"
                    >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Palette size={18} />
                                <span style={{ fontSize: '10px', marginLeft: '-6px', marginTop: '8px' }}>BG</span>
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: -4,
                                left: 0,
                                right: 0,
                                height: 3,
                                backgroundColor: element.styles.backgroundColor === 'transparent' ? 'transparent' : (element.styles.backgroundColor || '#FFFFFF'),
                                borderRadius: 1,
                                border: element.styles.backgroundColor === 'transparent' ? '1px solid #ccc' : 'none'
                            }} />
                        </div>
                    </button>
                    {showColorPicker === 'backgroundColor' && (
                        <div className={styles.colorPicker} onMouseDown={(e) => e.stopPropagation()}>
                            <div className={styles.colorPickerHeader}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>Background</span>
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleEyedropper('backgroundColor'); }}
                                        title="Pick Color from Screen"
                                    >
                                        <Pipette size={14} />
                                    </button>
                                </div>
                                <button onMouseDown={(e) => { e.stopPropagation(); setShowColorPicker(null); }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className={styles.hueSliderContainer}>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={hue}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => setHue(parseInt(e.target.value))}
                                    className={styles.hueSlider}
                                    style={{ background: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)` }}
                                />
                            </div>

                            <div className={styles.colorSwatches}>
                                {currentPalette.map(color => (
                                    <button
                                        key={color}
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: color }}
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleColorChange(color); }}
                                        title={color}
                                    />
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <button
                                    className={styles.transparentButton}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleColorChange('transparent'); }}
                                    title="No Background"
                                >
                                    None
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Frame Color & Shape */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery' || element.type === 'long-text' || (element.type === 'button' && element.metadata?.frameShape)) && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowColorPicker(showColorPicker === 'frameColor' ? null : 'frameColor'); }}
                        title="Frame Color"
                    >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={18} />
                            <div style={{
                                position: 'absolute',
                                bottom: -4,
                                left: 0,
                                right: 0,
                                height: 3,
                                backgroundColor: element.styles.frameColor === 'transparent' ? 'transparent' : (element.styles.frameColor || '#000000'),
                                borderRadius: 1,
                                border: element.styles.frameColor === 'transparent' ? '1px solid #ccc' : 'none'
                            }} />
                        </div>
                    </button>
                    {showColorPicker === 'frameColor' && (
                        <div className={styles.colorPicker} onMouseDown={(e) => e.stopPropagation()}>
                            <div className={styles.colorPickerHeader}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>Frame Color</span>
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleEyedropper('frameColor'); }}
                                        title="Pick Color from Screen"
                                    >
                                        <Pipette size={14} />
                                    </button>
                                </div>
                                <button onMouseDown={(e) => { e.stopPropagation(); setShowColorPicker(null); }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Hue Slider */}
                            <div className={styles.hueSliderContainer}>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={hue}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onChange={(e) => setHue(parseInt(e.target.value))}
                                    className={styles.hueSlider}
                                    style={{ background: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)` }}
                                />
                            </div>

                            <div className={styles.colorSwatches}>
                                {currentPalette.map(color => (
                                    <button
                                        key={color}
                                        className={styles.colorSwatch}
                                        style={{ backgroundColor: color }}
                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleColorChange(color); }}
                                        title={color}
                                    />
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <button
                                    className={styles.transparentButton}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleColorChange('transparent'); }}
                                    title="No Frame"
                                >
                                    None
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {element.type === 'button' && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowFrameShapePicker(!showFrameShapePicker); }}
                        title="Frame Shape"
                    >
                        <ImageIcon size={18} />
                    </button>
                    {showFrameShapePicker && (
                        <div className={styles.dropdown} onMouseDown={(e) => e.stopPropagation()}>
                            <button
                                className={`${styles.dropdownItem} ${!element.metadata?.frameShape ? styles.active : ''}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
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
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowAnimationPicker(!showAnimationPicker); }}
                    title="Animation"
                >
                    <Sparkles size={18} />
                </button>
                {showAnimationPicker && (
                    <div className={styles.dropdown} onMouseDown={(e) => e.stopPropagation()}>
                        {ANIMATIONS.map(anim => (
                            <button
                                key={anim.value}
                                className={`${styles.dropdownItem} ${element.styles.animation === anim.value ? styles.active : ''}`}
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAnimationChange(anim.value); }}
                            >
                                {anim.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Font Selector */}
            {showFontPicker && (element.type === 'text' || element.type === 'button' || element.type === 'long-text') && (
                <div className={styles.dropdown} onMouseDown={(e) => e.stopPropagation()}>
                    {FONTS.map(font => (
                        <button
                            key={font.value}
                            className={`${styles.dropdownItem} ${element.styles.fontFamily === font.value ? styles.active : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleFontChange(font.value); }}
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
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveLayer('front'); }}
                title="Move to Front"
            >
                <MoveUp size={18} />
            </button>
            <button
                className={styles.menuButton}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveLayer('back'); }}
                title="Move to Back"
            >
                <MoveDown size={18} />
            </button>

            {/* Delete */}
            <button
                className={`${styles.menuButton} ${styles.deleteButton}`}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};
