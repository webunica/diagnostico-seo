/**
 * API Key Management — DiagnósticoSEO
 *
 * Storage backend (selección automática):
 *  - PRODUCCIÓN  → Upstash Redis  (requiere UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *  - DESARROLLO  → JSON local en .tmp/api_keys.json (fallback automático)
 *
 * Configuración Upstash:
 *  1. Ir a https://console.upstash.com → Crear base de datos Redis
 *  2. Copiar "REST URL" y "REST Token"
 *  3. Agregar al .env.local y a Vercel Settings > Environment Variables:
 *       UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
 *       UPSTASH_REDIS_REST_TOKEN=AXxx...
 *
 * Schema de claves Redis:
 *  ak:h:{keyHash}    → JSON del ApiKey (lookup rápido por key)
 *  ak:e:{email}      → Set de keyIds del usuario
 *  ak:i:{id}         → Hash del key (para lookup por ID)
 */

import { randomBytes, createHash } from 'crypto';

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
            'Score técnico, on-page y contenido',
            'Análisis de keywords y competidores',
            'Acceso a la API REST',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        requestsPerMonth: 100,
        priceMontly: 29,
        features: [
            '100 análisis SEO / mes',
            'Todo del plan Starter',
            'Generación de contenido con GPT-4o',
            'Ranking de URLs internas',
            'Soporte prioritario',
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
            'API con mayor throughput',
            'Soporte dedicado + onboarding',
            'White-label disponible',
        ],
    },
};

