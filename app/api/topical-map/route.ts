import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export interface TopicalArticle {
    title: string;
    keyword: string;
    intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
    estimatedSearchVolume: string;
}

export interface TopicalCluster {
    title: string;
    description: string;
    articles: TopicalArticle[];
}

export interface TopicalMapResponse {
    pillar: {
        title: string;
        description: string;
    };
    clusters: TopicalCluster[];
    monetizationTips: string[];
}

export async function POST(req: NextRequest) {
    try {
        const { seedKeyword, country, email } = await req.json();

        if (!seedKeyword?.trim()) {
            return NextResponse.json({ error: 'Debes ingresar una palabra clave semilla.' }, { status: 400 });
        }

        if (!email?.trim()) {
            return NextResponse.json({ error: 'Debes ingresar tu correo electrónico.' }, { status: 400 });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY no configurado en .env.local' }, { status: 500 });
        }

        const prompt = `Eres un experto en Arquitectura de Información Web y Topical Authority para SEO.
Tu tarea es generar un "Topical Map" (Mapa Temático) completo basado en la siguiente temática semilla.

TEMÁTICA SEMILLA: "${seedKeyword}"
PAÍS/MERCADO OBJETIVO: ${country || 'Chile'}

El Topical Map debe estructurarse obligatoriamente en 1 Pilar central y exactamente 4 Clústeres de apoyo. 
Cada Clúster debe contener exactamente 5 artículos propuestos apuntando a keywords de cola larga relacionadas.

Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido (no incluyas markdown, saludos ni explicaciones).

Estructura estricta del JSON:
{
  "pillar": {
    "title": "<Título épico y abarcativo para la página Pilar (Guía Definitiva / Hub)>",
    "description": "<2 oraciones explicando de qué trata la página pilar y por qué es útil>"
  },
  "clusters": [
    {
      "title": "<Título descriptivo del clúster (Ej: Tipos de X, Problemas comunes de X)>",
      "description": "<1 oración explicando la intención de este clúster>",
      "articles": [
        {
          "title": "<Idea de titular SEO para el artículo>",
          "keyword": "<Keyword exacta a atacar>",
          "intent": "informational|commercial|transactional",
          "estimatedSearchVolume": "<ej: Bajo, Medio, Alto>"
        }
      ]
    }
  ],
  "monetizationTips": [
    "<Idea 1 de cómo monetizar esta temática>",
    "<Idea 2 de funnel o conversión>"
  ]
}

REGLAS GLOBALES:
- Todo en perfecto ESPAÑOL adaptado para ${country || 'Chile'}.
- Asegúrate de que los artículos no se canibalicen entre sí.
- "estimatedSearchVolume" debe decir "Bajo", "Medio" o "Alto".`;

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
                    content: 'Eres un estratega de contenido SEO de élite. Respondes SIEMPRE con un objeto JSON perfectamente válido que cumple con la estructura solicitada.',
                },
                { role: 'user', content: prompt },
            ],
        });

        const text = completion.choices[0]?.message?.content ?? '{}';

        let topicalMap: TopicalMapResponse;
        try {
            topicalMap = JSON.parse(text);
        } catch {
            throw new Error('Error al parsear la respuesta de la IA como JSON.');
        }

        return NextResponse.json({
            ...topicalMap,
            generatedAt: new Date().toISOString(),
            input: { seedKeyword, country },
            model: 'llama-3.3-70b-versatile (Groq)',
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno inesperado';
        console.error('[topical-map]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
