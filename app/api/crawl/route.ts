import { NextRequest } from 'next/server';

const FETCH_TIMEOUT = 10_000;   // 10s por página
const MAX_LIMIT = 500;      // tope absoluto
const BATCH_SIZE = 4;        // peticiones paralelas
const USER_AGENT = 'DiagnósticoSEO-Crawler/1.0';

// ── Helpers ─────────────────────────────────────────────────────────────

function toAbsolute(href: string, base: string): string | null {
    if (!href) return null;
    const h = href.trim();
    if (h.startsWith('mailto:') || h.startsWith('tel:') ||
        h.startsWith('javascript:') || h.startsWith('#') ||
        h.startsWith('data:')) return null;
    try {
        const u = new URL(h, base);
        u.hash = ''; // descartamos fragmentos
        return u.href;
    } catch { return null; }
}

function extractLinks(html: string, base: string, hostname: string): string[] {
    const links = new Set<string>();
    // Captura href="..." href='...' href=...
    const re = /href\s*=\s*(?:"([^"]*?)"|'([^']*?)'|([^\s>"']+))/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
        const href = (m[1] ?? m[2] ?? m[3] ?? '').trim();
        const abs = toAbsolute(href, base);
        if (!abs) continue;
        try {
            const u = new URL(abs);
            // Solo URLs del mismo dominio (o subdominios)
            if (u.hostname === hostname || u.hostname.endsWith('.' + hostname)) {
                links.add(abs);
            }
        } catch { /* ignorar */ }
    }
    return [...links];
}

function extractTitle(html: string): string {
    const m = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    return m ? m[1].trim().replace(/\s+/g, ' ') : '';
}

function contentTypeLabel(ct: string): string {
    if (!ct) return 'desconocido';
    if (ct.includes('text/html')) return 'HTML';
    if (ct.includes('application/pdf')) return 'PDF';
    if (ct.includes('image/')) return 'Imagen';
    if (ct.includes('application/json')) return 'JSON';
    if (ct.includes('text/css')) return 'CSS';
    if (ct.includes('javascript')) return 'JS';
    return ct.split(';')[0].split('/')[1] ?? 'otro';
}

// ── Route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: { url?: string; maxUrls?: number };
    try { body = await req.json(); }
    catch { return Response.json({ error: 'Body inválido' }, { status: 400 }); }

    const rawUrl = body.url?.trim() ?? '';
    const maxUrls = Math.min(Math.max(Number(body.maxUrls) || 100, 1), MAX_LIMIT);

    if (!rawUrl) return Response.json({ error: 'URL requerida' }, { status: 400 });

    let startUrl: URL;
    try {
        startUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    } catch {
        return Response.json({ error: 'URL inválida' }, { status: 400 });
    }

    const hostname = startUrl.hostname;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(ctrl) {
            const send = (obj: object) =>
                ctrl.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

            const visited = new Set<string>();
            const queued = new Set<string>();
            const queue: string[] = [startUrl.origin + '/'];
            queued.add(startUrl.origin + '/');
            let found = 0;

            send({ type: 'start', domain: hostname, maxUrls });

            while (queue.length > 0 && found < maxUrls) {
                // Sacar batch de la cola
                const batch: string[] = [];
                while (batch.length < BATCH_SIZE && queue.length > 0) {
                    const u = queue.shift()!;
                    if (!visited.has(u)) batch.push(u);
                }
                if (batch.length === 0) continue;

                // Fetch en paralelo
                const results = await Promise.allSettled(
                    batch.map(async (pageUrl) => {
                        visited.add(pageUrl);
                        const ac = new AbortController();
                        const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT);
                        try {
                            const res = await fetch(pageUrl, {
                                signal: ac.signal,
                                headers: { 'User-Agent': USER_AGENT },
                                redirect: 'follow',
                            });
                            clearTimeout(timer);

                            const ct = res.headers.get('content-type') ?? '';
                            const isHtml = ct.includes('text/html');
                            let title = '';
                            let newLinks: string[] = [];

                            if (isHtml && res.ok) {
                                const html = await res.text();
                                title = extractTitle(html);
                                newLinks = extractLinks(html, pageUrl, hostname)
                                    .filter(l => !visited.has(l) && !queued.has(l));
                            }

                            return {
                                url: pageUrl,
                                status: res.status,
                                type: contentTypeLabel(ct),
                                title,
                                newLinks,
                                ok: true,
                            };
                        } catch (err) {
                            clearTimeout(timer);
                            const isTimeout = err instanceof Error && err.name === 'AbortError';
                            return {
                                url: pageUrl,
                                status: isTimeout ? -1 : -2,
                                type: isTimeout ? 'timeout' : 'error',
                                title: '',
                                newLinks: [],
                                ok: false,
                            };
                        }
                    })
                );

                for (const r of results) {
                    if (r.status !== 'fulfilled') continue;
                    const { url, status, type, title, newLinks } = r.value;
                    found++;

                    // Encolar nuevos links descubiertos
                    for (const link of newLinks) {
                        if (found + queue.length < maxUrls * 5) { // pre-buffer razonable
                            queue.push(link);
                            queued.add(link);
                        }
                    }

                    send({ type: 'url', data: { url, status, type, title, index: found } });
                }
            }

            send({ type: 'done', total: found, queued: queue.length });
            ctrl.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-store',
            'X-Accel-Buffering': 'no',
        },
    });
}
