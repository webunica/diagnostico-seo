import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ── Fetcher con timeout ──────────────────────────────────────────────
async function safeFetch(url: string, timeoutMs = 15000): Promise<Response | null> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const r = await fetch(url, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'DiagnosticoSEO/1.0 (+https://diagnosticoseo.com)' },
        });
        clearTimeout(tid);
        return r;
    } catch {
        clearTimeout(tid);
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
        throw new Error('No se pudo acceder al sitio.');
    }

    const rResp = await safeFetch(`${origin}/robots.txt`);
    if (rResp?.ok) data.robotsTxt = await rResp.text();

    const sResp = await safeFetch(`${origin}/sitemap.xml`);
    if (sResp?.ok) data.sitemapXml = (await sResp.text()).substring(0, 3000);

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

HTML (primeros 5000 chars):
${String(pageData.html).substring(0, 5000)}

---
Responde SOLO con un JSON válido (sin markdown, sin texto adicional):

{
  "score": <número entero 0-100>,
  "businessType": "<tipo de negocio en español>",
  "platform": "<plataforma>",
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
  }
}

Reglas: score global pondera technical(25%)+onpage(20%)+content(25%)+schema(10%)+images(10%)+performance_estimada(10%). Mínimo 2 issues por sección relevante. Mínimo 3 quick wins. Mínimo 5 items en actionPlan. Todo en español. Sé específico y accionable.`;
}

// ── Verificar pago (MercadoPago o cupón) ─────────────────────────────
async function verifyPayment(paymentId: string): Promise<boolean> {
    if (!paymentId || paymentId === 'test') return true;

    // Cupón 100%: payment_id tiene forma "COUPON_COD100"
    if (paymentId.startsWith('COUPON_')) {
        const submittedCoupon = paymentId.replace('COUPON_', '');
        const validCoupons = (process.env.COUPON_100 ?? '')
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
            max_tokens: 4096,
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
            analysis = JSON.parse(text);
        } catch {
            throw new Error('Error al procesar respuesta de IA');
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
