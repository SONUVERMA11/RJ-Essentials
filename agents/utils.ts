import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import { SCRAPING, OUTPUT_DIR, LOGS_DIR } from './config.js';
import slugifyLib from 'slugify';

// ─── Slugify ─────────────────────────────────────────────────────────
export function slugify(text: string): string {
    return slugifyLib(text, { lower: true, strict: true, trim: true });
}

// ─── Random Delay ────────────────────────────────────────────────────
export function delay(minMs?: number, maxMs?: number): Promise<void> {
    const min = minMs ?? SCRAPING.minDelay;
    const max = maxMs ?? SCRAPING.maxDelay;
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Download Image to Buffer ────────────────────────────────────────
export function downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, { timeout: SCRAPING.timeout, headers: { 'User-Agent': getRandomUserAgent() } }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // Follow redirect
                downloadImage(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download image: HTTP ${res.statusCode}`));
                return;
            }
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Image download timeout'));
        });
    });
}

// ─── Random User Agent ───────────────────────────────────────────────
export function getRandomUserAgent(): string {
    return SCRAPING.userAgents[Math.floor(Math.random() * SCRAPING.userAgents.length)];
}

// ─── Structured Logging ──────────────────────────────────────────────
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';

export function log(agent: string, level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = {
        INFO: '📋',
        WARN: '⚠️',
        ERROR: '❌',
        SUCCESS: '✅',
        DEBUG: '🔍',
    }[level];

    const logLine = `[${timestamp}] ${prefix} [${agent}] ${message}`;
    console.log(logLine);
    if (data) console.log(JSON.stringify(data, null, 2));
}

export async function logToFile(agent: string, level: LogLevel, message: string, data?: unknown): Promise<void> {
    log(agent, level, message, data);

    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOGS_DIR, `${agent}-${date}.log`);

    const logLine = `[${new Date().toISOString()}] [${level}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;

    await ensureDir(LOGS_DIR);
    await fs.appendFile(logFile, logLine, 'utf-8');
}

// ─── Retry with Backoff ──────────────────────────────────────────────
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = SCRAPING.maxRetries,
    baseDelay: number = 1000
): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const waitMs = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            log('retry', 'WARN', `Attempt ${attempt + 1} failed, retrying in ${Math.round(waitMs)}ms...`);
            await delay(waitMs, waitMs);
        }
    }
    throw new Error('Unreachable');
}

// ─── Sanitize HTML ───────────────────────────────────────────────────
export function sanitizeHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')       // Strip HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')          // Collapse whitespace
        .trim();
}

// ─── Ensure Directory ────────────────────────────────────────────────
export async function ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
}

// ─── Read JSON File ──────────────────────────────────────────────────
export async function readJson<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
}

// ─── Write JSON File ─────────────────────────────────────────────────
export async function writeJson(filePath: string, data: unknown): Promise<void> {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Format Price (INR) ──────────────────────────────────────────────
export function formatPrice(price: number): string {
    return `₹${price.toLocaleString('en-IN')}`;
}

// ─── Calculate Discount % ────────────────────────────────────────────
export function calcDiscount(mrp: number, sellingPrice: number): number {
    if (mrp <= 0) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

// ─── Smart Price Rounding ────────────────────────────────────────────
export function roundPrice(price: number, roundTo: number = 9): number {
    // Round to nearest X9 (e.g., 499, 999, 1299)
    const base = Math.floor(price / 10) * 10;
    return base + roundTo;
}

// ─── Date Helpers ────────────────────────────────────────────────────
export function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

export function nowStr(): string {
    return new Date().toISOString();
}

// ─── Truncate Text ───────────────────────────────────────────────────
export function truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + '...';
}

// ─── Ensure Output Directories Exist ─────────────────────────────────
export async function ensureOutputDirs(): Promise<void> {
    await ensureDir(OUTPUT_DIR);
    await ensureDir(LOGS_DIR);
    await ensureDir(path.join(OUTPUT_DIR, 'social-content'));
    await ensureDir(path.join(OUTPUT_DIR, 'reports'));
}
