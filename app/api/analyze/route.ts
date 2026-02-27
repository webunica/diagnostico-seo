import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

// ── Fetcher con timeout y Axios para evitar errores TLS en Node 18+ ──
async function safeFetch(url: string, timeoutMs = 15000): Promise<{ ok: boolean; status: number; text: () => Promise<string>; url: string; headers: { get: (name: string) => string | null } } | null> {
    try {
        const r = await axios.get(url, {
            timeout: timeoutMs,
            httpsAgent: agent,
            headers: { 'User-Agent': 'DiagnosticoSEO/1.0 (+https://diagnosticoseo.com)' },
            validateStatus: () => true, // resolve to all status codes
            responseType: 'text'
        });
        return {
            ok: r.status >= 200 && r.status < 300,
            status: r.status,
            text: async () => r.data,
            url: r.request?.res?.responseUrl || url,
            headers: {
                get: (name: string) => (r.headers[name.toLowerCase()] as string) || null
            }
        };
    } catch (e) {
        console.error('safeFetch error for ' + url + ':', e);
        return null;
    }
}

// ── Extractor SEO del HTML ───────────────────────────────────────────
function extractSEO(html: string) {
    const get = (pattern: RegExp) => {
        const m = html.match(pattern);
        return m?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null;
    };

    const title = get(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = get(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
        ?? get(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i);
    const h1 = get(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const canonical = get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["']/i);
    const ogTitle = get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i);
    const ogDesc = get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i);

    const h1Count = (html.match(/<h1[^>]*>/gi) ?? []).length;
    const h2Count = (html.match(/<h2[^>]*>/gi) ?? []).length;
    const h3Count = (html.match(/<h3[^>]*>/gi) ?? []).length;
    const imgTotal = (html.match(/<img[^>]*>/gi) ?? []).length;
    const imgNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length;

    const hasSchema = html.includes('application/ld+json');
    const schemaTypes = hasSchema
        ? [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(m => m[1]).join(', ')
        : 'Ninguno';
    const hasViewport = html.includes('name="viewport"');
    const wordCount = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    const hasFacebook = html.includes('facebook.com');
    const hasInstagram = html.includes('instagram.com');
    const hasPhone = /tel:|href="[\+\d\s\-]{7,}"/i.test(html);
    const hasAddress = /(dirección|address|ubicación|calle|avenue|avda)/i.test(html);

    // Platform detection
    let platform = 'Desconocido';
    if (html.includes('Shopify') || html.includes('cdn.shopify.com')) platform = 'Shopify';
    else if (html.includes('wp-content') || html.includes('wp-includes')) platform = 'WordPress';
    else if (html.includes('wix.com') || html.includes('wixsite')) platform = 'Wix';
    else if (html.includes('squarespace')) platform = 'Squarespace';
    else if (html.includes('webflow')) platform = 'Webflow';

    const robotsMeta = get(/<meta[^>]+name=["']robots["'][^>]+content=["']([\s\S]*?)["']/i);
    const hasNoIndex = robotsMeta ? /noindex/i.test(robotsMeta) : false;

    return {
        title, titleLength: title?.length ?? 0,
        description, descriptionLength: description?.length ?? 0,
        h1, h1Count, h2Count, h3Count,
        imgTotal, imgNoAlt,
        hasSchema, schemaTypes,
        canonical, ogTitle, ogDesc,
        hasViewport, hasNoIndex, wordCount,
        hasFacebook, hasInstagram, hasPhone, hasAddress,
        robotsMeta, platform,
    };
}

// ── Parsear URLs del sitemap XML ────────────────────────────────────
function parseSitemapUrls(sitemapXml: string, origin: string, limit = 10): string[] {
    const urls: string[] = [];
    const re = /<loc>([^<]+)<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sitemapXml)) !== null && urls.length < limit) {
        const href = m[1].trim();
        if (
            (href.startsWith(origin) || href.startsWith('/')) &&
            !href.match(/\.(jpg|jpeg|png|gif|webp|svg|pdf|xml|zip|css|js)(\?.*)?$/i)
        ) {
            const abs = href.startsWith('http') ? href : `${origin}${href}`;
            if (!urls.includes(abs)) urls.push(abs);
        }
    }
    return urls;
}

// ── Datos SEO básicos de una página interna ──────────────────────────
interface InternalPage {
    url: string;
    status: number;
    title: string | null;
    h1: string | null;
    description: string | null;
    wordCount: number;
    hasSchema: boolean;
    imgNoAlt: number;
    imgTotal: number;
    canonical: string | null;
}

async function fetchInternalPages(urls: string[]): Promise<InternalPage[]> {
    const results = await Promise.allSettled(
        urls.map(async (pageUrl): Promise<InternalPage> => {
            const r = await safeFetch(pageUrl, 10000);
            if (!r) return { url: pageUrl, status: -1, title: null, h1: null, description: null, wordCount: 0, hasSchema: false, imgNoAlt: 0, imgTotal: 0, canonical: null };
            const html = await r.text();
            const get = (pat: RegExp) => html.match(pat)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null;
            return {
                url: pageUrl,
                status: r.status,
                title: get(/<title[^>]*>([\s\S]*?)<\/title>/i),
                h1: get(/<h1[^>]*>([\s\S]*?)<\/h1>/i),
                description: get(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
                    ?? get(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i),
                wordCount: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length,
                hasSchema: html.includes('application/ld+json'),
                imgTotal: (html.match(/<img[^>]*>/gi) ?? []).length,
                imgNoAlt: (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length,
                canonical: get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["']/i),
            };
        })
    );
    return results
        .filter((r): r is PromiseFulfilledResult<InternalPage> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(p => p.status >= 200 && p.status < 400);
}

// ── Recopilador de datos ───────────────────────────────────────────────
async function gatherData(url: string) {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    let origin: string;
    try {
        origin = new URL(normalized).origin;
    } catch {
        throw new Error(`URL inválida: ${url}`);
    }

    const data: Record<string, unknown> = { url: normalized, origin };

    const homeResp = await safeFetch(normalized);
    if (homeResp) {
        data.html = await homeResp.text();
        data.finalUrl = homeResp.url;
        data.statusCode = homeResp.status;
        data.server = homeResp.headers.get('server');
        data.contentType = homeResp.headers.get('content-type');
    } else {
        throw new Error('No se pudo acceder al sitio (conexión bloqueada o sitio web inactivo).');
    }

    const rResp = await safeFetch(`${origin}/robots.txt`);
    if (rResp?.ok) data.robotsTxt = await rResp.text();

    const sResp = await safeFetch(`${origin}/sitemap.xml`);
    let sitemapRaw = '';
    if (sResp?.ok) {
        sitemapRaw = await sResp.text();
        data.sitemapXml = sitemapRaw.substring(0, 3000);
    }

    // ── Crawl de páginas internas (sitemap → hasta 8 URLs) ────────────
    let internalUrls: string[] = sitemapRaw
        ? parseSitemapUrls(sitemapRaw, origin, 10)
        : [];

    // Fallback: extraer links del HTML de la homepage
    if (internalUrls.length === 0) {
        const linkRe = /href=["']([^"'#?]+)["']/gi;
        let lm: RegExpExecArray | null;
        const homeHtml = String(data.html);
        while ((lm = linkRe.exec(homeHtml)) !== null && internalUrls.length < 10) {
            const href = lm[1].trim();
            if (href.startsWith('/') && href.length > 1 && !href.match(/\.(jpg|jpeg|png|gif|webp|svg|pdf|xml|zip|css|js)(\?.*)?$/i)) {
                const abs = `${origin}${href}`;
                if (!internalUrls.includes(abs)) internalUrls.push(abs);
            }
        }
    }

    // Excluir homepage y limitar a 8
    internalUrls = internalUrls
        .filter(u => u.replace(/\/$/, '') !== origin.replace(/\/$/, ''))
        .slice(0, 8);

    data.internalPages = internalUrls.length > 0
        ? await fetchInternalPages(internalUrls)
        : [];

    return data;
}

// ── Prompt para OpenAI ────────────────────────────────────────────────
function buildPrompt(pageData: Record<string, unknown>, seo: ReturnType<typeof extractSEO>): string {
    return `Eres un experto SEO senior. Analiza los siguientes datos del sitio web y genera un diagnóstico SEO completo en ESPAÑOL.

URL: ${pageData.url}
URL Final: ${pageData.finalUrl}
Código HTTP: ${pageData.statusCode}
Servidor: ${pageData.server ?? 'Desconocido'}
Plataforma: ${seo.platform}

META TAGS:
- Title: "${seo.title ?? 'NO ENCONTRADO'}" (${seo.titleLength} chars)
- Meta description: "${seo.description ?? 'NO ENCONTRADA'}" (${seo.descriptionLength} chars)
- Canonical: ${seo.canonical ?? 'No definido'}
- OG Title: ${seo.ogTitle ?? 'No definido'}
- Robots meta: ${seo.robotsMeta ?? 'No definido'}
- Noindex: ${seo.hasNoIndex}
- Viewport: ${seo.hasViewport}

ENCABEZADOS:
- H1: "${seo.h1 ?? 'NINGUNO'}" (${seo.h1Count} total)
- H2 count: ${seo.h2Count} | H3 count: ${seo.h3Count}

CONTENIDO:
- Palabras estimadas: ${seo.wordCount}
- Imágenes totales: ${seo.imgTotal} | Sin alt text: ${seo.imgNoAlt}

SCHEMA:
- Tiene Schema markup: ${seo.hasSchema}
- Tipos: ${seo.schemaTypes}

SEÑALES E-E-A-T:
- Facebook: ${seo.hasFacebook} | Instagram: ${seo.hasInstagram}
- Teléfono: ${seo.hasPhone} | Dirección: ${seo.hasAddress}

CRAWLABILITY:
${pageData.robotsTxt ? `robots.txt:\n${String(pageData.robotsTxt).substring(0, 800)}` : 'robots.txt: NO ENCONTRADO'}

SITEMAP:
${pageData.sitemapXml ? `Sitemap:\n${String(pageData.sitemapXml).substring(0, 600)}` : 'Sitemap: NO ENCONTRADO'}

PÁGINAS INTERNAS ANALIZADAS (datos SEO reales de cada URL):
${(() => {
            const pages = (pageData.internalPages as InternalPage[] | undefined) ?? [];
            if (pages.length === 0) return 'No se encontraron páginas internas (sin sitemap ni links detectados).';
            return pages.map((p, i) => [
                `[${i + 1}] URL: ${p.url}`,
                `    Title: ${p.title ?? 'Sin title'}`,
                `    H1: ${p.h1 ?? 'Sin H1'}`,
                `    Meta desc: ${p.description ? p.description.substring(0, 100) : 'Sin descripción'}`,
                `    Palabras: ${p.wordCount} | Schema: ${p.hasSchema} | Imgs sin alt: ${p.imgNoAlt}/${p.imgTotal}`,
                `    Canonical: ${p.canonical ?? 'No definido'}`,
            ].join('\n')).join('\n\n');
        })()}

HTML (primeros 5000 chars):
${String(pageData.html).substring(0, 5000)}

---
Responde SOLO con un JSON válido (sin markdown, sin texto adicional):

{
  "score": <número entero 0-100>,
  "businessType": "<tipo de negocio en español>",
  "platform": "<plataforma>",
  "country": "<país estimado del negocio basado en URL, contenido e idioma>",
  "summary": "<resumen ejecutivo 2-3 oraciones>",
  "sections": {
    "technical": {
      "score": <0-100>,
      "status": "<good|warning|critical>",
      "summary": "<1 oración>",
      "issues": [{"title": "", "description": "", "fix": ""}],
      "passes": [""]
    },
    "onpage": {
      "score": <0-100>,
      "status": "<good|warning|critical>",
      "summary": "",
      "issues": [{"title": "", "description": "", "fix": ""}],
      "passes": []
    },
    "content": {
      "score": <0-100>,
      "status": "<good|warning|critical>",
      "summary": "",
      "issues": [{"title": "", "description": "", "fix": ""}],
      "passes": []
    },
    "schema": {
      "score": <0-100>,
      "status": "<good|warning|critical>",
      "summary": "",
      "issues": [{"title": "", "description": "", "fix": ""}],
      "passes": []
    },
    "images": {
      "score": <0-100>,
      "status": "<good|warning|critical>",
      "summary": "",
      "issues": [{"title": "", "description": "", "fix": ""}],
      "passes": []
    }
  },
  "criticalIssues": [{"title": "", "description": "", "impact": ""}],
  "quickWins": [{"title": "", "description": "", "effort": "<bajo|medio|alto>", "impact": "<alto|medio|bajo>"}],
  "actionPlan": [
    {"priority": "critical", "action": "", "description": "", "timeEstimate": ""},
    {"priority": "high", "action": "", "description": "", "timeEstimate": ""},
    {"priority": "medium", "action": "", "description": "", "timeEstimate": ""}
  ],
  "titleAnalysis": {
    "current": "${seo.title ?? 'No encontrado'}",
    "length": ${seo.titleLength},
    "status": "<good|warning|critical>",
    "recommendation": "<title recomendado>"
  },
  "descriptionAnalysis": {
    "current": "${seo.description ?? 'No encontrada'}",
    "length": ${seo.descriptionLength},
    "status": "<good|warning|critical>",
    "recommendation": "<meta description recomendada>"
  },
  "keywordAnalysis": {
    "currentKeywords": [
      {
        "keyword": "<keyword que el sitio parece estar apuntando ahora>",
        "source": "<dónde aparece: title|h1|meta|contenido|url>",
        "relevance": "<alta|media|baja>",
        "assessment": "<breve evaluación de si está bien optimizada o no>"
      }
    ],
    "missedKeywords": [
      {
        "keyword": "<keyword de alto potencial que el sitio NO está aprovechando>",
        "monthlyVolume": "<estimado: ej. 500-2.000/mes>",
        "intent": "<informacional|comercial|transaccional|local>",
        "opportunity": "<por qué es una oportunidad concreta para este negocio>"
      }
    ],
    "topicGaps": ["<tema o cluster de contenido completamente ausente que los competidores probablemente cubren>"]
  },
  "competitors": [
    {
      "name": "<nombre del competidor o sitio web>",
      "url": "<URL estimada del competidor, ej: competidor.cl>",
      "type": "<directo|indirecto>",
      "reason": "<por qué es competidor de este negocio específico>",
      "estimatedStrengths": "<qué probablemente hacen mejor en SEO y presencia digital>",
      "opportunity": "<cómo este sitio podría superarlos o diferenciarse en SEO>"
    }
  ],
  "topPages": [
    {
      "url": "<URL completa de la página interna analizada>",
      "title": "<title tag real de esa página>",
      "targetKeywords": ["<keyword principal que esta URL apunta>", "<keyword secundaria>"],
      "rankingPotential": "<alto|medio|bajo>",
      "estimatedPosition": "<Top 3|Top 10|Top 20|Top 50|No rankea>",
      "rankingStrengths": "<qué tiene bien esta página para rankear (title, contenido, schema, etc.)>",
      "rankingWeaknesses": "<qué le falta para posicionar mejor>",
      "improvement": "<acción concreta y prioritaria para mejorar su ranking>"
    }
  ]
}

Reglas:
- score global pondera technical(25%)+onpage(20%)+content(25%)+schema(10%)+images(10%)+performance_estimada(10%).
- Mínimo 2 issues por sección relevante. Mínimo 3 quick wins. Mínimo 5 items en actionPlan.
- keywordAnalysis.currentKeywords: entre 5 y 8 keywords reales detectadas en el HTML/meta.
- keywordAnalysis.missedKeywords: entre 5 y 8 oportunidades reales basadas en el tipo de negocio y país detectado.
- keywordAnalysis.topicGaps: entre 3 y 5 gaps de contenido.
- competitors: exactamente 5 competidores. Deben ser REALES y específicos del mercado/nicho/país detectado. No inventes nombres. Si el negocio es local a Chile, los competidores deben ser del mercado chileno o hispanohablante relevante. Incluye tanto competidores directos (mismo nicho) como plataformas/directorios que aparecen arriba en búsquedas del mismo sector.
- topPages: incluye una entrada por CADA página interna analizada proporcionada en "PÁGINAS INTERNAS ANALIZADAS". Si no hay páginas internas, incluye al menos la homepage como entrada con su URL real. Usa los datos SEO reales provistos (title, H1, meta) para determinar las keywords objetivo y el potencial de ranking. El campo estimatedPosition debe reflejar una estimación honesta.
- Todo en español. Sé específico y accionable.`;
}

// ── Verificar pago (MercadoPago o cupón) ─────────────────────────────
async function verifyPayment(paymentId: string): Promise<boolean> {
    if (!paymentId || paymentId === 'test') return true;

    if (paymentId.startsWith('COUPON_')) {
        const submittedCoupon = paymentId.replace('COUPON_', '');
        const validCoupons = (process.env.COUPON_100 ?? 'COD100')
            .split(',')
            .map(c => c.trim().toUpperCase())
            .filter(Boolean);
        return validCoupons.includes(submittedCoupon.toUpperCase());
    }

    // Pago normal: verificar en MercadoPago
    try {
        const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        });
        if (!resp.ok) return false;
        const data = await resp.json();
        return data.status === 'approved';
    } catch {
        return false;
    }
}

// ── Route Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const { url, paymentId } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
        }

        // Verificar pago
        const paid = await verifyPayment(paymentId);
        if (!paid) {
            return NextResponse.json({ error: 'Pago no verificado' }, { status: 403 });
        }

        // Recopilar datos
        const pageData = await gatherData(url);
        const seo = extractSEO(String(pageData.html));
        const prompt = buildPrompt(pageData, seo);

        // Llamar a OpenAI (GPT-4o-mini — más económico y muy capaz)
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 6000,
            temperature: 0.3,
            response_format: { type: 'json_object' }, // ← fuerza JSON válido
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto SEO senior. Siempre respondes ÚNICAMENTE con JSON válido según las instrucciones. No incluyas texto adicional fuera del JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const text = completion.choices[0]?.message?.content ?? '{}';

        let analysis: Record<string, unknown>;
        try {
            // Eliminar posibles bloques de markdown ```json que GPT a veces añade
            const cleanText = text.replace(/^[\s\S]*?```(json)?\n?/i, '').replace(/```[\s\S]*?$/i, '').trim();
            analysis = JSON.parse(cleanText || '{}');
        } catch {
            throw new Error('Error al procesar respuesta de IA (Formato inválido)');
        }

        return NextResponse.json({
            ...analysis,
            analyzedUrl: url,
            analyzedAt: new Date().toISOString(),
            rawSeo: seo,
            aiModel: 'gpt-4o-mini',
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno';
        console.error('[analyze]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
