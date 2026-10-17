import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraphTopic,
    Node,
    Edge,
    LogEntry,
    QueueItem,
    StepExplanation,
    ThemeType,
    AlgorithmType
} from './types';
import { PRESET_TOPICS, generateRandomGraph } from './utils/graphGenerator';
import { soundFx } from './utils/audio';
import { ParticleBackground } from './components/ParticleBackground';
import { AudioVisualizer } from './components/AudioVisualizer';
import { VictoryModal } from './components/VictoryModal';
import { TelemetryHUD } from './components/TelemetryHUD';
import { ControlsBar } from './components/ControlsBar';
import currentTopicJson from './data/current_topic.json';
import {
    Activity,
    Compass,
    Layers,
    Share2,
    Shield,
    Sparkles,
    Zap,
    Cpu,
    CheckCircle2
} from 'lucide-react';

const rawTopic = currentTopicJson as any;
const defaultInitialTopic: GraphTopic =
    rawTopic && rawTopic.nodes && rawTopic.nodes.length > 0
        ? {
              algorithm: rawTopic.algorithm || 'dijkstra',
              title: rawTopic.title || 'Quantum Entanglement Grid',
              description:
                  rawTopic.description ||
                  'Finding the global minimum cost path through the energy matrix.',
              nodes: rawTopic.nodes,
              edges: rawTopic.edges
          }
        : PRESET_TOPICS.quantum;

