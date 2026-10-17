import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry, QueueItem, StepExplanation } from '../types';
import { Terminal, Cpu, Layers, ArrowRight } from 'lucide-react';

interface TelemetryHUDProps {
    logs: LogEntry[];
    queue: QueueItem[];
    stepExplanation: StepExplanation | null;
    distances: Record<string, number>;
    targetDistance?: number;
    algorithm: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
    logs,
    queue,
    stepExplanation,
    distances,
    targetDistance,
    algorithm
}) => {
    const logScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logScrollRef.current) {
            logScrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    const getBadgeStyle = (badge?: string) => {
        switch (badge) {
            case 'RELAXING':
                return 'badge-relaxing';
            case 'OPTIMAL':
                return 'badge-optimal';
            case 'SCANNING':
                return 'badge-scanning';
            case 'QUEUED':
                return 'badge-queued';
            default:
                return 'badge-default';
        }
    };

    return (
        <div className="telemetry-hud-container">
            {/* Top: Live AI Decision Explainer Card */}
            <div className="explainer-card">
                <div className="explainer-header">
                    <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-cyan-400" />
                        <span className="explainer-title">AI NEURAL LOGIC ENGINE</span>
                    </div>
                    {stepExplanation && (
                        <span className={`explainer-badge ${getBadgeStyle(stepExplanation.badge)}`}>
                            {stepExplanation.badge}
                        </span>
                    )}
                </div>

                <div className="explainer-body">
                    {stepExplanation ? (
                        <motion.div
                            key={stepExplanation.title + stepExplanation.detail}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="explainer-content"
                        >
                            <h4 className="explainer-heading">{stepExplanation.title}</h4>
                            <p className="explainer-detail">{stepExplanation.detail}</p>
                        </motion.div>
                    ) : (
                        <div className="explainer-idle">
                            <span className="pulsing-cursor">_</span> System ready. Awaiting graph traversal sequence.
                        </div>
                    )}
                </div>
            </div>

            {/* Middle: Live Priority Queue / Min-Heap Frontier Visualizer */}
            <div className="queue-hud-card">
                <div className="queue-hud-header">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-purple-400" />
                        <span className="queue-hud-title">PRIORITY QUEUE FRONTIER (MIN-HEAP)</span>
                    </div>
                    <span className="queue-count-pill">{queue.length} PENDING</span>
                </div>

                <div className="queue-items-track">
                    <AnimatePresence>
                        {queue.length > 0 ? (
                            queue.map((item, idx) => (
                                <motion.div
                                    key={item.nodeId}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    layout
                                    className={`queue-chip ${idx === 0 ? 'queue-top' : ''}`}
                                >
                                    <span className="chip-node">{item.nodeId}</span>
                                    <span className="chip-cost">
                                        {item.distance === Infinity ? '∞' : item.distance}
                                    </span>
                                </motion.div>
                            ))
                        ) : (
                            <span className="queue-empty-text">Frontier empty</span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom: Sleek Cyber Console Stream */}
            <div className="console-hud-card">
                <div className="console-header">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-emerald-400" />
                        <span className="console-title">EVENT STREAM // TELEMETRY</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                    </div>
                </div>

                <div className="console-logs-scroll" ref={logScrollRef}>
                    <AnimatePresence initial={false}>
                        {logs.slice(0, 4).map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`console-line ${log.type}`}
                            >
                                <span className="console-ts">[{log.timestamp}]</span>
                                <span className="console-prompt">&gt;</span>
                                <span className="console-text">{log.text}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
