import React, { useState, useRef, useEffect } from 'react';
import type { ScreenElement } from '../types/model';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './styles.module.css';

const LongTextElement: React.FC<{
    element: ScreenElement;
    style: React.CSSProperties;
    mode: 'templatePreview' | 'editor' | 'export';
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
}> = ({ element, style, mode, isSelected, onMouseDown, onClick }) => {
    const { content, styles: elStyles } = element;

    return (
        <div
            className={styles.element}
            style={{
                ...style,
                padding: '16px',
                backgroundColor: elStyles.backgroundColor || 'rgba(255,255,255,0.9)',
                borderRadius: elStyles.borderRadius || 16,
                border: isSelected && mode === 'editor' ? '2px solid var(--color-primary)' : 'none',
                cursor: mode !== 'editor' ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
        >
            <div className={styles.longTextPlaceholder}>
                {content}
            </div>
        </div>
    );
};

interface Props {
    element: ScreenElement;
    mode: 'templatePreview' | 'editor' | 'export';
    isSelected?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onUpdate?: (id: string, changes: Partial<ScreenElement>) => void;
    screenType?: 'overlay' | 'content' | 'navigation'; // Screen type for safe area calculation
    device?: 'mobile' | 'desktop'; // Device type for responsive font sizing
}

export const ElementRenderer: React.FC<Props> = ({ element, mode, onClick, onUpdate, isSelected = false, screenType = 'overlay', device = 'mobile' }) => {
    const { type, position, size, content, styles: elStyles } = element;

    // Scale font sizes for mobile (9:16) to fit content better
    // Mobile needs smaller fonts to prevent overflow
    const isMobile = device === 'mobile';
    const fontScaleFactor = isMobile ? 0.7 : 1.0; // Scale down 30% on mobile
    const scaledFontSize = elStyles.fontSize ? elStyles.fontSize * fontScaleFactor : undefined;
    const elementRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const resizeHandleRef = useRef<string | null>(null);
    const pinchStartDistanceRef = useRef<number | null>(null);
    const pinchStartSizeRef = useRef<{ width: number; height: number } | null>(null);

    // Get animation class
    const getAnimationClass = () => {
        if (mode === 'editor') return ''; // Disable animations in editor for performance
        const animation = elStyles.animation;
        if (!animation || animation === 'none') return '';
        return styles[`elementAnimate${animation.charAt(0).toUpperCase() + animation.slice(1)}`] || '';
    };

    // Handle drag
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'editor' || isResizing) return;

        e.stopPropagation();
        // Select element immediately on mouse down (even if onUpdate is not available)
        onClick?.(e);

        // Only enable dragging if onUpdate is available
        if (!onUpdate) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = position.x;
        const startTop = position.y;
        dragStartRef.current = { x: startX, y: startY };

        const target = e.currentTarget as HTMLElement;
        const parent = target.offsetParent as HTMLElement;
        if (!parent) return;

        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;

        const handleMouseMove = (mv: MouseEvent) => {
            const dx = Math.abs(mv.clientX - startX);
            const dy = Math.abs(mv.clientY - startY);

            // Only start dragging if mouse moved more than 3px (to distinguish from click)
            if (dx > 3 || dy > 3) {
                mv.preventDefault();
                const dxPl = ((mv.clientX - startX) / parentWidth) * 100;
                const dyPl = ((mv.clientY - startY) / parentHeight) * 100;

                onUpdate(element.id, {
                    position: {
                        x: Math.min(100, Math.max(0, startLeft + dxPl)),
                        y: Math.min(100, Math.max(0, startTop + dyPl))
                    }
                });
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            dragStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Handle resize
    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        if (mode !== 'editor' || !onUpdate) return;
        e.stopPropagation();
        setIsResizing(true);
        resizeHandleRef.current = handle;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width || 20;
        const startHeight = size.height || 20;
        const startLeft = position.x;
        const startTop = position.y;

        const target = elementRef.current;
        const parent = target?.offsetParent as HTMLElement;
        if (!parent) return;

        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;

        const handleMouseMove = (mv: MouseEvent) => {
            mv.preventDefault();
            const dx = (mv.clientX - startX) / parentWidth * 100;
            const dy = (mv.clientY - startY) / parentHeight * 100;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            const maintainAspect = mv.shiftKey;

            if (handle.includes('e')) { // East (right)
                newWidth = Math.max(5, Math.min(95, startWidth + dx));
                if (maintainAspect) {
                    newHeight = (newWidth / startWidth) * startHeight;
                }
            }
            if (handle.includes('w')) { // West (left)
                newWidth = Math.max(5, Math.min(95, startWidth - dx));
                newLeft = Math.max(0, Math.min(95, startLeft + dx));
                if (maintainAspect) {
                    newHeight = (newWidth / startWidth) * startHeight;
                    newTop = startTop + (startHeight - newHeight);
                }
            }
            if (handle.includes('s')) { // South (bottom)
                newHeight = Math.max(5, Math.min(95, startHeight + dy));
                if (maintainAspect) {
                    newWidth = (newHeight / startHeight) * startWidth;
                }
            }
            if (handle.includes('n')) { // North (top)
                newHeight = Math.max(5, Math.min(95, startHeight - dy));
                newTop = Math.max(0, Math.min(95, startTop + dy));
                if (maintainAspect) {
                    newWidth = (newHeight / startHeight) * startWidth;
                    newLeft = startLeft + (startWidth - newWidth);
                }
            }

            onUpdate(element.id, {
                size: { width: newWidth, height: newHeight },
                position: { x: newLeft, y: newTop }
            });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            setIsResizing(false);
            resizeHandleRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Handle pinch-to-resize
    const handleTouchStart = (e: React.TouchEvent) => {
        if (mode !== 'editor' || !onUpdate || e.touches.length !== 2) return;
        e.stopPropagation();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );

        pinchStartDistanceRef.current = distance;
        pinchStartSizeRef.current = { width: size.width || 20, height: size.height || 20 };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (mode !== 'editor' || !onUpdate || e.touches.length !== 2 || !pinchStartDistanceRef.current || !pinchStartSizeRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );

        const scale = distance / pinchStartDistanceRef.current;
        const newWidth = Math.max(5, Math.min(95, pinchStartSizeRef.current.width * scale));
        const newHeight = Math.max(5, Math.min(95, pinchStartSizeRef.current.height * scale));

        onUpdate(element.id, {
            size: { width: newWidth, height: newHeight }
        });
    };

    const handleTouchEnd = () => {
        pinchStartDistanceRef.current = null;
        pinchStartSizeRef.current = null;
    };

    // Handle text content change
    const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
        if (!onUpdate) return;
        const newContent = e.currentTarget.textContent || '';
        onUpdate(element.id, { content: newContent });
    };

    // Auto-resize text elements - only when content or styles change
    const lastTriggerRef = useRef<string>('');
    const isResizingRef = useRef(false);
    const onUpdateRef = useRef(onUpdate);

    // Keep onUpdate ref up to date
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (type !== 'text' || !elementRef.current || !onUpdateRef.current || mode !== 'editor' || isResizingRef.current) return;

        // Create a trigger key from the values that should trigger recalculation
        const triggerKey = `${content}-${scaledFontSize}-${elStyles.fontFamily}`;

        // Skip if this exact combination was already processed
        if (lastTriggerRef.current === triggerKey) return;

        const element = elementRef.current;
        const textElement = element.querySelector('[contenteditable]') as HTMLElement;
        if (!textElement || !element.offsetParent) return;

        const measureDiv = document.createElement('div');
        measureDiv.style.position = 'absolute';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.whiteSpace = 'pre-wrap';
        measureDiv.style.fontSize = scaledFontSize ? `${scaledFontSize}px` : '24px';
        measureDiv.style.fontFamily = elStyles.fontFamily || 'inherit';
        measureDiv.style.width = '200px';
        measureDiv.textContent = content;
        document.body.appendChild(measureDiv);

        const parentWidth = element.offsetParent.clientWidth;
        const parentHeight = element.offsetParent.clientHeight;
        const calculatedWidth = Math.min(95, Math.max(10, (measureDiv.scrollWidth / parentWidth) * 100 + 2));
        const calculatedHeight = Math.min(95, Math.max(5, (measureDiv.scrollHeight / parentHeight) * 100 + 2));

        document.body.removeChild(measureDiv);

        // Only update if different from current size (with small threshold to avoid unnecessary updates)
        const currentWidth = size.width || 0;
        const currentHeight = size.height || 0;
        if (Math.abs(calculatedWidth - currentWidth) > 0.5 ||
            Math.abs(calculatedHeight - currentHeight) > 0.5) {
            lastTriggerRef.current = triggerKey;
            isResizingRef.current = true;
            onUpdateRef.current(element.id, {
                size: { width: calculatedWidth, height: calculatedHeight }
            });
            // Reset flag after state update completes
            requestAnimationFrame(() => {
                isResizingRef.current = false;
            });
        } else {
            // Even if size didn't change, mark this trigger as processed
            lastTriggerRef.current = triggerKey;
        }
    }, [content, scaledFontSize, elStyles.fontFamily, type, element.id, mode, device]);

    // Safe area calculation for content screens
    // Navigation bar: 60px ≈ 10% on mobile (accounts for nav bar)
    // Next button: ~80px ≈ 15% from bottom (accounts for next button area)
    // Safe area: top 10% to bottom 85% (75% available height)
    const isContentScreen = screenType === 'content';
    const safeAreaTop = 10;      // 10% from top (below nav bar)
    const safeAreaBottom = 85;   // 85% from top (above next button)
    const safeAreaHeight = safeAreaBottom - safeAreaTop; // 75% available height

    // Adjust position and size for content screens
    let adjustedY = position.y;
    let adjustedHeight = size.height;

    if (isContentScreen) {
        // Map element's y position (0-100%) to safe area (10-85%)
        // Element at y: 0% → renders at y: 10% (top of safe area)
        // Element at y: 100% → renders at y: 85% (bottom of safe area)
        adjustedY = safeAreaTop + (position.y / 100) * safeAreaHeight;

        // Scale element height proportionally to safe area
        if (adjustedHeight) {
            adjustedHeight = (adjustedHeight / 100) * safeAreaHeight;
        }
    }

    const style: React.CSSProperties = {
        left: `${position.x}%`,
        top: `${adjustedY}%`,
        width: size.width ? `${size.width}%` : 'auto',
        height: adjustedHeight ? `${adjustedHeight}%` : 'auto',
        color: elStyles.color,
        backgroundColor: elStyles.backgroundColor,
        fontSize: scaledFontSize ? `${scaledFontSize}px` : undefined,
        fontWeight: elStyles.fontWeight,
        fontFamily: elStyles.fontFamily,
        textAlign: elStyles.textAlign,
        borderRadius: elStyles.borderRadius,
        opacity: elStyles.opacity,
        transform: elStyles.rotation ? `rotate(${elStyles.rotation}deg)` : undefined,
        zIndex: elStyles.zIndex || 10,
        boxShadow: elStyles.shadow ? 'var(--shadow-md)' : undefined,
        textDecoration: elStyles.textDecoration,
        fontStyle: elStyles.fontStyle,
        cursor: mode === 'editor' && !isResizing ? 'move' : (type === 'button' || type === 'image' || type === 'gallery' || type === 'long-text') ? 'pointer' : 'default',
        border: isSelected && mode === 'editor' ? '2px solid var(--color-primary)' : 'none',
    };

    const handleInteraction = (e: React.MouseEvent) => {
        // In editor mode, allow clicks for selection (but not for navigation/interaction)
        if (mode === 'editor') {
            // Only select if not dragging (mouse hasn't moved much)
            if (onClick) onClick(e);
        } else {
            // In preview/export mode, handle normal interactions
            if (onClick) onClick(e);
        }
    };

    // Render resize handles
    const renderResizeHandles = () => {
        if (mode !== 'editor' || !isSelected) return null;

        const handles = [
            { id: 'nw', pos: { top: '-6px', left: '-6px' }, cursor: 'nw-resize' },
            { id: 'n', pos: { top: '-6px', left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize' },
            { id: 'ne', pos: { top: '-6px', right: '-6px' }, cursor: 'ne-resize' },
            { id: 'e', pos: { top: '50%', right: '-6px', transform: 'translateY(-50%)' }, cursor: 'e-resize' },
            { id: 'se', pos: { bottom: '-6px', right: '-6px' }, cursor: 'se-resize' },
            { id: 's', pos: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize' },
            { id: 'sw', pos: { bottom: '-6px', left: '-6px' }, cursor: 'sw-resize' },
            { id: 'w', pos: { top: '50%', left: '-6px', transform: 'translateY(-50%)' }, cursor: 'w-resize' },
        ];

        return (
            <>
                {handles.map(handle => (
                    <div
                        key={handle.id}
                        className={styles.resizeHandle}
                        style={{
                            position: 'absolute',
                            ...handle.pos,
                            width: '12px',
                            height: '12px',
                            backgroundColor: 'var(--color-primary)',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: handle.cursor,
                            zIndex: 10001,
                        }}
                        onMouseDown={(e) => handleResizeStart(e, handle.id)}
                    />
                ))}
            </>
        );
    };

    const commonProps: any = {
        ref: elementRef,
        className: `${styles.element} ${type === 'text' ? styles.elementText : ''} ${type === 'image' ? styles.elementImage : ''} ${type === 'button' ? styles.elementButton : ''} ${getAnimationClass()}`,
        style: {
            ...style,
            padding: elStyles.backgroundColor && type === 'text' ? '12px 16px' : undefined,
            display: type === 'text' && elStyles.backgroundColor ? 'flex' : undefined,
            pointerEvents: mode === 'editor' ? 'auto' : undefined, // Ensure elements are clickable in editor mode
        },
        'data-type': type,
        'data-element-id': element.id,
        onMouseDown: handleMouseDown,
        onClick: handleInteraction,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };

    switch (type) {
        case 'text':
            const hasBackground = !!elStyles.backgroundColor;
            const showBorderWrapper = isSelected && mode === 'editor';

            // For text without background and not selected, keep original layout but remove visible box
            if (!hasBackground && !showBorderWrapper) {
                // Use original commonProps structure but override className to exclude elementText
                // and ensure no visible border/background/boxShadow
                const noBoxTextClassName = `${styles.element} ${getAnimationClass()}`;

                const noBoxTextStyle = {
                    ...commonProps.style,
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                    // Use flex for proper alignment like elementText class, but without the class
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: elStyles.textAlign === 'center' ? 'center' : elStyles.textAlign === 'right' ? 'flex-end' : 'flex-start',
                };

                return (
                    <div
                        ref={elementRef}
                        id={`element-${element.id}`}
                        role="textbox"
                        aria-label="Text Element"
                        className={noBoxTextClassName}
                        contentEditable={isSelected && mode === 'editor'}
                        onInput={handleTextChange}
                        suppressContentEditableWarning
                        style={noBoxTextStyle}
                        data-type={type}
                        data-element-id={element.id}
                        onMouseDown={handleMouseDown}
                        onClick={handleInteraction}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {content}
                        {renderResizeHandles()}
                    </div>
                );
            }

            // For text with background or when selected, use wrapper for border/padding
            return (
                <div
                    {...commonProps}
                    style={{
                        ...commonProps.style,
                        border: 'none', // Border will be on inner wrapper if selected
                        display: hasBackground ? 'flex' : (showBorderWrapper ? 'flex' : undefined),
                        alignItems: hasBackground || showBorderWrapper ? 'center' : undefined,
                        justifyContent: hasBackground || showBorderWrapper ? (elStyles.textAlign === 'center' ? 'center' : elStyles.textAlign === 'right' ? 'flex-end' : 'flex-start') : undefined,
                    }}
                >
                    <div
                        id={`element-${element.id}`}
                        role="textbox"
                        aria-label="Text Element"
                        contentEditable={isSelected && mode === 'editor'}
                        onInput={handleTextChange}
                        suppressContentEditableWarning
                        style={{
                            outline: 'none',
                            border: showBorderWrapper ? '2px solid var(--color-primary)' : 'none',
                            padding: showBorderWrapper ? '4px 8px' : (hasBackground ? '12px 16px' : '0'),
                            backgroundColor: elStyles.backgroundColor,
                            borderRadius: elStyles.borderRadius,
                            display: 'inline-block',
                            width: showBorderWrapper ? 'fit-content' : undefined,
                            minWidth: showBorderWrapper ? 'fit-content' : undefined,
                            maxWidth: '100%',
                        }}
                    >
                        {content}
                    </div>
                    {renderResizeHandles()}
                </div>
            );

        case 'image':
            const hasTitle = element.metadata?.title && element.metadata.title.trim() !== '';
            const hasSubtitle = element.metadata?.subtitle && element.metadata.subtitle.trim() !== '';
            if (hasTitle || hasSubtitle || elStyles.frameColor) {
                return (
                    <div
                        {...commonProps}
                        style={{
                            ...commonProps.style,
                            border: elStyles.frameColor ? `4px solid ${elStyles.frameColor}` : 'none',
                            padding: elStyles.frameColor ? '8px' : '0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: elStyles.backgroundColor || 'transparent',
                        }}
                    >
                        {hasTitle && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                textAlign: 'center',
                                marginBottom: '4px',
                            }}>
                                {element.metadata?.title}
                            </div>
                        )}
                        <img
                            src={content}
                            alt="Element"
                            loading="eager"
                            decoding="async"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                borderRadius: 4
                            }}
                            draggable={false}
                            onLoad={(e) => {
                                // Optionally adjust element size based on image aspect ratio
                                if (mode === 'editor' && onUpdate && elementRef.current) {
                                    const img = e.currentTarget;
                                    const naturalWidth = img.naturalWidth;
                                    const naturalHeight = img.naturalHeight;

                                    if (naturalWidth > 0 && naturalHeight > 0) {
                                        const aspectRatio = naturalWidth / naturalHeight;
                                        const parent = elementRef.current.offsetParent as HTMLElement;
                                        if (parent) {
                                            const parentWidth = parent.clientWidth;
                                            const parentHeight = parent.clientHeight;
                                            const currentWidthPercent = size.width || 80;
                                            const currentHeightPercent = size.height || 45;

                                            // Calculate what height would maintain aspect ratio
                                            const currentWidthPx = (currentWidthPercent / 100) * parentWidth;
                                            const idealHeightPx = currentWidthPx / aspectRatio;
                                            const idealHeightPercent = (idealHeightPx / parentHeight) * 100;

                                            // Only update if the difference is significant (more than 5%)
                                            if (Math.abs(idealHeightPercent - currentHeightPercent) > 5) {
                                                // Don't auto-resize, let user manually adjust if needed
                                                // This is just for reference - we keep contain to show full image
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                        {hasSubtitle && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                marginTop: '4px',
                            }}>
                                {element.metadata?.subtitle}
                            </div>
                        )}
                        {renderResizeHandles()}
                    </div>
                );
            }
            return (
                <div {...commonProps} style={{
                    ...commonProps.style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: elStyles.backgroundColor || 'transparent',
                }}>
                    <img
                        src={content}
                        alt="Element"
                        loading="eager"
                        decoding="async"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center',
                        }}
                        draggable={false}
                    />
                    {renderResizeHandles()}
                </div>
            );

        case 'button':
            const buttonSticker = element.metadata?.sticker;
            return (
                <div
                    {...commonProps}
                    style={{
                        ...commonProps.style,
                        border: 'none', // Border will be on inner button
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <button
                        className={`${styles.elementButton} ${getAnimationClass()}`}
                        style={{
                            border: isSelected && mode === 'editor' ? '2px solid var(--color-primary)' : undefined,
                            padding: '12px 24px',
                            width: 'fit-content',
                            minWidth: 'fit-content',
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        {content}
                        {buttonSticker && <span>{buttonSticker}</span>}
                    </button>
                    {renderResizeHandles()}
                </div>
            );

        case 'sticker':
            return (
                <div {...commonProps} style={{ ...commonProps.style, fontSize: `${elStyles.fontSize || 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {content}
                    {renderResizeHandles()}
                </div>
            );

        case 'long-text':
            return (
                <>
                    <LongTextElement
                        element={element}
                        style={commonProps.style}
                        mode={mode}
                        isSelected={isSelected}
                        onMouseDown={handleMouseDown}
                        onClick={handleInteraction}
                    />
                    {renderResizeHandles()}
                </>
            );

        case 'gallery':
            let images: string[] = [];
            try {
                images = JSON.parse(content);
                if (!Array.isArray(images)) images = [content];
            } catch (e) {
                images = [content];
            }

            // Initialize current index to middle image
            const [currentImageIndex, setCurrentImageIndex] = useState<number>(
                Math.floor(images.length / 2)
            );
            const thumbnailCarouselRef = useRef<HTMLDivElement>(null);

            // Scroll carousel to center current image
            useEffect(() => {
                if (thumbnailCarouselRef.current && images.length > 0) {
                    const thumbnailWidth = 60; // Approximate thumbnail width + gap
                    const scrollPosition = (currentImageIndex - 2) * thumbnailWidth;
                    thumbnailCarouselRef.current.scrollTo({
                        left: Math.max(0, scrollPosition),
                        behavior: 'smooth'
                    });
                }
            }, [currentImageIndex, images.length]);

            const handlePrev = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (images.length > 0) {
                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                }
            };

            const handleNext = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (images.length > 0) {
                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                }
            };

            const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
            };

            const galleryTitle = element.metadata?.title && element.metadata.title.trim() !== '';
            const gallerySubtitle = element.metadata?.subtitle && element.metadata.subtitle.trim() !== '';
            const isInteractive = mode !== 'editor';

            return (
                <div
                    {...commonProps}
                    style={{
                        ...commonProps.style,
                        display: 'flex',
                        flexDirection: 'column',
                        border: elStyles.frameColor ? `4px solid ${elStyles.frameColor}` : 'none',
                        padding: elStyles.frameColor ? '8px' : '4px',
                        overflow: 'hidden',
                        backgroundColor: elStyles.backgroundColor || 'transparent',
                    }}
                >
                    {galleryTitle && (
                        <div style={{
                            padding: '4px 8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: '4px',
                        }}>
                            {element.metadata?.title}
                        </div>
                    )}

                    {/* Hero Image with Navigation */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        flex: 1,
                        minHeight: '60%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: 8,
                        overflow: 'hidden',
                        marginBottom: '8px',
                    }}>
                        {images.length > 0 && (
                            <img
                                src={images[currentImageIndex]}
                                alt={`Gallery ${currentImageIndex + 1}`}
                                loading="eager"
                                decoding="async"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    objectPosition: 'center',
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Navigation Arrows */}
                        {isInteractive && images.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    style={{
                                        position: 'absolute',
                                        left: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white',
                                        zIndex: 10,
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                                    }}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={handleNext}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white',
                                        zIndex: 10,
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                                    }}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Carousel */}
                    {images.length > 1 && (
                        <div
                            ref={thumbnailCarouselRef}
                            style={{
                                display: 'flex',
                                gap: '6px',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                padding: '4px 0',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#ccc transparent',
                                WebkitOverflowScrolling: 'touch',
                            }}
                            onWheel={(e) => {
                                if (e.deltaY !== 0) {
                                    e.currentTarget.scrollLeft += e.deltaY;
                                    e.preventDefault();
                                }
                            }}
                        >
                            {images.map((src, index) => (
                                <div
                                    key={index}
                                    onClick={isInteractive ? (e) => handleThumbnailClick(index, e) : undefined}
                                    style={{
                                        flexShrink: 0,
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        cursor: isInteractive ? 'pointer' : 'default',
                                        border: currentImageIndex === index ? '3px solid var(--color-primary)' : '2px solid transparent',
                                        opacity: currentImageIndex === index ? 1 : 0.7,
                                        transition: 'all 0.2s',
                                        backgroundColor: '#f0f0f0',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isInteractive && currentImageIndex !== index) {
                                            e.currentTarget.style.opacity = '0.9';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isInteractive && currentImageIndex !== index) {
                                            e.currentTarget.style.opacity = '0.7';
                                        }
                                    }}
                                >
                                    <img
                                        src={src}
                                        alt={`Thumbnail ${index + 1}`}
                                        loading="eager"
                                        decoding="async"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {gallerySubtitle && (
                        <div style={{
                            padding: '4px 8px',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            marginTop: '4px',
                        }}>
                            {element.metadata?.subtitle}
                        </div>
                    )}
                    {renderResizeHandles()}
                </div>
            );

        case 'video':
            const videoTitle = element.metadata?.title && element.metadata.title.trim() !== '';
            const videoSubtitle = element.metadata?.subtitle && element.metadata.subtitle.trim() !== '';
            if (videoTitle || videoSubtitle || elStyles.frameColor) {
                return (
                    <div
                        {...commonProps}
                        style={{
                            ...commonProps.style,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: elStyles.frameColor ? `4px solid ${elStyles.frameColor}` : 'none',
                            padding: elStyles.frameColor ? '8px' : '0',
                            backgroundColor: elStyles.backgroundColor || 'transparent',
                        }}
                    >
                        {videoTitle && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                textAlign: 'center',
                                marginBottom: '4px',
                            }}>
                                {element.metadata?.title}
                            </div>
                        )}
                        <video
                            src={content}
                            controls
                            preload="metadata"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                objectPosition: 'center',
                                borderRadius: 4
                            }}
                            draggable={false}
                        />
                        {videoSubtitle && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                marginTop: '4px',
                            }}>
                                {element.metadata?.subtitle}
                            </div>
                        )}
                        {renderResizeHandles()}
                    </div>
                );
            }
            return (
                <div {...commonProps} style={{
                    ...commonProps.style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: elStyles.backgroundColor || 'transparent',
                }}>
                    <video
                        src={content}
                        controls
                        preload="metadata"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center',
                        }}
                        draggable={false}
                    />
                    {renderResizeHandles()}
                </div>
            );

        case 'long-text':
            const longTextTitle = element.metadata?.title && element.metadata.title.trim() !== '';
            const longTextSubtitle = element.metadata?.subtitle && element.metadata.subtitle.trim() !== '';
            if (longTextTitle || longTextSubtitle || elStyles.frameColor) {
                return (
                    <div
                        {...commonProps}
                        style={{
                            ...commonProps.style,
                            display: 'flex',
                            flexDirection: 'column',
                            border: elStyles.frameColor ? `4px solid ${elStyles.frameColor}` : 'none',
                            padding: elStyles.frameColor ? '8px' : '12px',
                        }}
                    >
                        {longTextTitle && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                textAlign: 'center',
                                marginBottom: '4px',
                            }}>
                                {element.metadata?.title}
                            </div>
                        )}
                        <LongTextElement
                            element={element}
                            style={style}
                            mode={mode}
                            isSelected={isSelected}
                            onMouseDown={handleMouseDown}
                            onClick={handleInteraction}
                        />
                        {longTextSubtitle && (
                            <div style={{
                                padding: '4px 8px',
                                fontSize: '0.85rem',
                                textAlign: 'center',
                                marginTop: '4px',
                            }}>
                                {element.metadata?.subtitle}
                            </div>
                        )}
                        {renderResizeHandles()}
                    </div>
                );
            }
            return (
                <LongTextElement
                    element={element}
                    style={style}
                    mode={mode}
                    isSelected={isSelected}
                    onMouseDown={handleMouseDown}
                    onClick={handleInteraction}
                />
            );

        case 'shape':
            const isCircle = elStyles.borderRadius && elStyles.borderRadius >= 50;
            return (
                <div
                    {...commonProps}
                    style={{
                        ...commonProps.style,
                        backgroundColor: elStyles.backgroundColor || '#ccc',
                        borderRadius: isCircle ? '50%' : `${elStyles.borderRadius || 0}px`,
                    }}
                >
                    {renderResizeHandles()}
                </div>
            );

        default:
            return null;
    }
};
