import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLLINATIONS_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';

async function generateNewTopic() {
    const algorithms = ['dijkstra', 'astar', 'bfs', 'dfs'];
    const selectedAlgo = algorithms[Math.floor(Math.random() * algorithms.length)];

    const prompt = `
    You are an expert at creating complex, visually interesting graph theory scenarios for ${selectedAlgo}.
    Create a UNIQUE and CREATIVE scenario for a shortest path/traversal visualization optimized for a VERTICAL mobile screen.
    
    Themes: Cyberpunk City, Neural Network, Space Station, Deep Sea, Ancient Ruins, Quantum Computer, Microscopic World.

    RETURN ONLY A VALID JSON OBJECT with exactly these keys:
    - algorithm: "${selectedAlgo}"
    - title: "A creative name for the scenario (max 30 chars)"
    - description: "A brief educational hook about this specific network"
    - nodes: An array of 7 to 9 nodes. Each node must have:
        - id: A short string (e.g., "S", "A", "B", "C", "D", "E", "T")
        - x: Number (250 to 750) - Stay in the center horizontal 60% of the 1000 width screen
        - y: Number (350 to 1100) - Stay in the center vertical 60% of the 1400 height screen
    - edges: An array of 10 to 15 edges. Each edge must have:
        - from: node id
        - to: node id
        - weight: Integer (1 to 20)

    Constraint: 
    - Ensure nodes are AT LEAST 150 units apart to avoid any overlapping.
    - Ensure there is at least one node with id 'S' (Source) and one with id 'T' (Target).
    - Ensure the graph is connected.
    - The title MUST BE SHORT (under 30 characters).
    - No markdown formatting.
    `;

    try {
        const response = await fetch(POLLINATIONS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'gemini-fast',
                seed: Math.floor(Math.random() * 1000000)
            })
        });

        const fullResponse = await response.json();
        let content = fullResponse.choices?.[0]?.message?.content || "";
        console.log("RAW AI CONTENT:", content);

        content = content.replace(/```json|```/g, '').trim();

        try {
            return JSON.parse(content);
        } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No valid JSON in AI response after cleaning');
        }
    } catch (error) {
        console.error('Error generating AI topic:', error);
        return null;
    }
}

async function main() {
    console.log("🤖 Attempting to generate a unique AI scenario...");
    let topic = null;
    
    if (process.env.POLLINATIONS_API_KEY && process.env.POLLINATIONS_API_KEY !== 'PLACEHOLDER_API_KEY') {
        topic = await generateNewTopic();
    }

    if (!topic) {
        console.log("⚠️ No API Key found or AI failed. Using local fallback...");
        topic = generateLocalTopic();
    }

    if (topic) {
        const targetPath = path.join(__dirname, '../src/data/current_topic.json');
        fs.writeFileSync(targetPath, JSON.stringify(topic, null, 2));
        console.log(`✅ New topic generated: [${topic.title}] using algorithm [${topic.algorithm}]`);
        process.exit(0);
    } else {
        process.exit(1);
    }
}

function generateLocalTopic() {
    const algos = ['dijkstra', 'astar', 'bfs', 'dfs'];
    const selected = algos[Math.floor(Math.random() * algos.length)];

    const themes = [
        {
            title: "Quantum Entanglement Grid",
            description: "Navigating fluctuating quantum energy matrices from singularity to nexus."
        },
        {
            title: "Cyberpunk Subnet Grid",
            description: "Infiltrating encrypted security nodes to reach the central data bank."
        },
        {
            title: "Deep Trench Bio-Lattice",
            description: "Mapping bioluminescent hydrothermal conduits along the ocean floor."
        },
        {
            title: "Interstellar Jump Matrix",
            description: "Routing faster-than-light hyperlanes across deep-space navigation beacons."
        },
        {
            title: "Neural Synapse Mesh",
            description: "Tracing high-priority action potentials through cortical pyramidal neurons."
        }
    ];

    const theme = themes[Math.floor(Math.random() * themes.length)];

    // Generate vertical-friendly nodes: S at top, T at bottom, intermediate layers
    const nodes = [
        { id: 'S', x: 500, y: 350 },
        { id: 'A', x: 360 + Math.floor(Math.random() * 60), y: 520 + Math.floor(Math.random() * 40) },
        { id: 'B', x: 580 + Math.floor(Math.random() * 60), y: 520 + Math.floor(Math.random() * 40) },
        { id: 'C', x: 300 + Math.floor(Math.random() * 60), y: 720 + Math.floor(Math.random() * 40) },
        { id: 'D', x: 640 + Math.floor(Math.random() * 60), y: 720 + Math.floor(Math.random() * 40) },
        { id: 'E', x: 500 + Math.floor(Math.random() * 50) - 25, y: 910 + Math.floor(Math.random() * 40) },
        { id: 'T', x: 500, y: 1120 }
    ];

    const edges = [
        { from: 'S', to: 'A', weight: Math.floor(Math.random() * 6) + 2 },
        { from: 'S', to: 'B', weight: Math.floor(Math.random() * 7) + 3 },
        { from: 'A', to: 'B', weight: Math.floor(Math.random() * 5) + 2 },
        { from: 'A', to: 'C', weight: Math.floor(Math.random() * 8) + 4 },
        { from: 'A', to: 'E', weight: Math.floor(Math.random() * 10) + 6 },
        { from: 'B', to: 'D', weight: Math.floor(Math.random() * 7) + 3 },
        { from: 'B', to: 'C', weight: Math.floor(Math.random() * 9) + 4 },
        { from: 'C', to: 'E', weight: Math.floor(Math.random() * 6) + 3 },
        { from: 'D', to: 'E', weight: Math.floor(Math.random() * 6) + 2 },
        { from: 'C', to: 'T', weight: Math.floor(Math.random() * 12) + 8 },
        { from: 'D', to: 'T', weight: Math.floor(Math.random() * 10) + 6 },
        { from: 'E', to: 'T', weight: Math.floor(Math.random() * 7) + 4 }
    ];

    return {
        algorithm: selected,
        title: theme.title,
        description: theme.description,
        nodes,
        edges
    };
}

main().catch(err => {
    console.error('❌ Global error in topic generator:', err);
    process.exit(1);
});
