import React, { useState } from 'react';
import type { ScreenElement } from '../types/model';
import styles from './styles.module.css';

const LongTextElement: React.FC<{
    element: ScreenElement;
    style: React.CSSProperties;
    mode: 'templatePreview' | 'editor' | 'export';
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
}> = ({ element, style, mode, onMouseDown, onClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { content, styles: elStyles } = element;

    return (
        <div
            className={styles.element}
            style={{
                ...style,
                maxHeight: isExpanded ? 'none' : '200px',
                overflowY: isExpanded ? 'auto' : 'hidden',
                padding: '12px',
                backgroundColor: elStyles.backgroundColor || 'rgba(255,255,255,0.9)',
                borderRadius: elStyles.borderRadius || 8,
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
        >
            <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
            {mode !== 'editor' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    style={{
                        marginTop: '8px',
                        padding: '4px 12px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </button>
            )}
        </div>
    );
};

interface Props {
    element: ScreenElement;
    mode: 'templatePreview' | 'editor' | 'export';
    onClick?: (e: React.MouseEvent) => void;
    onUpdate?: (id: string, changes: Partial<ScreenElement>) => void;
}

export const ElementRenderer: React.FC<Props> = ({ element, mode, onClick, onUpdate }) => {
    const { type, position, size, content, styles: elStyles } = element;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'editor' || !onUpdate) return;

        e.stopPropagation(); // Prevent screen click
        onClick?.(e); // Select on drag start

        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = position.x;
        const startTop = position.y;

        const target = e.currentTarget as HTMLElement;
        const parent = target.offsetParent as HTMLElement;
        if (!parent) return;

        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;

        const handleMouseMove = (mv: MouseEvent) => {
            mv.preventDefault();
            const dx = mv.clientX - startX;
            const dy = mv.clientY - startY;

            // Convert px delta to percentage
            const dxPl = (dx / parentWidth) * 100;
            const dyPl = (dy / parentHeight) * 100;

            onUpdate(element.id, {
                position: {
                    x: Math.min(100, Math.max(0, startLeft + dxPl)),
                    y: Math.min(100, Math.max(0, startTop + dyPl))
                }
            });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const style: React.CSSProperties = {
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: size.width ? `${size.width}%` : 'auto',
        height: size.height ? `${size.height}%` : 'auto',
        color: elStyles.color,
        backgroundColor: elStyles.backgroundColor,
        fontSize: elStyles.fontSize ? `${elStyles.fontSize}px` : undefined,
        fontWeight: elStyles.fontWeight,
        fontFamily: elStyles.fontFamily,
        textAlign: elStyles.textAlign,
        borderRadius: elStyles.borderRadius,
        opacity: elStyles.opacity,
        transform: elStyles.rotation ? `rotate(${elStyles.rotation}deg)` : undefined,
        zIndex: elStyles.zIndex,
        boxShadow: elStyles.shadow ? 'var(--shadow-md)' : undefined,
        cursor: mode === 'editor' ? 'move' : (type === 'button' || type === 'image' || type === 'gallery') ? 'pointer' : 'default',
    };

    const handleInteraction = (e: React.MouseEvent) => {
        if (mode !== 'editor') {
            if (onClick) onClick(e);
        }
    };

    const commonProps: any = {
        className: `${styles.element} ${type === 'text' ? styles.elementText : ''} ${type === 'image' ? styles.elementImage : ''} ${type === 'button' ? styles.elementButton : ''}`,
        style: {
            ...style,
            padding: elStyles.backgroundColor && type === 'text' ? '12px 16px' : undefined,
            display: type === 'text' && elStyles.backgroundColor ? 'flex' : undefined,
        },
        'data-type': type,
        onMouseDown: handleMouseDown,
        onClick: handleInteraction
    };

    switch (type) {
        case 'text':
            return <div {...commonProps}>{content}</div>;

        case 'image':
            return <img src={content} alt="Element" {...commonProps} style={{ ...style, objectFit: 'cover' }} draggable={false} />;

        case 'button':
            return (
                <button
                    {...commonProps}
                    className={`${styles.element} ${styles.elementButton} ${mode !== 'editor' ? 'animate-pulse' : ''}`}
                >
                    {content}
                </button>
            );

        case 'sticker':
            return <div {...commonProps} style={{ ...style, fontSize: `${elStyles.fontSize || 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{content}</div>;

        case 'gallery':
            let images: string[] = [];
            try {
                images = JSON.parse(content);
                if (!Array.isArray(images)) images = [content];
            } catch (e) {
                images = [content]; // Fallback if single URL
            }

            return (
                <div
                    className={styles.element}
                    style={{
                        ...style,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '4px',
                        overflow: 'hidden',
                        padding: '4px',
                        background: 'rgba(255,255,255,0.5)'
                    }}
                    onMouseDown={handleMouseDown}
                    onClick={handleInteraction}
                >
                    {images.slice(0, 4).map((src, i) => (
                        <img
                            key={i}
                            src={src}
                            alt={`Gallery ${i}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                            draggable={false}
                        />
                    ))}
                    {images.length > 4 && (
                        <div style={{
                            position: 'absolute', bottom: 4, right: 4,
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem'
                        }}>
                            +{images.length - 4}
                        </div>
                    )}
                </div>
            );

        case 'video':
            return (
                <video
                    src={content}
                    controls
                    {...commonProps}
                    style={{ ...style, objectFit: 'cover' }}
                    draggable={false}
                />
            );

        case 'long-text':
            return (
                <LongTextElement
                    element={element}
                    style={style}
                    mode={mode}
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
                        ...style,
                        backgroundColor: elStyles.backgroundColor || '#ccc',
                        borderRadius: isCircle ? '50%' : `${elStyles.borderRadius || 0}px`,
                    }}
                />
            );

        default:
            return null;
    }
};
