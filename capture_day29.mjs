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
    const viteProcess = exec('npm run dev', { cwd: __dirname });

    let VITE_URL = 'http://localhost:5192/';
    const urlDetected = new Promise(resolve => {
        viteProcess.stdout.on('data', (data) => {
            const match = data.match(/http:\/\/(127\.0\.0\.1|localhost|10\.[^:\s]+|172\.[^:\s]+):[0-9]+/);
            if (match) {
                VITE_URL = match[0];
                console.log(`📡 Detected URL: ${VITE_URL}`);
                resolve();
            }
        });
        setTimeout(() => resolve(), 10000);
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
            '--hide-scrollbars',
            '--mute-audio'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    console.log(`🔗 Navigating to ${VITE_URL}...`);
    await page.goto(VITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 60,
        videoFrame: { width: 1080, height: 1920 },
        videoBitrate: 8000,
    });

    console.log('⏺️ Recording started...');
    await recorder.start(VIDEO_ONLY);

    await page.evaluate(() => {
        // @ts-ignore
        if (window.startAnimation) window.startAnimation();
    });

    // --- SMART WAIT: Wait for the animation-complete marker ---
    console.log('⏳ Waiting for algorithm to finish...');
    try {
        await page.waitForSelector('#animation-complete', { timeout: 120000 });
        console.log('🏁 Algorithm finished! Stopping recorder...');
    } catch (e) {
        console.warn('⚠️ Timeout waiting for completion marker. Stopping anyway.');
    }

    // Small buffer after finish
    await new Promise(r => setTimeout(r, 2000));
    await recorder.stop();
    await browser.close();

    console.log('💀 Killing Vite server...');
    viteProcess.kill();

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
            execSync(`"${ffmpegPath}" -y -i "${VIDEO_ONLY}" -i "${AUDIO_FILE}" -c:v copy -c:a aac -shortest "${FINAL_OUTPUT}"`);
            console.log(`✅ FINAL VIDEO SAVED: ${FINAL_OUTPUT}`);
            if (fs.existsSync(VIDEO_ONLY)) fs.unlinkSync(VIDEO_ONLY);
        } catch (err) {
            console.error('❌ FFmpeg merge failed:', err);
            if (fs.existsSync(VIDEO_ONLY)) fs.renameSync(VIDEO_ONLY, FINAL_OUTPUT);
        }
    } else {
        if (fs.existsSync(VIDEO_ONLY)) fs.renameSync(VIDEO_ONLY, FINAL_OUTPUT);
    }
    console.log('✨ All processes complete.');
}

run().catch(console.error);