// ── ApiKey record ─────────────────────────────────────────────────────
export interface ApiKey {
    id: string;
    key: string;           // prefijo visible  sk_live_xxxx… (truncado)
    keyHash: string;       // SHA-256 del key real
    email: string;
    plan: string;
    label: string;
    requestsUsed: number;
    requestsLimit: number;
    resetAt: string;       // ISO — próximo reset mensual
    createdAt: string;
    lastUsedAt: string | null;
    isActive: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────
function hashKey(rawKey: string) {
    return createHash('sha256').update(rawKey).digest('hex');
}

function nextResetDate() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

// ── Storage adapter ───────────────────────────────────────────────────
// Auto-detecta Upstash vs. JSON local según las variables de entorno.

const useUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// ── UPSTASH ADAPTER ───────────────────────────────────────────────────
let _redis: import('@upstash/redis').Redis | null = null;

function getRedis() {
    if (!_redis) {
        // Importación dinámica segura sólo cuando las vars están disponibles
        const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
        _redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    }
    return _redis;
}

async function kvGet<T>(key: string): Promise<T | null> {
    if (useUpstash) return getRedis().get<T>(key);
    return localGet<T>(key);
}

async function kvSet(key: string, value: unknown, exSeconds?: number) {
    if (useUpstash) {
        const r = getRedis();
        if (exSeconds) await r.set(key, value, { ex: exSeconds });
        else await r.set(key, value);
    } else {
        localSet(key, value);
    }
}

async function kvDel(key: string) {
    if (useUpstash) await getRedis().del(key);
    else localDel(key);
}

async function kvSAdd(key: string, member: string) {
    if (useUpstash) await getRedis().sadd(key, member);
    else localSAdd(key, member);
}

async function kvSMembers(key: string): Promise<string[]> {
    if (useUpstash) return getRedis().smembers(key) as Promise<string[]>;
    return localSMembers(key);
}

// ── LOCAL JSON ADAPTER (dev) ──────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOCAL_DIR = join(process.cwd(), '.tmp');
const LOCAL_FILE = join(LOCAL_DIR, 'kv_store.json');

function localStore(): Record<string, unknown> {
    if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
    if (!existsSync(LOCAL_FILE)) return {};
    try { return JSON.parse(readFileSync(LOCAL_FILE, 'utf-8')); } catch { return {}; }
}

function localSave(store: Record<string, unknown>) {
    if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
    writeFileSync(LOCAL_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function localGet<T>(key: string): T | null {
    return (localStore()[key] as T) ?? null;
}

function localSet(key: string, value: unknown) {
    const s = localStore();
    s[key] = value;
    localSave(s);
}

function localDel(key: string) {
    const s = localStore();
    delete s[key];
    localSave(s);
}

function localSAdd(key: string, member: string) {
    const s = localStore();
    const set = (s[key] as string[]) ?? [];
    if (!set.includes(member)) set.push(member);
    s[key] = set;
    localSave(s);
}

function localSMembers(key: string): string[] {
    return (localStore()[key] as string[]) ?? [];
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Crea una nueva API key y la persiste en Redis/local.
 * Retorna el rawKey (mostrar solo una vez) y el record completo.
 */
export async function createApiKey(
    email: string,
    plan: keyof typeof PLANS = 'starter',
    label = 'default',
): Promise<{ rawKey: string; record: ApiKey }> {
    const rawKey = `sk_live_${randomBytes(20).toString('hex')}`;
    const kHash = hashKey(rawKey);
    const id = randomBytes(8).toString('hex');

    // Desactivar keys previas del mismo email+label
    const existingIds = await kvSMembers(`ak:e:${email}`);
    for (const eid of existingIds) {
        const eHash = await kvGet<string>(`ak:i:${eid}`);
        if (!eHash) continue;
        const eRec = await kvGet<ApiKey>(`ak:h:${eHash}`);
        if (eRec && eRec.label === label && eRec.isActive) {
            await kvSet(`ak:h:${eHash}`, { ...eRec, isActive: false });
        }
    }

    const record: ApiKey = {
        id, keyHash: kHash,
        key: rawKey.substring(0, 14) + '…',  // prefijo visible
        email, plan, label,
        requestsUsed: 0,
        requestsLimit: PLANS[plan]?.requestsPerMonth ?? 10,
        resetAt: nextResetDate(),
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        isActive: true,
    };

    // Persistir
    await kvSet(`ak:h:${kHash}`, record);
    await kvSet(`ak:i:${id}`, kHash);
    await kvSAdd(`ak:e:${email}`, id);

    return { rawKey, record };
}

// Validation result
export type ValidateResult =
    | { ok: true; record: ApiKey }
    | { ok: false; status: 401 | 403 | 429; error: string; remaining?: number; resetAt?: string };

/**
 * Valida la API key y consume 1 request.
 */
export async function validateAndConsume(rawKey: string): Promise<ValidateResult> {
    if (!rawKey) return { ok: false, status: 401, error: 'API key requerida. Envía el header X-API-Key.' };

    const hash = hashKey(rawKey);
    const record = await kvGet<ApiKey>(`ak:h:${hash}`);

    if (!record) return { ok: false, status: 401, error: 'API key inválida.' };
    if (!record.isActive) return { ok: false, status: 403, error: 'API key desactivada.' };

    // Auto-reset mensual
    let used = record.requestsUsed;
    let resetAt = record.resetAt;
    if (new Date() >= new Date(resetAt)) {
        used = 0;
        resetAt = nextResetDate();
    }

    const remaining = record.requestsLimit - used;
    if (remaining <= 0) {
        return {
            ok: false, status: 429,
            error: `Límite de ${record.requestsLimit} requests/mes alcanzado. Reset el ${new Date(resetAt).toLocaleDateString('es-CL')}.`,
            remaining: 0, resetAt,
        };
    }

    const updated: ApiKey = {
        ...record,
        requestsUsed: used + 1,
        resetAt,
        lastUsedAt: new Date().toISOString(),
    };

    await kvSet(`ak:h:${hash}`, updated);
    return { ok: true, record: updated };
}

/**
 * Lista todas las keys (sin keyHash) de un email.
 */
export async function getKeysByEmail(email: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const ids = await kvSMembers(`ak:e:${email}`);
    const results: Omit<ApiKey, 'keyHash'>[] = [];

    for (const id of ids) {
        const hash = await kvGet<string>(`ak:i:${id}`);
        if (!hash) continue;
        const rec = await kvGet<ApiKey>(`ak:h:${hash}`);
        if (rec) {
            const { keyHash: _kh, ...safe } = rec;
            results.push(safe);
        }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Revoca una key por id (la marca isActive=false).
 */
export async function revokeKey(id: string, email: string): Promise<boolean> {
    // Verificar que el id pertenezca a ese email
    const ids = await kvSMembers(`ak:e:${email}`);
    if (!ids.includes(id)) return false;

    const hash = await kvGet<string>(`ak:i:${id}`);
    if (!hash) return false;

    const rec = await kvGet<ApiKey>(`ak:h:${hash}`);
    if (!rec) return false;

    await kvSet(`ak:h:${hash}`, { ...rec, isActive: false });
    return true;
}

/**
 * Lista TODAS las keys (para admin).
 */
export async function adminListAll(): Promise<Omit<ApiKey, 'keyHash'>[]> {
    if (useUpstash) {
        // Scan all ak:h:* keys
        const redis = getRedis();
        const keys: string[] = [];
        let cursor = 0;
        do {
            const [nextCursor, found] = await redis.scan(cursor, { match: 'ak:h:*', count: 100 });
            cursor = Number(nextCursor);
            keys.push(...(found as string[]));
        } while (cursor !== 0);

        const results: Omit<ApiKey, 'keyHash'>[] = [];
        for (const k of keys) {
            const rec = await redis.get<ApiKey>(k);
            if (rec) { const { keyHash: _kh, ...safe } = rec; results.push(safe); }
        }
        return results;
    }

    // Local: filter store by ak:h: prefix
    const store = localStore();
    return Object.entries(store)
        .filter(([k]) => k.startsWith('ak:h:'))
        .map(([, v]) => {
            const rec = v as ApiKey;
            const { keyHash: _kh, ...safe } = rec;
            return safe;
        });
}

/**
 * Headers de rate limit para incluir en respuestas API.
 */
export function rateLimitHeaders(record: ApiKey): Record<string, string> {
    const remaining = Math.max(0, record.requestsLimit - record.requestsUsed);
    return {
        'X-RateLimit-Limit': String(record.requestsLimit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': record.resetAt,
        'X-RateLimit-Plan': record.plan,
    };
}

/**
 * Indica si el sistema está usando Upstash Redis o fallback local.
 */
export function storageBackend(): 'upstash' | 'local-json' {
    return useUpstash ? 'upstash' : 'local-json';
}
