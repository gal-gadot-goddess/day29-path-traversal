import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const VIDEO_ONLY = path.join(__dirname, 'temp_video.mp4');
const FINAL_OUTPUT = path.join(__dirname, 'day29_dijkstra_pathfinding.mp4');

let AUDIO_DIR = path.join(__dirname, 'viral');
if (!fs.existsSync(AUDIO_DIR)) {
    AUDIO_DIR = path.join(__dirname, '../viral');
}

const audioFiles = fs.existsSync(AUDIO_DIR) ? fs.readdirSync(AUDIO_DIR).filter(file => file.endsWith('.mp3') || file.endsWith('.wav')) : [];
const randomAudio = audioFiles.length > 0 ? audioFiles[Math.floor(Math.random() * audioFiles.length)] : null;
const AUDIO_FILE = randomAudio ? path.join(AUDIO_DIR, randomAudio) : null;

async function run() {
    console.log('🚀 Starting Vite Server for Day 29...');
    // Use --host to ensure accessibility in all environments
    const viteProcess = exec('npm run dev -- --host', { cwd: __dirname });

    let VITE_URL = 'http://localhost:5192/';
    const urlDetected = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 15000); // 15s fallback
        viteProcess.stdout.on('data', (data) => {
            console.log(`[Vite] ${data.trim()}`);
            const match = data.match(/http:\/\/(127\.0\.0\.1|localhost|10\.[^:\s]+|172\.[^:\s]+):[0-9]+/);
            if (match) {
                VITE_URL = match[0];
                console.log(`📡 Detected URL: ${VITE_URL}`);
                clearTimeout(timeout);
                resolve();
            }
        });
        viteProcess.stderr.on('data', (data) => console.error(`[Vite Error] ${data.trim()}`));
    });

    await urlDetected;

    console.log('📸 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--window-size=1080,1920',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--hide-scrollbars',
            '--mute-audio'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    console.log(`🔗 Navigating to ${VITE_URL}...`);
    try {
        await page.goto(VITE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('✅ Page loaded.');
    } catch (err) {
        console.error('❌ Page load failed:', err.message);
        await browser.close();
        viteProcess.kill();
        process.exit(1);
    }

    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 60,
        videoFrame: { width: 1080, height: 1920 },
        videoBitrate: 8000,
    });

    console.log('⏺️ Recording started...');
    await recorder.start(VIDEO_ONLY);

    await page.evaluate(() => {
        if (window.startAnimation) window.startAnimation();
    });

    console.log('⏳ Waiting for algorithm completion signal...');
    try {
        // Wait for up to 90 seconds for the completion marker
        await page.waitForSelector('#animation-complete', { timeout: 90000 });
        console.log('🏁 Algorithm finished! Processing video...');
    } catch (e) {
        console.warn('⚠️ Completion marker not found within timeout. Stopping recorder anyway.');
    }

    await new Promise(r => setTimeout(r, 2000)); // Final buffer
    await recorder.stop();
    await browser.close();

    console.log('💀 Killing Vite server...');
    viteProcess.kill('SIGKILL');
    // Force kill entire process group on Windows/Linux
    try { process.kill(-viteProcess.pid, 'SIGKILL'); } catch (e) {}
    try { execSync(`taskkill /pid ${viteProcess.pid} /T /F 2>nul || kill -9 ${viteProcess.pid} 2>/dev/null`); } catch (e) {}

    if (AUDIO_FILE && fs.existsSync(AUDIO_FILE)) {
        console.log(`🎵 Merging with audio: ${randomAudio}...`);
        let ffmpegPath = 'ffmpeg';
        const possiblePaths = [
            path.join(__dirname, 'node_modules/ffmpeg-static/ffmpeg.exe'),
            path.join(__dirname, 'node_modules/ffmpeg-static/ffmpeg'),
            path.join(__dirname, '../node_modules/ffmpeg-static/ffmpeg.exe'),
            path.join(__dirname, '../node_modules/ffmpeg-static/ffmpeg')
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                ffmpegPath = p;
                break;
            }
        }
        try {
            console.log(`[FFmpeg] Using ${ffmpegPath}`);
            execSync(`"${ffmpegPath}" -y -i "${VIDEO_ONLY}" -i "${AUDIO_FILE}" -c:v copy -c:a aac -shortest "${FINAL_OUTPUT}"`);
            console.log(`✅ FINAL VIDEO SAVED: ${FINAL_OUTPUT}`);
            if (fs.existsSync(VIDEO_ONLY)) fs.unlinkSync(VIDEO_ONLY);
        } catch (err) {
            console.error('❌ FFmpeg merge failed:', err.message);
            if (fs.existsSync(VIDEO_ONLY)) fs.renameSync(VIDEO_ONLY, FINAL_OUTPUT);
        }
    } else {
        console.warn('⚠️ No audio file found. Saving video only.');
        if (fs.existsSync(VIDEO_ONLY)) fs.renameSync(VIDEO_ONLY, FINAL_OUTPUT);
    }
    console.log('✨ All capture processes complete.');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Global error in capture script:', err);
    process.exit(1);
});
