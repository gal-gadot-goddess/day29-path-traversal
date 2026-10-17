import { GraphTopic, Node, Edge } from '../types';

export const PRESET_TOPICS: Record<string, GraphTopic> = {
    quantum: {
        algorithm: 'dijkstra',
        title: 'Quantum Entanglement Grid',
        description: 'Navigate the fluctuating quantum nodes. Find the lowest energy path from Singularity S to Entanglement Nexus T.',
        nodes: [
            { id: 'S', x: 200, y: 500, label: 'Singularity' },
            { id: 'A', x: 400, y: 280, label: 'Photon-A' },
            { id: 'B', x: 400, y: 720, label: 'Photon-B' },
            { id: 'C', x: 650, y: 240, label: 'Cluster-C' },
            { id: 'D', x: 650, y: 500, label: 'Cluster-D' },
            { id: 'E', x: 650, y: 760, label: 'Cluster-E' },
            { id: 'F', x: 880, y: 380, label: 'Relay-F' },
            { id: 'T', x: 1050, y: 500, label: 'Nexus' }
        ],
        edges: [
            { from: 'S', to: 'A', weight: 4 },
            { from: 'S', to: 'B', weight: 6 },
            { from: 'A', to: 'C', weight: 3 },
            { from: 'A', to: 'D', weight: 8 },
            { from: 'B', to: 'D', weight: 2 },
            { from: 'B', to: 'E', weight: 7 },
            { from: 'C', to: 'F', weight: 5 },
            { from: 'D', to: 'F', weight: 3 },
            { from: 'D', to: 'E', weight: 4 },
            { from: 'E', to: 'T', weight: 9 },
            { from: 'F', to: 'T', weight: 2 },
            { from: 'C', to: 'T', weight: 12 }
        ]
    },
    cyberpunk: {
        algorithm: 'dijkstra',
        title: 'Cyberpunk Metro Matrix',
        description: 'Bypass corporate surveillance subnets to establish a secure data pipe to the central data mainframe.',
        nodes: [
            { id: 'S', x: 200, y: 480, label: 'Gateway' },
            { id: 'A', x: 420, y: 260, label: 'Proxy-1' },
            { id: 'B', x: 420, y: 700, label: 'Proxy-2' },
            { id: 'C', x: 660, y: 220, label: 'Switch-A' },
            { id: 'D', x: 660, y: 480, label: 'Router-B' },
            { id: 'E', x: 660, y: 740, label: 'Switch-C' },
            { id: 'F', x: 880, y: 350, label: 'Firewall' },
            { id: 'T', x: 1060, y: 480, label: 'Core Server' }
        ],
        edges: [
            { from: 'S', to: 'A', weight: 3 },
            { from: 'S', to: 'B', weight: 5 },
            { from: 'A', to: 'B', weight: 2 },
            { from: 'A', to: 'C', weight: 6 },
            { from: 'A', to: 'D', weight: 4 },
            { from: 'B', to: 'D', weight: 3 },
            { from: 'B', to: 'E', weight: 8 },
            { from: 'C', to: 'F', weight: 4 },
            { from: 'D', to: 'F', weight: 2 },
            { from: 'D', to: 'T', weight: 10 },
            { from: 'E', to: 'T', weight: 5 },
            { from: 'F', to: 'T', weight: 3 }
        ]
    },
    deep_trench: {
        algorithm: 'dijkstra',
        title: 'Deep Trench Bioluminescence',
        description: 'Follow abyssal bio-luminescent conduits through hydrothermal vents down to the Oceanic Trench Core.',
        nodes: [
            { id: 'S', x: 220, y: 500, label: 'Surface Lab' },
            { id: 'A', x: 450, y: 300, label: 'Reef Spire' },
            { id: 'B', x: 450, y: 700, label: 'Abyss Vent' },
            { id: 'C', x: 700, y: 300, label: 'Sunken Ship' },
            { id: 'D', x: 700, y: 700, label: 'Basalt Trench' },
            { id: 'E', x: 880, y: 500, label: 'Magma Ridge' },
            { id: 'T', x: 1080, y: 500, label: 'Trench Core' }
        ],
        edges: [
            { from: 'S', to: 'A', weight: 5 },
            { from: 'S', to: 'B', weight: 4 },
            { from: 'A', to: 'C', weight: 3 },
            { from: 'A', to: 'D', weight: 9 },
            { from: 'B', to: 'D', weight: 6 },
            { from: 'B', to: 'E', weight: 8 },
            { from: 'C', to: 'E', weight: 4 },
            { from: 'D', to: 'E', weight: 3 },
            { from: 'E', to: 'T', weight: 2 },
            { from: 'C', to: 'T', weight: 11 }
        ]
    },
    detour: {
        algorithm: 'dijkstra',
        title: 'High-Weight Detour Trap',
        description: 'Demonstrating how Dijkstra smartly avoids greedy shortcuts with massive hidden resistance.',
        nodes: [
            { id: 'S', x: 220, y: 500, label: 'Origin' },
            { id: 'A', x: 450, y: 260, label: 'North Way' },
            { id: 'B', x: 450, y: 740, label: 'South Way' },
            { id: 'C', x: 720, y: 260, label: 'Direct Trap' },
            { id: 'D', x: 720, y: 740, label: 'Safe Bypass' },
            { id: 'E', x: 920, y: 500, label: 'Final Gate' },
            { id: 'T', x: 1100, y: 500, label: 'Destination' }
        ],
        edges: [
            { from: 'S', to: 'A', weight: 1 },
            { from: 'S', to: 'B', weight: 8 },
            { from: 'A', to: 'C', weight: 14 },
            { from: 'A', to: 'D', weight: 3 },
            { from: 'B', to: 'D', weight: 2 },
            { from: 'D', to: 'E', weight: 2 },
            { from: 'C', to: 'E', weight: 1 },
            { from: 'E', to: 'T', weight: 3 },
            { from: 'C', to: 'T', weight: 20 }
        ]
    }
};

