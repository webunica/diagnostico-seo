/**
 * POST /api/v1/generate-content
 *
 * Public, API-Key-protected content generation endpoint.
 * Uses GPT-4o to generate SEO-optimized page content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsume, rateLimitHeaders } from '@/lib/api-keys';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
    // ── 1. Auth ───────────────────────────────────────────────────────
    const rawKey = req.headers.get('X-API-Key') ?? req.headers.get('x-api-key') ?? '';
    const authResult = await validateAndConsume(rawKey);

    if (!authResult.ok) {
        return NextResponse.json(
            { error: authResult.error, ...(authResult.resetAt ? { resetAt: authResult.resetAt } : {}) },
            { status: authResult.status }
        );
    }

    // Only pro/agency can use content generation via API
    if (!['pro', 'agency'].includes(authResult.record.plan)) {
        return NextResponse.json(
            { error: 'Generación de contenido requiere plan Pro o Agency.', upgrade: '/dashboard' },
            { status: 403, headers: rateLimitHeaders(authResult.record) }
        );
    }

    const rlHeaders = rateLimitHeaders(authResult.record);

    // ── 2. Parse body ─────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400, headers: rlHeaders });
    }

    const {
        url,           // required
        targetUrl,     // optional: specific internal page
        businessType,
        primaryKeyword,
        secondaryKeywords = [],
        country = 'Chile',
        language = 'es',
    } = body as Record<string, string | string[]>;

    if (!url) {
        return NextResponse.json({ error: 'Campo url requerido.' }, { status: 400, headers: rlHeaders });
    }

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503, headers: rlHeaders });
    }

    // ── 3. Generate content ───────────────────────────────────────────
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const kwList = Array.isArray(secondaryKeywords)
        ? (secondaryKeywords as string[]).slice(0, 8).join(', ')
        : String(secondaryKeywords);

    const prompt = `Eres un experto SEO y copywriter de nivel mundial. Genera contenido COMPLETO y OPTIMIZADO.

URL: ${targetUrl || url}
Sitio: ${url}
Negocio: ${businessType || 'a determinar'}
País/mercado: ${country}
Idioma: ${language}
Keyword principal: ${primaryKeyword || 'a determinar'}
Keywords secundarias: ${kwList || 'relacionadas al negocio'}

Genera un JSON con este esquema exacto:
{
  "primaryKeyword": "<keyword principal>",
  "secondaryKeywords": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"],
  "titleTag": "<title 55-65 chars, keyword al inicio>",
  "metaDescription": "<meta 145-158 chars con CTA>",
  "h1": "<H1 único, distinto al title>",
  "intro": "<párrafo intro 100-150 palabras>",
  "sections": [
    {
      "h2": "<H2 con keyword relacionada>",
      "intro": "<párrafo 80-120 palabras>",
      "h3s": [
        { "h3": "<H3>", "content": "<80-150 palabras>", "keywords": ["<kw>"] }
      ],
      "imageSuggestion": {
        "placement": "<hero|section-top|inline>",
        "altText": "<alt text optimizado, máx 125 chars>",
        "description": "<qué mostrar en la imagen>",
        "type": "<fotografía|infografía|ilustración>"
      },
      "cta": "<llamada a acción de esta sección>"
    }
  ],
  "conclusionH2": "<H2 conclusión>",
  "conclusionContent": "<párrafo conclusión 100-150 palabras>",
  "ctaSection": { "heading": "<heading CTA>", "text": "<texto 40-60 palabras>", "buttonText": "<texto botón>" },
  "schemaMarkup": "<JSON-LD completo como string>",
  "internalLinkSuggestions": [
    { "anchor": "<anchor text>", "targetPage": "<URL relativa>", "reason": "<por qué>" }
  ],
  "seoChecklist": [
    { "item": "<nombre del check>", "status": "ok", "value": "<valor verificado>" }
  ]
}

Reglas: mínimo 4 H2, cada H2 con 2-3 H3s, todo en ${language === 'es' ? 'español' : language}, específico para el mercado de ${country}.`;

    try {
        const chat = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 8000,
            temperature: 0.6,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'Experto SEO y copywriter. Responde únicamente con JSON válido y perfecto.' },
                { role: 'user', content: prompt },
            ],
        });

        const raw = chat.choices[0]?.message?.content ?? '{}';
        const clean = raw.replace(/^[\s\S]*?```(json)?\n?/i, '').replace(/```[\s\S]*?$/i, '').trim();
        const data = JSON.parse(clean || '{}');

        const wordCount = [
            data.intro ?? '',
            ...(data.sections ?? []).flatMap((s: Record<string, unknown>) => [
                String(s.intro ?? ''),
                ...((s.h3s as Record<string, unknown>[] ?? [])).map(h => String(h.content ?? '')),
            ]),
            data.conclusionContent ?? '',
        ].join(' ').split(/\s+/).filter(Boolean).length;

        return NextResponse.json({
            success: true,
            targetUrl: String(targetUrl || url),
            businessType: String(businessType || data.primaryKeyword || ''),
            estimatedWordCount: wordCount,
            generatedAt: new Date().toISOString(),
            model: 'gpt-4o',
            ...data,
            meta: {
                plan: authResult.record.plan,
                requestsUsed: authResult.record.requestsUsed,
                requestsRemaining: authResult.record.requestsLimit - authResult.record.requestsUsed,
            },
        }, { headers: rlHeaders });

    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al generar contenido';
        return NextResponse.json({ error: msg }, { status: 500, headers: rlHeaders });
    }
}
