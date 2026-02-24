import { NextRequest, NextResponse } from 'next/server';

// ── Fetcher con timeout ──────────────────────────────────────────────
async function safeFetch(url: string, timeoutMs = 12000): Promise<Response | null> {
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

// ── Extractores ligeros ──────────────────────────────────────────────
function getTag(html: string, pattern: RegExp): string | null {
    return html.match(pattern)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null;
}

interface FreeCheck {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    value: string;
    tip: string;
    points: number;
    maxPoints: number;
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

        // Normalizar URL
        const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        let origin: string;
        try {
            origin = new URL(normalized).origin;
        } catch {
            return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
        }

        // Fetch homepage
        const homeResp = await safeFetch(normalized);
        if (!homeResp) {
            return NextResponse.json({ error: 'No se pudo acceder al sitio.' }, { status: 422 });
        }

        const html = await homeResp.text();
        const isHTTPS = normalized.startsWith('https://');
        const finalUrl = homeResp.url;

        // ── Extraer datos básicos ──────────────────────────────────────
        const title = getTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
        const description = getTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
            ?? getTag(html, /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i);
        const h1 = getTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const h1Count = (html.match(/<h1[^>]*>/gi) ?? []).length;
        const hasViewport = html.includes('name="viewport"');
        const hasSchema = html.includes('application/ld+json');
        const imgTotal = (html.match(/<img[^>]*>/gi) ?? []).length;
        const imgNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length;

        // robots.txt
        const rResp = await safeFetch(`${origin}/robots.txt`);
        const hasRobots = !!rResp?.ok;

        // sitemap
        const sResp = await safeFetch(`${origin}/sitemap.xml`);
        const hasSitemap = !!sResp?.ok;

        // Platform detection
        let platform = 'Desconocido';
        if (html.includes('cdn.shopify.com')) platform = 'Shopify';
        else if (html.includes('wp-content')) platform = 'WordPress';
        else if (html.includes('wix.com')) platform = 'Wix';
        else if (html.includes('squarespace')) platform = 'Squarespace';
        else if (html.includes('webflow')) platform = 'Webflow';

        // ── Evaluación de checks ──────────────────────────────────────
        const titleLen = title?.length ?? 0;
        const descLen = description?.length ?? 0;
        const altRatio = imgTotal > 0 ? ((imgTotal - imgNoAlt) / imgTotal) : 1;

        const checks: FreeCheck[] = [
            {
                id: 'https',
                label: 'HTTPS / Seguridad',
                status: isHTTPS ? 'pass' : 'fail',
                value: isHTTPS ? 'Activo ✓' : 'Sin HTTPS ✗',
                tip: isHTTPS ? 'Tu sitio usa HTTPS. Google premia la seguridad.' : 'Instala un certificado SSL. Google penaliza sitios HTTP.',
                points: isHTTPS ? 10 : 0,
                maxPoints: 10,
            },
            {
                id: 'title',
                label: 'Title Tag',
                status: !title ? 'fail' : titleLen < 30 || titleLen > 70 ? 'warn' : 'pass',
                value: title ? `"${title.substring(0, 50)}${title.length > 50 ? '…' : ''}" (${titleLen} chars)` : 'No encontrado',
                tip: !title
                    ? 'No tiene title tag — crítico para SEO. Añade uno con tu keyword principal.'
                    : titleLen < 30
                        ? 'El title es muy corto. Amplíalo a 50-65 chars con keywords relevantes.'
                        : titleLen > 70
                            ? 'El title es muy largo. Google lo cortará. Redúcelo a 60-70 chars.'
                            : 'Longitud correcta. Asegúrate que incluya la keyword principal.',
                points: !title ? 0 : (titleLen >= 30 && titleLen <= 70) ? 15 : 7,
                maxPoints: 15,
            },
            {
                id: 'description',
                label: 'Meta Description',
                status: !description ? 'fail' : descLen < 70 || descLen > 165 ? 'warn' : 'pass',
                value: description
                    ? `"${description.substring(0, 60)}${description.length > 60 ? '…' : ''}" (${descLen} chars)`
                    : 'No encontrada',
                tip: !description
                    ? 'Sin meta description — Google creará una automáticamente (y puede ser mala). Escribe una de 140-155 chars.'
                    : descLen < 70
                        ? 'Demasiado corta. Amplía a 140-155 chars con un CTA atractivo.'
                        : descLen > 165
                            ? 'Demasiado larga. Google la cortará. Redúcela a 155 chars máximo.'
                            : 'Longitud ideal. Verifica que incluya un call-to-action.',
                points: !description ? 0 : (descLen >= 70 && descLen <= 165) ? 15 : 7,
                maxPoints: 15,
            },
            {
                id: 'h1',
                label: 'Encabezado H1',
                status: h1Count === 0 ? 'fail' : h1Count > 1 ? 'warn' : 'pass',
                value: h1Count === 0
                    ? 'No encontrado'
                    : h1Count > 1
                        ? `${h1Count} H1 encontrados (debe ser solo 1)`
                        : `"${h1?.substring(0, 50) ?? ''}${(h1?.length ?? 0) > 50 ? '…' : ''}"`,
                tip: h1Count === 0
                    ? 'Sin H1 — cada página debe tener exactamente un H1 con la keyword principal.'
                    : h1Count > 1
                        ? `Tienes ${h1Count} H1. Usa solo uno por página para señalar a Google cuál es el tema principal.`
                        : 'Un único H1 — correcto. Verifica que incluya tu keyword objetivo.',
                points: h1Count === 1 ? 15 : h1Count === 0 ? 0 : 7,
                maxPoints: 15,
            },
            {
                id: 'viewport',
                label: 'Viewport (Mobile-Friendly)',
                status: hasViewport ? 'pass' : 'fail',
                value: hasViewport ? 'Configurado ✓' : 'No configurado ✗',
                tip: hasViewport
                    ? 'Viewport configurado. El sitio está preparado para móviles.'
                    : 'Sin viewport meta tag. El sitio no está optimizado para móviles — Google lo penaliza fuertemente.',
                points: hasViewport ? 5 : 0,
                maxPoints: 5,
            },
            {
                id: 'robots',
                label: 'robots.txt',
                status: hasRobots ? 'pass' : 'warn',
                value: hasRobots ? 'Encontrado ✓' : 'No encontrado',
                tip: hasRobots
                    ? 'robots.txt presente. Asegúrate de que no bloquea páginas importantes.'
                    : 'Sin robots.txt. No es crítico, pero ayuda a guiar a los crawlers de Google.',
                points: hasRobots ? 5 : 2,
                maxPoints: 5,
            },
            {
                id: 'sitemap',
                label: 'Sitemap XML',
                status: hasSitemap ? 'pass' : 'warn',
                value: hasSitemap ? 'Encontrado ✓' : 'No encontrado',
                tip: hasSitemap
                    ? 'Sitemap XML presente. Súbelo en Google Search Console si no lo has hecho.'
                    : 'Sin sitemap.xml. Google puede tardar más en descubrir tus páginas. Créalo y súbelo a Search Console.',
                points: hasSitemap ? 10 : 3,
                maxPoints: 10,
            },
            {
                id: 'images',
                label: 'Alt Text en Imágenes',
                status: imgTotal === 0 ? 'pass' : altRatio > 0.8 ? 'pass' : altRatio > 0.5 ? 'warn' : 'fail',
                value: imgTotal === 0
                    ? 'Sin imágenes detectadas'
                    : imgNoAlt === 0
                        ? `${imgTotal} imágenes con alt text ✓`
                        : `${imgNoAlt} de ${imgTotal} sin alt text`,
                tip: imgTotal === 0
                    ? 'No se detectaron imágenes en el HTML.'
                    : imgNoAlt === 0
                        ? 'Todas las imágenes tienen alt text. Excelente para accesibilidad y SEO de imágenes.'
                        : `${imgNoAlt} imágenes sin alt text. Añade descripciones cortas y descriptivas que incluyan keywords relevantes.`,
                points: imgTotal === 0 ? 10 : Math.round(altRatio * 10),
                maxPoints: 10,
            },
            {
                id: 'schema',
                label: 'Schema / Datos Estructurados',
                status: hasSchema ? 'pass' : 'warn',
                value: hasSchema ? 'Schema markup detectado ✓' : 'No detectado',
                tip: hasSchema
                    ? 'Tiene Schema markup. Verifica que sea correcto con Google Rich Results Test.'
                    : 'Sin Schema markup. Los datos estructurados ayudan a Google a entender tu contenido y pueden generar Rich Snippets.',
                points: hasSchema ? 15 : 0,
                maxPoints: 15,
            },
        ];

        // ── Calcular score ─────────────────────────────────────────────
        const totalPoints = checks.reduce((s, c) => s + c.points, 0);
        const maxPoints = checks.reduce((s, c) => s + c.maxPoints, 0);
        const score = Math.round((totalPoints / maxPoints) * 100);

        const passing = checks.filter(c => c.status === 'pass').length;
        const warning = checks.filter(c => c.status === 'warn').length;
        const failing = checks.filter(c => c.status === 'fail').length;

        // Estimar cuántos issues habría en el reporte completo
        const estimatedFullIssues = Math.max(failing * 3 + warning * 2, 6);

        return NextResponse.json({
            url: normalized,
            finalUrl,
            analyzedAt: new Date().toISOString(),
            platform,
            score,
            checks,
            summary: { passing, warning, failing },
            estimatedFullIssues,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno';
        console.error('[analyze-free]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
