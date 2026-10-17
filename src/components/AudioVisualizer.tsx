import React from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
    bars?: number;
    isActive?: boolean;
    color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    bars = 18,
    isActive = true,
    color = 'var(--accent-cyan)'
}) => {
    return (
        <div className="audio-visualizer-container">
            <div className="audio-bars-wrapper">
                {Array.from({ length: bars }).map((_, i) => {
                    const duration = 0.4 + (i % 5) * 0.15;
                    const delay = (i * 0.05) % 0.3;
                    return (
                        <motion.div
                            key={i}
                            className="audio-bar"
                            animate={
                                isActive
                                    ? {
                                          height: ['20%', '95%', '35%', '85%', '20%'],
                                          opacity: [0.6, 1, 0.7, 0.95, 0.6]
                                      }
                                    : { height: '15%', opacity: 0.3 }
                            }
                            transition={{
                                duration,
                                delay,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                            style={{ backgroundColor: color }}
                        />
                    );
                })}
            </div>
            <span className="audio-live-text">AUDIO SYNC // 60 FPS</span>
        </div>
    );
};
