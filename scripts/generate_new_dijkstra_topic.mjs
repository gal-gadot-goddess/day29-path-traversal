import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLLINATIONS_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';

async function generateNewTopic() {
    const algorithms = ['dijkstra', 'bfs', 'dfs', 'astar', 'bubble_sort', 'quick_sort'];
    const selectedAlgo = algorithms[Math.floor(Math.random() * algorithms.length)];

    let prompt = "";

    if (selectedAlgo.includes('sort')) {
        prompt = `
        You are an expert at creating educational sorting algorithm scenarios.
        Create a UNIQUE and CREATIVE scenario for a ${selectedAlgo} visualization.
        
        Themes: Cyberpunk, Space, Bioluminescence, Ancient Magic, Quantum Computing, Steampunk.

        RETURN ONLY A VALID JSON OBJECT with exactly these keys:
        - algorithm: "${selectedAlgo}"
        - title: "A creative name for the sorting task (max 30 chars)"
        - description: "A brief educational hook about why we are sorting these items"
        - data: An array of 8 to 12 integers (values between 20 and 100) representing the items to be sorted.
        - labels: An array of strings (same length Redwood, max 12 chars each) giving each value a short name (e.g., "Packet A").

        No markdown formatting.
        `;
    } else {
        prompt = `
        You are an expert at creating complex, visually interesting graph theory scenarios for ${selectedAlgo}.
        Create a UNIQUE and CREATIVE scenario for a shortest path/traversal visualization optimized for a VERTICAL mobile screen.
        
        Themes: Cyberpunk City, Neural Network, Space Station, Deep Sea, Ancient Ruins, Quantum Computer, Microscopic World.

        RETURN ONLY A VALID JSON OBJECT with exactly these keys:
        - algorithm: "${selectedAlgo}"
        - title: "A creative name for the scenario (max 30 chars)"
        - description: "A brief educational hook about this specific network"
        - nodes: An array of 7 to 9 nodes. Each node must have:
            - id: A short string (e.g., "S", "A", "1", "T")
            - x: Number (200 to 800) - Stay in the center horizontal 60% of the 1000 width screen
            - y: Number (300 to 1100) - Stay in the center vertical 60% of the 1400 height screen
        - edges: An array of 10 to 15 edges. Each edge must have:
            - from: node id
            - to: node id
            - weight: Integer (1 to 20)

        Constraint: 
        - Ensure nodes are AT LEAST 200 units apart to avoid any overlapping.
        - Ensure there is at least one node with id 'S' (Source) and one with id 'T' (Target).
        - Ensure the graph is connected.
        - The title MUST BE SHORT (under 30 characters).
        - No markdown formatting.
        `;
    }

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
    const algos = ['dijkstra', 'bfs', 'dfs', 'astar', 'bubble_sort', 'quick_sort'];
    const selected = algos[Math.floor(Math.random() * algos.length)];
    
    if (selected.includes('sort')) {
        return {
            algorithm: selected,
            title: "Neural Synapse Sorter",
            description: "Sorting high-priority neurotransmitters in the prefrontal cortex.",
            data: [45, 12, 89, 34, 67, 23, 56, 78],
            labels: ["Dopamine", "Serotonin", "GABA", "Glutamate", "Acetyl", "Norepi", "Oxytocin", "Endorphin"]
        };
    }

    return {
        algorithm: selected,
        title: "Quantum Neural Mesh",
        description: "Navigating the entanglement pathways of a experimental quantum processor.",
        nodes: [
            { id: 'S', x: 500, y: 350 },
            { id: 'A', x: 250, y: 650 },
            { id: 'B', x: 750, y: 650 },
            { id: 'C', x: 300, y: 950 },
            { id: 'D', x: 700, y: 950 },
            { id: 'T', x: 500, y: 1150 }
        ],
        edges: [
            { from: 'S', to: 'A', weight: 4 },
            { from: 'S', to: 'B', weight: 3 },
            { from: 'A', to: 'C', weight: 5 },
            { from: 'B', to: 'D', weight: 6 },
            { from: 'C', to: 'T', weight: 2 },
            { from: 'D', to: 'T', weight: 3 }
        ]
    };
}

main().catch(err => {
    console.error('❌ Global error in topic generator:', err);
    process.exit(1);
});