export function generateRandomGraph(nodeCount: number = 8): GraphTopic {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const nodes: Node[] = [];
    
    // S on left, T on right
    nodes.push({ id: 'S', x: 180, y: 480, label: 'Source' });

    // Inner columns (e.g. 2 columns of 3)
    const innerCount = nodeCount - 2;
    const cols = 3;
    const nodesPerCol = Math.ceil(innerCount / cols);

    let letterIdx = 0;
    for (let c = 0; c < cols; c++) {
        const colX = 380 + c * 240;
        const countInCol = Math.min(nodesPerCol, innerCount - letterIdx);
        const ySpacing = 600 / (countInCol + 1);
        
        for (let r = 0; r < countInCol; r++) {
            const jitterY = (Math.random() - 0.5) * 50;
            const jitterX = (Math.random() - 0.5) * 40;
            const y = 200 + (r + 1) * ySpacing + jitterY;
            nodes.push({
                id: letters[letterIdx],
                x: Math.round(colX + jitterX),
                y: Math.round(y),
                label: `Node-${letters[letterIdx]}`
            });
            letterIdx++;
        }
    }

    nodes.push({ id: 'T', x: 1080, y: 480, label: 'Target' });

    // Connect edges forward-layered to ensure connectivity and acyclic+detour balance
    const edges: Edge[] = [];
    const edgeSet = new Set<string>();

    const addEdge = (u: string, v: string, weight: number) => {
        const key = `${u}->${v}`;
        const revKey = `${v}->${u}`;
        if (edgeSet.has(key) || edgeSet.has(revKey) || u === v) return;
        edgeSet.add(key);
        edges.push({ from: u, to: v, weight });
    };

    // Connect S to first column
    const firstColNodes = nodes.filter(n => n.x < 460 && n.id !== 'S');
    firstColNodes.forEach(n => {
        addEdge('S', n.id, Math.floor(Math.random() * 6) + 2);
    });

    // Connect last column to T
    const lastColNodes = nodes.filter(n => n.x > 800 && n.id !== 'T');
    lastColNodes.forEach(n => {
        addEdge(n.id, 'T', Math.floor(Math.random() * 5) + 2);
    });
    if (lastColNodes.length === 0) {
        const nearNodes = nodes.filter(n => n.id !== 'S' && n.id !== 'T').slice(-2);
        nearNodes.forEach(n => addEdge(n.id, 'T', Math.floor(Math.random() * 5) + 2));
    }

    // Connect adjacent nodes
    for (let i = 1; i < nodes.length - 1; i++) {
        const u = nodes[i];
        // find 2 or 3 closest nodes with x >= u.x
        const candidates = nodes
            .filter(v => v.id !== u.id && v.id !== 'S' && v.x >= u.x - 30)
            .sort((a, b) => {
                const da = Math.hypot(a.x - u.x, a.y - u.y);
                const db = Math.hypot(b.x - u.x, b.y - u.y);
                return da - db;
            });
        
        candidates.slice(0, 2).forEach(v => {
            const w = Math.floor(Math.random() * 9) + 1;
            addEdge(u.id, v.id, w);
        });
    }

    const titles = [
        'Cosmic Synapse Web',
        'Hyperlane Quantum Grid',
        'Bioluminescent Trench Conduit',
        'Autonomous Drone Swarm Network',
        'Sub-Orbital Laser Relays'
    ];
    const chosenTitle = titles[Math.floor(Math.random() * titles.length)];

    return {
        algorithm: 'dijkstra',
        title: chosenTitle,
        description: 'Dynamically generated optimal route traversal. Finding minimum weight path from S to T.',
        nodes,
        edges
    };
}
