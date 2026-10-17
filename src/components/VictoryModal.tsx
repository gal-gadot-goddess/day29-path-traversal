import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, Zap, Activity } from 'lucide-react';

interface VictoryModalProps {
    path: string[];
    totalDistance: number;
    visitedCount: number;
    totalNodes: number;
    algorithmName: string;
    complexity: string;
    onClose?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
    path,
    totalDistance,
    visitedCount,
    totalNodes,
    algorithmName,
    complexity
}) => {
    return (
        <motion.div
            className="victory-overlay"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
        >
            <div className="victory-card">
                {/* Glowing Top Ring */}
                <div className="victory-header-glow" />

                <div className="victory-badge-row">
                    <span className="victory-pill">
                        <CheckCircle size={16} className="text-emerald-400" />
                        OPTIMAL SOLUTION PROVEN
                    </span>
                    <span className="victory-time-pill">
                        <Zap size={14} className="text-yellow-400" />
                        {complexity}
                    </span>
                </div>

                <div className="victory-icon-wrapper">
                    <Trophy size={48} className="victory-trophy-icon" />
                    <div className="victory-pulse-ring" />
                </div>

                <h2 className="victory-title">SHORTEST PATH DISCOVERED</h2>
                <p className="victory-subtitle">
                    {algorithmName.toUpperCase()} found the global minimum traversal cost
                </p>

                {/* Path Breadcrumbs */}
                <div className="victory-path-container">
                    <div className="victory-path-label">OPTIMAL ROUTE SEQUENCE:</div>
                    <div className="victory-path-breadcrumbs">
                        {path.map((nodeId, idx) => (
                            <React.Fragment key={nodeId}>
                                <div
                                    className={`victory-node-chip ${
                                        nodeId === 'S'
                                            ? 'source'
                                            : nodeId === 'T'
                                            ? 'target'
                                            : 'intermediate'
                                    }`}
                                >
                                    <span className="chip-label">{nodeId}</span>
                                </div>
                                {idx < path.length - 1 && (
                                    <span className="victory-arrow">➔</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Metric Grid */}
                <div className="victory-stats-grid">
                    <div className="victory-stat-box">
                        <span className="v-stat-label">TOTAL DISTANCE</span>
                        <span className="v-stat-val text-cyan">{totalDistance}</span>
                    </div>
                    <div className="victory-stat-box">
                        <span className="v-stat-label">NODES VISITED</span>
                        <span className="v-stat-val text-purple">
                            {visitedCount} / {totalNodes}
                        </span>
                    </div>
                    <div className="victory-stat-box">
                        <span className="v-stat-label">EXPLORATION</span>
                        <span className="v-stat-val text-green">
                            {Math.round((visitedCount / totalNodes) * 100)}%
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
