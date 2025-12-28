import type { Template, Screen, ScreenElement } from '../types/model';
import { v4 as uuidv4 } from 'uuid';

// --- Helpers ---

const createText = (content: string, y: number, fontSize: number = 24, bold: boolean = false, color: string = 'var(--color-text)'): ScreenElement => ({
    id: uuidv4(),
    type: 'text',
    content,
    position: { x: 10, y },
    size: { width: 80, height: 10 },
    styles: {
        color,
        fontSize,
        textAlign: 'center',
        fontWeight: bold ? 'bold' : 'normal',
        fontFamily: 'var(--font-heading)',
        zIndex: 10,
    }
});

const createButton = (content: string, y: number, color: string = 'var(--color-primary)', emoji?: string): ScreenElement => ({
    id: uuidv4(),
    type: 'button',
    content: content, // Text only, emoji goes in metadata
    position: { x: 35, y },
    size: { width: 30, height: 8 },
    styles: {
        color: 'white',
        backgroundColor: color,
        textAlign: 'center',
        borderRadius: 999,
        shadow: true,
        zIndex: 20,
    },
    metadata: {
        target: 'next',
        action: 'navigate',
        sticker: emoji // Store emoji in metadata for separate rendering
    }
});

const createSticker = (emoji: string, x: number, y: number, size: number = 48, rotation: number = 0): ScreenElement => ({
    id: uuidv4(),
    type: 'sticker',
    content: emoji,
    position: { x, y },
    size: { width: 10, height: 10 },
    styles: {
        fontSize: size,
        zIndex: 5,
        rotation,
        opacity: 0.8,
    }
});

const createWishCard = (text: string, y: number, bgColor: string, textColor: string): ScreenElement => ({
    id: uuidv4(),
    type: 'text',
    content: text,
    position: { x: 15, y },
    size: { width: 70, height: 12 },
    styles: {
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: 12,
        fontSize: 18,
        fontWeight: 'bold',
        zIndex: 10,
        textAlign: 'center',
    }
});

const createLongText = (content: string, y: number, bgColor: string = 'rgba(255,255,255,0.9)', textColor: string = 'var(--color-text)'): ScreenElement => ({
    id: uuidv4(),
    type: 'long-text',
    content,
    position: { x: 10, y },
    size: { width: 80, height: 50 },
    styles: {
        backgroundColor: bgColor,
        borderRadius: 12,
        color: textColor,
        fontSize: 18,
        zIndex: 10,
    }
});

const createScreen = (title: string, type: Screen['type'], backgroundValue: string, elements: ScreenElement[] = [], overlay?: Screen['background']['overlay']): Screen => {
    // Layout calculation is now done at render time in ScreenRenderer based on device
    // Templates are created with original element positions

    return {
        id: uuidv4(),
        title,
        type,
        background: {
            type: backgroundValue.includes('gradient') || backgroundValue.startsWith('#') ? (backgroundValue.startsWith('#') ? 'solid' : 'gradient') : 'image',
            value: backgroundValue,
            animation: 'fade',
            overlay
        },
        elements: elements
    };
};

// Estimate actual rendered height for text elements
// Returns height as percentage (0-100%)
const estimateTextHeight = (
    content: string,
    fontSize: number,
    width: number,
    device: 'mobile' | 'desktop'
): number => {
    // Base line height factor (typically 1.2-1.5x font size)
    const lineHeightFactor = 1.3;

    // Account for device scaling - use same scale as ElementRenderer (0.7 for mobile)
    // This ensures layout calculation matches actual rendered font sizes
    const deviceScale = device === 'mobile' ? 0.7 : 1.0;
    const scaledFontSize = fontSize * deviceScale;

    // Count line breaks in content
    const lineBreaks = (content.match(/\n/g) || []).length;

    // Estimate characters per line based on width
    // Rough estimate: ~50-60 characters per 100% width at 24px font
    // Adjust based on actual font size
    const charsPerLine = Math.max(20, Math.floor((width / 100) * (60 * (24 / scaledFontSize))));

    // Calculate number of lines needed
    const textLines = Math.max(1, Math.ceil(content.length / charsPerLine));
    const totalLines = textLines + lineBreaks;

    // Calculate height: lines * line height, converted to percentage
    // For mobile (9:16 aspect ratio): typical viewport height is ~667-800px
    // For desktop (16:9 aspect ratio): typical viewport height is ~600-900px
    // We need to convert pixel height to percentage of the safe area (0-100% template space)
    const lineHeightPx = scaledFontSize * lineHeightFactor;
    const estimatedHeightPx = lineHeightPx * totalLines;

    // Convert to percentage based on actual viewport height
    // Mobile: ~667px viewport height (iPhone standard)
    // Desktop: ~720px viewport height for 16:9
    const viewportHeightPx = device === 'mobile' ? 667 : 720;

    // Convert pixel height to percentage of viewport
    // Then scale to template space (0-100%)
    const heightPercent = (estimatedHeightPx / viewportHeightPx) * 100;

    // Add padding for text elements (more padding for larger fonts)
    // Minimum padding: 3%, additional padding based on font size
    const fontSizePadding = Math.max(0, (scaledFontSize - 20) / 5); // Extra 0.2% per px above 20px
    const totalPadding = 3 + fontSizePadding;

    // Ensure minimum height based on font size (at least 2.5x line height for single line)
    // This accounts for actual rendered height which is often larger than calculated
    // For larger fonts, we need even more space
    const minHeightMultiplier = scaledFontSize > 30 ? 3.0 : 2.5;
    const minHeightPercent = (scaledFontSize * lineHeightFactor * minHeightMultiplier) / viewportHeightPx * 100;

    const result = Math.max(minHeightPercent, Math.min(95, heightPercent + totalPadding));
    return result;
};

