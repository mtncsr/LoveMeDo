import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import type { ScreenElement } from '../types/model';
import {
    Trash2, Type, Palette, MoveUp, MoveDown, 
    Bold, Underline, Italic, Minus, Plus,
    Sparkles, Image as ImageIcon, X, FolderOpen,
    AlignLeft, AlignCenter, AlignRight, GripVertical
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
    const { activeScreenId, setSelectedElementId, setMediaLibraryOpen } = useUIStore();
    const { updateElement, removeElement } = useProjectStore();
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // 'color' | 'backgroundColor' | 'frameColor' | null
    const [showAnimationPicker, setShowAnimationPicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showFrameShapePicker, setShowFrameShapePicker] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [isPositioned, setIsPositioned] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isManuallyPositioned, setIsManuallyPositioned] = useState(false);

    // Handle dragging
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newLeft = e.clientX - dragOffset.x;
            const newTop = e.clientY - dragOffset.y;
            
            // Clamp to viewport bounds
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const menuRect = menuRef.current?.getBoundingClientRect();
            
            if (menuRect) {
                const padding = 8;
                const minLeft = padding;
                const maxLeft = viewportWidth - menuRect.width - padding;
                const minTop = padding;
                const maxTop = viewportHeight - menuRect.height - padding;
                
                setMenuPosition({
                    left: Math.max(minLeft, Math.min(maxLeft, newLeft)),
                    top: Math.max(minTop, Math.min(maxTop, newTop))
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsManuallyPositioned(true);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Reset manual positioning when element changes
    useEffect(() => {
        setIsManuallyPositioned(false);
    }, [element.id]);

    // Position menu below element by finding it in the DOM
    // Menu can render anywhere on the canvas, not just within the preview window
    useEffect(() => {
        // Don't auto-position if user has manually dragged the menu
        if (isManuallyPositioned) return;
        
        setIsPositioned(false);
        
        const findElement = () => {
            // For hidden navigation button elements, find the automatic next button instead
            let elementEl: HTMLElement | null = null;
            if (element.type === 'button' && element.metadata?.action === 'navigate' && element.metadata?.target === 'next' && element.metadata?.hidden) {
                // Find the automatic next button by data attribute
                elementEl = document.querySelector(`[data-automatic-next-button="true"][data-nav-button-id="${element.id}"]`) as HTMLElement;
            } else {
                // Find the element by data attribute
                elementEl = document.querySelector(`[data-element-id="${element.id}"]`) as HTMLElement;
            }
            if (elementEl && menuRef.current) {
                // Get viewport dimensions to prevent scrolling
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                const elementRect = elementEl.getBoundingClientRect();
                const menuRect = menuRef.current.getBoundingClientRect();
                
                const padding = 8; // Padding between element and menu
                
                // Use viewport coordinates (getBoundingClientRect gives us viewport-relative positions)
                const elementTop = elementRect.top;
                const elementBottom = elementRect.bottom;
                const elementLeft = elementRect.left;
                const elementRight = elementRect.right;
                const elementCenterX = elementRect.left + elementRect.width / 2;
                const elementCenterY = elementRect.top + elementRect.height / 2;
                
                // Check available space in viewport
                const spaceBelow = viewportHeight - elementBottom;
                const spaceAbove = elementTop;
                const spaceRight = viewportWidth - elementRight;
                const spaceLeft = elementLeft;
                
                let top: number;
                let left: number;
                
                // Smart positioning: prefer below, but use side if no room
                if (spaceBelow >= menuRect.height + padding) {
                    // Enough space below - position below element
                    top = elementBottom + padding;
                    left = elementCenterX - (menuRect.width / 2);
                } else if (spaceAbove >= menuRect.height + padding) {
                    // Not enough space below, but enough above - position above element
                    top = elementTop - menuRect.height - padding;
                    left = elementCenterX - (menuRect.width / 2);
                } else {
                    // Not enough space above or below - position to the side
                    if (spaceRight >= menuRect.width + padding) {
                        // Position to the right
                        top = elementCenterY - (menuRect.height / 2);
                        left = elementRight + padding;
                    } else if (spaceLeft >= menuRect.width + padding) {
                        // Position to the left
                        top = elementCenterY - (menuRect.height / 2);
                        left = elementLeft - menuRect.width - padding;
                    } else {
                        // Fallback: position below element, but adjust to stay in viewport
                        top = elementBottom + padding;
                        left = elementCenterX - (menuRect.width / 2);
                    }
                }
                
                // Clamp to viewport bounds to prevent scrolling
                const minLeft = padding;
                const maxLeft = viewportWidth - menuRect.width - padding;
                const minTop = padding;
                const maxTop = viewportHeight - menuRect.height - padding;
                
                const clampedLeft = Math.max(minLeft, Math.min(maxLeft, left));
                const clampedTop = Math.max(minTop, Math.min(maxTop, top));
                
                setMenuPosition({
                    top: clampedTop,
                    left: clampedLeft
                });
                setIsPositioned(true);
            }
        };

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                findElement();
            });
        });
        
        const interval = setInterval(findElement, 100);
        window.addEventListener('resize', findElement);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', findElement);
        };
    }, [element.id, isManuallyPositioned]);

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

    const handleDragStart = (e: React.MouseEvent) => {
        if (!menuRef.current) return;
        
        const menuRect = menuRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - menuRect.left,
            y: e.clientY - menuRect.top
        });
        setIsDragging(true);
        e.preventDefault();
        e.stopPropagation();
    };

    const renderTextFeatures = () => (
        <>
            {/* Only show Edit Text button for text and long-text, not for buttons (buttons are directly editable) */}
            {(element.type === 'text' || element.type === 'long-text') && (
                <button
                    className={styles.menuButton}
                    onClick={handleEditText}
                    title="Edit Text"
                >
                    <Type size={18} />
                </button>
            )}
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
        <div
            ref={menuRef}
            className={styles.menu}
            data-editing-menu="true"
            style={{
                position: 'fixed', // Use fixed positioning to render on top of entire canvas
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                opacity: isPositioned ? 1 : 0,
                pointerEvents: isPositioned ? 'auto' : 'none',
                zIndex: 10000, // High z-index to ensure it's on top
                cursor: isDragging ? 'grabbing' : 'default',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Drag Handle */}
            <div
                ref={dragHandleRef}
                className={styles.dragHandle}
                onMouseDown={handleDragStart}
                title="Drag to reposition"
            >
                <GripVertical size={14} />
            </div>

            {/* Top Row: All Icon Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
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

                {/* Contents Button (for all content items: image, video, gallery) */}
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
                                onChange={(e) => {
                                    setShowColorPicker('frameColor');
                                    handleColorChange(e.target.value);
                                }}
                                className={styles.colorInput}
                            />
                        </div>
                    )}
                </div>
                )}

                {/* Frame Shape (for buttons) */}
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

                {/* Frame Color (for buttons with frames) */}
                {element.type === 'button' && element.metadata?.frameShape && (
                <div className={styles.dropdownContainer}>
                    <button
                        className={styles.menuButton}
                        onClick={() => setShowColorPicker(showColorPicker === 'frameColor' ? null : 'frameColor')}
                        title="Frame Color"
                    >
                        <Palette size={18} />
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
                                    setShowColorPicker('frameColor');
                                    handleColorChange(e.target.value);
                                }}
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

            {/* Bottom Row: Title/Subtitle Inputs (only for certain element types) */}
            {(element.type === 'image' || element.type === 'video' || element.type === 'gallery' || element.type === 'long-text') && (
                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={element.metadata?.title || ''}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className={styles.textInput}
                        style={{ flex: '1 1 auto', minWidth: '80px' }}
                    />
                    <input
                        type="text"
                        placeholder="Subtitle"
                        value={element.metadata?.subtitle || ''}
                        onChange={(e) => handleSubtitleChange(e.target.value)}
                        className={styles.textInput}
                        style={{ flex: '1 1 auto', minWidth: '80px' }}
                    />
                </div>
            )}
        </div>
    );
};

