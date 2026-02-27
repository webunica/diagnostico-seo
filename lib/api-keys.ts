/**
 * API Key Management — DiagnósticoSEO
 *
 * Storage: En Vercel Production se usa un archivo JSON persistido vía
 * File System API de Vercel (o KV si se activa). En desarrollo local
 * se almacena en /tmp/api_keys.json.
 *
 * Para mayor escala, reemplazar el backend por Vercel KV:
 *   import { kv } from '@vercel/kv';
 */

import { randomBytes, createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Plan definitions ──────────────────────────────────────────────────
export interface Plan {
    id: string;
    name: string;
    requestsPerMonth: number;
    priceMontly: number;
    features: string[];
}

export const PLANS: Record<string, Plan> = {
    starter: {
        id: 'starter',
        name: 'Starter',
        requestsPerMonth: 10,
        priceMontly: 0,
        features: [
            '10 análisis SEO / mes',
            'Análisis básico de URL',
            'Score 0-100',
            'Soporte por email',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        requestsPerMonth: 100,
        priceMontly: 29,
        features: [
            '100 análisis SEO / mes',
            'Análisis completo + keywords + competidores',
            'Ranking de URLs internas',
            'Generación de contenido con GPT-4o',
            'Prioridad en soporte',
        ],
    },
    agency: {
        id: 'agency',
        name: 'Agency',
        requestsPerMonth: 1000,
        priceMontly: 99,
        features: [
            '1.000 análisis SEO / mes',
            'Todo del plan Pro',
            'Acceso API prioritario',
            'Soporte dedicado + onboarding',
            'White-label disponible',
        ],
    },
};

// ── ApiKey record ─────────────────────────────────────────────────────
export interface ApiKey {
    id: string;
    key: string;            // sk_live_xxxx (public prefix)
    keyHash: string;        // SHA-256 del key real (nunca almacenar el key plano)
    email: string;
    plan: string;
    label: string;
    requestsUsed: number;
    requestsLimit: number;
    resetAt: string;        // ISO date del próximo reset mensual
    createdAt: string;
    lastUsedAt: string | null;
    isActive: boolean;
}

// ── Storage helpers ───────────────────────────────────────────────────
const DATA_DIR = process.env.NODE_ENV === 'production'
    ? '/tmp'           // Vercel ephemeral (upgrade to KV for persistence)
    : join(process.cwd(), '.tmp');
const DATA_FILE = join(DATA_DIR, 'api_keys.json');

function ensureDir() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadKeys(): ApiKey[] {
    ensureDir();
    if (!existsSync(DATA_FILE)) return [];
    try {
        return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function saveKeys(keys: ApiKey[]) {
    ensureDir();
    writeFileSync(DATA_FILE, JSON.stringify(keys, null, 2), 'utf-8');
}

// Cache en memoria para evitar I/O repetido en la misma request
let _cache: ApiKey[] | null = null;
let _cacheTs = 0;

function getKeys(): ApiKey[] {
    const now = Date.now();
    if (_cache && now - _cacheTs < 5000) return _cache;
    _cache = loadKeys();
    _cacheTs = now;
    return _cache;
}

function mutateKeys(fn: (keys: ApiKey[]) => ApiKey[]) {
    const keys = fn(loadKeys());
    saveKeys(keys);
    _cache = keys;
    _cacheTs = Date.now();
    return keys;
}

// ── Key generation ────────────────────────────────────────────────────
function hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
}

function nextResetDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Creates a new API key for an email.
 * Returns the raw key (only shown once) and the full record.
 */
export function createApiKey(
    email: string,
    plan: keyof typeof PLANS = 'starter',
    label = 'default',
): { rawKey: string; record: ApiKey } {
    const rawKey = `sk_live_${randomBytes(20).toString('hex')}`;
    const record: ApiKey = {
        id: randomBytes(8).toString('hex'),
        key: rawKey.substring(0, 14) + '…',  // truncated for display
        keyHash: hashKey(rawKey),
        email,
        plan,
        label,
        requestsUsed: 0,
        requestsLimit: PLANS[plan]?.requestsPerMonth ?? 10,
        resetAt: nextResetDate(),
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        isActive: true,
    };

    mutateKeys(keys => {
        // Desactivar keys anteriores del mismo email+label
        const updated = keys.map(k =>
            k.email === email && k.label === label ? { ...k, isActive: false } : k
        );
        return [...updated, record];
    });

    return { rawKey, record };
}

// Validation result
export type ValidateResult =
    | { ok: true; record: ApiKey }
    | { ok: false; status: 401 | 403 | 429; error: string; remaining?: number; resetAt?: string };

/**
 * Validates a raw API key and checks rate limits.
 * If valid, increments usage.
 */
export function validateAndConsume(rawKey: string): ValidateResult {
    if (!rawKey) return { ok: false, status: 401, error: 'API key requerida. Envía el header X-API-Key.' };

    const hash = hashKey(rawKey);
    const keys = getKeys();
    const record = keys.find(k => k.keyHash === hash);

    if (!record) return { ok: false, status: 401, error: 'API key inválida.' };
    if (!record.isActive) return { ok: false, status: 403, error: 'API key desactivada.' };

    // Auto-reset mensual
    if (new Date() >= new Date(record.resetAt)) {
        mutateKeys(all => all.map(k =>
            k.id === record.id
                ? { ...k, requestsUsed: 0, resetAt: nextResetDate() }
                : k
        ));
        record.requestsUsed = 0;
        record.resetAt = nextResetDate();
    }

    const remaining = record.requestsLimit - record.requestsUsed;
    if (remaining <= 0) {
        return {
            ok: false, status: 429,
            error: `Límite de ${record.requestsLimit} requests/mes alcanzado. Resetea el ${new Date(record.resetAt).toLocaleDateString('es-CL')}.`,
            remaining: 0,
            resetAt: record.resetAt,
        };
    }

    // Consume one request
    mutateKeys(all => all.map(k =>
        k.id === record.id
            ? { ...k, requestsUsed: k.requestsUsed + 1, lastUsedAt: new Date().toISOString() }
            : k
    ));

    return { ok: true, record: { ...record, requestsUsed: record.requestsUsed + 1 } };
}

/**
 * Gets all (non-sensitive) keys for an email.
 */
export function getKeysByEmail(email: string): Omit<ApiKey, 'keyHash'>[] {
    return getKeys()
        .filter(k => k.email === email)
        .map(({ keyHash: _kh, ...safe }) => safe);
}

/**
 * Revokes a key by id.
 */
export function revokeKey(id: string, email: string): boolean {
    let found = false;
    mutateKeys(keys => keys.map(k => {
        if (k.id === id && k.email === email) { found = true; return { ...k, isActive: false }; }
        return k;
    }));
    return found;
}

/**
 * Gets usage summary for a raw key (for the dashboard).
 */
export function getUsageSummary(rawKey: string): Omit<ApiKey, 'keyHash'> | null {
    const hash = hashKey(rawKey);
    const rec = getKeys().find(k => k.keyHash === hash);
    if (!rec) return null;
    const { keyHash: _kh, ...safe } = rec;
    return safe;
}

// ── Admin helpers ─────────────────────────────────────────────────────
export function adminListAll(): Omit<ApiKey, 'keyHash'>[] {
    return getKeys().map(({ keyHash: _kh, ...safe }) => safe);
}

/**
 * Response headers to include with each successful API call.
 */
export function rateLimitHeaders(record: ApiKey): Record<string, string> {
    const remaining = record.requestsLimit - record.requestsUsed;
    return {
        'X-RateLimit-Limit': String(record.requestsLimit),
        'X-RateLimit-Remaining': String(Math.max(0, remaining)),
        'X-RateLimit-Reset': record.resetAt,
        'X-RateLimit-Plan': record.plan,
    };
}
