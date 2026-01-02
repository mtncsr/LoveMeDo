import React, { useState, useRef, useEffect } from 'react';
import type { ScreenElement, Project } from '../types/model';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './styles.module.css';

// Detect if text contains RTL characters (Hebrew, Arabic, etc.)
const detectTextDirection = (text: string): 'ltr' | 'rtl' => {
    if (!text) return 'ltr';
    // Hebrew: \u0590-\u05FF, Arabic: \u0600-\u06FF, etc.
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text) ? 'rtl' : 'ltr';
};

// Convert newlines to HTML breaks for rendering
const newlinesToHtml = (text: string): string => {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
};

const LongTextElement: React.FC<{
    element: ScreenElement;
    style: React.CSSProperties;
    mode: 'templatePreview' | 'editor' | 'export';
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    onUpdate?: (id: string, changes: Partial<ScreenElement>) => void;
}> = ({ element, mode, isSelected, onMouseDown, onClick, onUpdate }) => {
    const { content, styles: elStyles, size } = element;
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef(content);
    const hasInitializedFocusRef = useRef(false);

    // Sync contentRef
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Update DOM only if content changes externally
    useEffect(() => {
        if (ref.current && !(isSelected && mode === 'editor' && document.activeElement === ref.current)) {
            // Use innerText to preserve newlines when setting content
            if (ref.current.innerText !== content) {
                ref.current.innerText = content || '';
            }
        }
    }, [content, isSelected, mode]);

    const isEditable = isSelected && mode === 'editor';
    const [isFocused, setIsFocused] = useState(false);

    // Calculate approximate line count for ellipsis (only when not editable)
    useEffect(() => {
        if (ref.current && ref.current.parentElement && !isEditable && mode !== 'editor') {
            const containerHeight = ref.current.parentElement.clientHeight;
            const fontSize = elStyles.fontSize ? parseFloat(String(elStyles.fontSize)) : 16;
            const lineHeight = fontSize * 1.5; // Approximate line height
            const maxLines = Math.floor(containerHeight / lineHeight);
            // Set a reasonable max (between 5 and 50 lines)
            const clampedLines = Math.max(5, Math.min(50, maxLines));
            if (ref.current) {
                ref.current.style.setProperty('-webkit-line-clamp', String(clampedLines));
                ref.current.style.setProperty('line-clamp', String(clampedLines));
            }
        } else if (ref.current && isEditable) {
            // When editable, remove line-clamp to allow full editing
            ref.current.style.removeProperty('-webkit-line-clamp');
            ref.current.style.removeProperty('line-clamp');
        }
    }, [size, elStyles.fontSize, isSelected, mode, isEditable]);

    // Focus contentEditable when element becomes selected
    useEffect(() => {
        // Only initialize focus when element first becomes selected
        if (isSelected && mode === 'editor' && ref.current && ref.current.contentEditable === 'true' && !hasInitializedFocusRef.current) {
            requestAnimationFrame(() => {
                if (ref.current && ref.current.contentEditable === 'true') {
                    ref.current.focus();
                    // Set cursor to end of text only on initial selection
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (sel && ref.current.childNodes.length > 0) {
                        range.selectNodeContents(ref.current);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    hasInitializedFocusRef.current = true;
                }
            });
        } else if (!isSelected) {
            setIsFocused(false);
            hasInitializedFocusRef.current = false;
        }
    }, [isSelected, mode, element.id]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!onUpdate) return;
        // Use innerText to preserve line breaks as \n characters
        const newContent = e.currentTarget.innerText || '';
        if (newContent !== contentRef.current) {
            onUpdate(element.id, { content: newContent });
        }
    };

    // Return just the contentEditable div - no container wrapper
    return (
        <div
            ref={ref}
            className={styles.longTextPlaceholder}
            data-element-id={element.id}
            data-type="long-text"
            contentEditable={isEditable}
            onInput={handleInput}
            onMouseDown={onMouseDown}
            onClick={(e) => {
                // Only stop propagation when editing text, not when selecting
                if (!isEditable) {
                    onClick(e);
                } else {
                    e.stopPropagation();
                }
            }}
            onFocus={() => {
                setIsFocused(true);
            }}
            onBlur={(e) => {
                setIsFocused(false);
                if (isSelected && mode === 'editor' && ref.current) {
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    const clickedOnMenu = relatedTarget?.closest('[data-editing-menu]');
                    const clickedOnResizeHandle = relatedTarget?.closest('[class*="resizeHandle"]');
                    if (!clickedOnMenu && !clickedOnResizeHandle) {
                        setTimeout(() => {
                            if (isSelected && ref.current && document.activeElement !== ref.current) {
                                ref.current.focus();
                            }
                        }, 0);
                    }
                }
            }}
            suppressContentEditableWarning
            style={{
                color: elStyles.color,
                fontSize: elStyles.fontSize ? `${elStyles.fontSize}px` : undefined,
                fontFamily: elStyles.fontFamily,
                fontWeight: elStyles.fontWeight,
                textAlign: elStyles.textAlign || 'left',
                outline: 'none',
                width: '100%',
                height: '100%',
                minHeight: 0,
                padding: '16px',
                backgroundColor: elStyles.backgroundColor || 'rgba(255,255,255,0.9)',
                borderRadius: elStyles.borderRadius || 16,
                cursor: mode !== 'editor' ? 'pointer' : (isFocused ? 'text' : 'move'),
                boxSizing: 'border-box',
            }}
        />
    );
};

