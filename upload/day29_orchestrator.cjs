const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const HISTORY_FILE = path.join(__dirname, 'history.json');
const CURRENT_TOPIC_FILE = path.join(__dirname, 'src/data/current_topic.json');

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function saveHistory(item) {
    const history = loadHistory();
    history.push({ ...item, date: new Date().toISOString() });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Enhanced runCommand with timeout protection
 */
function runCommand(command, args, options = {}, timeoutMs = 600000) { // Default 10 mins
    return new Promise((resolve, reject) => {
        console.log(`[EXEC] ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, {
            env: { ...process.env, ...options.env },
            ...options,
            shell: true
        });

        const timer = setTimeout(() => {
            console.error(`[TIMEOUT] ${command} exceeded ${timeoutMs}ms. Terminating...`);
            proc.kill('SIGKILL');
            reject(new Error(`Command ${command} timed out`));
        }, timeoutMs);

        let output = "";
        proc.stdout.on('data', d => {
            output += d.toString();
            process.stdout.write(d.toString());
        });
        proc.stderr.on('data', d => {
            output += d.toString();
            process.stderr.write(d.toString());
        });

        proc.on('close', code => {
            clearTimeout(timer);
            if (code === 0) resolve();
            else {
                console.error(`[FAILED] ${command} with code ${code}`);
                reject(new Error(`${command} failed`));
            }
        });
    });
}

async function automateDay29() {
    console.log(`🚀 DAY 29 AUTOMATION (Hardened Mode)`);

    try {
        console.log("1️⃣ Generating Topic...");
        const genScript = path.join(__dirname, 'scripts/generate_new_dijkstra_topic.mjs');
        await runCommand('node', ["\"" + genScript + "\""], { cwd: __dirname }, 60000); // 1 min

        const topicData = JSON.parse(fs.readFileSync(CURRENT_TOPIC_FILE, 'utf8'));
        console.log(`TOPIC: [${topicData.title}] [${topicData.algorithm}]`);

        console.log("2️⃣ Generating Video...");
        await runCommand('node', ['capture_day29.mjs'], { cwd: __dirname }, 180000); // 3 mins

        console.log("3️⃣ Generating Metadata...");
        const metaScript = path.join(__dirname, 'scripts/generate_ai_metadata.mjs');
        await runCommand('node', ["\"" + metaScript + "\"", `"${topicData.algorithm}"`, `"${topicData.description}"`], { cwd: __dirname }, 60000);

        console.log("4️⃣ Uploading to Social Media...");
        const videoPath = path.join(__dirname, 'day29_dijkstra_pathfinding.mp4');
        const uploadScript = path.join(__dirname, 'scripts/unified_uploader.py');
        await runCommand('python', ["\"" + uploadScript + "\"", `"${videoPath}"`], { cwd: __dirname }, 300000); // 5 mins total

        saveHistory({
            topic: 'AI_GENERATED',
            title: topicData.title,
            algorithm: topicData.algorithm
        });

        console.log("✨ Day 29 Success! Pipeline complete.");

    } catch (error) {
        console.error("❌ Automation pipeline failed:", error.message);
        // Don't exit with 1 if it's just an upload error, so we can still save history? 
        // Actually, better to fail the action so the user knows.
        process.exit(1);
    }
}

if (require.main === module) {
    automateDay29();
}
