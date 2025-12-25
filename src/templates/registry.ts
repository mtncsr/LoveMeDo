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

const createButton = (content: string, y: number, color: string = 'var(--color-primary)'): ScreenElement => ({
    id: uuidv4(),
    type: 'button',
    content,
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
    background: { type: 'solid', value: bg, animation: 'none' },
    elements: [] // Renderer handles the grid automatically for type='navigation'
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
        defaultConfig: { primaryColor: '#FFD93D', fontHeading: 'Fredoka One' },
        initialProjectData: (title) => {
            const s1 = createScreen('Welcome', 'overlay', 'linear-gradient(135deg, #FFD93D, #FF4D6D, #4CC9F0)', [
                createText('Happy Birthday!', 30, 48, true, '#FFFFFF'),
                createText('Let’s celebrate your special day!', 50, 24, false, '#FFFFFF'),
                createButton('🎁 Start Party', 70, '#FF4D6D')
            ], 'confetti');
            s1.elements[0].styles.shadow = true;

            const s2 = createScreen('Hero', 'content', '#FFFFFF', [
                createText('[Name] turns [Age]!', 20, 32, true, '#ff006e'),
                createText('A day full of fun, laughter, and surprises', 35, 20, false, '#333'),
                {
                    id: uuidv4(),
                    type: 'image' as const,
                    content: '',
                    position: { x: 10, y: 50 },
                    size: { width: 80, height: 35 },
                    styles: { zIndex: 5 }
                }
            ]);

            const s3 = createScreen('Gallery', 'content', '#fff0f3', [
                createText('Some of our favorite moments', 10, 24, true, '#ff006e'),
            ]);

            const s4 = createScreen('Video', 'content', '#ccff33', [
                createText('A special message for you', 10, 24, true, '#333')
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'birthday-kids',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#FFD93D', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#FFFFFF')],
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Intro', 'overlay', 'linear-gradient(135deg, #590d22, #800f2f, #ffccd5)', [
                createText('For You', 35, 48, true, '#FFF'),
                createText('A small journey of our love', 55, 20, false, 'rgba(255,255,255,0.9)'),
                createButton('❤️ Open', 75, '#C9184A')
            ], 'hearts');

            const s2 = createScreen('Message', 'content', '#FDF0F5', [
                createText('To my love,', 20, 28, true, '#590d22'),
                createText('Every day with you is a gift.', 40, 20, false, '#590d22')
            ]);

            const s3 = createScreen('Us', 'content', '#FFF', [
                createText('Moments that mean everything', 15, 24, true, '#800f2f')
            ]);

            const s4 = createScreen('Video', 'content', '#000', [
                createText('Just for you', 10, 20, false, '#FFF')
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to right, #4a4e69, #9a8c98)', [
                createText('Our Story', 35, 48, true, '#FFF'),
                createText('Since [Year]', 55, 24, false, '#f2e9e4'),
                createButton('Begin Journey', 75, '#22223b')
            ]);

            const s2 = createScreen('Intro', 'content', '#f2e9e4', [
                createText('It all started with one moment...', 40, 24, false, '#22223b')
            ]);

            const s3 = createScreen('Timeline', 'content', '#c9ada7', [
                createText('Every step brought us closer', 10, 24, true, '#22223b')
            ]);

            const s4 = createScreen('Wishes', 'content', '#f2e9e4', [
                createText('Here’s to many more years', 40, 24, true, '#22223b')
            ]);

            const s5 = createScreen('Video', 'content', '#22223b', [
                createText('Still choosing each other', 15, 20, false, '#FFF')
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
        defaultConfig: {},
        initialProjectData: (title) => {
            // Single screen, no navigation screen per spec
            const s1 = createScreen('Main', 'content', '#222', [
                createText('I needed you to know this.', 50, 24, true, '#FFF')
            ]);
            // Remove top bar by making it overlay type but without start button
            s1.type = 'overlay';
            s1.elements = s1.elements.filter(el => el.type !== 'button'); // Remove any buttons

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'one-screen',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#FFF', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Welcome', 'overlay', 'linear-gradient(to bottom, #d8f3dc, #fefae0)', [
                createText('Welcome to the World', 30, 36, true, '#555'),
                createButton('👶 See Baby', 70, '#95d5b2')
            ], 'stars');

            const s2 = createScreen('Details', 'content', '#FFF', [
                createText('Born on [Date]', 20, 24),
                createText('At [Time]', 30, 24),
                createText('Weight: [Weight]', 40, 24),
            ]);

            const s3 = createScreen('Gallery', 'content', '#fefae0', [
                createText('Our first moments', 10, 24)
            ]);

            const s4 = createScreen('Wishes', 'content', '#d8f3dc', [
                createText('So much love already', 40, 24, true, '#444')
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to bottom, #001d3d, #003566)', [
                createText('Graduation Day', 35, 42, true, '#ffc300'),
                createButton('🎓 Celebrate', 70, '#ffc300')
            ]);
            s1.elements[1].styles.color = '#001d3d'; // dark text on gold button

            const s2 = createScreen('Message', 'content', '#FFF', [
                createText('To new beginnings', 20, 28, true, '#001d3d'),
                createText('[Lengthy achievement text...]', 50, 18)
            ]);

            const s3 = createScreen('Gallery', 'content', '#f0f0f0', [
                createText('The journey so far', 10, 24, true, '#003566')
            ]);

            const s4 = createScreen('Wishes', 'content', '#FFF', [
                createText('The future is yours!', 40, 32, true, '#001d3d')
            ]);

            const s5 = createScreen('Video', 'content', '#000', [
                createText('A moment to remember', 15, 20, false, '#FFF')
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'graduation',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#ffc300', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('#FFF')],
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(120deg, #fdfcdc, #f0ebd8)', [
                createText('Thank You', 40, 48, true, '#6d6875'),
                createButton('🙏 Read Note', 70, '#b5838d')
            ]);

            const s2 = createScreen('Note', 'content', '#FFF', [
                createText('I wanted to say...', 20, 24, true),
                createText('[Enter your gratitude message here]', 50, 18)
            ]);

            const s3 = createScreen('Gallery', 'content', '#f0ebd8', [
                createText('Moments we’ll always remember', 10, 20, false, '#6d6875')
            ]);

            const s4 = createScreen('Wishes', 'content', '#FFF', [
                createText('With appreciation, [Name]', 40, 24)
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to bottom, #2b2d42, #8d99ae)', [
                createText('In Loving Memory', 35, 36, true, '#edf2f4'),
                createButton('🕯️ Light Candle', 70, '#ef233c')
            ], 'stars'); // subtle stars

            const s2 = createScreen('Portrait', 'content', '#edf2f4', [
                createText('Forever in our hearts', 80, 24, true, '#2b2d42')
                // Placeholder portrait
            ]);

            const s3 = createScreen('Gallery', 'content', '#dbdbdb', [
                createText('A life full of moments', 10, 24, true, '#2b2d42')
            ]);

            const s4 = createScreen('Text', 'content', '#edf2f4', [
                createText('[Remembrance text...]', 20, 18, false, '#2b2d42')
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'memorial',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#8d99ae', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, createNavScreen('#edf2f4')],
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(135deg, #fff0f3, #ffccd5)', [
                createText('[Name] & [Name]', 30, 36, true, '#590d22'),
                createText('[Date]', 50, 24, false, '#800f2f'),
                createButton('💌 Open Invite', 70, '#ff4d6d')
            ], 'hearts');

            const s2 = createScreen('Details', 'content', '#FFF', [
                createText('We are getting married!', 20, 32, true, '#590d22'),
                createText('Location: [Location]\nTime: [Time]', 50, 20, false, '#333')
            ]);

            const s3 = createScreen('Gallery', 'content', '#fff0f3', [
                createText('Our story in moments', 10, 24, true, '#800f2f')
            ]);

            const s4 = createScreen('Message', 'content', '#FFF', [
                createText('[Invitation Message]', 20, 20, false, '#333')
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(to bottom, #000428, #004e92)', [
                createText('Welcome 202X', 35, 48, true, '#FFD700'),
                createButton('🎆 Celebrate', 70, '#FFD700')
            ], 'fireworks');
            s1.elements[1].styles.color = '#000';

            const s2 = createScreen('Reflection', 'content', '#000', [
                createText('Looking back...', 20, 32, true, '#FFF'),
                createText('[Reflection on the past year]', 50, 18, false, '#ccc')
            ]);

            const s3 = createScreen('Gallery', 'content', '#111', [
                createText('Highlights', 10, 24, true, '#FFF')
            ]);

            const s4 = createScreen('Wishes', 'content', '#000', [
                createText('Health. Joy. New Beginnings.', 40, 28, true, '#FFD700')
            ]);

            const s5 = createScreen('Video', 'content', '#000', [
                createText('Happy New Year!', 15, 24, true, '#FFD700')
            ]);

            return {
                id: uuidv4(),
                version: '1.0',
                templateId: 'new-year',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                config: { title, primaryColor: '#FFD700', fontHeading: 'Playfair Display', fontBody: 'Outfit' },
                screens: [s1, s2, s3, s4, s5, createNavScreen('#000')],
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
        defaultConfig: {},
        initialProjectData: (title) => {
            const s1 = createScreen('Cover', 'overlay', 'linear-gradient(135deg, #d00000, #ffba08)', [
                createText('Year of the [Animal]', 35, 42, true, '#ffba08'),
                createButton('🧧 Open Envelope', 70, '#ffba08')
            ], 'confetti');
            s1.elements[1].styles.color = '#d00000';

            const s2 = createScreen('Hero', 'content', '#fff8f0', [
                createText('Strength, Prosperity, Renewal', 40, 24, true, '#d00000')
            ]);

            const s3 = createScreen('Wishes', 'content', '#d00000', [
                createText('Good Fortune & Health', 40, 32, true, '#ffba08')
            ]);

            const s4 = createScreen('Gallery', 'content', '#fff8f0', [
                createText('Celebrating Together', 10, 24, true, '#d00000')
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
        defaultConfig: {},
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
