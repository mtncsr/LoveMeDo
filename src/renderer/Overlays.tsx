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
        const maxDuration = 9; // Max fall duration
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(6, maxDuration); // Slower fall (was 3-6)
            const rotationStart = random(-180, 180);
            // Spread delays evenly across max duration for continuous fall
            newParticles.push({
                id: i,
                left: random(0, 100),
                delay: random(0, maxDuration), // Spread delays for continuous fall
                duration: duration,
                size: random(6, 12),
                color: randomColor(),
                rotation: rotationStart, // Random rotation start
                tx: `${random(-50, 50)}px`, // Random horizontal drift
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
                        // @ts-ignore
                        '--drift-x': p.tx || '0px',
                        '--rotation-end': `${(p.rotation || 0) + 720}deg`,
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
        const maxDuration = 16; // Max rise duration
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(10, maxDuration); // Slower rise (was 6-10)
            // Spread delays across max duration for smooth continuous flow
            newParticles.push({
                id: i,
                left: random(0, 100),
                delay: random(0, maxDuration), // Spread delays for continuous flow
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
        const totalCount = 15; // Always have 15 stars (max)
        const duration = 12; // Consistent duration for smoother looping
        const newParticles: Particle[] = [];
        
        for (let i = 0; i < totalCount; i++) {
            if (i < 5) {
                // First 5 stars: start mid-cycle (visible) using negative delay
                // At 50% of cycle = -duration * 0.5
                newParticles.push({
                    id: i,
                    left: random(0, 100),
                    delay: -duration * 0.5 + random(-1, 1), // Start mid-cycle (visible)
                    duration: duration,
                    size: random(10, 20),
                    rotation: random(0, 100),
                });
            } else {
                // Remaining 10 stars: staggered delays for continuous fade in/out
                newParticles.push({
                    id: i,
                    left: random(0, 100),
                    delay: random(0, duration), // Stagger across cycle
                    duration: duration,
                    size: random(10, 20),
                    rotation: random(0, 100),
                });
            }
        }
        setParticles(newParticles);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {particles.map((p) => {
                return (
                    <div
                        key={p.id}
                        className={`${styles.star} ${styles.starVariable}`}
                        style={{
                            left: `${p.left}%`,
                            top: `${p.rotation}%`,
                            fontSize: `${p.size}px`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
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
        const count = Math.floor(random(20, 31)); // Random between 20-30 bursts
        const maxDuration = 6; // Max cycle duration
        const newBursts: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const duration = random(3, maxDuration); // Random cycle duration
            // Spread delays across max duration for continuous bursts
            newBursts.push({
                id: i,
                left: random(10, 90), // Wider horizontal spread
                rotation: random(10, 70), // Wider vertical spread
                delay: random(0, maxDuration), // Spread delays for continuous flow
                duration: duration,
                color: randomColor(),
            });
        }
        setBursts(newBursts);
    }, []);

    return (
        <div className={styles.overlayContainer}>
            {bursts.map(b => {
                // Vary number of particles per burst (8-16 particles)
                const particleCount = Math.floor(random(8, 17));
                const particleAngles: number[] = [];
                const particleDistances: number[] = [];
                
                // Generate random angles and distances for each particle
                for (let i = 0; i < particleCount; i++) {
                    particleAngles.push(random(0, 360) * (Math.PI / 180)); // Random angle in radians
                    particleDistances.push(random(80, 150)); // Random explosion distance
                }

                return (
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
                        {/* Create particles for this burst with randomized angles and distances */}
                        {Array.from({ length: particleCount }).map((_, i) => {
                            const angle = particleAngles[i];
                            const dist = particleDistances[i];
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
                );
            })}
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
