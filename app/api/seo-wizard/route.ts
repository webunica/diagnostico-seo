import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            topic,
            primaryKeyword,
            secondaryKeywords,
            location,
            targetAudience,
            tone,
            contentType,
            apiKey
        } = body;

        if (!topic || !primaryKeyword) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const openAiKey = apiKey || process.env.OPENAI_API_KEY;

        if (!openAiKey) {
            return NextResponse.json({ error: 'API Key no configurada o proporcionada' }, { status: 500 });
        }

        const prompt = `Eres un experto SEO de nivel mundial, copywriter y estratega de contenido. Tu tarea es generar una página web COMPLETA optimizada para obtener un score SEO de 100/100 y posicionarse en el Top 3 de Google.

DATOS PROPORCIONADOS:
- Tema/Título inicial: ${topic}
- Keyword principal: ${primaryKeyword}
- Keywords secundarias: ${secondaryKeywords || 'a determinar por ti'}
- Localidad/Mercado: ${location || 'España'}
- Público Objetivo: ${targetAudience || 'General'}
- Tono de voz: ${tone || 'Profesional'}
- Tipo de contenido: ${contentType || 'Página de servicios'}

REQUISITOS CRÍTICOS PARA 100/100 SEO:
1. URL Slug: optimizada, corta, con la keyword principal, sin stopwords.
2. Title Tag: EXACTAMENTE 55-65 caracteres, keyword principal al inicio.
3. Meta Description: EXACTAMENTE 145-155 caracteres, persuasiva con CTA y keyword.
4. Open Graph: título y descripción optimizados para redes sociales.
5. H1: único, atractivo, incluye la keyword, DIFERENTE al Title Tag, máx 70 chars.
6. Introducción: 200-300 palabras, keyword en las primeras 100 palabras, enganchando al lector.
7. Estructura PROFUNDA: Mínimo 5 secciones H2, cada una con 2-3 subsecciones H3.
8. Contenido extenso: Cada sección H2 con su intro (80-120 palabras) + H3s con contenido de 150-250 palabras cada uno. Usa HTML semántico: <strong>, <ul>, <li>, <a> donde aplique.
9. Densidad de keyword: 1-2% natural, nunca keyword stuffing.
10. Imágenes: Al menos 4 sugerencias con alt text SEO optimizado y descripción para diseñador/IA.
11. CTA Final: Bloque de conversión con heading, texto persuasivo y texto del botón.
12. Conclusión: H2 de cierre con párrafo de 100-150 palabras resumiendo beneficios.
13. JSON-LD Schema: Schema.org completo y válido para el tipo de contenido.
14. Internal Links: Al menos 3 sugerencias de enlaces internos con anchor text optimizado.
15. FAQ Schema: Al menos 3 preguntas frecuentes con respuestas de 50-80 palabras.
16. Checklist SEO: Verifica que TODOS los criterios se cumplen.

Responde SOLO con JSON válido usando EXACTAMENTE esta estructura:
{
  "slug": "<url-slug>",
  "titleTag": "<55-65 chars, keyword al inicio>",
  "titleLength": <número de chars del title>,
  "metaDescription": "<145-155 chars con CTA>",
  "metaLength": <número de chars de la meta>,
  "ogTitle": "<título para Open Graph / redes sociales>",
  "ogDescription": "<descripción para Open Graph>",
  "canonicalUrl": "/<slug>",
  "h1": "<H1 único, diferente al title, con keyword>",
  "primaryKeyword": "${primaryKeyword}",
  "secondaryKeywords": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"],
  "intro": "<párrafo introductorio 200-300 palabras, keyword en primeras 100 palabras>",
  "sections": [
    {
      "h2": "<H2 con keyword relacionada o LSI>",
      "intro": "<párrafo introductorio de esta sección, 80-120 palabras>",
      "h3s": [
        {
          "h3": "<H3 específico y concreto>",
          "content": "<contenido del H3, 150-250 palabras, con HTML semántico si aplica>",
          "keywords": ["<keyword natural usada>"]
        }
      ],
      "imageSuggestion": {
        "placement": "<hero|section-top|inline|sidebar|cta>",
        "altText": "<alt text optimizado con keyword, máx 125 chars>",
        "description": "<qué mostrar en la imagen, para diseñador o IA generativa>",
        "type": "<fotografía|infografía|captura|ilustración|icono>",
        "keywords": ["<kw del alt>"]
      },
      "cta": "<llamada a la acción específica para esta sección>"
    }
  ],
  "faqSection": [
    {
      "question": "<pregunta frecuente>",
      "answer": "<respuesta de 50-80 palabras>"
    }
  ],
  "conclusionH2": "<H2 de conclusión>",
  "conclusionContent": "<párrafo 100-150 palabras, resumir beneficios y CTA>",
  "ctaSection": {
    "heading": "<heading del bloque CTA final>",
    "text": "<texto persuasivo del CTA, 60-80 palabras>",
    "buttonText": "<texto del botón de acción>"
  },
  "schemaMarkup": "<JSON-LD de Schema.org completo como string>",
  "internalLinkSuggestions": [
    {
      "anchor": "<anchor text con keyword>",
      "targetPage": "<URL relativa sugerida>",
      "reason": "<por qué mejora el SEO>"
    }
  ],
  "seoChecklist": [
    {"item": "<criterio SEO>", "status": "ok", "value": "<valor verificado>"}
  ]
}

REGLAS CRÍTICAS:
- Todo en ESPAÑOL adaptado al mercado de ${location || 'España'}.
- Contenido NATURAL y de alta calidad, tono ${tone || 'profesional'}. NUNCA lorem ipsum.
- El H1 NUNCA puede ser igual al titleTag.
- Mínimo 5 H2s, cada H2 con 2-3 H3s con contenido EXTENSO.
- Las keywords deben estar integradas de forma natural (1-2% densidad).
- El schemaMarkup debe ser JSON-LD completo y válido.
- Incluye FAQ con mínimo 3 preguntas reales del público objetivo.
- El seoChecklist debe verificar: title, meta, H1, keywords, imágenes, schema, H2s, palabras, CTA, FAQ.
- Enfócate en intención de búsqueda: ¿qué busca alguien con la keyword "${primaryKeyword}"?`;

        const openai = new OpenAI({ apiKey: openAiKey });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 12000,
            temperature: 0.65,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto SEO y copywriter de nivel mundial. Generas contenido que posiciona en Top 3 de Google. Respondes ÚNICAMENTE con JSON válido y perfecto. Nunca incluyes texto fuera del JSON. Tu contenido es extenso, profesional y listo para publicar.'
                },
                { role: 'user', content: prompt }
            ]
        });

        const raw = completion.choices[0]?.message?.content ?? '{}';
        let result;
        try {
            const clean = raw.replace(/^[\s\S]*?```(json)?\n?/i, '').replace(/```[\s\S]*?$/i, '').trim();
            result = JSON.parse(clean || '{}');
        } catch {
            throw new Error('Error al procesar la respuesta de IA (JSON inválido)');
        }

        // Calcular word count estimado
        const totalWords = [
            result.intro ?? '',
            ...(result.sections ?? []).flatMap((s: any) => [
                s.intro ?? '',
                ...(s.h3s ?? []).map((h: any) => h.content ?? ''),
            ]),
            ...(result.faqSection ?? []).map((f: any) => f.answer ?? ''),
            result.conclusionContent ?? '',
            result.ctaSection?.text ?? '',
        ].join(' ').split(/\s+/).filter(Boolean).length;

        const h2count = result.sections?.length ?? 0;
        const h3count = (result.sections ?? []).reduce((a: number, s: any) => a + (s.h3s?.length ?? 0), 0);
        const imgcount = (result.sections ?? []).filter((s: any) => s.imageSuggestion).length;

        return NextResponse.json({
            ...result,
            estimatedWordCount: totalWords,
            structureStats: { h2s: h2count, h3s: h3count, images: imgcount },
            generatedAt: new Date().toISOString(),
            model: 'gpt-4o',
            input: { topic, primaryKeyword, secondaryKeywords, location, targetAudience, tone, contentType },
        });

    } catch (error: any) {
        console.error('[seo-wizard]', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
