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
    // Apply layout calculation for content screens to prevent overlaps
    const processedElements = type === 'content' ? calculateLayout(elements) : elements;
    
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
        elements: processedElements
    };
};

// Layout helper: Calculate non-overlapping positions for content screens
// Works in 0-100% space which maps to 10-85% safe area in renderer
const calculateLayout = (elements: ScreenElement[]): ScreenElement[] => {
    // Safe area bounds: 0-100% in template space maps to 10-85% on screen
    const safeAreaTop = 0;
    const safeAreaBottom = 100;  // 100% in template = 85% on screen (safe area bottom)
    const minSpacing = 3;        // Minimum 3% spacing between elements
    const mobileSizeReduction = 0.85; // Reduce element sizes by 15% for mobile
    
    // Separate layout-constrained elements from stickers (free-floating)
    const layoutElements: ScreenElement[] = [];
    const stickers: ScreenElement[] = [];
    
    elements.forEach(el => {
        if (el.type === 'sticker') {
            stickers.push(el); // Stickers can overlap, keep original position
        } else {
            layoutElements.push({ ...el }); // Copy for layout calculation
        }
    });
    
    // Sort layout elements by intended Y position (top to bottom)
    layoutElements.sort((a, b) => {
        const aY = a.position.y;
        const bY = b.position.y;
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
        let adjustedHeight = (current.size.height || 10) * mobileSizeReduction; // Reduce size for mobile
        
        // Check for overlaps with ALL previous elements (not just immediately previous)
        let maxBottom = safeAreaTop;
        for (let j = 0; j < adjustedElements.length; j++) {
            const previous = adjustedElements[j];
            const prevBottom = previous.position.y + (previous.size.height || 10);
            
            // Check if elements overlap horizontally (same column/area)
            const horizontalOverlap = 
                (current.position.x < previous.position.x + (previous.size.width || 80) &&
                 current.position.x + (current.size.width || 80) > previous.position.x);
            
            // If horizontally overlapping, track the bottom position
            if (horizontalOverlap) {
                maxBottom = Math.max(maxBottom, prevBottom);
            }
        }
        
        // Position element below all overlapping previous elements with spacing
        if (adjustedY < maxBottom + minSpacing) {
            adjustedY = maxBottom + minSpacing;
        }
        
        // CRITICAL: Ensure element doesn't exceed safe area bottom (100% = 85% on screen)
        // After mapping: y: 100% → 85%, height: 20% → 15%, so bottom = 100% (overlaps!)
        // Solution: Keep elements within 0-100% template space, but ensure bottom ≤ 100%
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
        adjustedElements.push({
            ...current,
            position: {
                ...current.position,
                y: finalY
            },
            size: {
                ...current.size,
                height: finalHeight
            }
        });
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
        screens: 5,
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
            ], '🎈'); // Use template thumbnail
            s1.elements[3].styles.shadow = true; // Title shadow

            // Screen 2: Hero Image + Short Text - Bright playful design
            const s2 = createScreen('Hero', 'content', 'linear-gradient(135deg, #FFD93D, #FFE66D, #FFFFFF)', [
                createSticker('🎂', 85, 10, 40, 10),
                createSticker('🎈', 10, 15, 36, -5),
                createText('[Name] turns [Age]!', 12, 36, true, '#FF4D6D'),
                createText('A day full of fun, laughter, and surprises', 20, 20, false, '#333'),
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 10, y: 28 },
                    size: { width: 80, height: 45 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            // Screen 3: Gallery + Caption + Wishes - Bright pink background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #fff0f3, #ffe0e6)', [
                createSticker('📸', 88, 8, 32, 0),
                createText('Some of our favorite moments together', 12, 26, true, '#FF4D6D'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 35 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                },
                createWishCard('Happy Birthday! We love you!', 58, '#FFD93D', '#FFFFFF'),
                createWishCard('Wishing you endless joy and fun!', 70, '#FF4D6D', '#FFFFFF'),
                createWishCard('So proud of you!', 80, '#4CC9F0', '#FFFFFF'),
            ]);

            // Screen 4: Video Standalone - Bright cyan background
            const s4 = createScreen('Video', 'content', 'linear-gradient(135deg, #4CC9F0, #7DD3FC, #FFFFFF)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('A special message for you', 12, 26, true, '#FF4D6D'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 22 },
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
                screens: [s1, s2, s3, s4, createNavScreen('linear-gradient(135deg, #FFD93D, #FFE66D, #FFFFFF)')],
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
            ], '🌹'); // Use template thumbnail

            // Screen 2: Long Love Text - Romantic burgundy/purple theme
            const s2 = createScreen('Message', 'content', 'linear-gradient(135deg, #FDF0F5, #F8E8EE, #FFF)', [
                createSticker('❤️', 88, 8, 32, 0),
                createSticker('💕', 10, 12, 28, -5),
                createLongText('To my dearest love,\n\nEvery day with you is a gift. Every moment we share becomes a treasured memory. Your smile lights up my world, and your love fills my heart with endless joy.\n\nOn this special day, I want you to know how much you mean to me. You are my everything, my today, and my forever.\n\nWith all my love,', 12, 'rgba(255,255,255,0.95)', '#590d22')
            ]);
            s2.elements[2].size = { width: 80, height: 65 };

            // Screen 3: Gallery + Caption - Elegant white with burgundy accents
            const s3 = createScreen('Us', 'content', 'linear-gradient(to bottom, #FFFFFF, #FDF0F5)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Moments that mean everything to me', 12, 26, true, '#800f2f'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Video Standalone - Deep romantic background
            const s4 = createScreen('Video', 'content', 'linear-gradient(135deg, #590d22, #800f2f, #9d4edd)', [
                createSticker('💜', 88, 10, 40, 0),
                createText('Just for you', 12, 24, true, '#FFF'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 22 },
                    size: { width: 80, height: 55 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
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
        description: ['Warm, mature, story-driven', 'Timeline style', 'Deep purple & rose'],
        thumbnail: '⏳',
        screens: 6,
        tags: ['anniversary', 'timeline', 'story'],
        defaultConfig: { primaryColor: '#9a8c98', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
        initialProjectData: (title) => {
            // Screen 1: Overlay with calm gradient, hourglass
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to right, #4a4e69, #9a8c98, #c9ada7)', [
                createSticker('⏳', 50, 15, 56, 0), // Moved up from 25 to avoid title overlap (large sticker)
                createText('Our Story', 35, 48, true, '#FFF'),
                createText('Since [Year]', 55, 24, false, '#f2e9e4'),
                createButton('Begin Journey', 75, '#22223b')
            ], '⏳'); // Use template thumbnail

            // Screen 2: Intro Text - Warm purple/rose theme
            const s2 = createScreen('Intro', 'content', 'linear-gradient(135deg, #f2e9e4, #e9d8d6, #FFFFFF)', [
                createSticker('💑', 50, 15, 44, 0),
                createText('It all started with one moment, and slowly became a lifetime of memories.', 12, 24, false, '#22223b')
            ]);

            // Screen 3: Timeline Gallery - Mature purple tones
            const s3 = createScreen('Timeline', 'content', 'linear-gradient(to bottom, #c9ada7, #e9d8d6)', [
                createSticker('📅', 88, 8, 32, 0),
                createText('Every step brought us closer', 12, 26, true, '#22223b'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Warm elegant background
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #f2e9e4, #FFFFFF)', [
                createSticker('💝', 12, 10, 36, 5),
                createWishCard('So inspiring to see your love', 15, '#9a8c98', '#FFFFFF'),
                createWishCard('Here\'s to many more years', 30, '#4a4e69', '#FFFFFF'),
            ]);

            // Screen 5: Video Standalone - Deep purple background
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #22223b, #4a4e69)', [
                createSticker('💜', 88, 10, 40, 0),
                createText('Still choosing each other', 12, 24, true, '#FFF'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 22 },
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
                config: { title, primaryColor: '#9a8c98', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('#f2e9e4')],
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
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    styles: { zIndex: 1 }
                },
                createText('I needed you to know this.', 50, 28, true, '#FFF')
            ], '🎬'); // Use template thumbnail
            s1.elements[1].styles.zIndex = 20;

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
            ], '👶'); // Use template thumbnail

            // Screen 2: Baby Hero + Details
            const s2 = createScreen('Details', 'content', '#FFF', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 20, y: 12 },
                    size: { width: 60, height: 45 },
                    styles: { zIndex: 5, borderRadius: 16 }
                },
                createText('Born on [Date]', 60, 24, false, '#555'),
                createText('At [Time]', 68, 24, false, '#555'),
                createText('Weight: [Weight]', 76, 24, false, '#555'),
            ]);

            // Screen 3: Gallery + Caption
            const s3 = createScreen('Gallery', 'content', '#fefae0', [
                createText('Our first moments together', 12, 24, true, '#555'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5 }
                }
            ]);

            // Screen 4: Wishes
            const s4 = createScreen('Wishes', 'content', '#d8f3dc', [
                createWishCard('Welcome, little one!', 20, '#95d5b2', '#FFFFFF'),
                createWishCard('So much love already', 35, '#b7e4c7', '#FFFFFF'),
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
            ], '🎓'); // Use template thumbnail
            s1.elements[2].styles.color = '#001d3d';

            // Screen 2: Long Achievement Text - Gold/navy theme
            const s2 = createScreen('Message', 'content', 'linear-gradient(135deg, #FFFFFF, #fffef0, #ffc300)', [
                createSticker('🎓', 88, 8, 40, 0),
                createSticker('⭐', 10, 12, 36, -5),
                createLongText('To new beginnings,\n\nYour journey has been one of dedication, perseverance, and growth. Every late night studying, every challenge overcome, every moment of doubt turned into determination—it all led to this incredible achievement.\n\nYou have shown that with hard work and passion, anything is possible. The future holds endless opportunities, and you are ready to embrace them all.\n\nCongratulations on this milestone. The world awaits your brilliance.', 12, 'rgba(255,255,255,0.95)', '#001d3d')
            ]);
            s2.elements[2].size = { width: 80, height: 65 };

            // Screen 3: Gallery + Caption - Navy/gold accents
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #f0f0f0, #FFFFFF)', [
                createSticker('📚', 12, 10, 36, 5),
                createText('The journey so far', 12, 26, true, '#003566'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Celebratory gold/navy
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #FFFFFF, #fffef0)', [
                createSticker('🏆', 88, 10, 40, 0),
                createWishCard('So proud of you!', 20, '#ffc300', '#001d3d'),
                createWishCard('The future is yours', 35, '#003566', '#FFFFFF'),
            ]);

            // Screen 5: Video Standalone - Deep navy background
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #001d3d, #003566)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('A moment to remember', 12, 24, true, '#ffc300'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 22 },
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
                createText('Thank You', 40, 48, true, '#6d6875'),
                createButton('Read Note', 70, '#b5838d', '🙏')
            ], '🙏'); // Use template thumbnail

            // Screen 2: Long Thank You Text - Warm beige/gold theme
            const s2 = createScreen('Note', 'content', 'linear-gradient(135deg, #FFFFFF, #fdfcdc, #f0ebd8)', [
                createSticker('🙏', 88, 8, 40, 0),
                createSticker('💝', 10, 12, 32, -5),
                createLongText('I wanted to take a moment to express my deepest gratitude.\n\nYour kindness, support, and generosity have meant more to me than words can convey. In a world that sometimes feels rushed, you took the time to be present, to care, and to make a difference.\n\nThank you for being you. Thank you for everything you\'ve done. Your impact will not be forgotten.\n\nWith sincere appreciation,', 12, 'rgba(255,255,255,0.95)', '#6d6875')
            ]);
            s2.elements[2].size = { width: 80, height: 65 };

            // Screen 3: Gallery + Caption - Warm beige background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #f0ebd8, #FFFFFF)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Moments we\'ll always remember', 12, 24, true, '#6d6875'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes / Notes - Elegant beige/gold
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #FFFFFF, #fdfcdc)', [
                createSticker('💌', 88, 10, 40, 0),
                createWishCard('With appreciation, [Name]', 40, '#b5838d', '#FFFFFF'),
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
                    content: '',
                    position: { x: 25, y: 15 },
                    size: { width: 50, height: 50 },
                    styles: { zIndex: 5, borderRadius: 8 }
                },
                createText('Forever in our hearts', 68, 24, true, '#2b2d42')
            ]);

            // Screen 3: Gallery + Caption
            const s3 = createScreen('Gallery', 'content', '#dbdbdb', [
                createText('A life full of moments', 12, 24, true, '#2b2d42'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5 }
                }
            ]);

            // Screen 4: Long Memorial Text
            const s4 = createScreen('Text', 'content', '#edf2f4', [
                createLongText('In loving memory of a life well-lived.\n\nYour presence touched so many hearts, and your absence leaves a void that can never be filled. We remember your kindness, your wisdom, and the love you shared with all who knew you.\n\nThough you are no longer with us, your spirit lives on in the memories we cherish and the lives you touched.\n\nRest in peace, forever remembered, forever loved.', 12, 'rgba(255,255,255,0.95)', '#2b2d42')
            ]);
            s4.elements[0].size = { width: 80, height: 65 };

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
            ], '💍'); // Use template thumbnail

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
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Long Invitation Text - Elegant white with pink accents
            const s4 = createScreen('Message', 'content', 'linear-gradient(135deg, #FFFFFF, #fff0f3)', [
                createSticker('💌', 88, 10, 40, 0),
                createLongText('We are thrilled to invite you to celebrate our special day.\n\nAfter [X] years together, we have decided to make it official and would be honored to have you join us as we say "I do."\n\nYour presence would make our day even more meaningful. Please save the date and join us for an evening of love, laughter, and celebration.\n\nWith love and excitement,', 12, 'rgba(255,255,255,0.95)', '#333')
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
            ], '🎆'); // Use template thumbnail
            s1.elements[1].styles.color = '#000';

            // Screen 2: Reflection Text - Midnight blue/gold theme
            const s2 = createScreen('Reflection', 'content', 'linear-gradient(135deg, #000428, #004e92, #0077be)', [
                createSticker('⭐', 88, 8, 40, 0),
                createSticker('✨', 10, 12, 36, -5),
                createText('Looking back...', 12, 34, true, '#FFD700'),
                createLongText('As we reflect on the past year, we remember the challenges we overcame, the growth we experienced, and the moments that shaped us. Every high and every low contributed to who we are today.\n\nWe are grateful for the lessons learned, the connections made, and the memories created. The year may be ending, but the journey continues.', 22, 'rgba(0,0,0,0.8)', '#FFF')
            ]);
            s2.elements[3].size = { width: 80, height: 50 };

            // Screen 3: Gallery + Caption - Dark festive background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #111, #000428)', [
                createSticker('📸', 12, 10, 36, 5),
                createText('Highlights from the year', 12, 26, true, '#FFD700'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 58 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Festive gold on dark
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #000, #000428)', [
                createSticker('🎆', 88, 10, 40, 0),
                createWishCard('Health', 20, '#FFD700', '#000'),
                createWishCard('Joy', 35, '#FFD700', '#000'),
                createWishCard('New beginnings', 50, '#FFD700', '#000'),
            ]);

            // Screen 5: Video Standalone - Midnight blue
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #000428, #004e92)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('Happy New Year!', 12, 28, true, '#FFD700'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 22 },
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
            ], '🧧'); // Use template thumbnail
            s1.elements[1].styles.color = '#d00000';

            // Screen 2: Zodiac Hero
            const s2 = createScreen('Hero', 'content', '#fff8f0', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 20, y: 15 },
                    size: { width: 60, height: 50 },
                    styles: { zIndex: 5 }
                },
                createText('Strength, prosperity, and renewal', 68, 24, true, '#d00000')
            ]);

            // Screen 3: Wishes
            const s3 = createScreen('Wishes', 'content', '#d00000', [
                createWishCard('Good fortune', 15, '#ffba08', '#d00000'),
                createWishCard('Health', 30, '#ffba08', '#d00000'),
                createWishCard('Success', 45, '#ffba08', '#d00000'),
            ]);

            // Screen 4: Gallery + Caption
            const s4 = createScreen('Gallery', 'content', '#fff8f0', [
                createText('Celebrating together', 12, 24, true, '#d00000'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
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
