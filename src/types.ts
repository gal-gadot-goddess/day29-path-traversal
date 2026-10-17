export interface Node {
    id: string;
    x: number;
    y: number;
    label?: string;
}

export interface Edge {
    from: string;
    to: string;
    weight: number;
}

export interface GraphTopic {
    algorithm: string;
    title: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
    data?: number[];
    labels?: string[];
}

export interface LogEntry {
    id: string;
    text: string;
    type: 'default' | 'active' | 'success' | 'highlight' | 'warning';
    timestamp: string;
}

export interface QueueItem {
    nodeId: string;
    distance: number;
    active?: boolean;
}

export interface StepExplanation {
    badge: 'SCANNING' | 'EVALUATING' | 'RELAXING' | 'QUEUED' | 'OPTIMAL' | 'START' | 'COMPLETE';
    title: string;
    detail: string;
    currentNode?: string;
    targetNode?: string;
    edgeWeight?: number;
    prevDistance?: number;
    newDistance?: number;
}

export type ThemeType = 'cyberpunk' | 'quantum' | 'synthwave' | 'deepvoid';

export type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs';
