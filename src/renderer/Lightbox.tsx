import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './styles.module.css';

interface LightboxItem {
    type: 'image' | 'text';
    content: string;
}

interface Props {
    items: LightboxItem[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

export const Lightbox: React.FC<Props> = ({ items, currentIndex, onClose, onNavigate }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const currentItem = items[currentIndex];

    // Swipe detection
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentIndex < items.length - 1) {
            onNavigate(currentIndex + 1);
        }
        if (isRightSwipe && currentIndex > 0) {
            onNavigate(currentIndex - 1);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex < items.length - 1) {
            onNavigate(currentIndex + 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                onNavigate(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && currentIndex < items.length - 1) {
                onNavigate(currentIndex + 1);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, items.length, onNavigate, onClose]);

    if (!currentItem) return null;

    return (
        <div
            className={styles.lightboxOverlay}
            onClick={onClose}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <button className={styles.lightboxClose} onClick={onClose}>
                <X size={32} />
            </button>

            {items.length > 1 && currentIndex > 0 && (
                <button
                    className={styles.lightboxNav}
                    style={{ left: '20px' }}
                    onClick={handlePrev}
                    aria-label="Previous item"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {items.length > 1 && currentIndex < items.length - 1 && (
                <button
                    className={styles.lightboxNav}
                    style={{ right: '20px' }}
                    onClick={handleNext}
                    aria-label="Next item"
                >
                    <ChevronRight size={32} />
                </button>
            )}

            <div
                className={styles.lightboxContent}
                onClick={e => e.stopPropagation()}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                }}
            >
                {currentItem.type === 'image' ? (
                    <img
                        ref={imageRef}
                        src={currentItem.content}
                        className={styles.lightboxImage}
                        alt="Fullscreen"
                        loading="eager"
                        decoding="async"
                    />
                ) : (
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '40px',
                        borderRadius: '16px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        fontSize: '24px',
                        lineHeight: '1.6',
                        color: '#333',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'center',
                        fontFamily: 'var(--font-body, sans-serif)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text',
                        cursor: 'text'
                    }}>
                        {currentItem.content}
                    </div>
                )}
            </div>

            {items.length > 1 && (
                <div className={styles.lightboxCounter}>
                    {currentIndex + 1} / {items.length}
                </div>
            )}
        </div>
    );
};