// Layout helper: Calculate non-overlapping positions for content screens
// Works in 0-100% space which maps to 10-85% safe area in renderer
const calculateLayout = (elements: ScreenElement[], device: 'mobile' | 'desktop' = 'mobile'): ScreenElement[] => {
    // Safe area bounds: 0-99% in template space maps to 10-85% on screen
    // Use 99% to leave 1% buffer at bottom for next button
    const safeAreaTop = 0;
    const safeAreaBottom = 99;  // 99% in template = ~84% on screen (leaves space for next button)

    // Device-aware scaling factors
    const isMobile = device === 'mobile';
    const contentScale = isMobile ? 0.85 : 1.0; // Scale down content on mobile
    const spacingFactor = isMobile ? 1.5 : 1.0; // More spacing on mobile for better readability
    const baseMinSpacing = 4; // Base minimum spacing between elements (increased from 3)
    const minSpacing = baseMinSpacing * spacingFactor; // Minimum spacing between elements

    // Separate layout-constrained elements from stickers (free-floating)
    const layoutElements: ScreenElement[] = [];
    const stickers: ScreenElement[] = [];
    const galleries: ScreenElement[] = [];

    elements.forEach(el => {
        if (el.type === 'sticker') {
            stickers.push(el); // Stickers can overlap, keep original position
        } else if (el.type === 'gallery') {
            galleries.push(el); // Handle galleries separately
            layoutElements.push({ ...el }); // Also include in layout calculation
        } else {
            layoutElements.push({ ...el }); // Copy for layout calculation
        }
    });

    // Sort layout elements by intended Y position (top to bottom)
    // Special handling: process yellow wish card first, then hero, then blue wish card, then red wish card
    layoutElements.sort((a, b) => {
        const aY = a.position.y;
        const bY = b.position.y;

        // Detect wish cards
        const aIsWish = a.type === 'text' && a.styles?.backgroundColor && a.styles?.borderRadius;
        const bIsWish = b.type === 'text' && b.styles?.backgroundColor && b.styles?.borderRadius;

        // Yellow wish card (y:5) comes first
        if (aIsWish && aY === 5) return -1;
        if (bIsWish && bY === 5) return 1;

        // Hero image comes after yellow, before blue
        if (a.type === 'image' && aY >= 50 && aIsWish && bY === 5) return 1;
        if (b.type === 'image' && bY >= 50 && aIsWish && aY === 5) return -1;
        if (a.type === 'image' && aY >= 50 && bIsWish && bY === 31) return -1;
        if (b.type === 'image' && bY >= 50 && aIsWish && aY === 31) return 1;

        // Blue wish card (y:31) comes after hero
        if (aIsWish && aY === 31 && b.type === 'image' && bY >= 50) return 1;
        if (bIsWish && bY === 31 && a.type === 'image' && aY >= 50) return -1;

        // Red wish card (y:18) comes after yellow, before blue
        if (aIsWish && aY === 18 && bIsWish && bY === 31) return -1;
        if (bIsWish && bY === 18 && aIsWish && aY === 31) return 1;

        // Default: sort by Y position
        if (Math.abs(aY - bY) < 5) {
            // If Y positions are close (within 5%), sort by X (left to right)
            return a.position.x - b.position.x;
        }
        return aY - bY;
    });

    // Calculate adjusted positions to prevent overlaps
    const adjustedElements: ScreenElement[] = [];

    for (let i = 0; i < layoutElements.length; i++) {
        const current = layoutElements[i];
        let adjustedY = current.position.y;


        // Calculate accurate height based on element type
        let adjustedHeight: number;

        if (current.type === 'text' || current.type === 'long-text') {
            // Use estimated height for text elements
            const fontSize = current.styles?.fontSize || 24;
            const width = current.size.width || 80;
            adjustedHeight = estimateTextHeight(current.content || '', fontSize, width, device);
            // Don't apply content scaling to heights - heights are already device-aware in estimateTextHeight
            // Content scaling should only affect spacing, not element dimensions
        } else if (current.type === 'gallery') {
            // For galleries, use defined height (will be adjusted later for desktop)
            adjustedHeight = (current.size.height || 50) * contentScale;
        } else {
            // For other elements (images, buttons), use defined height with scaling
            adjustedHeight = (current.size.height || 10) * contentScale;
        }


        // Check for overlaps with ALL previous elements (not just immediately previous)
        let maxBottom = safeAreaTop;
        for (let j = 0; j < adjustedElements.length; j++) {
            const previous = adjustedElements[j];

            // Get actual height of previous element
            let prevHeight: number;
            if (previous.type === 'text' || previous.type === 'long-text') {
                const prevFontSize = previous.styles?.fontSize || 24;
                const prevWidth = previous.size.width || 80;
                prevHeight = estimateTextHeight(previous.content || '', prevFontSize, prevWidth, device) * contentScale;
            } else {
                prevHeight = (previous.size.height || 10) * contentScale;
            }

            const prevBottom = previous.position.y + prevHeight;

            // Improved horizontal overlap detection - use actual element widths
            const currentLeft = current.position.x;
            const currentRight = current.position.x + (current.size.width || 80);
            const prevLeft = previous.position.x;
            const prevRight = previous.position.x + (previous.size.width || 80);

            // Check if elements overlap horizontally (more precise check)
            const horizontalOverlap = currentLeft < prevRight && currentRight > prevLeft;


            // If horizontally overlapping, track the bottom position
            if (horizontalOverlap) {
                maxBottom = Math.max(maxBottom, prevBottom);
            }
        }

        // Position element below all overlapping previous elements with spacing
        // Detect wish cards (text elements with background color and border radius)
        const isWishCard = (el: ScreenElement) =>
            el.type === 'text' &&
            el.styles?.backgroundColor &&
            el.styles?.borderRadius;

        const currentIsWish = isWishCard(current);
        const currentIsImage = current.type === 'image';

        // Add spacing based on element types
        let requiredSpacing = minSpacing;
        if ((current.type === 'text' || current.type === 'long-text') &&
            adjustedElements.length > 0) {
            const previous = adjustedElements[adjustedElements.length - 1];
            if (previous.type === 'text' || previous.type === 'long-text') {
                const prevIsWish = isWishCard(previous);

                if (currentIsWish && prevIsWish) {
                    // Wish cards should have consistent small spacing between them
                    // Use a fixed small padding (1.5% on mobile, 1.0% on desktop) for consistent stacking
                    requiredSpacing = isMobile ? 1.5 : 1.0; // Small consistent spacing for wish cards
                } else {
                    // Extra spacing between regular text elements (especially on mobile)
                    const extraTextSpacing = isMobile ? 2.5 : 1.5;
                    requiredSpacing = minSpacing + extraTextSpacing;
                }
            }
        }

        // Special handling: if current is image and previous is wish card, add minimal spacing
        if (currentIsImage && adjustedElements.length > 0) {
            const previous = adjustedElements[adjustedElements.length - 1];
            if (isWishCard(previous)) {
                // Minimal spacing between last wish card and hero image
                requiredSpacing = isMobile ? 2.0 : 1.5;
            }
        }

        // For wish cards: special layout - yellow at top, blue at bottom, red centered between them
        // This must run BEFORE the general overlap adjustment to ensure positioning takes precedence
        if (currentIsWish) {

            const wishCardSpacing = isMobile ? 1.5 : 1.0; // Small spacing for wish cards

            // Find hero image in layoutElements
            let heroImage: ScreenElement | null = null;
            for (let j = 0; j < layoutElements.length; j++) {
                if (layoutElements[j].type === 'image' && layoutElements[j].position.y >= 50) {
                    heroImage = layoutElements[j];
                    break;
                }
            }

            // Identify which wish card this is (by original Y position: 5=yellow, 18=red, 31=blue)
            const isYellow = current.position.y === 5;
            const isRed = current.position.y === 18;
            const isBlue = current.position.y === 31;

            if (isYellow) {
                // Yellow card: small space from top line
                adjustedY = wishCardSpacing; // Start with small padding from top
            } else if (isBlue) {
                // Blue card: small space from hero (position above hero with small padding)
                if (heroImage) {
                    // Check if hero has already been processed (in adjustedElements)
                    let heroY = heroImage.position.y; // Default to original position
                    for (const el of adjustedElements) {
                        if (el.type === 'image' && el.id === heroImage.id) {
                            heroY = el.position.y; // Use adjusted position if available
                            break;
                        }
                    }

                    adjustedY = heroY - adjustedHeight - wishCardSpacing - 3; // Position above hero with small padding, move up 3 tics (2% more than before)
                }
            } else if (isRed) {
                // Red card: centered between yellow and blue with small space from each
                // Find yellow and blue cards from adjustedElements or calculate from known positions
                let yellowBottom = wishCardSpacing + adjustedHeight; // Yellow at top + its height
                let blueTop = safeAreaBottom - adjustedHeight - wishCardSpacing; // Blue near bottom

                // Try to get actual positions from already processed elements
                for (const el of adjustedElements) {
                    if (isWishCard(el)) {
                        if (el.position.y < 10) {
                            yellowBottom = el.position.y + (el.size.height || adjustedHeight);
                        }
                        if (el.position.y > 20) {
                            blueTop = el.position.y;
                        }
                    }
                }

                // If we have hero, use it to calculate blue position
                if (heroImage && blueTop > heroImage.position.y - adjustedHeight) {
                    blueTop = heroImage.position.y - adjustedHeight - wishCardSpacing;
                }

                // Center red between yellow bottom and blue top
                const availableSpace = blueTop - yellowBottom;
                const redHeight = adjustedHeight;
                const totalSpaceNeeded = redHeight + (wishCardSpacing * 2); // Red height + padding on both sides

                if (availableSpace >= totalSpaceNeeded) {
                    adjustedY = yellowBottom + wishCardSpacing; // Small space from yellow
                    // Center it in remaining space
                    const extraSpace = availableSpace - totalSpaceNeeded;
                    adjustedY += extraSpace / 2;
                } else {
                    // Not enough space, just stack with small padding from yellow
                    adjustedY = yellowBottom + wishCardSpacing;
                }

                // Move red card up by 2 tics
                adjustedY -= 2;

            }
        }

        // Now apply general overlap adjustment (but skip for wish cards that already handled stacking)
        // Don't override wish card stacking - only apply general adjustment if not a wish card or if it's the first wish card
        if (!currentIsWish || adjustedElements.length === 0) {
            if (adjustedY < maxBottom + requiredSpacing) {
                adjustedY = maxBottom + requiredSpacing;
            }
        }


        // CRITICAL: Ensure element doesn't exceed safe area bottom (100% = 85% on screen)
        const elementBottom = adjustedY + adjustedHeight;
        if (elementBottom > safeAreaBottom) {
            // Reduce height to fit within safe area
            const maxHeight = safeAreaBottom - adjustedY - 1; // Leave 1% buffer
            if (maxHeight > 2) {
                adjustedHeight = maxHeight;
            } else {
                // If no room, move element up and reduce height
                adjustedHeight = Math.max(2, safeAreaBottom - safeAreaTop - 2);
                adjustedY = safeAreaBottom - adjustedHeight - 1;
            }
        }

        // Final clamp: ensure element fits within 0-100% template space
        const finalY = Math.max(safeAreaTop, Math.min(safeAreaBottom - adjustedHeight - 0.5, adjustedY));
        const finalHeight = Math.min(adjustedHeight, safeAreaBottom - finalY - 0.5);

        // Create adjusted element
        const adjustedElement = {
            ...current,
            position: {
                ...current.position,
                y: finalY
            },
            size: {
                ...current.size,
                height: finalHeight
            }
        };


        adjustedElements.push(adjustedElement);
    }

    // Gallery-specific responsive behavior: Expand galleries on desktop
    if (!isMobile) {
        // Find all gallery elements and expand them to use available space
        for (let i = 0; i < adjustedElements.length; i++) {
            if (adjustedElements[i].type === 'gallery') {
                const gallery = adjustedElements[i];

                // Calculate used vertical space by all elements below this gallery
                let spaceUsedBelow = 0;
                const galleryBottom = gallery.position.y + gallery.size.height;

                for (let j = 0; j < adjustedElements.length; j++) {
                    if (j !== i && adjustedElements[j].position.y > galleryBottom) {
                        const otherElement = adjustedElements[j];
                        let otherHeight: number;
                        if (otherElement.type === 'text' || otherElement.type === 'long-text') {
                            const otherFontSize = otherElement.styles?.fontSize || 24;
                            const otherWidth = otherElement.size.width || 80;
                            otherHeight = estimateTextHeight(otherElement.content || '', otherFontSize, otherWidth, device);
                        } else {
                            otherHeight = otherElement.size.height || 10;
                        }
                        spaceUsedBelow += otherHeight + minSpacing;
                    }
                }

                // Calculate available space for gallery expansion
                const availableSpace = safeAreaBottom - gallery.position.y - spaceUsedBelow - minSpacing;
                const maxGalleryHeight = Math.min(availableSpace * 0.9, 70); // Max 70% height, use 90% of available

                // Expand gallery if there's more space available
                if (maxGalleryHeight > gallery.size.height) {
                    adjustedElements[i] = {
                        ...gallery,
                        size: {
                            ...gallery.size,
                            height: Math.max(gallery.size.height, maxGalleryHeight)
                        }
                    };
                }
            }
        }
    }

    // Combine adjusted layout elements with stickers (preserving original positions)
    return [...adjustedElements, ...stickers];
};

