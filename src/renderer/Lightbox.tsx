import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './styles.module.css';

interface Props {
    imageSrc: string;
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

export const Lightbox: React.FC<Props> = ({ imageSrc, images, currentIndex, onClose, onNavigate }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);

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

        if (isLeftSwipe && currentIndex < images.length - 1) {
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
        if (currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                onNavigate(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
                onNavigate(currentIndex + 1);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length, onNavigate, onClose]);

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
            
            {images.length > 1 && currentIndex > 0 && (
                <button
                    className={styles.lightboxNav}
                    style={{ left: '20px' }}
                    onClick={handlePrev}
                    aria-label="Previous image"
                >
                    <ChevronLeft size={32} />
                </button>
            )}
            
            {images.length > 1 && currentIndex < images.length - 1 && (
                <button
                    className={styles.lightboxNav}
                    style={{ right: '20px' }}
                    onClick={handleNext}
                    aria-label="Next image"
                >
                    <ChevronRight size={32} />
                </button>
            )}
            
            <img
                ref={imageRef}
                src={imageSrc}
                className={styles.lightboxImage}
                alt="Fullscreen"
                loading="eager"
                decoding="async"
                onClick={e => e.stopPropagation()}
            />
            
            {images.length > 1 && (
                <div className={styles.lightboxCounter}>
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};