// Internal component for safe contentEditable handling of buttons
const EditableButton: React.FC<{
    element: ScreenElement;
    mode: 'templatePreview' | 'editor' | 'export';
    isSelected: boolean;
    onUpdate?: (id: string, changes: Partial<ScreenElement>) => void;
    commonProps: any;
    renderResizeHandles: () => React.ReactNode;
    buttonStyle: React.CSSProperties;
    buttonClassName: string;
    sticker?: string;
}> = ({ element, mode, isSelected, onUpdate, commonProps, renderResizeHandles, buttonStyle, buttonClassName, sticker }) => {
    const { content } = element;
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef(content);

    // Sync contentRef
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Initialize content when element becomes editable
    useEffect(() => {
        if (ref.current && ref.current.contentEditable === 'true' && !ref.current.innerText && content) {
            ref.current.innerText = content;
        }
    }, [content, isSelected, mode]);

    // Update DOM only if content changes externally (not from our own typing)
    useEffect(() => {
        if (ref.current && ref.current.contentEditable === 'true') {
            // Only update if content changed externally (not when focused/editing)
            if (ref.current.innerText !== content && !(isSelected && mode === 'editor' && document.activeElement === ref.current)) {
                ref.current.innerText = content || '';
            }
        }
    }, [content, isSelected, mode]);

    // Track if we've already initialized focus to avoid resetting cursor position
    const hasInitializedFocusRef = useRef(false);

    // Initialize and focus contentEditable when element becomes selected
    useEffect(() => {
        // Initialize and focus the contentEditable when element becomes selected
        if (isSelected && mode === 'editor' && ref.current && ref.current.contentEditable === 'true' && !hasInitializedFocusRef.current) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                if (ref.current && ref.current.contentEditable === 'true') {
                    // Initialize content if empty
                    if (!ref.current.innerText && content) {
                        ref.current.innerText = content;
                    }
                    ref.current.focus();
                    // Set cursor to end of text only on initial selection
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (sel && ref.current.childNodes.length > 0) {
                        range.selectNodeContents(ref.current);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    hasInitializedFocusRef.current = true;
                }
            });
        } else if (!isSelected) {
            // Reset flag when element is deselected
            hasInitializedFocusRef.current = false;
        }
    }, [isSelected, mode, element.id]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!onUpdate) return;
        // Use innerText to preserve line breaks as \n characters
        const newContent = e.currentTarget.innerText || '';
        // Optimization: Don't trigger update if same
        if (newContent !== contentRef.current) {
            onUpdate(element.id, { content: newContent });
        }
    };

    const textDirection = detectTextDirection(content);
    const isEditable = isSelected && mode === 'editor';

    // When editing, use a div styled like a button. Otherwise use a real button element.
    if (isEditable) {
        // In editor mode when selected, use div styled as button for contentEditable
        return (
            <div
                {...commonProps}
                style={{
                    ...commonProps.style,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    className={buttonClassName}
                    style={buttonStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <div
                        ref={ref}
                        contentEditable={true}
                        onInput={handleInput}
                        onBlur={(e) => {
                            // If element is still selected and blur wasn't caused by clicking on menu/controls, refocus
                            if (isSelected && mode === 'editor' && ref.current) {
                                const relatedTarget = e.relatedTarget as HTMLElement;
                                // Don't refocus if user clicked on editing menu or resize handles
                                const clickedOnMenu = relatedTarget?.closest('[data-editing-menu]');
                                const clickedOnResizeHandle = relatedTarget?.closest('[class*="resizeHandle"]');
                                if (!clickedOnMenu && !clickedOnResizeHandle) {
                                    // Use setTimeout to allow the blur to complete, then refocus
                                    setTimeout(() => {
                                        if (isSelected && ref.current && document.activeElement !== ref.current) {
                                            ref.current.focus();
                                        }
                                    }, 0);
                                }
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        suppressContentEditableWarning
                        style={{
                            outline: 'none',
                            border: 'none',
                            background: 'transparent',
                            width: '100%',
                            direction: textDirection,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                        }}
                    />
                    {sticker && <span>{sticker}</span>}
                </div>
                {renderResizeHandles()}
            </div>
        );
    }

    // In preview/export mode, use actual button element
    return (
        <div
            {...commonProps}
            style={{
                ...commonProps.style,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <button
                className={buttonClassName}
                style={buttonStyle}
                onClick={(e) => {
                    // In editor mode, prevent default button behavior
                    if (mode === 'editor') {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                {content}
                {sticker && <span>{sticker}</span>}
            </button>
            {renderResizeHandles()}
        </div>
    );
};

// Internal component for safe contentEditable handling
const EditableText: React.FC<{
    element: ScreenElement;
    mode: 'templatePreview' | 'editor' | 'export';
    isSelected: boolean;
    onUpdate?: (id: string, changes: Partial<ScreenElement>) => void;
    commonProps: any;
    renderResizeHandles: () => React.ReactNode;
}> = ({ element, mode, isSelected, onUpdate, commonProps, renderResizeHandles }) => {
    const { content, styles: elStyles } = element;
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef(content);

    // Sync contentRef
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Update DOM only if content changes externally (not from our own typing)
    useEffect(() => {
        if (ref.current) {
            // If contentEditable is enabled and element is empty, initialize it with content
            if (isSelected && mode === 'editor' && ref.current.contentEditable === 'true' && !ref.current.innerText && content) {
                ref.current.innerText = content;
            }
            // Otherwise, only update if content changed externally (not when focused/editing)
            else if (ref.current.innerText !== content && !(isSelected && mode === 'editor' && document.activeElement === ref.current)) {
                ref.current.innerText = content || '';
            }
        }
    }, [content, isSelected, mode]);

    // Track if we've already initialized focus to avoid resetting cursor position
    const hasInitializedFocusRef = useRef(false);

    // Initialize and focus contentEditable when element becomes selected
    useEffect(() => {
        // Only initialize focus when element first becomes selected
        if (isSelected && mode === 'editor' && ref.current && ref.current.contentEditable === 'true' && !hasInitializedFocusRef.current) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                if (ref.current && ref.current.contentEditable === 'true') {
                    // Initialize content if empty
                    if (!ref.current.innerText && content) {
                        ref.current.innerText = content;
                    }
                    ref.current.focus();
                    // Set cursor to end of text only on initial selection
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (sel && ref.current.childNodes.length > 0) {
                        range.selectNodeContents(ref.current);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    hasInitializedFocusRef.current = true;
                }
            });
        } else if (!isSelected) {
            // Reset flag when element is deselected
            hasInitializedFocusRef.current = false;
        }
    }, [isSelected, mode, element.id]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!onUpdate) return;
        // Use innerText to preserve line breaks as \n characters
        const newContent = e.currentTarget.innerText || '';
        // Optimization: Don't trigger update if same
        if (newContent !== contentRef.current) {
            onUpdate(element.id, { content: newContent });
        }
    };

    const hasBackground = !!elStyles.backgroundColor;
    const showBorderWrapper = isSelected && mode === 'editor';
    const textDirection = detectTextDirection(content);

    // Unified rendering: All text elements use the wrapper structure
    // This ensures resize handles are always siblings to the contentEditable element, not children
    // preventing issues where handles become part of the editable content or are hidden.

    // Box Style
    return (
        <div
            {...commonProps} // Wrapper handles positioning
            style={{
                ...commonProps.style,
                border: 'none',
                display: hasBackground ? 'flex' : (showBorderWrapper ? 'flex' : undefined),
                alignItems: hasBackground || showBorderWrapper ? 'center' : undefined,
                justifyContent: hasBackground || showBorderWrapper ? (elStyles.textAlign === 'center' ? 'center' : elStyles.textAlign === 'right' ? 'flex-end' : 'flex-start') : undefined,
                direction: textDirection,
            }}
        >
            <div
                ref={ref}
                id={`element-${element.id}`}
                role="textbox"
                aria-label="Text Element"
                contentEditable={isSelected && mode === 'editor'}
                onInput={handleInput}
                onBlur={(e) => {
                    // If element is still selected and blur wasn't caused by clicking on menu/controls, refocus
                    if (isSelected && mode === 'editor' && ref.current) {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        // Don't refocus if user clicked on editing menu or resize handles
                        const clickedOnMenu = relatedTarget?.closest('[data-editing-menu]');
                        const clickedOnResizeHandle = relatedTarget?.closest('[class*="resizeHandle"]');
                        if (!clickedOnMenu && !clickedOnResizeHandle) {
                            // Use setTimeout to allow the blur to complete, then refocus
                            setTimeout(() => {
                                if (isSelected && ref.current && document.activeElement !== ref.current) {
                                    ref.current.focus();
                                }
                            }, 0);
                        }
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                }}
                suppressContentEditableWarning
                key={`text-box-${element.id}-${isSelected ? 'editable' : 'static'}`}
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
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    direction: textDirection,
                }}
                dangerouslySetInnerHTML={!isSelected || mode !== 'editor' ? { __html: newlinesToHtml(content || '') } : undefined}
            >
            </div>
            {renderResizeHandles()}
        </div>
    );
};

interface Props {
    element: ScreenElement;
    mode: 'templatePreview' | 'editor' | 'export';
    isSelected?: boolean;
    onClick?: (e?: React.MouseEvent | string) => void;
    onUpdate?: (id: string, changes: Partial<ScreenElement>) => void;
    screenType?: 'overlay' | 'content' | 'navigation'; // Screen type for safe area calculation
    device?: 'mobile' | 'desktop'; // Device type for responsive font sizing
    project?: Project; // Project for media resolution
    hasNextButton?: boolean; // Whether the screen has a next button (for long-text auto-expand limits)
    onVideoRef?: (videoRef: HTMLVideoElement) => void;
    onVideoUnref?: (videoRef: HTMLVideoElement) => void;
}

export const ElementRenderer: React.FC<Props> = ({ element, mode, onClick, onUpdate, isSelected = false, screenType = 'overlay', device = 'mobile', project, hasNextButton = false, onVideoRef, onVideoUnref }) => {
    const { type, position, size, content, styles: elStyles } = element;

    // Resolve media URL from content (media ID or placeholder URL)
    const resolveMediaUrl = (contentValue: string): string => {
        if (!project || !contentValue) return contentValue;
        // Check if content is a media ID in mediaLibrary
        if (project.mediaLibrary[contentValue]) {
            return project.mediaLibrary[contentValue].data;
        }
        // Otherwise, it's a placeholder URL or direct URL
        return contentValue;
    };

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

        // Select element immediately on mouse down (even if onUpdate is not available)
        onClick?.(e);

        // For text and button elements, check if we should allow the click to propagate to contentEditable
        const target = e.target as HTMLElement;
        const isTextElement = type === 'text';
        const isButtonElement = type === 'button';

        // For text/button elements that are already selected, allow clicks to reach contentEditable
        if ((isTextElement || isButtonElement) && isSelected) {
            // Find the contentEditable element within this element
            const currentTarget = e.currentTarget as HTMLElement;
            const contentEditableEl = currentTarget.querySelector('[contenteditable="true"]') as HTMLElement;

            // If clicking on the wrapper but there's a contentEditable child, don't stop propagation
            // so the click can reach the contentEditable for proper focus
            if (contentEditableEl && target === currentTarget) {
                // Click is on wrapper of selected text/button element, allow it to bubble to contentEditable
                // Don't stop propagation so click can reach contentEditable
                // Also don't set up drag handlers for text/button elements on wrapper clicks
                return;
            }
        }

        // For non-text elements or unselected text elements, stop propagation
        e.stopPropagation();

        // Only enable dragging if onUpdate is available
        if (!onUpdate) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = position.x;
        const startTop = position.y;
        dragStartRef.current = { x: startX, y: startY };

        const currentTarget = e.currentTarget as HTMLElement;
        const parent = currentTarget.offsetParent as HTMLElement;
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
                position: { x: newLeft, y: newTop },
                metadata: {
                    ...element.metadata,
                    manualSize: true
                }
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
            size: { width: newWidth, height: newHeight },
            metadata: {
                ...element.metadata,
                manualSize: true
            }
        });
    };

    const handleTouchEnd = () => {
        pinchStartDistanceRef.current = null;
        pinchStartSizeRef.current = null;
    };



    // Auto-resize text elements - only when content or styles change
    const lastTriggerRef = useRef<string>('');
    const isResizingRef = useRef(false);
    const onUpdateRef = useRef(onUpdate);
    const prevIsResizingRef = useRef(isResizing); // Track previous resize state

    // Keep onUpdate ref up to date
    useEffect(() => {
        onUpdateRef.current = onUpdate;
        prevIsResizingRef.current = isResizing;
    }, [onUpdate, isResizing]);

    useEffect(() => {
        if (type !== 'text' || !elementRef.current || !onUpdateRef.current || mode !== 'editor' || isResizingRef.current) return;

        // Create a trigger key from the values that should trigger recalculation
        const triggerKey = `${content}-${scaledFontSize}-${elStyles.fontFamily}`;

        // Skip if this exact combination was already processed
        // ALSO SKIP if user is manually resizing
        const justFinishedResizing = !isResizing && prevIsResizingRef.current;
        if (lastTriggerRef.current === triggerKey || isResizing || justFinishedResizing) {
            // If we just finished resizing, update the trigger key so we don't snap back immediately
            if (justFinishedResizing || isResizing) {
                lastTriggerRef.current = triggerKey;
            }
            return;
        }

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
    }, [content, scaledFontSize, elStyles.fontFamily, type, element.id, mode, device, isResizing]);

    // Auto-resize long-text elements - expand to fit content with limits
    const longTextLastTriggerRef = useRef<string>('');
    const longTextIsResizingRef = useRef(false);

    useEffect(() => {
        if (type !== 'long-text' || !elementRef.current || !onUpdateRef.current || mode !== 'editor' || longTextIsResizingRef.current || isResizingRef.current) return;

        // Create a trigger key from the values that should trigger recalculation
        const triggerKey = `${content}-${scaledFontSize || elStyles.fontSize}-${elStyles.fontFamily}-${position.y}-${position.x}`;

        // Skip if this exact combination was already processed
        // ALSO SKIP if user is manually resizing
        const justFinishedResizing = !isResizing && prevIsResizingRef.current;
        if (longTextLastTriggerRef.current === triggerKey || isResizing || justFinishedResizing) {
            // If we just finished resizing, update the trigger key so we don't snap back immediately
            if (justFinishedResizing || isResizing) {
                longTextLastTriggerRef.current = triggerKey;
            }
            return;
        }

        const element = elementRef.current;
        const longTextElement = element.querySelector('[contenteditable]') as HTMLElement;
        if (!longTextElement || !element.offsetParent) return;

        // Measure content height
        const measureDiv = document.createElement('div');
        measureDiv.style.position = 'absolute';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.whiteSpace = 'pre-wrap';
        const fontSize = scaledFontSize || elStyles.fontSize || 18;
        measureDiv.style.fontSize = `${fontSize}px`;
        measureDiv.style.fontFamily = elStyles.fontFamily || 'inherit';
        measureDiv.style.fontWeight = elStyles.fontWeight || 'normal';
        const elementWidthPx = (size.width || 80) / 100 * element.offsetParent.clientWidth;
        measureDiv.style.width = `${elementWidthPx - 32}px`; // Account for padding (16px * 2)
        measureDiv.style.padding = '16px';
        measureDiv.style.boxSizing = 'border-box';
        measureDiv.textContent = content || '';
        document.body.appendChild(measureDiv);

        const parentHeight = element.offsetParent.clientHeight;

        // Calculate content height
        const contentHeightPx = measureDiv.scrollHeight;
        const contentHeightPercent = (contentHeightPx / parentHeight) * 100;

        document.body.removeChild(measureDiv);

        // Calculate maximum height based on next button area or bottom edge
        const isContentScreen = screenType === 'content';
        let maxHeightPercent: number;
        if (isContentScreen) {
            if (hasNextButton) {
                // Next button area: bottom at 85% (safeAreaBottom)
                // Max height = 85% - element top position
                maxHeightPercent = 85 - position.y;
            } else {
                // No next button: bottom at 99% with small padding
                maxHeightPercent = 99 - position.y;
            }
        } else {
            // For overlay/navigation screens, use 95% as max
            maxHeightPercent = 95 - position.y;
        }

        // Calculate desired height (content height, but not exceeding max)
        const desiredHeight = Math.min(contentHeightPercent, maxHeightPercent);

        // Respect user-set size if they've manually shrunk it further
        const currentHeight = size.height || 0;
        // If current height is smaller than desired, user may have manually resized
        // But only respect it if it's significantly smaller (more than 2% difference)
        const userSetHeight = currentHeight < desiredHeight - 2 ? currentHeight : null;

        // Only auto-expand if content is larger than current size
        // But respect user-set size if they've manually shrunk it
        const finalHeight = userSetHeight && userSetHeight < desiredHeight
            ? userSetHeight // User has manually shrunk it, respect that
            : Math.max(currentHeight, Math.min(desiredHeight, maxHeightPercent)); // Auto-expand but don't exceed max

        // Only update if different from current size (with small threshold)
        if (Math.abs(finalHeight - currentHeight) > 0.5) {
            longTextLastTriggerRef.current = triggerKey;
            longTextIsResizingRef.current = true;
            onUpdateRef.current(element.id, {
                size: { width: size.width || 80, height: finalHeight }
            });
            // Reset flag after state update completes
            requestAnimationFrame(() => {
                longTextIsResizingRef.current = false;
            });
        } else {
            // Even if size didn't change, mark this trigger as processed
            longTextLastTriggerRef.current = triggerKey;
        }
    }, [content, scaledFontSize, elStyles.fontSize, elStyles.fontFamily, elStyles.fontWeight, type, element.id, mode, device, position.y, position.x, size.width, size.height, screenType, hasNextButton, isResizing]);

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
        direction: type === 'text' ? detectTextDirection(content) : 'ltr',
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

    const isInteractive = mode !== 'editor';

    switch (type) {
        case 'text':
            return (
                <EditableText
                    element={element}
                    mode={mode}
                    isSelected={isSelected}
                    onUpdate={onUpdate}
                    commonProps={commonProps}
                    renderResizeHandles={renderResizeHandles}
                />
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
                            src={resolveMediaUrl(content)}
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
                        src={resolveMediaUrl(content)}
                        alt="Element"
                        loading="eager"
                        decoding="async"
                        onClick={isInteractive ? (e) => {
                            e.stopPropagation();
                            onClick?.(element.id);
                        } : undefined}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: 'center',
                            cursor: isInteractive ? 'pointer' : 'default',
                        }}
                        draggable={false}
                    />
                    {renderResizeHandles()}
                </div>
            );

        case 'button':
            const buttonSticker = element.metadata?.sticker;
            const frameShape = element.metadata?.frameShape;
            const frameColor = elStyles.frameColor || '#000000';

            // Calculate frame shape clip-path or border-radius
            const getFrameStyle = () => {
                if (!frameShape) return {};

                switch (frameShape) {
                    case 'heart':
                        return {
                            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                            borderRadius: 0
                        };
                    case 'star':
                        return {
                            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                            borderRadius: 0
                        };
                    case 'circle':
                        return {
                            borderRadius: '50%'
                        };
                    case 'diamond':
                        return {
                            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                            borderRadius: 0
                        };
                    default:
                        return {};
                }
            };

            const frameStyle = getFrameStyle();
            const hasFrame = frameShape && elStyles.frameColor;

            const buttonWrapperProps = {
                ...commonProps,
                style: {
                    ...commonProps.style,
                    border: hasFrame ? `4px solid ${frameColor}` : 'none',
                    padding: hasFrame ? '4px' : '0',
                    ...(hasFrame && frameStyle),
                }
            };

            const buttonStyle: React.CSSProperties = {
                border: isSelected && mode === 'editor' ? '2px solid var(--color-primary)' : undefined,
                padding: '12px 24px',
                width: 'fit-content',
                minWidth: 'fit-content',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
            };

            return (
                <EditableButton
                    element={element}
                    mode={mode}
                    isSelected={isSelected}
                    onUpdate={onUpdate}
                    commonProps={buttonWrapperProps}
                    renderResizeHandles={renderResizeHandles}
                    buttonStyle={buttonStyle}
                    buttonClassName={`${styles.elementButton} ${getAnimationClass()}`}
                    sticker={buttonSticker}
                />
            );

        case 'sticker':
            return (
                <div {...commonProps} style={{ ...commonProps.style, fontSize: `${elStyles.fontSize || 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {content}
                    {renderResizeHandles()}
                </div>
            );

        case 'gallery':
            let images: string[] = [];
            try {
                images = JSON.parse(content);
                if (!Array.isArray(images)) images = [content];
            } catch (e) {
                images = [content];
            }

            // Resolve media URLs for all gallery images
            const resolvedImages = images.map(imgId => resolveMediaUrl(imgId));

            // Initialize current index to middle image
            const [currentImageIndex, setCurrentImageIndex] = useState<number>(
                Math.floor(resolvedImages.length / 2)
            );
            const thumbnailCarouselRef = useRef<HTMLDivElement>(null);

            // Scroll carousel to center current image
            useEffect(() => {
                if (thumbnailCarouselRef.current && resolvedImages.length > 0) {
                    const thumbnailWidth = 60; // Approximate thumbnail width + gap
                    const scrollPosition = (currentImageIndex - 2) * thumbnailWidth;
                    thumbnailCarouselRef.current.scrollTo({
                        left: Math.max(0, scrollPosition),
                        behavior: 'smooth'
                    });
                }
            }, [currentImageIndex, resolvedImages.length]);

            const handlePrev = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (resolvedImages.length > 0) {
                    setCurrentImageIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length);
                }
            };

            const handleNext = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (resolvedImages.length > 0) {
                    setCurrentImageIndex((prev) => (prev + 1) % resolvedImages.length);
                }
            };

            const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
            };

            const galleryTitle = element.metadata?.title && element.metadata.title.trim() !== '';
            const gallerySubtitle = element.metadata?.subtitle && element.metadata.subtitle.trim() !== '';

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
                        {resolvedImages.length > 0 && (
                            <img
                                src={resolvedImages[currentImageIndex]}
                                alt={`Gallery ${currentImageIndex + 1}`}
                                loading="eager"
                                decoding="async"
                                onClick={isInteractive ? (e) => {
                                    e.stopPropagation();
                                    // Store current image index in element temporarily for lightbox
                                    (element as any).__currentImageIndex = currentImageIndex;
                                    onClick?.(element.id);
                                } : undefined}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    objectPosition: 'center',
                                    cursor: isInteractive ? 'pointer' : 'default',
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Navigation Arrows */}
                        {isInteractive && resolvedImages.length > 1 && (
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
                    {resolvedImages.length > 1 && (
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
                            {resolvedImages.map((resolvedUrl, index) => (
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
                                        src={resolvedUrl}
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
                            src={resolveMediaUrl(content)}
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
            const videoRef = useRef<HTMLVideoElement | null>(null);

            // Register/unregister video ref for music pause/resume
            useEffect(() => {
                if (mode !== 'editor' && videoRef.current && onVideoRef) {
                    onVideoRef(videoRef.current);
                }
                return () => {
                    if (videoRef.current && onVideoUnref) {
                        onVideoUnref(videoRef.current);
                    }
                };
            }, [mode, onVideoRef, onVideoUnref]);

            return (
                <div {...commonProps} style={{
                    ...commonProps.style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: elStyles.backgroundColor || 'transparent',
                }}>
                    <video
                        ref={videoRef}
                        src={resolveMediaUrl(content)}
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
                            style={{
                                ...style,
                                border: 'none', // Remove border from style since outer wrapper handles it
                                position: 'relative', // Override absolute positioning from style
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                flex: 1, // Take remaining space in flex container
                                minHeight: 0 // Allow shrinking
                            }}
                            mode={mode}
                            isSelected={isSelected}
                            onMouseDown={handleMouseDown}
                            onClick={handleInteraction}
                            onUpdate={onUpdate}
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
                <div {...commonProps} style={{
                    ...commonProps.style,
                    padding: '0', // Remove padding from outer wrapper since LongTextElement handles it
                    backgroundColor: 'transparent', // Remove background from outer wrapper
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                }}>
                    <LongTextElement
                        element={element}
                        style={style}
                        mode={mode}
                        isSelected={isSelected}
                        onMouseDown={handleMouseDown}
                        onClick={handleInteraction}
                        onUpdate={onUpdate}
                    />
                    {renderResizeHandles()}
                </div>
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