// Common Nav Screen (Last Screen)
const createNavScreen = (bg: string): Screen => ({
    id: uuidv4(),
    title: 'All Screens',
    type: 'navigation',
    background: {
        type: bg.includes('gradient') ? 'gradient' : 'solid',
        value: bg,
        animation: 'none'
    },
    elements: []
});


// --- Templates ---

const templates: Template[] = [
    // 1. Birthday – Kids (Party Explosion)
    {
        id: 'birthday-kids',
        category: 'Birthday',
        name: 'Birthday – Kids',
        description: ['Bright, playful, energetic', 'Falling confetti', 'Perfect for kids'],
        thumbnail: '🎈',
        screens: 6,
        tags: ['kids', 'fun', 'colorful'],
        defaultConfig: { primaryColor: '#FFD93D', fontHeading: 'Fredoka One', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with animated gradient, confetti, floating emojis
            const s1 = createScreen('Welcome', 'overlay', 'linear-gradient(135deg, #FFD93D, #FF4D6D, #4CC9F0)', [
                createSticker('🎈', 15, 15, 56, 0), // Balloon - moved up from 20 to 15 to avoid title overlap, more padding from top
                createSticker('🎉', 74, 14, 48, 15), // Confetti - moved up from 30 to 12, moved left from 75 to 70 for padding from right edge
                createSticker('⭐', 47, 8, 52, 25), // Star - moved up from 15 to 8 for more padding from top
                createText('Happy Birthday!', 30, 48, true, '#FFFFFF'),
                createText('Let\'s celebrate your special day!', 50, 24, false, '#FFFFFF'),
                createButton('Start Experience', 70, '#FF4D6D', '🎁')
            ], 'confetti'); // Use template thumbnail
            s1.elements[3].styles.shadow = true; // Title shadow
            s1.elements[0].styles.animation = 'float';
            s1.elements[1].styles.animation = 'pulse';

            // Screen 2: Hero Image + Short Text - Bright playful design
            const s2 = createScreen('Hero', 'content', 'linear-gradient(135deg, #FFD93D, #FFE66D, #FFFFFF)', [
                createSticker('🎂', 85, 10, 40, 10),
                createSticker('🎈', 10, 15, 36, -5),
                createText('[Name] turns [Age]!', 12, 36, true, '#FF4D6D'),
                createText('A day full of fun, laughter, and surprises', 20, 20, false, '#333'),
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/birthday-kids-hero.webp',
                    position: { x: 10, y: 54 }, // Adjusted to end at 99% (54 + 45 = 99)
                    size: { width: 80, height: 45 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            // Screen 3: Gallery + Caption - Bright pink background (wish cards removed)
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #fff0f3, #ffe0e6)', [
                createSticker('📸', 88, 8, 32, 0),
                createText('Some of our favorite moments together', 12, 26, true, '#FF4D6D'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 79 }, // Adjusted to end at 99% (20 + 79 = 99), leaving small padding for next button
                    styles: { zIndex: 5, borderRadius: 12, shadow: true },
                    metadata: { galleryLayout: 'gridWithZoom' }
                }
            ]);

            // Screen 4: Wishes with Hero Image - Bright playful background
            // Wish cards at top (close to top line), hero image at bottom
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(to bottom, #fff0f3, #ffe0e6)', [
                createWishCard('Happy Birthday! We love you!', 5, '#FFD93D', '#FFFFFF'), // Start close to top
                createWishCard('Wishing you endless joy and fun!', 18, '#FF4D6D', '#FFFFFF'), // Stacked with minimal spacing
                createWishCard('So proud of you!', 31, '#4CC9F0', '#FFFFFF'), // Stacked with minimal spacing, close to hero
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/birthday-kids-hero.webp',
                    position: { x: 10, y: 50 }, // Position at bottom, close to last wish card
                    size: { width: 80, height: 49 }, // Height adjusted to fit within 99% (50 + 49 = 99)
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            // Random playful rotation for wish cards
            s4.elements[0].styles.rotation = -2;
            s4.elements[1].styles.rotation = 1;
            s4.elements[2].styles.rotation = -1;

            // Screen 5: Video Standalone - Bright cyan background
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #4CC9F0, #7DD3FC, #FFFFFF)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('A special message for you', 12, 26, true, '#FF4D6D'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '/images/templates/videos/video-placeholder.mp4',
                    position: { x: 10, y: 44 }, // Adjusted to end at 99% (44 + 55 = 99)
                    size: { width: 80, height: 55 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'birthday-kids',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#FFD93D', fontHeading: 'Fredoka One', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('linear-gradient(135deg, #FFD93D, #FFE66D, #FFFFFF)')],
                mediaLibrary: {}
            };
        }
    },

    // 2. Birthday – Partner (Romantic Glow)
    {
        id: 'birthday-partner',
        category: 'Birthday',
        name: 'Birthday – Partner',
        description: ['Romantic, intimate, elegant', 'Deep purple & burgundy', 'Heart animations'],
        thumbnail: '🌹',
        screens: 5,
        tags: ['romantic', 'partner', 'elegant'],
        defaultConfig: { primaryColor: '#800f2f', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with burgundy → purple gradient, hearts, sparkles
            const s1 = createScreen('Intro', 'overlay', 'linear-gradient(135deg, #590d22, #800f2f, #9d4edd)', [
                createSticker('❤️', 20, 25, 48, 0), // Moved up from 25 to avoid title overlap
                createSticker('✨', 75, 28, 40, 15), // Moved up from 30 to avoid title overlap
                createSticker('💕', 50, 20, 44, 10), // Moved up from 20 to avoid title overlap
                createText('For You', 35, 48, true, '#FFF'),
                createText('A small journey of our love', 55, 20, false, 'rgba(255,255,255,0.9)'),
                createButton('Open', 75, '#C9184A', '❤️')
            ], 'hearts'); // Use template thumbnail

            // Screen 2: Long Love Text - Romantic burgundy/purple theme
            const s2 = createScreen('Message', 'content', 'linear-gradient(135deg, #FDF0F5, #F8E8EE, #FFF)', [
                createSticker('❤️', 88, 8, 32, 0),
                createSticker('💕', 10, 12, 28, -5),
                createLongText('To my dearest love,\n\nEvery day with you is a gift. Every moment we share becomes a treasured memory. Your smile lights up my world, and your love fills my heart with endless joy.\n\nOn this special day, I want you to know how much you mean to me. You are my everything, my today, and my forever.\n\nWith all my love,', 34, 'rgba(255,255,255,0.95)', '#590d22') // Adjusted to end at 99% (34 + 65 = 99)
            ]);
            s2.elements[2].size = { width: 80, height: 65 };

            // Screen 3: Gallery + Caption - Elegant white with burgundy accents
            const s3 = createScreen('Us', 'content', 'linear-gradient(to bottom, #FFFFFF, #FDF0F5)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Moments that mean everything to me', 12, 26, true, '#800f2f'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true },
                    metadata: { galleryLayout: 'fullscreenSlideshow' }
                }
            ]);

            // Screen 4: Video Standalone - Deep romantic background
            const s4 = createScreen('Video', 'content', 'linear-gradient(135deg, #590d22, #800f2f, #9d4edd)', [
                createSticker('💜', 88, 10, 40, 0),
                createText('Just for you', 12, 24, true, '#FFF'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '/images/templates/videos/video-placeholder.mp4',
                    position: { x: 10, y: 44 }, // Adjusted to end at 99% (44 + 55 = 99)
                    size: { width: 80, height: 55 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true, frameColor: '#C9184A' }
                }
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'birthday-partner',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#800f2f', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#FDF0F5')],
                mediaLibrary: {}
            };
        }
    },

    // 3. Anniversary – Timeline of Us
    {
        id: 'anniversary-timeline',
        category: 'Anniversary',
        name: 'Anniversary Timeline',
        description: ['Warm, mature, loving', 'Timeline style', 'Ruby & Cream'],
        thumbnail: '🥂',
        screens: 6,
        tags: ['anniversary', 'timeline', 'love'],
        defaultConfig: { primaryColor: '#A4161A', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with warm sunset gradient
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(135deg, #FFB4A2, #E5989B, #FFFFFF)', [
                createSticker('🥂', 50, 20, 56, 0), // Swapped to Champagne glasses
                createSticker('⏳', 15, 25, 30, -15), // Hourglass on left side
                createSticker('💕', 85, 25, 30, 15), // Floating hearts above/side of title
                createText('Our Story', 35, 48, true, '#FFFFFF'),
                createText('Since [Year]', 55, 24, false, '#FFF0F3'),
                createButton('Begin Journey', 75, '#A4161A')
            ], 'stars'); // Use template thumbnail

            // Screen 2: Intro Text - Warm purple/rose theme
            // Screen 2: Intro Text - Deeper Rose theme
            const s2 = createScreen('Intro', 'content', 'linear-gradient(135deg, #E5989B, #B5838D, #6D6875)', [ // Darker
                createText('It all started with one moment, and slowly became a lifetime of memories.', 20, 24, false, '#FFFFFF'), // Raised slightly
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/one-screen-hero.webp',
                    position: { x: 10, y: 50 },
                    size: { width: 80, height: 45 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                },
                createSticker('💑', 85, 35, 40, -10), // Moved to side between text and image
            ]);

            // Screen 3: Timeline Gallery - Mature purple tones
            // Screen 3: Timeline Gallery - Warm Sunset
            const s3 = createScreen('Timeline', 'content', 'linear-gradient(to bottom, #FFB4A2, #E5989B)', [ // Darker
                createSticker('⏳', 50, 8, 40, 0), // Hourglass centered above text
                createText('Every step brought us closer', 25, 26, true, '#FFFFFF'), // Lowered text more
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true },
                    metadata: { galleryLayout: 'timeline' }
                }
            ]);

            // Screen 4: Wishes - Warm elegant background
            // Screen 4: Wishes - Warm Rose
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #FFB4A2, #FFCDB2, #E5989B)', [ // Darker
                createSticker('💝', 90, 5, 36, 15),
                createWishCard('So inspiring to see your love', 10, '#A4161A', '#FFFFFF'), // Top wish
                // Expandable Wish Container - Centered and filling space
                {
                    id: uuidv4(),
                    type: 'long-text' as const,
                    content: 'Click here to write a long, heartfelt wish or memory. \n\nThis message will open in fullscreen for easy reading. Share your favorite moments, lessons learned, or hopes for the future.',
                    position: { x: 10, y: 24 },
                    size: { width: 80, height: 52 },
                    styles: {
                        borderRadius: 16,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#660708',
                        fontSize: 18,
                        zIndex: 10,
                        shadow: true,
                        textAlign: 'left',
                    },
                    metadata: { expandable: true } // Opens in lightbox
                },
                createWishCard('Here\'s to many more years', 78, '#660708', '#FFFFFF'), // Bottom wish
            ]);

            // Screen 5: Video Standalone - Deep purple background
            // Screen 5: Video Standalone - Deep Warm Ruby
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #660708, #A4161A)', [
                createSticker('💜', 88, 5, 40, 0), // Moved to corner
                createText('Still choosing each other', 12, 24, true, '#FFF'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '/images/templates/videos/video-placeholder.mp4',
                    position: { x: 10, y: 44 }, // Adjusted to end at 99% (44 + 55 = 99)
                    size: { width: 80, height: 55 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'anniversary-timeline',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#A4161A', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('#E5989B')],
                mediaLibrary: {}
            };
        }
    },

    // 4. One Screen Emotional Hit
    {
        id: 'one-screen',
        category: 'Minimal',
        name: 'One Screen Emotional',
        description: ['Minimal, powerful, cinematic', 'Single screen', 'No distractions'],
        thumbnail: '🎬',
        screens: 1,
        tags: ['simple', 'emotional', 'minimal'],
        defaultConfig: { primaryColor: '#333', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Single screen with fullscreen image/video and one sentence
            const s1 = createScreen('Main', 'overlay', '#222', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/one-screen-hero.webp',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    styles: { zIndex: 1 }
                },
                createText('I needed you to know this.', 50, 28, true, '#FFF')
            ], '🎬'); // Use template thumbnail
            s1.elements[1].styles.zIndex = 20;
            s1.elements[1].styles.animation = 'fade';
            s1.elements[1].styles.shadow = true;

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'one-screen',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#333', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1], // No navigation screen
                mediaLibrary: {}
            };
        }
    },

    // 5. Baby Birth Announcement
    {
        id: 'baby-birth',
        category: 'Family',
        name: 'Baby Announcement',
        description: ['Soft, gentle, warm', 'Mint green & cream', 'Welcome message'],
        thumbnail: '👶',
        screens: 5,
        tags: ['baby', 'family', 'newborn'],
        defaultConfig: { primaryColor: '#95d5b2', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with soft gradient, baby emojis
            const s1 = createScreen('Welcome', 'overlay', 'linear-gradient(to bottom, #d8f3dc, #fefae0, #b7e4c7)', [
                createSticker('⭐', 20, 12, 48, 0), // Moved up from 25 to avoid title overlap
                createSticker('❤️', 75, 15, 44, 10), // Moved up from 30 to avoid title overlap
                createSticker('👶', 50, 10, 56, 0), // Moved up from 20 to avoid title overlap
                createText('Welcome to the World', 30, 36, true, '#555'),
                createButton('See Baby', 70, '#95d5b2', '👶')
            ], 'stars'); // Use template thumbnail

            // Screen 2: Baby Hero + Details
            const s2 = createScreen('Details', 'content', '#FFF', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/baby-birth-hero.webp',
                    position: { x: 20, y: 12 },
                    size: { width: 60, height: 45 },
                    styles: { zIndex: 5, borderRadius: 16 }
                },
                createText('Born on [Date]', 60, 24, false, '#555'),
                createText('At [Time]', 68, 24, false, '#555'),
                createText('Weight: [Weight]', 89, 24, false, '#555'), // Adjusted to end at 99% (89 + 10 = 99)
            ]);

            // Screen 3: Gallery + Caption
            const s3 = createScreen('Gallery', 'content', '#fefae0', [
                createText('Our first moments together', 12, 24, true, '#555'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5 },
                    metadata: { galleryLayout: 'heroWithThumbnails' }
                }
            ]);

            // Screen 4: Wishes
            const s4 = createScreen('Wishes', 'content', '#d8f3dc', [
                createWishCard('Welcome, little one!', 20, '#95d5b2', '#FFFFFF'),
                createWishCard('So much love already', 87, '#b7e4c7', '#FFFFFF'), // Adjusted to end at 99% (87 + 12 = 99)
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'baby-birth',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#95d5b2', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#fefae0')],
                mediaLibrary: {}
            };
        }
    },

    // 6. Graduation
    {
        id: 'graduation',
        category: 'Celebration',
        name: 'Graduation Day',
        description: ['Proud, optimistic', 'Gold & Navy', 'Achievement focused'],
        thumbnail: '🎓',
        screens: 6,
        tags: ['grad', 'school', 'achievement'],
        defaultConfig: { primaryColor: '#ffc300', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with clean celebratory gradient, cap icon
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to bottom, #001d3d, #003566, #ffc300)', [
                createSticker('🎓', 50, 15, 64, 0), // Moved up from 25 to avoid title overlap (large sticker)
                createText('Graduation Day', 35, 42, true, '#ffc300'),
                createButton('Celebrate', 70, '#ffc300', '🎓')
            ], 'confetti'); // Use template thumbnail
            s1.elements[2].styles.color = '#001d3d';

            // Screen 2: Long Achievement Text - Gold/navy theme
            const s2 = createScreen('Message', 'content', 'linear-gradient(135deg, #FFFFFF, #fffef0, #ffc300)', [
                createSticker('🎓', 88, 8, 40, 0),
                createSticker('⭐', 10, 12, 36, -5),
                createLongText('To new beginnings,\n\nYour journey has been one of dedication, perseverance, and growth. Every late night studying, every challenge overcome, every moment of doubt turned into determination—it all led to this incredible achievement.\n\nYou have shown that with hard work and passion, anything is possible. The future holds endless opportunities, and you are ready to embrace them all.\n\nCongratulations on this milestone. The world awaits your brilliance.', 34, 'rgba(255,255,255,0.95)', '#001d3d') // Adjusted to end at 99% (34 + 65 = 99)
            ]);
            s2.elements[2].size = { width: 80, height: 65 };

            // Screen 3: Gallery + Caption - Navy/gold accents
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #f0f0f0, #FFFFFF)', [
                createSticker('📚', 12, 10, 36, 5),
                createText('The journey so far', 12, 26, true, '#003566'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Celebratory gold/navy
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #FFFFFF, #fffef0)', [
                createSticker('🏆', 88, 10, 40, 0),
                createWishCard('So proud of you!', 20, '#ffc300', '#001d3d'),
                createWishCard('The future is yours', 87, '#003566', '#FFFFFF'), // Adjusted to end at 99% (87 + 12 = 99)
            ]);

            // Screen 5: Video Standalone - Deep navy background
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #001d3d, #003566)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('A moment to remember', 12, 24, true, '#ffc300'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '/images/templates/videos/video-placeholder.mp4',
                    position: { x: 10, y: 44 }, // Adjusted to end at 99% (44 + 55 = 99)
                    size: { width: 80, height: 55 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'graduation',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#ffc300', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('linear-gradient(to bottom, #f0f0f0, #FFFFFF)')],
                mediaLibrary: {}
            };
        }
    },

    // 7. Thank You / Appreciation
    {
        id: 'thank-you',
        category: 'Greeting',
        name: 'Thank You',
        description: ['Warm, calm, sincere', 'Beige & Gold', 'Gratitude'],
        thumbnail: '🙏',
        screens: 5,
        tags: ['thanks', 'gratitude', 'kindness'],
        defaultConfig: { primaryColor: '#b5838d', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with soft warm background
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(120deg, #fdfcdc, #f0ebd8, #d4a574)', [
                { ...createText('Thank You', 40, 48, true, '#6d6875'), ...{ styles: { ...createText('Thank You', 40, 48, true, '#6d6875').styles, animation: 'fade' } } },
                createButton('Read Note', 70, '#b5838d', '🙏')
            ], '🙏'); // Use template thumbnail

            // Screen 2: Long Thank You Text - Warm beige/gold theme
            const s2 = createScreen('Note', 'content', 'linear-gradient(135deg, #FFFFFF, #fdfcdc, #f0ebd8)', [
                createSticker('🙏', 88, 8, 40, 0),
                createSticker('💝', 10, 12, 32, -5),
                createLongText('I wanted to take a moment to express my deepest gratitude.\n\nYour kindness, support, and generosity have meant more to me than words can convey. In a world that sometimes feels rushed, you took the time to be present, to care, and to make a difference.\n\nThank you for being you. Thank you for everything you\'ve done. Your impact will not be forgotten.\n\nWith sincere appreciation,', 34, 'rgba(255,255,255,0.95)', '#6d6875') // Adjusted to end at 99% (34 + 65 = 99)
            ]);
            s2.elements[2].size = { width: 80, height: 65 };
            s2.elements[2].styles.shadow = true;

            // Screen 3: Gallery + Caption - Warm beige background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #f0ebd8, #FFFFFF)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Moments we\'ll always remember', 12, 24, true, '#6d6875'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes / Notes - Elegant beige/gold
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #FFFFFF, #fdfcdc)', [
                createSticker('💌', 88, 10, 40, 0),
                createWishCard('With appreciation, [Name]', 87, '#b5838d', '#FFFFFF'), // Adjusted to end at 99% (87 + 12 = 99)
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'thank-you',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#b5838d', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#fdfcdc')],
                mediaLibrary: {}
            };
        }
    },

    // 8. Memorial / In Memory Of
    {
        id: 'memorial',
        category: 'Memorial',
        name: 'In Loving Memory',
        description: ['Respectful, calm, dignified', 'Blue, Gray, Lavender', 'Remembrance'],
        thumbnail: '🕯️',
        screens: 5,
        tags: ['memorial', 'peace', 'remembrance'],
        defaultConfig: { primaryColor: '#8d99ae', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with calm dark gradient, candle
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to bottom, #2b2d42, #8d99ae, #cbc0d3)', [
                createText('In Loving Memory', 35, 36, true, '#edf2f4'),
                createButton('Light Candle', 70, '#8d99ae', '🕯️')
            ], '🕯️'); // Use template thumbnail

            // Screen 2: Portrait + Short Text
            const s2 = createScreen('Portrait', 'content', '#edf2f4', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/memorial-hero.webp',
                    position: { x: 25, y: 15 },
                    size: { width: 50, height: 50 },
                    styles: { zIndex: 5, borderRadius: 8, shadow: true }
                },
                createText('Forever in our hearts', 89, 24, true, '#2b2d42') // Adjusted to end at 99% (89 + 10 = 99)
            ]);

            // Screen 3: Gallery + Caption
            const s3 = createScreen('Gallery', 'content', '#dbdbdb', [
                createText('A life full of moments', 12, 24, true, '#2b2d42'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5 }
                }
            ]);

            // Screen 4: Long Memorial Text
            const s4 = createScreen('Text', 'content', '#edf2f4', [
                createLongText('In loving memory of a life well-lived.\n\nYour presence touched so many hearts, and your absence leaves a void that can never be filled. We remember your kindness, your wisdom, and the love you shared with all who knew you.\n\nThough you are no longer with us, your spirit lives on in the memories we cherish and the lives you touched.\n\nRest in peace, forever remembered, forever loved.', 12, 'rgba(255,255,255,0.95)', '#2b2d42')
            ]);
            s4.elements[0].size = { width: 80, height: 87 }; // Adjusted to end at 99% (12 + 87 = 99)

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'memorial',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#8d99ae', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('linear-gradient(to bottom, #2b2d42, #8d99ae)')],
                mediaLibrary: {}
            };
        }
    },

    // 9. Wedding – Save the Date
    {
        id: 'wedding-save-date',
        category: 'Wedding',
        name: 'Save the Date',
        description: ['Elegant, romantic, clean', 'Blush Pink & Rose', 'Event details'],
        thumbnail: '💍',
        screens: 5,
        tags: ['wedding', 'love', 'invite'],
        defaultConfig: { primaryColor: '#ff4d6d', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with soft romantic background, envelope
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(135deg, #fff0f3, #ffccd5, #ffb3c6)', [
                createText('[Name] & [Name]', 30, 36, true, '#590d22'),
                createText('[Date]', 50, 24, false, '#800f2f'),
                createButton('Open Invite', 70, '#ff4d6d', '💌')
            ], 'hearts'); // Use template thumbnail

            // Screen 2: Event Details - Elegant blush pink/rose
            const s2 = createScreen('Details', 'content', 'linear-gradient(135deg, #FFFFFF, #fff0f3, #ffccd5)', [
                createSticker('💍', 88, 8, 40, 0),
                createSticker('💕', 10, 12, 32, -5),
                createText('We are getting married!', 12, 34, true, '#590d22'),
                createText('Date: [Date]\nLocation: [Location]\nTime: [Time]', 22, 20, false, '#333')
            ]);

            // Screen 3: Gallery + Caption - Romantic pink background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #fff0f3, #FFFFFF)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Our story in moments', 12, 26, true, '#800f2f'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true },
                    metadata: { galleryLayout: 'fullscreenSlideshow' }
                }
            ]);

            // Screen 4: Long Invitation Text - Elegant white with pink accents
            const s4 = createScreen('Message', 'content', 'linear-gradient(135deg, #FFFFFF, #fff0f3)', [
                createSticker('💌', 88, 10, 40, 0),
                createLongText('We are thrilled to invite you to celebrate our special day.\n\nAfter [X] years together, we have decided to make it official and would be honored to have you join us as we say "I do."\n\nYour presence would make our day even more meaningful. Please save the date and join us for an evening of love, laughter, and celebration.\n\nWith love and excitement,', 34, 'rgba(255,255,255,0.95)', '#333') // Adjusted to end at 99% (34 + 65 = 99)
            ]);
            s4.elements[1].size = { width: 80, height: 65 };

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'wedding-save-date',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#ff4d6d', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#fff0f3')],
                mediaLibrary: {}
            };
        }
    },

    // 10. New Year – Western
    {
        id: 'new-year',
        category: 'Holiday',
        name: 'New Year Celebration',
        description: ['Festive, reflective, hopeful', 'Midnight Blue & Gold', 'Fireworks'],
        thumbnail: '🎆',
        screens: 6,
        tags: ['newyear', 'party', 'fireworks'],
        defaultConfig: { primaryColor: '#FFD700', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with dark festive background, fireworks
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to bottom, #000428, #004e92, #0077be)', [
                createText('Welcome 202X', 35, 48, true, '#FFD700'),
                createButton('Celebrate', 70, '#FFD700', '🎆')
            ], 'fireworks'); // Use template thumbnail
            s1.elements[1].styles.color = '#000';

            // Screen 2: Reflection Text - Midnight blue/gold theme
            const s2 = createScreen('Reflection', 'content', 'linear-gradient(135deg, #000428, #004e92, #0077be)', [
                createSticker('⭐', 88, 8, 40, 0),
                createSticker('✨', 10, 12, 36, -5),
                createText('Looking back...', 12, 34, true, '#FFD700'),
                createLongText('As we reflect on the past year, we remember the challenges we overcame, the growth we experienced, and the moments that shaped us. Every high and every low contributed to who we are today.\n\nWe are grateful for the lessons learned, the connections made, and the memories created. The year may be ending, but the journey continues.', 49, 'rgba(0,0,0,0.8)', '#FFF') // Adjusted to end at 99% (49 + 50 = 99)
            ]);
            s2.elements[3].size = { width: 80, height: 50 };

            // Screen 3: Gallery + Caption - Dark festive background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #111, #000428)', [
                createSticker('📸', 12, 10, 36, 5),
                createText('Highlights from the year', 12, 26, true, '#FFD700'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Festive gold on dark
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #000, #000428)', [
                createSticker('🎆', 88, 10, 40, 0),
                createWishCard('Health', 20, '#FFD700', '#000'),
                createWishCard('Joy', 35, '#FFD700', '#000'),
                createWishCard('New beginnings', 87, '#FFD700', '#000'), // Adjusted to end at 99% (87 + 12 = 99)
            ], 'fireworks');

            // Screen 5: Video Standalone - Midnight blue
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #000428, #004e92)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('Happy New Year!', 12, 28, true, '#FFD700'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '/images/templates/videos/video-placeholder.mp4',
                    position: { x: 10, y: 44 }, // Adjusted to end at 99% (44 + 55 = 99)
                    size: { width: 80, height: 55 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'new-year',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#FFD700', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('linear-gradient(to bottom, #000428, #004e92)')],
                mediaLibrary: {}
            };
        }
    },

    // 11. Chinese New Year
    {
        id: 'cny',
        category: 'Holiday',
        name: 'Chinese New Year',
        description: ['Bold, cultural, celebratory', 'Red & Gold', 'Zodiac theme'],
        thumbnail: '🧧',
        screens: 5,
        tags: ['cny', 'holiday', 'tradition'],
        defaultConfig: { primaryColor: '#d00000', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with red and gold background
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(135deg, #d00000, #ff0000, #ffba08)', [
                createText('Year of the [Animal]', 35, 42, true, '#ffba08'),
                createButton('Open Envelope', 70, '#ffba08', '🧧')
            ], 'fireworks'); // Use template thumbnail
            s1.elements[1].styles.color = '#d00000';

            // Screen 2: Zodiac Hero
            const s2 = createScreen('Hero', 'content', '#fff8f0', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '/images/templates/heroes/cny-hero.webp',
                    position: { x: 20, y: 15 },
                    size: { width: 60, height: 50 },
                    styles: { zIndex: 5, frameColor: '#ffba08' }
                },
                createText('Strength, prosperity, and renewal', 89, 24, true, '#d00000') // Adjusted to end at 99% (89 + 10 = 99)
            ]);

            // Screen 3: Wishes
            const s3 = createScreen('Wishes', 'content', '#d00000', [
                createWishCard('Good fortune', 15, '#ffba08', '#d00000'),
                createWishCard('Health', 30, '#ffba08', '#d00000'),
                createWishCard('Success', 87, '#ffba08', '#d00000'), // Adjusted to end at 99% (87 + 12 = 99)
            ]);

            // Screen 4: Gallery + Caption
            const s4 = createScreen('Gallery', 'content', '#fff8f0', [
                createText('Celebrating together', 12, 24, true, '#d00000'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: JSON.stringify([
                        '/images/templates/galleries/gallery-1.webp',
                        '/images/templates/galleries/gallery-2.webp',
                        '/images/templates/galleries/gallery-3.webp',
                        '/images/templates/galleries/gallery-4.webp'
                    ]),
                    position: { x: 10, y: 41 }, // Adjusted to end at 99% (41 + 58 = 99)
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5 }
                }
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'cny',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#d00000', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#fff8f0')],
                mediaLibrary: {}
            };
        }
    },

    // 12. Blank Canvas – Pro Mode
    {
        id: 'blank',
        category: 'Pro',
        name: 'Blank Canvas',
        description: ['Neutral, clean, professional', 'Build everything from scratch', 'For creators'],
        thumbnail: '✨',
        screens: 1,
        tags: ['blank', 'pro', 'custom'],
        defaultConfig: { primaryColor: '#333', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            const s1 = createScreen('Screen 1', 'content', '#FFFFFF');

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'blank',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#333', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1],
                mediaLibrary: {}
            };
        }
    },
];

export const getTemplate = (id: string) => templates.find(t => t.id === id);
export const getAllTemplates = () => templates;
export { calculateLayout }; // Export for use in renderer
