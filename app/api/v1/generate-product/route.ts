/**
 * POST /api/v1/generate-product
 * 
 * Genera contenido optimizado para una ficha de producto.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsume, rateLimitHeaders } from '@/lib/api-keys';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
    // 1. Auth
    const rawKey = req.headers.get('X-API-Key') ?? req.headers.get('x-api-key') ?? '';
    const authResult = await validateAndConsume(rawKey);

    if (!authResult.ok) {
        return NextResponse.json(
            { error: authResult.error, ...(authResult.resetAt ? { resetAt: authResult.resetAt } : {}) },
            { status: authResult.status }
        );
    }

    if (!['pro', 'agency'].includes(authResult.record.plan)) {
        return NextResponse.json(
            { error: 'Optimización de productos requiere plan Pro o Agency.', upgrade: '/dashboard' },
            { status: 403, headers: rateLimitHeaders(authResult.record) }
        );
    }

    const rlHeaders = rateLimitHeaders(authResult.record);

    // 2. Parse body
    let body: Record<string, any>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400, headers: rlHeaders });
    }

    const {
        productName,   // required
        keywords = [],  // required
        country = 'Chile',
        language = 'es',
    } = body;

    if (!productName) {
        return NextResponse.json({ error: 'Campo productName requerido.' }, { status: 400, headers: rlHeaders });
    }

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 503, headers: rlHeaders });
    }

    // 3. Generate product content
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const kwList = Array.isArray(keywords) ? keywords.join(', ') : keywords;

    const prompt = `Eres un experto SEO de nivel mundial y copywriter de E-commerce. Tu tarea es generar la ficha de producto PERFECTA y OPTIMIZADA para Google Shooping y búsqueda orgánica.

PRODUCTO: ${productName}
KEYWORDS OBJETIVO: ${kwList}
PAÍS/MERCADO: ${country}
IDIOMA: ${language}

Genera un JSON con este esquema exacto:
{
  "productName": "<nombre optimizado del producto con keyword>",
  "titleTag": "<title SEO 55-65 chars, keyword al inicio>",
  "metaDescription": "<meta description persuasiva 145-158 chars con beneficios>",
  "shortDescription": "<breve descripción gancho de 40-60 palabras>",
  "longDescription": "<descripción detallada con beneficios, 200-350 palabras>",
  "features": [
    { "title": "<característica>", "description": "<detalle breve>" }
  ],
  "technicalSpecs": [
    { "label": "<atributo>", "value": "<valor>" }
  ],
  "schemaMarkup": "<JSON-LD de Schema.org tipo Product completo como string>",
  "seoAdvice": "<consejo SEO específico para este producto>",
  "isProduct": true
}

Reglas:
- Mínimo 5 características clave.
- Mínimo 4 especificaciones técnicas probables.
- El SchemaMarkup debe incluir campos como name, description, brand (si aplica), etc. No inventes precios ni stock reales, usa placeholders tipo "$PRECIO" si es necesario.
- Todo en ${language === 'es' ? 'español' : language}.
- Enfócate en la CONVERSIÓN y en el SEO.`;

    try {
        const chat = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 4000,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'Experto en E-commerce SEO. Responde únicamente con JSON válido.' },
                { role: 'user', content: prompt },
            ],
        });

        const raw = chat.choices[0]?.message?.content ?? '{}';
        const data = JSON.parse(raw);

        return NextResponse.json({
            success: true,
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
        const msg = e instanceof Error ? e.message : 'Error al generar ficha de producto';
        return NextResponse.json({ error: msg }, { status: 500, headers: rlHeaders });
    }
}
