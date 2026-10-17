import React from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    SkipForward,
    Volume2,
    VolumeX,
    Sparkles,
    Smartphone,
    Monitor,
    Shuffle
} from 'lucide-react';
import { AlgorithmType, ThemeType } from '../types';

interface ControlsBarProps {
    isRunning: boolean;
    isPaused: boolean;
    speed: number;
    algorithm: AlgorithmType;
    theme: ThemeType;
    soundEnabled: boolean;
    isMobilePreview: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStep: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onAlgorithmChange: (algo: AlgorithmType) => void;
    onThemeChange: (theme: ThemeType) => void;
    onToggleSound: () => void;
    onToggleMobilePreview: () => void;
    onRandomizeGraph: () => void;
    onSelectPreset: (presetKey: string) => void;
    currentPresetKey: string;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
    isRunning,
    isPaused,
    speed,
    algorithm,
    theme,
    soundEnabled,
    isMobilePreview,
    onPlay,
    onPause,
    onStep,
    onReset,
    onSpeedChange,
    onAlgorithmChange,
    onThemeChange,
    onToggleSound,
    onToggleMobilePreview,
    onRandomizeGraph,
    onSelectPreset,
    currentPresetKey
}) => {
    return (
        <div className="controls-bar-container">
            {/* Primary Action Buttons */}
            <div className="controls-group playback-group">
                {!isRunning || isPaused ? (
                    <button className="ctrl-btn btn-primary" onClick={onPlay} title="Run Algorithm">
                        <Play size={16} fill="currentColor" />
                        <span>{isPaused ? 'RESUME' : 'PLAY'}</span>
                    </button>
                ) : (
                    <button className="ctrl-btn btn-warning" onClick={onPause} title="Pause">
                        <Pause size={16} fill="currentColor" />
                        <span>PAUSE</span>
                    </button>
                )}

                <button
                    className="ctrl-btn btn-secondary"
                    onClick={onStep}
                    disabled={isRunning && !isPaused}
                    title="Step Forward"
                >
                    <SkipForward size={16} />
                    <span>STEP</span>
                </button>

                <button className="ctrl-btn btn-ghost" onClick={onReset} title="Reset">
                    <RotateCcw size={16} />
                    <span>RESET</span>
                </button>
            </div>

            {/* Speed Multiplier */}
            <div className="controls-group speed-group">
                <span className="ctrl-label">SPEED:</span>
                {[0.5, 1, 2, 4].map(s => (
                    <button
                        key={s}
                        className={`speed-pill ${speed === s ? 'active' : ''}`}
                        onClick={() => onSpeedChange(s)}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            {/* Algorithm Selector */}
            <div className="controls-group algo-group">
                <span className="ctrl-label">ALGO:</span>
                <select
                    className="ctrl-select"
                    value={algorithm}
                    onChange={e => onAlgorithmChange(e.target.value as AlgorithmType)}
                    disabled={isRunning && !isPaused}
                >
                    <option value="dijkstra">Dijkstra's Shortest Path</option>
                    <option value="astar">A* Heuristic Search</option>
                    <option value="bfs">Breadth-First Search (BFS)</option>
                    <option value="dfs">Depth-First Search (DFS)</option>
                </select>
            </div>

            {/* Scenario / Preset Selector */}
            <div className="controls-group preset-group">
                <span className="ctrl-label">SCENARIO:</span>
                <select
                    className="ctrl-select"
                    value={currentPresetKey}
                    onChange={e => onSelectPreset(e.target.value)}
                    disabled={isRunning && !isPaused}
                >
                    <option value="quantum">Quantum Entanglement Grid</option>
                    <option value="cyberpunk">Cyberpunk Metro Matrix</option>
                    <option value="deep_trench">Deep Trench Bioluminescence</option>
                    <option value="detour">High-Weight Detour Trap</option>
                    <option value="custom">Current Topic JSON</option>
                </select>

                <button
                    className="ctrl-btn btn-icon"
                    onClick={onRandomizeGraph}
                    title="Generate New Procedural Graph"
                    disabled={isRunning && !isPaused}
                >
                    <Shuffle size={16} />
                    <span>RANDOM</span>
                </button>
            </div>

            {/* Theme Selector */}
            <div className="controls-group theme-group">
                <span className="ctrl-label">THEME:</span>
                <select
                    className="ctrl-select"
                    value={theme}
                    onChange={e => onThemeChange(e.target.value as ThemeType)}
                >
                    <option value="cyberpunk">Cyber Neon</option>
                    <option value="quantum">Quantum Emerald</option>
                    <option value="synthwave">Synthwave Sunset</option>
                    <option value="deepvoid">Deep Void</option>
                </select>
            </div>

            {/* Audio Toggle & Mobile Preview Toggle */}
            <div className="controls-group utility-group">
                <button
                    className={`ctrl-btn btn-icon ${soundEnabled ? 'active' : ''}`}
                    onClick={onToggleSound}
                    title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
                >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                    className={`ctrl-btn btn-icon ${isMobilePreview ? 'active' : ''}`}
                    onClick={onToggleMobilePreview}
                    title={isMobilePreview ? 'Switch to Studio View' : 'Switch to 9:16 Video Frame'}
                >
                    {isMobilePreview ? <Monitor size={16} /> : <Smartphone size={16} />}
                    <span className="hidden sm:inline">
                        {isMobilePreview ? 'STUDIO' : '9:16 FRAME'}
                    </span>
                </button>
            </div>
        </div>
    );
};
