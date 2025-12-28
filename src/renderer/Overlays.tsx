import React, { useEffect, useState } from 'react';
import styles from './overlays.module.css';

// --- Types ---
interface Particle {
    id: number;
    left: number; // 0-100%
    delay: number; // Seconds
    duration: number; // Seconds
    size?: number; // px
    color?: string;
    // For specific animations
    rotation?: number;
    tx?: string; // Translate X for fireworks
    ty?: string; // Translate Y for fireworks
}

// --- Helpers ---
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomColor = () => {
    const colors = ['#FFD93D', '#FF4D6D', '#4CC9F0', '#95d5b2', '#a2d6f9', '#ffb3c6', '#FFC300'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// --- Components ---

const ConfettiOverlay: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const count = 30; // Number of particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(6, 9); // Slower fall (was 3-6)
            newParticles.push({
                id: i,
                left: random(0, 100),
                delay: random(-duration, 0), // Start mid-animation
                duration: duration,
                size: random(6, 12),
                color: randomColor(),
            });
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {particles.map(p => (
                <div
                    key={p.id}
                    className={styles.confetti}
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

const HeartsOverlay: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const count = 15;
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(10, 16); // Slower rise (was 6-10)
            newParticles.push({
                id: i,
                left: random(0, 100),
                delay: random(-duration, 0),
                duration: duration,
                size: random(20, 40),
                color: Math.random() > 0.5 ? '#FF4D6D' : '#FFb3c6',
            });
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {particles.map(p => (
                <div
                    key={p.id}
                    className={styles.heart}
                    style={{
                        left: `${p.left}%`,
                        fontSize: `${p.size}px`, // Using emoji size
                        color: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                >
                    ❤️
                </div>
            ))}
        </div>
    );
};

const StarsOverlay: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const count = 15; // Total 15 stars
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: i,
                left: random(0, 100), // x position
                delay: random(0, 5), // Random start for twinkle
                duration: random(3, 6), // Slower Twinkle duration (was 2-4)
                size: random(10, 20),
                rotation: random(0, 100), // top position
            });
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {particles.map((p, index) => {
                // First 5 are constant (index 0-4), rest 10 (5-14) are variable
                const isVariable = index >= 5;
                const className = `${styles.star} ${isVariable ? styles.starVariable : styles.starTwinkle}`;

                return (
                    <div
                        key={p.id}
                        className={className}
                        style={{
                            left: `${p.left}%`,
                            top: `${p.rotation}%`, // Random top position
                            fontSize: `${p.size}px`,
                            animationDelay: `${p.delay}s`, // Applies to twinkle or loopFade
                            animationDuration: isVariable ? '15s' : `${p.duration}s`, // Slower density cycle (was 10s)
                        }}
                    >
                        ✨
                    </div>
                );
            })}
        </div>
    );
};

const BubblesOverlay: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const count = 20;
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(15, 25); // Very slow float (was 8-15)
            newParticles.push({
                id: i,
                left: random(0, 100),
                delay: random(-duration, 0),
                duration: duration,
                size: random(20, 60),
            });
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {particles.map(p => (
                <div
                    key={p.id}
                    className={styles.bubble}
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

const FireworksOverlay: React.FC = () => {
    // Fireworks are complex, simplifed here as bursting dots
    // We'll just spawn a few burst centers that contain particles
    const [bursts, setBursts] = useState<Particle[]>([]);

    useEffect(() => {
        const count = 15; // Increased from 5 to 15
        const newBursts: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(3, 6); // Random cycle duration
            newBursts.push({
                id: i,
                left: random(10, 90), // Wider horizontal spread
                rotation: random(10, 70), // Wider vertical spread
                delay: random(0, duration),
                duration: duration,
                color: randomColor(),
            });
        }
        setBursts(newBursts);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {bursts.map(b => (
                // This wrapper positions the burst center
                <div
                    key={b.id}
                    style={{
                        position: 'absolute',
                        left: `${b.left}%`,
                        top: `${b.rotation}%`,
                        width: 0,
                        height: 0,
                    }}
                >
                    {/* Create particles for this burst */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i * 30) * (Math.PI / 180);
                        const dist = 100; // Explode distance
                        const tx = Math.cos(angle) * dist + 'px';
                        const ty = Math.sin(angle) * dist + 'px';

                        return (
                            <div
                                key={i}
                                className={styles.fireworkParticle}
                                style={{
                                    backgroundColor: b.color,
                                    animationDelay: `${b.delay}s`,
                                    animationDuration: `${b.duration}s`,
                                    // @ts-ignore
                                    '--tx': tx,
                                    '--ty': ty,
                                }}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};


export const OverlayManager: React.FC<{ type?: string }> = ({ type }) => {
    if (!type || type === 'none') return null;

    switch (type) {
        case 'confetti': return <ConfettiOverlay />;
        case 'hearts': return <HeartsOverlay />;
        case 'stars': return <StarsOverlay />;
        case 'bubbles': return <BubblesOverlay />;
        case 'fireworks': return <FireworksOverlay />;
        default: return null; // Or render nothing if type is custom emoji string which handled by existing renderer? 
        // Actually user said addition, so we might want to check if it matches our keys.
    }
};
