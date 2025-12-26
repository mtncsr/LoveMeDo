import type { Project, Template, Screen, ScreenElement } from '../types/model';
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
    content: emoji ? `${emoji} ${content}` : content,
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
    metadata: { target: 'next', action: 'navigate' }
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

const createScreen = (title: string, type: Screen['type'], backgroundValue: string, elements: ScreenElement[] = [], overlay?: Screen['background']['overlay']): Screen => ({
    id: uuidv4(),
    title,
    type,
    background: {
        type: backgroundValue.includes('gradient') || backgroundValue.startsWith('#') ? (backgroundValue.startsWith('#') ? 'solid' : 'gradient') : 'image',
        value: backgroundValue,
        animation: 'fade',
        overlay
    },
    elements
});

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
                createSticker('🎈', 15, 20, 56, 0), // Balloon - slow float
                createSticker('🎉', 75, 30, 48, 15), // Confetti - soft burst
                createSticker('⭐', 50, 15, 52, 25), // Star - slow rotation
                createText('Happy Birthday!', 30, 48, true, '#FFFFFF'),
                createText('Let\'s celebrate your special day!', 50, 24, false, '#FFFFFF'),
                createButton('Start Experience', 70, '#FF4D6D', '🎁')
            ], 'confetti');
            s1.elements[3].styles.shadow = true; // Title shadow

            // Screen 2: Hero Image + Short Text - Bright playful design
            const s2 = createScreen('Hero', 'content', 'linear-gradient(135deg, #FFD93D, #FFE66D, #FFFFFF)', [
                createSticker('🎂', 85, 10, 40, 10),
                createSticker('🎈', 10, 15, 36, -5),
                createText('[Name] turns [Age]!', 20, 36, true, '#FF4D6D'),
                createText('A day full of fun, laughter, and surprises', 35, 20, false, '#333'),
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 10, y: 50 },
                    size: { width: 80, height: 35 },
                    styles: { zIndex: 5, borderRadius: 16, shadow: true }
                }
            ]);

            // Screen 3: Gallery + Caption + Wishes - Bright pink background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #fff0f3, #ffe0e6)', [
                createSticker('📸', 88, 8, 32, 0),
                createText('Some of our favorite moments together', 10, 26, true, '#FF4D6D'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 40 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                },
                createWishCard('Happy Birthday! We love you!', 65, '#FFD93D', '#FFFFFF'),
                createWishCard('Wishing you endless joy and fun!', 78, '#FF4D6D', '#FFFFFF'),
                createWishCard('So proud of you!', 88, '#4CC9F0', '#FFFFFF'),
            ]);

            // Screen 4: Video Standalone - Bright cyan background
            const s4 = createScreen('Video', 'content', 'linear-gradient(135deg, #4CC9F0, #7DD3FC, #FFFFFF)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('A special message for you', 10, 26, true, '#FF4D6D'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 25 },
                    size: { width: 80, height: 50 },
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
                createSticker('❤️', 20, 25, 48, 0),
                createSticker('✨', 75, 30, 40, 15),
                createSticker('💕', 50, 20, 44, 10),
                createText('For You', 35, 48, true, '#FFF'),
                createText('A small journey of our love', 55, 20, false, 'rgba(255,255,255,0.9)'),
                createButton('Open', 75, '#C9184A', '❤️')
            ], 'hearts');

            // Screen 2: Long Love Text - Romantic burgundy/purple theme
            const s2 = createScreen('Message', 'content', 'linear-gradient(135deg, #FDF0F5, #F8E8EE, #FFF)', [
                createSticker('❤️', 88, 8, 32, 0),
                createSticker('💕', 10, 12, 28, -5),
                createLongText('To my dearest love,\n\nEvery day with you is a gift. Every moment we share becomes a treasured memory. Your smile lights up my world, and your love fills my heart with endless joy.\n\nOn this special day, I want you to know how much you mean to me. You are my everything, my today, and my forever.\n\nWith all my love,', 20, 'rgba(255,255,255,0.95)', '#590d22')
            ]);

            // Screen 3: Gallery + Caption - Elegant white with burgundy accents
            const s3 = createScreen('Us', 'content', 'linear-gradient(to bottom, #FFFFFF, #FDF0F5)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Moments that mean everything to me', 15, 26, true, '#800f2f'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 25 },
                    size: { width: 80, height: 60 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Video Standalone - Deep romantic background
            const s4 = createScreen('Video', 'content', 'linear-gradient(135deg, #590d22, #800f2f, #9d4edd)', [
                createSticker('💜', 88, 10, 40, 0),
                createText('Just for you', 10, 24, true, '#FFF'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 25 },
                    size: { width: 80, height: 50 },
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
                createSticker('⏳', 50, 25, 56, 0),
                createText('Our Story', 35, 48, true, '#FFF'),
                createText('Since [Year]', 55, 24, false, '#f2e9e4'),
                createButton('Begin Journey', 75, '#22223b')
            ]);

            // Screen 2: Intro Text - Warm purple/rose theme
            const s2 = createScreen('Intro', 'content', 'linear-gradient(135deg, #f2e9e4, #e9d8d6, #FFFFFF)', [
                createSticker('💑', 50, 15, 44, 0),
                createText('It all started with one moment, and slowly became a lifetime of memories.', 40, 24, false, '#22223b')
            ]);

            // Screen 3: Timeline Gallery - Mature purple tones
            const s3 = createScreen('Timeline', 'content', 'linear-gradient(to bottom, #c9ada7, #e9d8d6)', [
                createSticker('📅', 88, 8, 32, 0),
                createText('Every step brought us closer', 10, 26, true, '#22223b'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 5, y: 20 },
                    size: { width: 90, height: 60 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Warm elegant background
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #f2e9e4, #FFFFFF)', [
                createSticker('💝', 12, 10, 36, 5),
                createWishCard('So inspiring to see your love', 30, '#9a8c98', '#FFFFFF'),
                createWishCard('Here\'s to many more years', 45, '#4a4e69', '#FFFFFF'),
            ]);

            // Screen 5: Video Standalone - Deep purple background
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #22223b, #4a4e69)', [
                createSticker('💜', 88, 10, 40, 0),
                createText('Still choosing each other', 15, 24, true, '#FFF'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 25 },
                    size: { width: 80, height: 50 },
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
            ]);
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
                createSticker('⭐', 20, 25, 48, 0),
                createSticker('❤️', 75, 30, 44, 10),
                createSticker('👶', 50, 20, 56, 0),
                createText('Welcome to the World', 30, 36, true, '#555'),
                createButton('See Baby', 70, '#95d5b2', '👶')
            ], 'stars');

            // Screen 2: Baby Hero + Details
            const s2 = createScreen('Details', 'content', '#FFF', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 20, y: 15 },
                    size: { width: 60, height: 40 },
                    styles: { zIndex: 5, borderRadius: 16 }
                },
                createText('Born on [Date]', 60, 24, false, '#555'),
                createText('At [Time]', 68, 24, false, '#555'),
                createText('Weight: [Weight]', 76, 24, false, '#555'),
            ]);

            // Screen 3: Gallery + Caption
            const s3 = createScreen('Gallery', 'content', '#fefae0', [
                createText('Our first moments together', 10, 24, true, '#555'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
                    styles: { zIndex: 5 }
                }
            ]);

            // Screen 4: Wishes
            const s4 = createScreen('Wishes', 'content', '#d8f3dc', [
                createWishCard('Welcome, little one!', 35, '#95d5b2', '#FFFFFF'),
                createWishCard('So much love already', 50, '#b7e4c7', '#FFFFFF'),
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
                createSticker('🎓', 50, 25, 64, 0),
                createText('Graduation Day', 35, 42, true, '#ffc300'),
                createButton('Celebrate', 70, '#ffc300', '🎓')
            ]);
            s1.elements[2].styles.color = '#001d3d';

            // Screen 2: Long Achievement Text - Gold/navy theme
            const s2 = createScreen('Message', 'content', 'linear-gradient(135deg, #FFFFFF, #fffef0, #ffc300)', [
                createSticker('🎓', 88, 8, 40, 0),
                createSticker('⭐', 10, 12, 36, -5),
                createLongText('To new beginnings,\n\nYour journey has been one of dedication, perseverance, and growth. Every late night studying, every challenge overcome, every moment of doubt turned into determination—it all led to this incredible achievement.\n\nYou have shown that with hard work and passion, anything is possible. The future holds endless opportunities, and you are ready to embrace them all.\n\nCongratulations on this milestone. The world awaits your brilliance.', 20, 'rgba(255,255,255,0.95)', '#001d3d')
            ]);

            // Screen 3: Gallery + Caption - Navy/gold accents
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #f0f0f0, #FFFFFF)', [
                createSticker('📚', 12, 10, 36, 5),
                createText('The journey so far', 10, 26, true, '#003566'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Celebratory gold/navy
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #FFFFFF, #fffef0)', [
                createSticker('🏆', 88, 10, 40, 0),
                createWishCard('So proud of you!', 35, '#ffc300', '#001d3d'),
                createWishCard('The future is yours', 50, '#003566', '#FFFFFF'),
            ]);

            // Screen 5: Video Standalone - Deep navy background
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #001d3d, #003566)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('A moment to remember', 15, 24, true, '#ffc300'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 25 },
                    size: { width: 80, height: 50 },
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
            ]);

            // Screen 2: Long Thank You Text - Warm beige/gold theme
            const s2 = createScreen('Note', 'content', 'linear-gradient(135deg, #FFFFFF, #fdfcdc, #f0ebd8)', [
                createSticker('🙏', 88, 8, 40, 0),
                createSticker('💝', 10, 12, 32, -5),
                createLongText('I wanted to take a moment to express my deepest gratitude.\n\nYour kindness, support, and generosity have meant more to me than words can convey. In a world that sometimes feels rushed, you took the time to be present, to care, and to make a difference.\n\nThank you for being you. Thank you for everything you\'ve done. Your impact will not be forgotten.\n\nWith sincere appreciation,', 20, 'rgba(255,255,255,0.95)', '#6d6875')
            ]);

            // Screen 3: Gallery + Caption - Warm beige background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #f0ebd8, #FFFFFF)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Moments we\'ll always remember', 10, 24, true, '#6d6875'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
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
            ], 'stars');

            // Screen 2: Portrait + Short Text
            const s2 = createScreen('Portrait', 'content', '#edf2f4', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 25, y: 20 },
                    size: { width: 50, height: 50 },
                    styles: { zIndex: 5, borderRadius: 8 }
                },
                createText('Forever in our hearts', 75, 24, true, '#2b2d42')
            ]);

            // Screen 3: Gallery + Caption
            const s3 = createScreen('Gallery', 'content', '#dbdbdb', [
                createText('A life full of moments', 10, 24, true, '#2b2d42'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
                    styles: { zIndex: 5 }
                }
            ]);

            // Screen 4: Long Memorial Text
            const s4 = createScreen('Text', 'content', '#edf2f4', [
                createLongText('In loving memory of a life well-lived.\n\nYour presence touched so many hearts, and your absence leaves a void that can never be filled. We remember your kindness, your wisdom, and the love you shared with all who knew you.\n\nThough you are no longer with us, your spirit lives on in the memories we cherish and the lives you touched.\n\nRest in peace, forever remembered, forever loved.', 20, 'rgba(255,255,255,0.95)', '#2b2d42')
            ]);

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
            ], 'hearts');

            // Screen 2: Event Details - Elegant blush pink/rose
            const s2 = createScreen('Details', 'content', 'linear-gradient(135deg, #FFFFFF, #fff0f3, #ffccd5)', [
                createSticker('💍', 88, 8, 40, 0),
                createSticker('💕', 10, 12, 32, -5),
                createText('We are getting married!', 20, 34, true, '#590d22'),
                createText('Date: [Date]\nLocation: [Location]\nTime: [Time]', 50, 20, false, '#333')
            ]);

            // Screen 3: Gallery + Caption - Romantic pink background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #fff0f3, #FFFFFF)', [
                createSticker('📷', 12, 10, 36, 5),
                createText('Our story in moments', 10, 26, true, '#800f2f'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Long Invitation Text - Elegant white with pink accents
            const s4 = createScreen('Message', 'content', 'linear-gradient(135deg, #FFFFFF, #fff0f3)', [
                createSticker('💌', 88, 10, 40, 0),
                createLongText('We are thrilled to invite you to celebrate our special day.\n\nAfter [X] years together, we have decided to make it official and would be honored to have you join us as we say "I do."\n\nYour presence would make our day even more meaningful. Please save the date and join us for an evening of love, laughter, and celebration.\n\nWith love and excitement,', 20, 'rgba(255,255,255,0.95)', '#333')
            ]);

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
            ], 'fireworks');
            s1.elements[1].styles.color = '#000';

            // Screen 2: Reflection Text - Midnight blue/gold theme
            const s2 = createScreen('Reflection', 'content', 'linear-gradient(135deg, #000428, #004e92, #0077be)', [
                createSticker('⭐', 88, 8, 40, 0),
                createSticker('✨', 10, 12, 36, -5),
                createText('Looking back...', 20, 34, true, '#FFD700'),
                createLongText('As we reflect on the past year, we remember the challenges we overcame, the growth we experienced, and the moments that shaped us. Every high and every low contributed to who we are today.\n\nWe are grateful for the lessons learned, the connections made, and the memories created. The year may be ending, but the journey continues.', 35, 'rgba(0,0,0,0.8)', '#FFF')
            ]);

            // Screen 3: Gallery + Caption - Dark festive background
            const s3 = createScreen('Gallery', 'content', 'linear-gradient(to bottom, #111, #000428)', [
                createSticker('📸', 12, 10, 36, 5),
                createText('Highlights from the year', 10, 26, true, '#FFD700'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
                    styles: { zIndex: 5, borderRadius: 12, shadow: true }
                }
            ]);

            // Screen 4: Wishes - Festive gold on dark
            const s4 = createScreen('Wishes', 'content', 'linear-gradient(135deg, #000, #000428)', [
                createSticker('🎆', 88, 10, 40, 0),
                createWishCard('Health', 35, '#FFD700', '#000'),
                createWishCard('Joy', 50, '#FFD700', '#000'),
                createWishCard('New beginnings', 65, '#FFD700', '#000'),
            ]);

            // Screen 5: Video Standalone - Midnight blue
            const s5 = createScreen('Video', 'content', 'linear-gradient(135deg, #000428, #004e92)', [
                createSticker('🎬', 12, 10, 40, 5),
                createText('Happy New Year!', 15, 28, true, '#FFD700'),
                {
                    id: uuidv4(),
                    type: 'video' as const,
                    content: '',
                    position: { x: 10, y: 25 },
                    size: { width: 80, height: 50 },
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
            ], 'confetti');
            s1.elements[1].styles.color = '#d00000';

            // Screen 2: Zodiac Hero
            const s2 = createScreen('Hero', 'content', '#fff8f0', [
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 20, y: 20 },
                    size: { width: 60, height: 50 },
                    styles: { zIndex: 5 }
                },
                createText('Strength, prosperity, and renewal', 75, 24, true, '#d00000')
            ]);

            // Screen 3: Wishes
            const s3 = createScreen('Wishes', 'content', '#d00000', [
                createWishCard('Good fortune', 30, '#ffba08', '#d00000'),
                createWishCard('Health', 45, '#ffba08', '#d00000'),
                createWishCard('Success', 60, '#ffba08', '#d00000'),
            ]);

            // Screen 4: Gallery + Caption
            const s4 = createScreen('Gallery', 'content', '#fff8f0', [
                createText('Celebrating together', 10, 24, true, '#d00000'),
                {
                    id: uuidv4(),
                    type: 'gallery' as const,
                    content: '[]',
                    position: { x: 10, y: 20 },
                    size: { width: 80, height: 60 },
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
