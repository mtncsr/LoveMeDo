import { useState, useEffect } from 'react';

export const useDevice = () => {
    const [isMobile, setIsMobile] = useState(() => {
        // Initial check
        if (typeof window !== 'undefined') {
            return window.matchMedia('(max-width: 768px)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const handleChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches);
        };

        // Modern browsers
        mediaQuery.addEventListener('change', handleChange);

        // Fallback for older browsers (though likely not needed for this stack)
        // mediaQuery.addListener(handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            // mediaQuery.removeListener(handleChange);
        };
    }, []);

    return { isMobile, isDesktop: !isMobile };
};
