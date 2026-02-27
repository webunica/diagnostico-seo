import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ── Types ─────────────────────────────────────────────────────────────
interface ImageSuggestion {
    placement: 'hero' | 'section-top' | 'inline' | 'sidebar' | 'cta';
    altText: string;
    description: string;
    type: 'fotografía' | 'infografía' | 'captura' | 'ilustración' | 'icono';
    keywords: string[];
}

interface H3Block {
    h3: string;
    content: string;
    keywords: string[];
}

interface Section {
    h2: string;
    intro: string;
    h3s: H3Block[];
    imageSuggestion?: ImageSuggestion;
    cta?: string;
}

interface GeneratedContent {
    targetUrl: string;
    businessType: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    titleTag: string;
    titleLength: number;
    metaDescription: string;
    metaLength: number;
    h1: string;
    intro: string;
    sections: Section[];
    conclusionH2: string;
    conclusionContent: string;
    ctaSection: {
        heading: string;
        text: string;
        buttonText: string;
    };
    schemaMarkup: string;
    internalLinkSuggestions: { anchor: string; targetPage: string; reason: string }[];
    estimatedWordCount: number;
    seoChecklist: { item: string; status: 'ok'; value: string }[];
    generatedAt: string;
}

// ── Route Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            url,
            businessType,
            platform,
            country,
            primaryKeyword,
            secondaryKeywords = [],
            existingTitle,
            existingH1,
            existingDescription,
            topPageUrl,   // URL específica a optimizar (puede ser una interna)
        } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OPENAI_API_KEY no configurado' }, { status: 500 });
        }

        const targetUrl = topPageUrl || url;
        const kwList = secondaryKeywords.slice(0, 8).join(', ') || 'relacionadas al negocio';

        const prompt = `Eres un experto SEO de nivel mundial y copywriter especializado en contenido que posiciona en el Top 3 de Google. Tu tarea es generar el contenido COMPLETO y OPTIMIZADO para la siguiente página web, diseñado para alcanzar un score SEO de 100/100.

DATOS DEL SITIO:
- URL a optimizar: ${targetUrl}
- Sitio principal: ${url}
- Tipo de negocio: ${businessType || 'No especificado'}
- Plataforma: ${platform || 'Desconocida'}
- Mercado/País: ${country || 'Chile'}
- Keyword principal: ${primaryKeyword || 'a determinar según el negocio'}
- Keywords secundarias: ${kwList}

CONTENIDO ACTUAL (para mejorar):
- Title actual: "${existingTitle || 'No encontrado'}"
- H1 actual: "${existingH1 || 'No encontrado'}"
- Meta description actual: "${existingDescription || 'No encontrada'}"

REQUISITOS DEL CONTENIDO GENERADO:
1. Title Tag: exactamente 55-65 caracteres, keyword principal al inicio
2. Meta Description: exactamente 145-158 caracteres, incluir CTA y keyword
3. H1: único, poderoso, con keyword principal, máximo 70 chars
4. Mínimo 4 secciones H2 con H3s anidados
5. Mínimo 1.200 palabras de contenido
6. Densidad de keyword principal: 1-2% (natural, no keyword stuffing)
7. Al menos 3 sugerencias de imágenes con alt text optimizado
8. Schema markup JSON-LD apropiado para el tipo de negocio
9. Sugerencias de enlaces internos con anchor text optimizado
10. Call-to-action claro y persuasivo

Responde SOLO con un JSON válido (sin markdown) siguiendo EXACTAMENTE esta estructura:

{
  "primaryKeyword": "<keyword principal determinada para esta página>",
  "secondaryKeywords": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"],
  "titleTag": "<title tag optimizado, 55-65 chars, keyword al inicio>",
  "metaDescription": "<meta description 145-158 chars con CTA>",
  "h1": "<H1 principal único y potente>",
  "intro": "<párrafo de introducción 100-150 palabras, keyword en primeras 100 palabras, engancha al lector>",
  "sections": [
    {
      "h2": "<H2 con keyword relacionada o LSI>",
      "intro": "<párrafo introductorio de esta sección, 80-120 palabras>",
      "h3s": [
        {
          "h3": "<H3 específico y concreto>",
          "content": "<contenido del H3, 80-150 palabras, informativo y con valor>",
          "keywords": ["<kw natural incluida>"]
        }
      ],
      "imageSuggestion": {
        "placement": "<hero|section-top|inline|sidebar|cta>",
        "altText": "<alt text optimizado con keyword, máx 125 chars>",
        "description": "<descripción detallada de qué mostrar en la imagen, para el diseñador o IA generativa>",
        "type": "<fotografía|infografía|captura|ilustración|icono>",
        "keywords": ["<kw del alt>"]
      },
      "cta": "<llamada a la acción específica para esta sección (opcional)>"
    }
  ],
  "conclusionH2": "<H2 de conclusión>",
  "conclusionContent": "<párrafo de conclusión 100-150 palabras, resumir beneficios y CTA final>",
  "ctaSection": {
    "heading": "<heading del bloque CTA final>",
    "text": "<texto persuasivo del CTA, 40-60 palabras>",
    "buttonText": "<texto del botón de acción>"
  },
  "schemaMarkup": "<JSON-LD de Schema.org apropiado para el tipo de negocio, como string JSON escapado con saltos de línea>",
  "internalLinkSuggestions": [
    {
      "anchor": "<anchor text con keyword>",
      "targetPage": "<URL relativa sugerida, ej: /servicios/ejemplo>",
      "reason": "<por qué este enlace interno mejora el SEO de esta página>"
    }
  ],
  "seoChecklist": [
    {"item": "Title tag optimizado (55-65 chars)", "status": "ok", "value": "<chars del title>"},
    {"item": "Meta description (145-158 chars)", "status": "ok", "value": "<chars de la meta>"},
    {"item": "H1 único con keyword", "status": "ok", "value": "<el H1>"},
    {"item": "Keyword en primeras 100 palabras", "status": "ok", "value": "Sí"},
    {"item": "Alt text en todas las imágenes sugeridas", "status": "ok", "value": "<número> imágenes"},
    {"item": "Schema markup incluido", "status": "ok", "value": "<tipo de schema>"},
    {"item": "Mínimo 4 secciones H2", "status": "ok", "value": "<número> H2s"},
    {"item": "Mínimo 1.200 palabras", "status": "ok", "value": "<palabras estimadas>"},
    {"item": "CTA claro definido", "status": "ok", "value": "<texto del CTA>"},
    {"item": "Keywords secundarias integradas", "status": "ok", "value": "<número> keywords"}
  ]
}

REGLAS CRÍTICAS:
- Todo el contenido debe estar en ESPAÑOL y adaptado al mercado ${country || 'chileno'}
- El contenido debe sonar NATURAL y de alta calidad, no robótico
- Incluir mínimo 3 imageSuggestion en las sections (una por cada sección H2 principal)
- El schemaMarkup debe ser el JSON-LD completo y válido para el tipo de negocio detectado
- El título H1 NUNCA puede ser igual al titleTag
- Mínimo 4 H2, cada H2 con 2-3 H3s
- Los H3s deben tener contenido real y útil, no genérico
- Las keywords deben estar integradas de forma natural
- Enfócate en intención del usuario: ¿qué busca alguien que llega a esta página?`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',          // máxima calidad para generación de contenido
            max_tokens: 8000,
            temperature: 0.6,          // un poco más creativo para el contenido
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto SEO y copywriter de nivel mundial. Generas contenido que posiciona en Top 3 de Google. Respondes ÚNICAMENTE con JSON válido y perfecto. Nunca incluyes texto fuera del JSON.',
                },
                { role: 'user', content: prompt },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? '{}';
        let content: Partial<GeneratedContent>;

        try {
            const clean = raw.replace(/^[\s\S]*?```(json)?\n?/i, '').replace(/```[\s\S]*?$/i, '').trim();
            content = JSON.parse(clean || '{}');
        } catch {
            throw new Error('Error al procesar la respuesta de IA (JSON inválido)');
        }

        // Calcular word count estimado
        const totalWords = [
            content.intro ?? '',
            ...(content.sections ?? []).flatMap(s => [
                s.intro ?? '',
                ...(s.h3s ?? []).map(h => h.content ?? ''),
            ]),
            content.conclusionContent ?? '',
            content.ctaSection?.text ?? '',
        ].join(' ').split(/\s+/).filter(Boolean).length;

        return NextResponse.json({
            ...content,
            targetUrl,
            businessType: businessType || content.primaryKeyword || 'Negocio',
            estimatedWordCount: totalWords,
            generatedAt: new Date().toISOString(),
            model: 'gpt-4o',
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno';
        console.error('[generate-content]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
