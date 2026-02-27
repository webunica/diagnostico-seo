/**
 * POST /api/v1/analyze
 *
 * Public, API-Key-protected endpoint.
 * Identical functionality to /api/analyze but:
 *  - Requires X-API-Key header
 *  - Enforces rate limits by plan
 *  - Returns rate limit headers
 *  - Structured JSON response (no payment check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsume, rateLimitHeaders } from '@/lib/api-keys';

// Re-export all the core logic from the main route
// We duplicate the imports to keep it standalone and avoid circular deps

import OpenAI from 'openai';
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

async function safeFetch(url: string, timeoutMs = 15000): Promise<{
    ok: boolean; status: number; text: () => Promise<string>; url: string;
    headers: { get: (name: string) => string | null };
} | null> {
    try {
        const r = await axios.get(url, {
            timeout: timeoutMs,
            httpsAgent: agent,
            headers: { 'User-Agent': 'DiagnosticoSEO/1.0 (+https://diagnosticoseo.com)' },
            validateStatus: () => true,
            responseType: 'text',
        });
        return {
            ok: r.status >= 200 && r.status < 300,
            status: r.status,
            text: async () => r.data,
            url: r.request?.res?.responseUrl || url,
            headers: { get: (name: string) => (r.headers[name.toLowerCase()] as string) || null },
        };
    } catch (e) {
        console.error('safeFetch error:', e);
        return null;
    }
}

function extractSEO(html: string) {
    const get = (pat: RegExp) => html.match(pat)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null;
    return {
        title: get(/<title[^>]*>([\s\S]*?)<\/title>/i),
        description: get(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
            ?? get(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i),
        h1: get(/<h1[^>]*>([\s\S]*?)<\/h1>/i),
        canonical: get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["']/i),
        ogTitle: get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i),
        ogDesc: get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i),
        h1Count: (html.match(/<h1[^>]*>/gi) ?? []).length,
        h2Count: (html.match(/<h2[^>]*>/gi) ?? []).length,
        h3Count: (html.match(/<h3[^>]*>/gi) ?? []).length,
        imgNoAlt: (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length,
        imgTotal: (html.match(/<img[^>]*>/gi) ?? []).length,
        hasSchema: html.includes('application/ld+json'),
        hasViewport: html.includes('name="viewport"') || html.includes("name='viewport'"),
        wordCount: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length,
    };
}

export async function POST(req: NextRequest) {
    // ── 1. Auth ───────────────────────────────────────────────────────
    const rawKey = req.headers.get('X-API-Key') ?? req.headers.get('x-api-key') ?? '';
    const authResult = validateAndConsume(rawKey);

    if (!authResult.ok) {
        return NextResponse.json(
            { error: authResult.error, ...(authResult.resetAt ? { resetAt: authResult.resetAt } : {}) },
            { status: authResult.status }
        );
    }

    const rlHeaders = rateLimitHeaders(authResult.record);

    // ── 2. Parse body ─────────────────────────────────────────────────
    let url: string;
    try {
        const body = await req.json();
        url = body.url;
        if (!url) throw new Error('Campo url requerido.');
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Body JSON inválido.' },
            { status: 400, headers: rlHeaders }
        );
    }

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503, headers: rlHeaders });
    }

    // ── 3. Fetch page ─────────────────────────────────────────────────
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    let origin: string;
    try { origin = new URL(normalized).origin; }
    catch { return NextResponse.json({ error: 'URL inválida.' }, { status: 400, headers: rlHeaders }); }

    const homeResp = await safeFetch(normalized);
    if (!homeResp) {
        return NextResponse.json({ error: 'No se pudo acceder al sitio.' }, { status: 422, headers: rlHeaders });
    }

    const html = await homeResp.text();
    const seo = extractSEO(html);
    const robots = await safeFetch(`${origin}/robots.txt`).then(r => r?.ok ? r.text() : null);
    const sitemapR = await safeFetch(`${origin}/sitemap.xml`).then(r => r?.ok ? r.text() : null);

    // ── 4. GPT analysis ───────────────────────────────────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Eres un experto SEO. Analiza este sitio web y devuelve SOLO JSON válido.

URL: ${normalized}
Title: ${seo.title ?? 'N/A'}
H1: ${seo.h1 ?? 'N/A'}
Meta description: ${seo.description ?? 'N/A'}
H1s: ${seo.h1Count}, H2s: ${seo.h2Count}, H3s: ${seo.h3Count}
Imágenes sin alt: ${seo.imgNoAlt}/${seo.imgTotal}
Schema: ${seo.hasSchema ? 'Sí' : 'No'}
Viewport: ${seo.hasViewport ? 'Sí' : 'No'}
Palabras: ${seo.wordCount}
Robots.txt: ${robots ? 'Disponible' : 'No encontrado'}
Sitemap.xml: ${sitemapR ? 'Disponible' : 'No encontrado'}
Canonical: ${seo.canonical ?? 'No definido'}
HTML (primeros 3000 chars): ${html.substring(0, 3000)}

Responde con este JSON:
{
  "score": <0-100>,
  "businessType": "<tipo de negocio detectado>",
  "country": "<país/mercado detectado>",
  "sections": {
    "technical": { "score": <0-100>, "issues": [{ "title": "", "description": "", "priority": "critical|high|medium" }] },
    "onpage":    { "score": <0-100>, "issues": [...] },
    "content":   { "score": <0-100>, "issues": [...] }
  },
  "quickWins": [{ "title": "", "impact": "high|medium", "effort": "low|medium", "steps": [""] }],
  "actionPlan": [{ "priority": 1, "action": "", "impact": "", "timeEstimate": "" }],
  "titleAnalysis": { "current": "", "score": 0, "issues": [""], "suggested": "" },
  "descriptionAnalysis": { "current": "", "score": 0, "issues": [""], "suggested": "" },
  "keywordAnalysis": {
    "currentKeywords": [{ "keyword": "", "frequency": 0 }],
    "missedKeywords": [{ "keyword": "", "searchVolume": "", "difficulty": "" }],
    "topicGaps": [""]
  },
  "competitors": [{ "name": "", "url": "", "type": "direct|indirect", "reason": "", "estimatedStrengths": "", "opportunity": "" }]
}`;

    try {
        const chat = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 4000,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'Eres un experto SEO. Responde únicamente con JSON válido.' },
                { role: 'user', content: prompt },
            ],
        });

        const raw = chat.choices[0]?.message?.content ?? '{}';
        const clean = raw.replace(/^[\s\S]*?```(json)?\n?/i, '').replace(/```[\s\S]*?$/i, '').trim();
        const data = JSON.parse(clean || '{}');

        return NextResponse.json({
            success: true,
            analyzedUrl: normalized,
            ...data,
            meta: {
                model: 'gpt-4o-mini',
                analyzedAt: new Date().toISOString(),
                plan: authResult.record.plan,
                requestsUsed: authResult.record.requestsUsed,
                requestsRemaining: authResult.record.requestsLimit - authResult.record.requestsUsed,
            },
        }, { headers: rlHeaders });

    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al procesar';
        return NextResponse.json({ error: msg }, { status: 500, headers: rlHeaders });
    }
}
