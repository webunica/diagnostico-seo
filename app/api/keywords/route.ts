import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';


interface KeywordItem {
    keyword: string;
    intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
    difficulty: 'low' | 'medium' | 'high';
    monthlyVolume: string;
    why: string;
    contentIdea: string;
}

interface KeywordsResponse {
    businessType: string;
    summary: string;
    headTerms: KeywordItem[];
    longTail: KeywordItem[];
    questions: KeywordItem[];
    commercial: KeywordItem[];
    local: KeywordItem[];
    negative: string[];
}

export async function POST(req: NextRequest) {
    try {
        const { description, country, focus, url } = await req.json();

        if (!description?.trim()) {
            return NextResponse.json({ error: 'Debes describir tu negocio o servicio.' }, { status: 400 });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY no configurado en .env.local' }, { status: 500 });
        }

        const prompt = `Eres un experto en SEO y keyword research para mercados de habla hispana.
Basándote en la siguiente descripción de negocio, genera palabras clave SEO estratégicas en ESPAÑOL.

NEGOCIO/SERVICIO: ${description}
PAÍS/REGIÓN TARGET: ${country || 'Chile'}
ENFOQUE: ${focus || 'todos los tipos'}
${url ? `SITIO WEB REFERENCIAL: ${url}` : ''}

Genera tussen 35 y 45 palabras clave totales distribuidas en las categorías indicadas.
Para volumen mensual, usa rangos realistas para ${country || 'Chile'}: 
  - Bajo: < 500 búsquedas/mes
  - Medio: 500–5.000 búsquedas/mes
  - Alto: > 5.000 búsquedas/mes

Responde EXCLUSIVAMENTE con JSON válido (sin markdown, sin texto extra):

{
  "businessType": "<tipo de negocio identificado>",
  "summary": "<2 oraciones sobre la estrategia keyword recomendada>",
  "headTerms": [
    {
      "keyword": "<keyword principal>",
      "intent": "informational|commercial|transactional|navigational",
      "difficulty": "low|medium|high",
      "monthlyVolume": "<ej: 1.000–5.000/mes>",
      "why": "<por qué es relevante para este negocio, 1 oración>",
      "contentIdea": "<idea concreta de contenido/página para esta keyword>"
    }
  ],
  "longTail": [...igual estructura, 10-12 keywords long-tail...],
  "questions": [...igual estructura, 8-10 preguntas que hace el usuario (¿Cómo...? ¿Cuánto...? ¿Cuál...?)...],
  "commercial": [...igual estructura, 6-8 keywords de intención comercial/de compra...],
  "local": [...igual estructura, 5-6 keywords con geo-modificador (ciudad, región, "cerca de mí")...],
  "negative": ["<keyword negativa 1>", "<keyword negativa 2>", "...5-8 keywords a excluir en ads/SEO"]
}

REGLAS IMPORTANTES:
- headTerms: 8-10 términos principales de alto volumen
- Todas las keywords deben ser en español y relevantes para ${country || 'Chile'}
- No incluir marcas de competidores
- Las "questions" deben empezar con palabras interrogativas: cómo, qué, cuándo, cuánto, cuál, dónde, por qué
- "negative" son keywords que traen tráfico irrelevante a excluir
- Dificultad "low" = keywords de cola larga con poca competencia, "high" = muy competidas`;

        // ── Groq usa el SDK de OpenAI con baseURL diferente ───────────────────
        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY ?? '',
            baseURL: 'https://api.groq.com/openai/v1',
        });

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 4096,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Experto SEO. Respondes SOLO con JSON válido. Nunca incluyes texto fuera del JSON.',
                },
                { role: 'user', content: prompt },
            ],
        });

        const text = completion.choices[0]?.message?.content ?? '{}';

        let keywords: KeywordsResponse;
        try {
            keywords = JSON.parse(text);
        } catch {
            throw new Error('Error al procesar la respuesta de IA.');
        }

        // Normalizar: garantizar que todos los campos sean arrays
        // (la IA a veces usa nombres alternativos o no incluye algún campo)
        const normalized = {
            businessType: keywords.businessType ?? 'Negocio',
            summary: keywords.summary ?? '',
            headTerms: Array.isArray(keywords.headTerms) ? keywords.headTerms : [],
            longTail: Array.isArray(keywords.longTail) ? keywords.longTail : [],
            questions: Array.isArray(keywords.questions) ? keywords.questions : [],
            commercial: Array.isArray(keywords.commercial) ? keywords.commercial : [],
            local: Array.isArray(keywords.local) ? keywords.local : [],
            negative: Array.isArray(keywords.negative) ? keywords.negative : [],
        };

        return NextResponse.json({
            ...normalized,
            generatedAt: new Date().toISOString(),
            input: { description, country, focus },
            model: 'llama-3.3-70b-versatile (Groq)',
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno';
        console.error('[keywords]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
