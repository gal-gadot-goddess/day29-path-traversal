import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { motion, AnimatePresence } from 'framer-motion';

// Import current topic data
import currentTopic from './data/current_topic.json';

interface Node {
    id: string;
    x: number;
    y: number;
}

interface Edge {
    from: string;
    to: string;
    weight: number;
}

interface LogEntry {
    text: string;
    type: 'default' | 'active' | 'success' | 'highlight';
}

const ALGORITHM = currentTopic.algorithm || 'dijkstra';
const NODES: Node[] = currentTopic.nodes || [];
const EDGES: Edge[] = currentTopic.edges || [];
const SORT_DATA: number[] = currentTopic.data || [];
const SORT_LABELS: string[] = currentTopic.labels || [];
const PAGE_TITLE = currentTopic.title || "ALGORITHM VISUALIZER";

const Visualizer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState('Standby');
    const [isComplete, setIsComplete] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);

    // Graph State
    const [distances, setDistances] = useState<Record<string, number>>({});
    const [visited, setVisited] = useState<Set<string>>(new Set());
    const [currentNode, setCurrentNode] = useState<string | null>(null);
    const [activeEdge, setActiveEdge] = useState<{ from: string; to: string } | null>(null);
    const [shortestPath, setShortestPath] = useState<string[]>([]);

    // Sorting State
    const [array, setArray] = useState<number[]>(SORT_DATA);
    const [activeIndices, setActiveIndices] = useState<number[]>([]);
    const [sortedIndices, setSortedIndices] = useState<Set<number>>(new Set());

    const addLog = (text: string, type: LogEntry['type'] = 'default') => {
        setLogs(prev => [{ text, type }, ...prev].slice(0, 15));
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const onFinish = () => {
        setIsComplete(true);
        setStatus('COMPLETE');
        // Signal to Puppeteer that the animation is finished
        const finishMarker = document.createElement('div');
        finishMarker.id = 'animation-complete';
        document.body.appendChild(finishMarker);
        addLog('Process Finished. Ready for Export.', 'success');
    };

    // --- ALGORITHMS ---

    const runDijkstra = async () => {
        setStatus('Dijkstra Processing');
        addLog('Starting Dijkstra Shortest Path Algorithm...', 'highlight');

        const dists: Record<string, number> = {};
        const prevNodes: Record<string, string | null> = {};
        const unvisited = new Set(NODES.map(n => n.id));

        NODES.forEach(n => {
            dists[n.id] = Infinity;
            prevNodes[n.id] = null;
        });

        dists['S'] = 0;
        setDistances({ ...dists });
        await sleep(1000);

        while (unvisited.size > 0) {
            let minNode: string | null = null;
            let minDist = Infinity;

            unvisited.forEach(nodeId => {
                if (dists[nodeId] < minDist) {
                    minDist = dists[nodeId];
                    minNode = nodeId;
                }
            });

            if (minNode === null || minDist === Infinity) break;

            setCurrentNode(minNode);
            addLog(`Visiting Node ${minNode}`, 'active');
            await sleep(600);

            const neighbors = EDGES.filter(e => e.from === minNode || e.to === minNode);

            for (const edge of neighbors) {
                const neighbor = edge.from === minNode ? edge.to : edge.from;
                if (!unvisited.has(neighbor)) continue;

                setActiveEdge({ from: minNode, to: neighbor });
                await sleep(300);

                const newDist = dists[minNode] + edge.weight;
                if (newDist < dists[neighbor]) {
                    dists[neighbor] = newDist;
                    prevNodes[neighbor] = minNode;
                    setDistances({ ...dists });
                    addLog(`Updated ${neighbor}`, 'success');
                    await sleep(300);
                }
            }

            unvisited.delete(minNode);
            setVisited(prev => new Set(prev).add(minNode!));
            setActiveEdge(null);
            if (minNode === 'T') break;
        }

        reconstructPath(prevNodes);
    };

    const runBFS = async () => {
        setStatus('BFS Processing');
        addLog('Starting Breadth-First Search...', 'highlight');
        const queue: string[] = ['S'];
        const visitedNodes = new Set<string>(['S']);
        const prevNodes: Record<string, string | null> = { 'S': null };
        setVisited(new Set(['S']));

        while (queue.length > 0) {
            const curr = queue.shift()!;
            setCurrentNode(curr);
            addLog(`Dequeued ${curr}`, 'active');
            await sleep(600);
            if (curr === 'T') break;
            const neighbors = EDGES.filter(e => e.from === curr || e.to === curr).map(e => e.from === curr ? e.to : e.from);
            for (const neighbor of neighbors) {
                if (!visitedNodes.has(neighbor)) {
                    visitedNodes.add(neighbor);
                    prevNodes[neighbor] = curr;
                    queue.push(neighbor);
                    setActiveEdge({ from: curr, to: neighbor });
                    setVisited(new Set(visitedNodes));
                    addLog(`Found ${neighbor}`);
                    await sleep(400);
                }
            }
            setActiveEdge(null);
        }
        reconstructPath(prevNodes);
    };

    const runDFS = async () => {
        setStatus('DFS Processing');
        addLog('Starting Depth-First Search...', 'highlight');
        const visitedNodes = new Set<string>();
        const prevNodes: Record<string, string | null> = {};
        const dfs = async (curr: string, parent: string | null) => {
            if (visitedNodes.has(curr)) return false;
            visitedNodes.add(curr);
            setVisited(new Set(visitedNodes));
            prevNodes[curr] = parent;
            setCurrentNode(curr);
            addLog(`Visiting ${curr}`, 'active');
            await sleep(600);
            if (curr === 'T') return true;
            const neighbors = EDGES.filter(e => e.from === curr || e.to === curr).map(e => e.from === curr ? e.to : e.from);
            for (const neighbor of neighbors) {
                if (!visitedNodes.has(neighbor)) {
                    setActiveEdge({ from: curr, to: neighbor });
                    if (await dfs(neighbor, curr)) return true;
                }
            }
            setActiveEdge(null);
            return false;
        };
        await dfs('S', null);
        reconstructPath(prevNodes);
    };

    const runAStar = async () => {
        setStatus('A* Processing');
        addLog('Starting A* Search...', 'highlight');
        const target = NODES.find(n => n.id === 'T')!;
        const heuristic = (id: string) => {
            const n = NODES.find(node => node.id === id)!;
            return Math.sqrt(Math.pow(n.x - target.x, 2) + Math.pow(n.y - target.y, 2)) / 15;
        };
        const gScore: Record<string, number> = {};
        const fScore: Record<string, number> = {};
        const prevNodes: Record<string, string | null> = {};
        const openSet = new Set(['S']);
        NODES.forEach(n => { gScore[n.id] = Infinity; fScore[n.id] = Infinity; });
        gScore['S'] = 0;
        fScore['S'] = heuristic('S');
        setDistances({ ...gScore });
        while (openSet.size > 0) {
            let curr: string | null = null;
            let minF = Infinity;
            openSet.forEach(id => { if (fScore[id] < minF) { minF = fScore[id]; curr = id; } });
            if (curr === 'T' || curr === null) break;
            openSet.delete(curr);
            setVisited(prev => new Set(prev).add(curr!));
            setCurrentNode(curr);
            addLog(`Visiting ${curr}`, 'active');
            await sleep(600);
            const neighbors = EDGES.filter(e => e.from === curr || e.to === curr);
            for (const edge of neighbors) {
                const neighbor = edge.from === curr ? edge.to : edge.from;
                const tentativeG = gScore[curr] + edge.weight;
                if (tentativeG < gScore[neighbor]) {
                    prevNodes[neighbor] = curr;
                    gScore[neighbor] = tentativeG;
                    fScore[neighbor] = tentativeG + heuristic(neighbor);
                    setDistances({ ...gScore });
                    setActiveEdge({ from: curr, to: neighbor });
                    if (!openSet.has(neighbor)) openSet.add(neighbor);
                    addLog(`Optimizing ${neighbor}`, 'success');
                    await sleep(300);
                }
            }
            setActiveEdge(null);
        }
        reconstructPath(prevNodes);
    };

    const reconstructPath = (prevNodes: Record<string, string | null>) => {
        const path: string[] = [];
        let curr: string | null = 'T';
        while (curr !== null) {
            path.unshift(curr);
            if (curr === 'S') break;
            curr = prevNodes[curr] || null;
        }
        if (path[0] === 'S' && path.includes('T')) {
            setShortestPath(path);
            addLog(`Optimal path identified`, 'highlight');
        } else {
            addLog('No complete path found', 'highlight');
        }
        setCurrentNode(null);
        onFinish();
    };

    const runBubbleSort = async () => {
        setStatus('Bubble Sort');
        addLog('Starting Bubble Sort...', 'highlight');
        let arr = [...array];
        let n = arr.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                setActiveIndices([j, j + 1]);
                await sleep(300);
                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    setArray([...arr]);
                    await sleep(300);
                }
            }
            setSortedIndices(prev => new Set([...prev, n - i - 1]));
        }
        onFinish();
        setActiveIndices([]);
    };

    const runQuickSort = async () => {
        setStatus('Quick Sort');
        addLog('Starting Quick Sort...', 'highlight');
        let arr = [...array];
        const partition = async (low: number, high: number) => {
            let pivot = arr[high];
            let i = low - 1;
            for (let j = low; j < high; j++) {
                setActiveIndices([j, high]);
                await sleep(300);
                if (arr[j] < pivot) {
                    i++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    setArray([...arr]);
                    await sleep(200);
                }
            }
            [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
            setArray([...arr]);
            return i + 1;
        };
        const qSort = async (low: number, high: number) => {
            if (low < high) {
                let pi = await partition(low, high);
                setSortedIndices(prev => new Set([...prev, pi]));
                await qSort(low, pi - 1);
                await qSort(pi + 1, high);
            } else if (low === high) {
                setSortedIndices(prev => new Set([...prev, low]));
            }
        };
        await qSort(0, arr.length - 1);
        onFinish();
        setActiveIndices([]);
    };

    useEffect(() => {
        // @ts-ignore
        window.startAnimation = () => {
            if (ALGORITHM === 'dijkstra') runDijkstra();
            else if (ALGORITHM === 'bfs') runBFS();
            else if (ALGORITHM === 'dfs') runDFS();
            else if (ALGORITHM === 'astar') runAStar();
            else if (ALGORITHM === 'bubble_sort') runBubbleSort();
            else if (ALGORITHM === 'quick_sort') runQuickSort();
        };
    }, []);

    const isEdgeInPath = (from: string, to: string) => {
        if (shortestPath.length < 2) return false;
        for (let i = 0; i < shortestPath.length - 1; i++) {
            if ((shortestPath[i] === from && shortestPath[i + 1] === to) || (shortestPath[i] === to && shortestPath[i + 1] === from)) return true;
        }
        return false;
    };

    const isActive = (from: string, to: string) => {
        return activeEdge && ((activeEdge.from === from && activeEdge.to === to) || (activeEdge.from === to && activeEdge.to === from));
    };

    const getComplexity = () => {
        switch(ALGORITHM) {
            case 'dijkstra': return 'O(E log V)';
            case 'bfs': return 'O(V + E)';
            case 'dfs': return 'O(V + E)';
            case 'astar': return 'O(E)';
            case 'bubble_sort': return 'O(n\u00B2)';
            case 'quick_sort': return 'O(n log n)';
            default: return 'O(N)';
        }
    };

    const titleFontSize = PAGE_TITLE.length > 25 ? "40px" : PAGE_TITLE.length > 15 ? "46px" : "54px";

    return (
        <div className="container">
            <div className="header">
                <div className="title-group">
                    <h1 style={{ fontSize: titleFontSize }}>{PAGE_TITLE.toUpperCase()}</h1>
                </div>
                <div className="header-row-2">
                    <div className="badge">{ALGORITHM.replace('_', ' ').toUpperCase()}</div>
                    <div className="ai-status">
                        <span className={`status-dot ${isComplete ? 'pulsing' : ''}`}></span>
                        {status.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="visualizer-stage">
                <div className="stats-panel">
                    <div className="stat-card">
                        <span className="stat-label">COMPLEXITY</span>
                        <span className="stat-value">{getComplexity()}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">MODE</span>
                        <span className="stat-value">{isComplete ? 'READY' : 'RUNNING'}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">NODES</span>
                        <span className="stat-value">{NODES.length || array.length}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">EDGES</span>
                        <span className="stat-value">{EDGES.length || 'N/A'}</span>
                    </div>
                </div>

                <div className="graph-canvas">
                    {!ALGORITHM.includes('sort') ? (
                        <svg className="svg-layer" viewBox="150 250 700 900" preserveAspectRatio="xMidYMid meet">
                            {/* Edges */}
                            {EDGES.map((edge, i) => {
                                const from = NODES.find(n => n.id === edge.from);
                                const to = NODES.find(n => n.id === edge.to);
                                if (!from || !to) return null;
                                const isPath = isEdgeInPath(edge.from, edge.to);
                                const active = isActive(edge.from, edge.to);
                                const midX = (from.x + to.x) / 2;
                                const midY = (from.y + to.y) / 2;
                                return (
                                    <g key={`edge-${i}`}>
                                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={`connection ${active ? 'active' : ''} ${isPath ? 'final' : ''}`} />
                                        <g transform={`translate(${midX}, ${midY})`} className="edge-weight-group">
                                            <rect x="-22" y="-18" width="44" height="36" rx="6" className="edge-weight-bg" />
                                            <text className={`edge-weight ${active ? 'active' : ''}`} textAnchor="middle" dy=".35em">{edge.weight}</text>
                                        </g>
                                    </g>
                                );
                            })}

                            {/* Nodes */}
                            {NODES.map(node => (
                                <g key={node.id} className={`node ${currentNode === node.id ? 'active' : ''} ${visited.has(node.id) ? 'visited' : ''} ${node.id === 'S' ? 'source' : ''} ${node.id === 'T' ? 'target' : ''}`} transform={`translate(${node.x}, ${node.y})`}>
                                    <circle r="42" />
                                    <text dy=".3em">{node.id}</text>
                                    <text dy="80" className="node-dist">
                                        {distances[node.id] === undefined || distances[node.id] === Infinity ? '' : distances[node.id]}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    ) : (
                        <div className="sorting-container">
                            {array.map((val, i) => (
                                <div key={i} className="sort-column">
                                    <div className={`sort-bar ${activeIndices.includes(i) ? 'active' : ''} ${sortedIndices.has(i) ? 'sorted' : ''}`} style={{ height: `${val * 6.5}px` }}>
                                        <span className="sort-value">{val}</span>
                                    </div>
                                    <span className="sort-label">{SORT_LABELS[i]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sidebar">
                    <div className="terminal">
                        <div className="terminal-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                            <span className="terminal-title">Console Output</span>
                        </div>
                        <div className="terminal-body" ref={logRef}>
                            <AnimatePresence initial={false}>
                                {logs.map((log, i) => (
                                    <motion.div key={`log-${logs.length - i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1 - i * 0.1, x: 0 }} className={`log-line ${log.type}`}>
                                        <span className="log-prompt">$</span>
                                        <span>{log.text}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer">
                KREGGSCODE <span className="ai-pill">ALGO CORE</span>
            </div>
        </div>
    );
};

export default Visualizer;