export const App: React.FC = () => {
    // Topic & Configuration State
    const [topic, setTopic] = useState<GraphTopic>(defaultInitialTopic);
    const [currentPresetKey, setCurrentPresetKey] = useState<string>('quantum');
    const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');
    const [theme, setTheme] = useState<ThemeType>('cyberpunk');
    const [speed, setSpeed] = useState<number>(1);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [isMobilePreview, setIsMobilePreview] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('mode') === 'record' || window.innerWidth === 1080;
        }
        return false;
    });
    const [isCaptureMode, setIsCaptureMode] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('mode') === 'record' || window.innerWidth === 1080;
        }
        return false;
    });

    // Visualizer Algorithm State
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [currentNode, setCurrentNode] = useState<string | null>(null);
    const [activeEdge, setActiveEdge] = useState<{ from: string; to: string } | null>(null);
    const [visited, setVisited] = useState<Set<string>>(new Set());
    const [distances, setDistances] = useState<Record<string, number>>({});
    const [shortestPath, setShortestPath] = useState<string[]>([]);
    const [highlightedPathEdges, setHighlightedPathEdges] = useState<Set<string>>(new Set());

    // Telemetry State
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [stepExplanation, setStepExplanation] = useState<StepExplanation | null>(null);

    // Refs for execution loop
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;
    const isRunningRef = useRef(isRunning);
    isRunningRef.current = isRunning;
    const speedRef = useRef(speed);
    speedRef.current = speed;

    // Detect URL recording mode or 1080x1920 mobile viewport
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const mode = params.get('mode');
            const isRec = mode === 'record' || window.innerWidth === 1080;
            setIsCaptureMode(isRec);
            if (isRec) {
                setIsMobilePreview(true);
            }
        }
    }, []);

    const addLog = useCallback(
        (text: string, type: LogEntry['type'] = 'default') => {
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
            setLogs(prev => [
                {
                    id: Math.random().toString(36).substring(2, 9),
                    text,
                    type,
                    timestamp: timeStr
                },
                ...prev
            ].slice(0, 25));
        },
        []
    );

    const sleep = (baseMs: number) => {
        return new Promise<void>(resolve => {
            const duration = Math.max(30, baseMs / speedRef.current);
            const check = () => {
                if (!isRunningRef.current) {
                    resolve();
                    return;
                }
                if (isPausedRef.current) {
                    setTimeout(check, 100);
                } else {
                    setTimeout(resolve, duration);
                }
            };
            check();
        });
    };

    const resetAlgorithm = useCallback(() => {
        setIsRunning(false);
        isRunningRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setIsComplete(false);
        setCurrentNode(null);
        setActiveEdge(null);
        setVisited(new Set());
        setDistances({});
        setShortestPath([]);
        setHighlightedPathEdges(new Set());
        setQueue([]);
        setStepExplanation({
            badge: 'START',
            title: 'System Ready',
            detail: `Selected Algorithm: ${algorithm.toUpperCase()}. Initializing from Source [S] to Target [T].`
        });
        addLog(`Reset visualizer state. Algorithm: ${algorithm.toUpperCase()}`, 'highlight');

        // Remove any residual animation-complete element
        const oldFinishMarker = document.getElementById('animation-complete');
        if (oldFinishMarker) {
            oldFinishMarker.remove();
        }
    }, [algorithm, addLog]);

    // Graph preset loader
    const handleSelectPreset = (key: string) => {
        setCurrentPresetKey(key);
        if (key === 'custom' && rawTopic && rawTopic.nodes) {
            setTopic(rawTopic);
        } else if (PRESET_TOPICS[key]) {
            setTopic(PRESET_TOPICS[key]);
        }
        resetAlgorithm();
    };

    // Random Graph Generator
    const handleRandomizeGraph = () => {
        const randTopic = generateRandomGraph(8);
        setTopic(randTopic);
        setCurrentPresetKey('random');
        resetAlgorithm();
        soundFx.playClick();
    };

    // Finish celebration sequence
    const triggerCelebration = async (finalPath: string[], totalCost: number, prevNodes: Record<string, string | null>) => {
        setIsComplete(true);
        setCurrentNode(null);
        setActiveEdge(null);
        setShortestPath(finalPath);

        setStepExplanation({
            badge: 'OPTIMAL',
            title: 'Global Shortest Path Discovered!',
            detail: `Route: ${finalPath.join(' ➔ ')} | Total Cost: ${totalCost} units.`
        });
        addLog(`Optimal path verified: ${finalPath.join(' -> ')} (Cost: ${totalCost})`, 'success');

        soundFx.playVictory();

        // Sequential Laser Beam Sweep along final path
        const edgeSet = new Set<string>();
        for (let i = 0; i < finalPath.length - 1; i++) {
            const u = finalPath[i];
            const v = finalPath[i + 1];
            edgeSet.add(`${u}->${v}`);
            edgeSet.add(`${v}->${u}`);
            setHighlightedPathEdges(new Set(edgeSet));
            soundFx.playNodeVisit(700 + i * 80);
            await sleep(180);
        }

        // Buffer before signaling completion to screen recorder
        await new Promise(r => setTimeout(r, 3200));

        // Signal Puppeteer that recording is complete
        const finishMarker = document.createElement('div');
        finishMarker.id = 'animation-complete';
        document.body.appendChild(finishMarker);
        setIsRunning(false);
        isRunningRef.current = false;
    };

    // ==========================================
    // ALGORITHMS EXECUTION
    // ==========================================

    const runDijkstra = async () => {
        const nodes = topic.nodes;
        const edges = topic.edges;

        const dists: Record<string, number> = {};
        const prev: Record<string, string | null> = {};
        const unvisited = new Set(nodes.map(n => n.id));

        nodes.forEach(n => {
            dists[n.id] = Infinity;
            prev[n.id] = null;
        });

        dists['S'] = 0;
        setDistances({ ...dists });
        setQueue([{ nodeId: 'S', distance: 0 }]);

        setStepExplanation({
            badge: 'START',
            title: 'Starting Dijkstra Shortest Path Search',
            detail: 'Source node [S] initialized with distance 0. All other nodes set to Infinity (∞).'
        });
        addLog('Source [S] initialized. Frontier queue created.', 'highlight');
        soundFx.playNodeVisit(500);

        await sleep(700);

        while (unvisited.size > 0 && isRunningRef.current) {
            // Find unvisited node with lowest distance
            let minNode: string | null = null;
            let minDist = Infinity;

            unvisited.forEach(id => {
                if (dists[id] < minDist) {
                    minDist = dists[id];
                    minNode = id;
                }
            });

            if (minNode === null || minDist === Infinity) {
                addLog('No reachable unvisited nodes remaining in component.', 'warning');
                break;
            }

            setCurrentNode(minNode);
            soundFx.playNodeVisit(540);

            setStepExplanation({
                badge: 'SCANNING',
                title: `Evaluating Node [${minNode}]`,
                detail: `Popped node [${minNode}] from priority queue with minimum tentative cost ${minDist}.`
            });
            addLog(`Popped Node [${minNode}] (Cost: ${minDist})`, 'active');

            // Update queue representation
            const currentQueue: QueueItem[] = Array.from(unvisited)
                .map(id => ({ nodeId: id, distance: dists[id] }))
                .filter(item => item.distance < Infinity && item.nodeId !== minNode)
                .sort((a, b) => a.distance - b.distance);
            setQueue(currentQueue);

            await sleep(650);

            // Explore neighbors
            const neighbors = edges.filter(e => e.from === minNode || e.to === minNode);

            for (const edge of neighbors) {
                if (!isRunningRef.current) break;
                const neighbor = edge.from === minNode ? edge.to : edge.from;
                if (!unvisited.has(neighbor)) continue;

                setActiveEdge({ from: minNode, to: neighbor });
                soundFx.playNodeVisit(620);

                setStepExplanation({
                    badge: 'EVALUATING',
                    title: `Examining Edge [${minNode}] ➔ [${neighbor}]`,
                    detail: `Testing path via [${minNode}] (+${edge.weight}). Tentative = ${dists[minNode]} + ${edge.weight} = ${dists[minNode] + edge.weight}. Current [${neighbor}] = ${dists[neighbor] === Infinity ? '∞' : dists[neighbor]}.`
                });

                await sleep(350);

                const newDist = dists[minNode] + edge.weight;
                if (newDist < dists[neighbor]) {
                    const oldDist = dists[neighbor];
                    dists[neighbor] = newDist;
                    prev[neighbor] = minNode;
                    setDistances({ ...dists });

                    soundFx.playRelaxation(edge.weight);

                    setStepExplanation({
                        badge: 'RELAXING',
                        title: `Path Relaxation: Node [${neighbor}] Updated!`,
                        detail: `New shorter route found! Distance reduced from ${oldDist === Infinity ? '∞' : oldDist} ➔ ${newDist}.`
                    });
                    addLog(`Relaxed [${neighbor}]: ${oldDist === Infinity ? '∞' : oldDist} -> ${newDist}`, 'success');

                    // Refresh queue
                    const updatedQueue: QueueItem[] = Array.from(unvisited)
                        .map(id => ({ nodeId: id, distance: dists[id] }))
                        .filter(item => item.distance < Infinity && item.nodeId !== minNode)
                        .sort((a, b) => a.distance - b.distance);
                    setQueue(updatedQueue);

                    await sleep(350);
                }
            }

            unvisited.delete(minNode);
            setVisited(prevSet => new Set(prevSet).add(minNode!));
            setActiveEdge(null);

            if (minNode === 'T') {
                setStepExplanation({
                    badge: 'OPTIMAL',
                    title: 'Target Node [T] Reached!',
                    detail: `Target reached with optimal distance ${dists['T']}. Reconstructing shortest path...`
                });
                addLog(`Target [T] finalized at cost ${dists['T']}!`, 'highlight');
                break;
            }
        }

        // Reconstruct path
        const path: string[] = [];
        let curr: string | null = 'T';
        while (curr !== null) {
            path.unshift(curr);
            if (curr === 'S') break;
            curr = prev[curr] || null;
        }

        if (path[0] === 'S' && path.includes('T')) {
            await triggerCelebration(path, dists['T'], prev);
        } else {
            addLog('No complete path found from S to T', 'warning');
            setIsRunning(false);
        }
    };

    const runAStar = async () => {
        const nodes = topic.nodes;
        const edges = topic.edges;
        const targetNode = nodes.find(n => n.id === 'T') || nodes[nodes.length - 1];

        const heuristic = (id: string) => {
            const n = nodes.find(node => node.id === id);
            if (!n || !targetNode) return 0;
            return Math.round(Math.hypot(n.x - targetNode.x, n.y - targetNode.y) / 60);
        };

        const gScore: Record<string, number> = {};
        const fScore: Record<string, number> = {};
        const prev: Record<string, string | null> = {};
        const openSet = new Set(['S']);
        const closedSet = new Set<string>();

        nodes.forEach(n => {
            gScore[n.id] = Infinity;
            fScore[n.id] = Infinity;
            prev[n.id] = null;
        });

        gScore['S'] = 0;
        fScore['S'] = heuristic('S');
        setDistances({ ...gScore });
        setQueue([{ nodeId: 'S', distance: fScore['S'] }]);

        setStepExplanation({
            badge: 'START',
            title: 'Starting A* Heuristic Search',
            detail: 'Evaluating paths using f(n) = g(n) + h(n), where h(n) estimates Euclidean distance to [T].'
        });
        addLog('A* Search initialized with Euclidean heuristic.', 'highlight');

        await sleep(700);

        while (openSet.size > 0 && isRunningRef.current) {
            let curr: string | null = null;
            let minF = Infinity;

            openSet.forEach(id => {
                if (fScore[id] < minF) {
                    minF = fScore[id];
                    curr = id;
                }
            });

            if (curr === null || curr === 'T') break;

            openSet.delete(curr);
            closedSet.add(curr);
            setVisited(new Set(closedSet));
            setCurrentNode(curr);
            soundFx.playNodeVisit(520);

            setStepExplanation({
                badge: 'SCANNING',
                title: `A* Visiting Node [${curr}]`,
                detail: `f(${curr}) = g(${gScore[curr]}) + h(${heuristic(curr)}) = ${fScore[curr]}.`
            });
            addLog(`A* Visiting [${curr}] (f: ${fScore[curr]}, g: ${gScore[curr]})`, 'active');

            await sleep(600);

            const neighbors = edges.filter(e => e.from === curr || e.to === curr);
            for (const edge of neighbors) {
                if (!isRunningRef.current) break;
                const neighbor = edge.from === curr ? edge.to : edge.from;
                if (closedSet.has(neighbor)) continue;

                setActiveEdge({ from: curr, to: neighbor });
                soundFx.playNodeVisit(600);

                const tentativeG = gScore[curr] + edge.weight;
                if (tentativeG < gScore[neighbor]) {
                    prev[neighbor] = curr;
                    gScore[neighbor] = tentativeG;
                    fScore[neighbor] = tentativeG + heuristic(neighbor);
                    setDistances({ ...gScore });
                    openSet.add(neighbor);

                    soundFx.playRelaxation(edge.weight);
                    setStepExplanation({
                        badge: 'RELAXING',
                        title: `A* Relaxed Node [${neighbor}]`,
                        detail: `Updated g(${neighbor}) = ${tentativeG}, total f(${neighbor}) = ${fScore[neighbor]}.`
                    });
                    addLog(`Optimized [${neighbor}] (g: ${tentativeG}, f: ${fScore[neighbor]})`, 'success');

                    const updatedQueue: QueueItem[] = Array.from(openSet)
                        .map(id => ({ nodeId: id, distance: fScore[id] }))
                        .sort((a, b) => a.distance - b.distance);
                    setQueue(updatedQueue);

                    await sleep(350);
                }
            }
            setActiveEdge(null);
        }

        const path: string[] = [];
        let curr: string | null = 'T';
        while (curr !== null) {
            path.unshift(curr);
            if (curr === 'S') break;
            curr = prev[curr] || null;
        }

        if (path[0] === 'S' && path.includes('T')) {
            await triggerCelebration(path, gScore['T'], prev);
        } else {
            setIsRunning(false);
        }
    };

    const runBFS = async () => {
        const nodes = topic.nodes;
        const edges = topic.edges;
        const queueList: string[] = ['S'];
        const visitedNodes = new Set<string>(['S']);
        const prev: Record<string, string | null> = { S: null };
        const dists: Record<string, number> = { S: 0 };
        setVisited(new Set(['S']));
        setDistances({ ...dists });

        setStepExplanation({
            badge: 'START',
            title: 'Starting Breadth-First Search (BFS)',
            detail: 'Exploring graph layer by layer to discover unweighted shortest hop path.'
        });
        addLog('BFS exploration initialized with FIFO queue.', 'highlight');

        await sleep(700);

        while (queueList.length > 0 && isRunningRef.current) {
            const curr = queueList.shift()!;
            setCurrentNode(curr);
            soundFx.playNodeVisit(530);

            setStepExplanation({
                badge: 'SCANNING',
                title: `Dequeued Node [${curr}]`,
                detail: `Inspecting neighbors at hop level ${dists[curr]}.`
            });
            addLog(`Dequeued [${curr}] (Hops: ${dists[curr]})`, 'active');

            setQueue(queueList.map((id, i) => ({ nodeId: id, distance: dists[id] || i + 1 })));
            await sleep(600);

            if (curr === 'T') break;

            const neighbors = edges
                .filter(e => e.from === curr || e.to === curr)
                .map(e => (e.from === curr ? e.to : e.from));

            for (const neighbor of neighbors) {
                if (!isRunningRef.current) break;
                if (!visitedNodes.has(neighbor)) {
                    visitedNodes.add(neighbor);
                    prev[neighbor] = curr;
                    dists[neighbor] = (dists[curr] || 0) + 1;
                    setDistances({ ...dists });
                    queueList.push(neighbor);

                    setActiveEdge({ from: curr, to: neighbor });
                    soundFx.playRelaxation(2);

                    setVisited(new Set(visitedNodes));
                    setStepExplanation({
                        badge: 'QUEUED',
                        title: `Discovered Node [${neighbor}]`,
                        detail: `Added [${neighbor}] to FIFO frontier at depth ${dists[neighbor]}.`
                    });
                    addLog(`Queued [${neighbor}]`, 'success');

                    await sleep(350);
                }
            }
            setActiveEdge(null);
        }

        const path: string[] = [];
        let curr: string | null = 'T';
        while (curr !== null) {
            path.unshift(curr);
            if (curr === 'S') break;
            curr = prev[curr] || null;
        }

        if (path[0] === 'S' && path.includes('T')) {
            await triggerCelebration(path, dists['T'] || path.length - 1, prev);
        } else {
            setIsRunning(false);
        }
    };

    const runDFS = async () => {
        const edges = topic.edges;
        const visitedNodes = new Set<string>();
        const prev: Record<string, string | null> = {};
        const dists: Record<string, number> = { S: 0 };

        setStepExplanation({
            badge: 'START',
            title: 'Starting Depth-First Search (DFS)',
            detail: 'Recursively probing down paths until dead-ends, then backtracking.'
        });
        addLog('DFS recursive search initialized.', 'highlight');

        await sleep(700);

        const dfsStep = async (curr: string, parent: string | null): Promise<boolean> => {
            if (!isRunningRef.current) return false;
            visitedNodes.add(curr);
            setVisited(new Set(visitedNodes));
            prev[curr] = parent;
            setCurrentNode(curr);
            soundFx.playNodeVisit(540);

            setStepExplanation({
                badge: 'SCANNING',
                title: `DFS Exploring Node [${curr}]`,
                detail: `Probing branch from parent [${parent || 'START'}].`
            });
            addLog(`DFS Visiting [${curr}]`, 'active');

            await sleep(600);

            if (curr === 'T') return true;

            const neighbors = edges
                .filter(e => e.from === curr || e.to === curr)
                .map(e => (e.from === curr ? e.to : e.from));

            for (const neighbor of neighbors) {
                if (!isRunningRef.current) return false;
                if (!visitedNodes.has(neighbor)) {
                    setActiveEdge({ from: curr, to: neighbor });
                    soundFx.playRelaxation(3);
                    dists[neighbor] = (dists[curr] || 0) + 1;
                    setDistances({ ...dists });

                    await sleep(350);

                    if (await dfsStep(neighbor, curr)) return true;
                }
            }

            setActiveEdge(null);
            return false;
        };

        await dfsStep('S', null);

        const path: string[] = [];
        let curr: string | null = 'T';
        while (curr !== null) {
            path.unshift(curr);
            if (curr === 'S') break;
            curr = prev[curr] || null;
        }

        if (path[0] === 'S' && path.includes('T')) {
            await triggerCelebration(path, path.length - 1, prev);
        } else {
            setIsRunning(false);
        }
    };

    const handleStartAnimation = useCallback(() => {
        if (isRunningRef.current && !isPausedRef.current) return;
        setIsRunning(true);
        isRunningRef.current = true;
        setIsPaused(false);
        isPausedRef.current = false;
        if (algorithm === 'dijkstra') runDijkstra();
        else if (algorithm === 'astar') runAStar();
        else if (algorithm === 'bfs') runBFS();
        else if (algorithm === 'dfs') runDFS();
    }, [algorithm, topic]);

    // Expose window.startAnimation for Puppeteer screen recorder
    useEffect(() => {
        // @ts-ignore
        window.startAnimation = () => {
            handleStartAnimation();
        };
    }, [handleStartAnimation]);

    // Auto-start in capture mode after brief initialization buffer
    useEffect(() => {
        if (isCaptureMode) {
            const timer = setTimeout(() => {
                handleStartAnimation();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isCaptureMode, handleStartAnimation]);

    // Dynamic ViewBox Calculation to scale and center any graph cleanly
    const computeViewBox = (nodes: Node[]) => {
        if (!nodes || nodes.length === 0) return '0 0 1000 800';
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const padX = 100;
        const padY = 90;
        const w = Math.max(maxX - minX + padX * 2, 500);
        const h = Math.max(maxY - minY + padY * 2, 400);
        return `${minX - padX} ${minY - padY} ${w} ${h}`;
    };

    const isEdgeActive = (from: string, to: string) => {
        return (
            activeEdge &&
            ((activeEdge.from === from && activeEdge.to === to) ||
                (activeEdge.from === to && activeEdge.to === from))
        );
    };

    const isEdgeInShortestPath = (from: string, to: string) => {
        return (
            highlightedPathEdges.has(`${from}->${to}`) ||
            highlightedPathEdges.has(`${to}->${from}`)
        );
    };

    const getComplexity = () => {
        switch (algorithm) {
            case 'dijkstra':
                return 'O((V + E) log V)';
            case 'astar':
                return 'O(E)';
            case 'bfs':
                return 'O(V + E)';
            case 'dfs':
                return 'O(V + E)';
            default:
                return 'O(V + E)';
        }
    };

    const isVerticalLayout = isMobilePreview || isCaptureMode;

    return (
        <div className={`app-root theme-${theme} ${isVerticalLayout ? 'mode-mobile-frame' : 'mode-studio'}`}>
            <ParticleBackground theme={theme} />

            <div className={`main-container ${isVerticalLayout ? 'container-1080' : 'container-responsive'}`}>
                {/* HUD Corner Accents */}
                <div className="hud-bracket top-left" />
                <div className="hud-bracket top-right" />
                <div className="hud-bracket bottom-left" />
                <div className="hud-bracket bottom-right" />

                {/* Top Header Section */}
                <header className="header-zone">
                    <div className="header-meta-row">
                        <div className="brand-badge">
                            <span className="live-rec-dot" />
                            <span className="brand-text">DAY 29 // ALGORITHM LAB</span>
                        </div>
                        <AudioVisualizer bars={isVerticalLayout ? 14 : 20} isActive={isRunning || isComplete} />
                        <div className="header-status-pill">
                            <span className={`status-indicator-dot ${isComplete ? 'complete' : isRunning ? 'running' : 'idle'}`} />
                            <span className="status-indicator-text">
                                {isComplete ? 'PATH SECURED' : isRunning ? 'OPTIMIZING' : 'STANDBY'}
                            </span>
                        </div>
                    </div>

                    <div className="header-title-row">
                        <div className="title-block">
                            <h1 className="hero-heading">{topic.title.toUpperCase()}</h1>
                            <p className="hero-subtext">{topic.description}</p>
                        </div>
                        <div className="algo-badge-wrapper">
                            <div className="algo-neon-badge">
                                <Zap size={16} className="text-cyan-400" />
                                <span>{algorithm.toUpperCase()} ENGINE</span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Controls (Hidden during headless capture, visible in studio) */}
                    {!isCaptureMode && (
                        <ControlsBar
                            isRunning={isRunning}
                            isPaused={isPaused}
                            speed={speed}
                            algorithm={algorithm}
                            theme={theme}
                            soundEnabled={soundEnabled}
                            isMobilePreview={isMobilePreview}
                            onPlay={() => {
                                soundFx.enabled = soundEnabled;
                                soundFx.playClick();
                                if (isPaused) {
                                    setIsPaused(false);
                                } else {
                                    handleStartAnimation();
                                }
                            }}
                            onPause={() => {
                                soundFx.playClick();
                                setIsPaused(true);
                            }}
                            onStep={() => {
                                soundFx.playClick();
                                if (!isRunning) handleStartAnimation();
                            }}
                            onReset={resetAlgorithm}
                            onSpeedChange={s => setSpeed(s)}
                            onAlgorithmChange={a => {
                                setAlgorithm(a);
                                resetAlgorithm();
                            }}
                            onThemeChange={t => setTheme(t)}
                            onToggleSound={() => {
                                const next = !soundEnabled;
                                setSoundEnabled(next);
                                soundFx.enabled = next;
                            }}
                            onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
                            onRandomizeGraph={handleRandomizeGraph}
                            onSelectPreset={handleSelectPreset}
                            currentPresetKey={currentPresetKey}
                        />
                    )}

                    {/* Metric Quick-Cards */}
                    <div className="metrics-row">
                        <div className="metric-chip">
                            <span className="metric-label">TIME COMPLEXITY</span>
                            <span className="metric-value font-mono text-cyan-400">{getComplexity()}</span>
                        </div>
                        <div className="metric-chip">
                            <span className="metric-label">CURRENT BEST COST</span>
                            <span className="metric-value font-mono text-yellow-400">
                                {distances['T'] !== undefined && distances['T'] !== Infinity
                                    ? distances['T']
                                    : 'CALCULATING...'}
                            </span>
                        </div>
                        <div className="metric-chip">
                            <span className="metric-label">GRAPH SIZE</span>
                            <span className="metric-value font-mono text-purple-400">
                                {topic.nodes.length} NODES • {topic.edges.length} EDGES
                            </span>
                        </div>
                        <div className="metric-chip">
                            <span className="metric-label">EXPLORED</span>
                            <span className="metric-value font-mono text-emerald-400">
                                {visited.size} / {topic.nodes.length}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Visualizer Stage */}
                <main className="stage-zone">
                    <div className="graph-frame">
                        <svg
                            className="graph-svg"
                            viewBox={computeViewBox(topic.nodes)}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <defs>
                                {/* Neon Glow Filters */}
                                <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="8" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="7" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>

                                {/* Laser Path Gradients */}
                                <linearGradient id="laser-path-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#00f0ff" />
                                    <stop offset="50%" stopColor="#ffe600" />
                                    <stop offset="100%" stopColor="#00ff88" />
                                </linearGradient>

                                <radialGradient id="node-base-grad" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#1e293b" />
                                    <stop offset="100%" stopColor="#0a0f1d" />
                                </radialGradient>
                            </defs>

                            {/* Render Graph Edges */}
                            <g className="edges-layer">
                                {topic.edges.map((edge, idx) => {
                                    const fromNode = topic.nodes.find(n => n.id === edge.from);
                                    const toNode = topic.nodes.find(n => n.id === edge.to);
                                    if (!fromNode || !toNode) return null;

                                    const active = isEdgeActive(edge.from, edge.to);
                                    const inPath = isEdgeInShortestPath(edge.from, edge.to);

                                    const midX = (fromNode.x + toNode.x) / 2;
                                    const midY = (fromNode.y + toNode.y) / 2;

                                    return (
                                        <g key={`edge-${edge.from}-${edge.to}-${idx}`}>
                                            {/* Base Connection Trace */}
                                            <line
                                                x1={fromNode.x}
                                                y1={fromNode.y}
                                                x2={toNode.x}
                                                y2={toNode.y}
                                                className={`edge-base ${active ? 'edge-active' : ''} ${inPath ? 'edge-final' : ''}`}
                                            />

                                            {/* Glowing Active / Winning Overlay */}
                                            {inPath && (
                                                <line
                                                    x1={fromNode.x}
                                                    y1={fromNode.y}
                                                    x2={toNode.x}
                                                    y2={toNode.y}
                                                    className="edge-laser-glow"
                                                />
                                            )}

                                            {/* Traveling Plasma Photon Pulse on Active Edge */}
                                            {active && (
                                                <circle r="7" className="traveling-photon">
                                                    <animateMotion
                                                        path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                                                        dur="0.45s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            )}

                                            {/* Edge Weight Pill Badge */}
                                            <g transform={`translate(${midX}, ${midY})`} className="edge-weight-container">
                                                <rect
                                                    x="-22"
                                                    y="-15"
                                                    width="44"
                                                    height="30"
                                                    rx="8"
                                                    className={`edge-weight-rect ${active ? 'active' : ''} ${inPath ? 'final' : ''}`}
                                                />
                                                <text
                                                    className={`edge-weight-text ${active ? 'active' : ''} ${inPath ? 'final' : ''}`}
                                                    textAnchor="middle"
                                                    dy=".35em"
                                                >
                                                    {edge.weight}
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })}
                            </g>

                            {/* Render Graph Nodes */}
                            <g className="nodes-layer">
                                {topic.nodes.map(node => {
                                    const isCurrent = currentNode === node.id;
                                    const isVisited = visited.has(node.id);
                                    const isSource = node.id === 'S';
                                    const isTarget = node.id === 'T';
                                    const inFinalPath = shortestPath.includes(node.id);
                                    const dist = distances[node.id];

                                    return (
                                        <g
                                            key={`node-${node.id}`}
                                            className={`node-group ${isCurrent ? 'current' : ''} ${isVisited ? 'visited' : ''} ${isSource ? 'source' : ''} ${isTarget ? 'target' : ''} ${inFinalPath ? 'in-final' : ''}`}
                                            transform={`translate(${node.x}, ${node.y})`}
                                        >
                                            {/* Outer Expanding Pulse Beacon for Source */}
                                            {isSource && (
                                                <circle r="36" className="beacon-ring">
                                                    <animate
                                                        attributeName="r"
                                                        values="36;58;36"
                                                        dur="2.4s"
                                                        repeatCount="indefinite"
                                                    />
                                                    <animate
                                                        attributeName="opacity"
                                                        values="0.8;0;0.8"
                                                        dur="2.4s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            )}

                                            {/* Rotating Target Reticle */}
                                            {isTarget && (
                                                <circle r="46" className="target-reticle">
                                                    <animateTransform
                                                        attributeName="transform"
                                                        type="rotate"
                                                        from="0 0 0"
                                                        to="360 0 0"
                                                        dur="6s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            )}

                                            {/* Active Energy Scanner Ring */}
                                            {isCurrent && (
                                                <circle r="48" className="active-scanner-ring">
                                                    <animateTransform
                                                        attributeName="transform"
                                                        type="rotate"
                                                        from="360 0 0"
                                                        to="0 0 0"
                                                        dur="3s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            )}

                                            {/* Core Node Orb */}
                                            <circle r="36" className="node-core-circle" />

                                            {/* Node Identifier */}
                                            <text className="node-id-text" dy=".32em">
                                                {node.id}
                                            </text>

                                            {/* Floating Distance Pill Badge (neatly above node) */}
                                            <g transform="translate(0, -52)" className="node-dist-badge-group">
                                                <rect
                                                    x="-26"
                                                    y="-13"
                                                    width="52"
                                                    height="26"
                                                    rx="13"
                                                    className={`node-dist-rect ${isSource ? 'source' : isTarget ? 'target' : ''} ${isCurrent ? 'active' : ''}`}
                                                />
                                                <text className="node-dist-value" dy=".35em" textAnchor="middle">
                                                    {dist === undefined || dist === Infinity ? '∞' : dist}
                                                </text>
                                            </g>

                                            {/* Node Label (below node) */}
                                            {node.label && (
                                                <text className="node-sublabel" dy="54" textAnchor="middle">
                                                    {node.label}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Celebratory Victory Overlay */}
                        <AnimatePresence>
                            {isComplete && shortestPath.length > 0 && (
                                <VictoryModal
                                    path={shortestPath}
                                    totalDistance={distances['T'] || 0}
                                    visitedCount={visited.size}
                                    totalNodes={topic.nodes.length}
                                    algorithmName={algorithm}
                                    complexity={getComplexity()}
                                    onClose={() => setIsComplete(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right-Hand / Bottom Telemetry Section */}
                    <div className="telemetry-zone">
                        <TelemetryHUD
                            logs={logs}
                            queue={queue}
                            stepExplanation={stepExplanation}
                            distances={distances}
                            targetDistance={distances['T']}
                            algorithm={algorithm}
                        />
                    </div>
                </main>

                {/* Footer Section */}
                <footer className="footer-zone">
                    <div className="footer-brand">
                        <span className="footer-highlight">KREGGSCODE</span> // GRAPH THEORY SERIES
                    </div>
                    <div className="footer-pill">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span>NEXT-GEN VISUALIZER // 60 FPS</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;
