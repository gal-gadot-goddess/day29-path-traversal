import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
    theme?: string;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ theme = 'cyberpunk' }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.offsetWidth);
        let height = (canvas.height = canvas.offsetHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', handleResize);

        const particleCount = 45;
        const particles: Array<{
            x: number;
            y: number;
            size: number;
            speedY: number;
            speedX: number;
            alpha: number;
            maxAlpha: number;
            color: string;
        }> = [];

        const colors =
            theme === 'quantum'
                ? ['#00ff88', '#00e5ff', '#38ef7d']
                : theme === 'synthwave'
                ? ['#ff007f', '#ffaa00', '#00f0ff']
                : ['#00f0ff', '#a855f7', '#6366f1'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2.5 + 0.8,
                speedY: -(Math.random() * 0.4 + 0.1),
                speedX: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.5 + 0.1,
                maxAlpha: Math.random() * 0.6 + 0.2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw glowing particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.y += p.speedY;
                p.x += p.speedX;

                if (p.y < 0) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;

                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [theme]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="ambient-glow glow-1" />
            <div className="ambient-glow glow-2" />
            <div className="ambient-glow glow-3" />
        </div>
    );
};
