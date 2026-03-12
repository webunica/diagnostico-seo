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
            apiKey
        } = body;

        if (!topic || !primaryKeyword) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const openAiKey = apiKey || process.env.OPENAI_API_KEY;

        if (!openAiKey) {
            return NextResponse.json({ error: 'API Key no configurada o proporcionada' }, { status: 500 });
        }

        const prompt = `Eres un experto SEO de nivel mundial y copywriter. Tu tarea es generar la estructura y el contenido para una página web NUEVA optimizada para SEO, apuntando a un score de 100/100.

DATOS PROPORCIONADOS:
- Tema/Título inicial: ${topic}
- Keyword principal: ${primaryKeyword}
- Keywords secundarias: ${secondaryKeywords}
- Localidad/Mercado: ${location}
- Público Objetivo: ${targetAudience || 'General'}
- Tono de voz: ${tone || 'Profesional'}

REQUISITOS DEL CONTENIDO:
1. URL Slug: optimizada, corta, con la keyword principal.
2. Title Tag: 55-65 caracteres, keyword principal al inicio.
3. Meta Description: 145-155 caracteres, persuasiva y con CTA.
4. H1: único, atractivo, incluye la keyword.
5. Introducción extensa: 150-250 palabras, atrapando al lector y con la keyword, explicando a fondo de qué trata la página.
6. Estructura de contenido PROFUNDA: Al menos 4 a 6 secciones H2, y CADA UNA debe tener subsecciones H3 relevantes. 
7. Contenido Exhaustivo: El texto dentro de "content" debe ser largo, detallado, de calidad periodística o experta. Al menos 300 a 500 palabras por cada sección H2, usando viñetas o listas (<ul>, <li>), negritas (<strong>) para las ideas clave si aplica. Escribe contenido real, NUNCA texto de relleno o "lorem ipsum".
8. Sugerencias de imágenes: Al menos 4 ideas de imágenes estratégicas con Alt Text SEO.
9. Call to Action (CTA) final diseñado para conversión.
10. JSON-LD Schema: apropiado para el tema (Article, LocalBusiness, FAQ etc).

Responde SOLO con un JSON válido usando esta estructura exacta:
{
  "slug": "url-slug-aqui",
  "titleTag": "Title Tag Aquí",
  "metaDescription": "Meta description aquí",
  "h1": "H1 aquí",
  "intro": "Párrafo introductorio aquí",
  "sections": [
    {
      "h2": "Título H2",
      "content": "Contenido del H2 y H3s si aplica"
    }
  ],
  "imageSuggestions": [
    {
      "description": "Qué debe mostrar la imagen",
      "altText": "Alt text optimizado SEO"
    }
  ],
  "cta": "Texto del call to action final",
  "schemaMarkup": "JSON-LD schema como string"
}

NO incluyas markdown como \`\`\`json, solo devuelve el objeto JSON. Asegúrate de que el lenguaje sea acorde a la localidad especificada (${location}).`;

        const openai = new OpenAI({ apiKey: openAiKey });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 8000,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto SEO de élite. Respondes únicamente con JSON válido.'
                },
                { role: 'user', content: prompt }
            ]
        });

        const raw = completion.choices[0]?.message?.content ?? '{}';
        const result = JSON.parse(raw);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[seo-wizard]', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
