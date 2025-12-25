import React from 'react';
import { useUIStore } from '../store/uiStore';
import { Heart, Sparkles, MoveRight } from 'lucide-react';
import styles from './Landing.module.css';

const Landing: React.FC = () => {
    const setMode = useUIStore(state => state.setMode);

    return (
        <div className={styles.container}>
            {/* Background with animated gradient */}
            <div className={styles.background}></div>
            <div className={styles.particles}>
                {/* Simple decorative particles */}
                <div className={styles.particle} style={{ top: '20%', left: '10%' }}>✨</div>
                <div className={styles.particle} style={{ top: '70%', left: '80%' }}>❤️</div>
                <div className={styles.particle} style={{ top: '30%', left: '85%' }}>🌟</div>
            </div>

            <div className={`${styles.content} animate-fade-in`}>
                <div className={`${styles.iconWrapper} animate-float`}>
                    <Heart size={64} color="white" fill="rgba(255,255,255,0.2)" />
                </div>

                <h1 className={styles.title}>LoveMeDo</h1>
                <p className={styles.subtitle}>Interactive Gift Productions</p>

                <p className={styles.description}>
                    Create unforgettable interactive experiences for the ones you love.
                </p>

                <button
                    className={`${styles.ctaButton} animate-pulse`}
                    onClick={() => setMode('templates')}
                >
                    <Sparkles size={20} />
                    <span>Create Yours</span>
                    <MoveRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Landing;
