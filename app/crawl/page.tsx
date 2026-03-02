'use client';

import { useState, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────
interface CrawledUrl {
    url: string;
    status: number;
    type: string;
    title: string;
    index: number;
}

type FilterStatus = 'all' | '2xx' | '3xx' | '4xx' | '5xx' | 'error';

// ── Helpers ────────────────────────────────────────────────────────────
function statusColor(s: number) {
    if (s >= 200 && s < 300) return '#059669';
    if (s >= 300 && s < 400) return '#B45309';
    if (s >= 400 && s < 500) return '#DC2626';
    if (s >= 500) return '#991B1B';
    return '#52525B'; // error/timeout
}

function statusBg(s: number) {
    if (s >= 200 && s < 300) return 'rgba(52,211,153,0.1)';
    if (s >= 300 && s < 400) return 'rgba(252,211,77,0.1)';
    if (s >= 400 && s < 500) return 'rgba(248,113,113,0.1)';
    if (s >= 500) return 'rgba(255,140,90,0.1)';
    return 'rgba(148,163,184,0.1)';
}

function statusLabel(s: number) {
    if (s === -1) return 'TIMEOUT';
    if (s === -2) return 'ERROR';
    return String(s);
}

function matchFilter(s: number, f: FilterStatus) {
    if (f === 'all') return true;
    if (f === '2xx') return s >= 200 && s < 300;
    if (f === '3xx') return s >= 300 && s < 400;
    if (f === '4xx') return s >= 400 && s < 500;
    if (f === '5xx') return s >= 500;
    if (f === 'error') return s < 0;
    return true;
}

function exportCSV(urls: CrawledUrl[], domain: string) {
    const header = 'URL,Status,Tipo,Título';
    const rows = urls.map(u =>
        [u.url, statusLabel(u.status), u.type, u.title]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `crawl-${domain}-${Date.now()}.csv`;
    a.click();
}

// ── Stat Pill ──────────────────────────────────────────────────────────
function StatPill({
    label, count, color, active, onClick,
}: { label: string; count: number; color: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '8px 18px',
                color: active ? color : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s',
            }}
        >
            <span style={{ fontWeight: 800 }}>{count}</span>
            {label}
        </button>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function CrawlPage() {
    const [domain, setDomain] = useState('');
    const [email, setEmail] = useState('');
    const [maxUrls, setMaxUrls] = useState(100);
    const [crawling, setCrawling] = useState(false);
    const [done, setDone] = useState(false);
    const [urls, setUrls] = useState<CrawledUrl[]>([]);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [copiedUrl, setCopiedUrl] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleCrawl = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setDone(false); setUrls([]); setFilter('all'); setSearch('');
        if (!email.trim() || !isValidEmail(email.trim())) { setError('Ingresa un correo válido.'); return; }
        if (!domain.trim()) { setError('Ingresa un dominio o URL.'); return; }

        setCrawling(true);
        const ac = new AbortController();
        abortRef.current = ac;

        try {
            const res = await fetch('/api/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: domain.trim(), maxUrls, email: email.trim() }),
                signal: ac.signal,
            });

            if (!res.ok || !res.body) throw new Error('Error al conectar con el crawler.');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const msg = JSON.parse(line);
                        if (msg.type === 'url') {
                            setUrls(prev => [...prev, msg.data]);
                        } else if (msg.type === 'done') {
                            setDone(true);
                        } else if (msg.type === 'error') {
                            setError(msg.message);
                        }
                    } catch { /* ignorar líneas malformadas */ }
                }
            }
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                setError(err instanceof Error ? err.message : 'Error inesperado.');
            }
        } finally {
            setCrawling(false);
        }
    }, [domain, maxUrls]);

    const stopCrawl = () => {
        abortRef.current?.abort();
        setCrawling(false);
        setDone(true);
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(''), 1500);
    };

    // Counts
    const count2xx = urls.filter(u => u.status >= 200 && u.status < 300).length;
    const count3xx = urls.filter(u => u.status >= 300 && u.status < 400).length;
    const count4xx = urls.filter(u => u.status >= 400 && u.status < 500).length;
    const count5xx = urls.filter(u => u.status >= 500).length;
    const countErr = urls.filter(u => u.status < 0).length;

    const filtered = urls.filter(u => {
        const matchS = matchFilter(u.status, filter);
        const matchQ = !search || u.url.toLowerCase().includes(search.toLowerCase()) ||
            u.title.toLowerCase().includes(search.toLowerCase());
        return matchS && matchQ;
    });

    const detectedDomain = (() => {
        try { return new URL(domain.startsWith('http') ? domain : `https://${domain}`).hostname; } catch { return domain; }
    })();

    return (
        <div style={{ minHeight: '100vh', background: '#F7F7F9', color: '#101820', fontFamily: 'Montserrat, sans-serif' }}>
            {/* Navbar */}
            <nav className="navbar" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="navbar-logo">
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#C2410C' }}>SEO Diagnostico</span>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.85rem', color: '#52525B', fontWeight: 700, textDecoration: 'none' }}>← Inicio</a>
                    <a href="/keywords" style={{ fontSize: '0.85rem', color: '#52525B', fontWeight: 700, textDecoration: 'none' }}>Keywords</a>
                    <div style={{
                        fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px',
                        background: 'rgba(255,105,0,0.08)', border: '1px solid rgba(194,65,12,0.15)',
                        borderRadius: 20, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        🕷️ Crawl — Free
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                paddingTop: 110,
                paddingBottom: 60,
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 0%, rgba(255,105,0,0.05) 0%, transparent 70%), #FFFFFF',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,105,0,0.08)', border: '1px solid rgba(194,65,12,0.15)',
                        borderRadius: 20, padding: '6px 16px', fontSize: '0.72rem', fontWeight: 800,
                        color: '#C2410C', marginBottom: 24, textTransform: 'uppercase'
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                        Crawler BFS en tiempo real · 100% Gratis
                    </div>

                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, marginBottom: 16, lineHeight: 1.1, color: '#101820', letterSpacing: '-0.02em' }}>
                        Descubre todas las <span style={{ color: '#C2410C' }}>URLs de un dominio</span>
                    </h1>

                    <p style={{ fontSize: '1.1rem', color: '#52525B', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 500 }}>
                        Crawl inteligente con BFS — sigue todos los enlaces internos y muestra URLs en tiempo real con estado HTTP, tipo y título de página.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleCrawl} style={{ maxWidth: 680, margin: '0 auto' }}>
                        {/* Email Row */}
                        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto 12px' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.5 }}>📧</span>
                            <input
                                type="email"
                                placeholder="Tu correo electrónico..."
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={crawling}
                                style={{
                                    width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)',
                                    background: 'white', fontSize: '0.97rem', fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', marginBottom: 12 }}>
                            <input
                                type="text"
                                placeholder="ejemplo.cl o https://ejemplo.cl"
                                value={domain}
                                onChange={e => setDomain(e.target.value)}
                                disabled={crawling}
                                style={{ flex: 1, border: 'none', color: '#1a1a2e', fontSize: '0.97rem', padding: '14px 18px', fontFamily: 'inherit', background: 'transparent' }}
                            />
                            <select
                                value={maxUrls}
                                onChange={e => setMaxUrls(Number(e.target.value))}
                                disabled={crawling}
                                style={{ border: 'none', borderLeft: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: '0.85rem', padding: '0 14px', fontFamily: 'inherit', cursor: 'pointer' }}
                            >
                                <option value={50}>50 URLs</option>
                                <option value={100}>100 URLs</option>
                                <option value={200}>200 URLs</option>
                                <option value={500}>500 URLs</option>
                            </select>
                            {crawling ? (
                                <button type="button" onClick={stopCrawl} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '14px 22px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}> detener </button>
                            ) : (
                                <button type="submit" style={{ background: '#C2410C', color: 'white', border: 'none', padding: '14px 24px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', textTransform: 'uppercase' }}> 🕷️ Iniciar Crawl </button>
                            )}
                        </div>
                        {error && <div style={{ color: '#DC2626', fontSize: '0.82rem', marginBottom: 10 }}>⚠️ {error}</div>}
                        <p style={{ fontSize: '0.72rem', color: '#71717A', textAlign: 'center' }}>
                            Máx. 500 URLs · Recibirás el resumen en tu correo.
                        </p>
                    </form>
                </div>
            </section>

            {/* Results area */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
                {urls.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#101820' }}>
                                {crawling
                                    ? <span>🕷️ Crawleando <strong style={{ color: '#C2410C' }}>{detectedDomain}</strong>… <span style={{ color: '#71717A', fontWeight: 400 }}>{urls.length} encontrados</span></span>
                                    : <span>✅ Completo — <strong style={{ color: '#C2410C' }}>{urls.length}</strong> URLs en <strong>{detectedDomain}</strong></span>}
                            </div>
                            {done && (
                                <button onClick={() => exportCSV(urls, detectedDomain)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>⬇️ Exportar CSV</button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            <StatPill label="All" count={urls.length} color="#101820" active={filter === 'all'} onClick={() => setFilter('all')} />
                            <StatPill label="2xx" count={count2xx} color="#059669" active={filter === '2xx'} onClick={() => setFilter('2xx')} />
                            <StatPill label="3xx" count={count3xx} color="#B45309" active={filter === '3xx'} onClick={() => setFilter('3xx')} />
                            <StatPill label="4xx" count={count4xx} color="#DC2626" active={filter === '4xx'} onClick={() => setFilter('4xx')} />
                        </div>

                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <input type="text" placeholder="Filtrar por URL o título…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '12px 14px', color: '#101820', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                {filtered.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No URLs found.</div>
                                ) : filtered.map((u, i) => (
                                    <div key={u.url} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 90px 90px 36px', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>{u.index}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#101820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.url}</div>
                                            <div style={{ fontSize: '0.74rem', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.title}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}><span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: statusBg(u.status), color: statusColor(u.status) }}>{statusLabel(u.status)}</span></div>
                                        <div style={{ textAlign: 'center' }}><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>{u.type}</span></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <button onClick={() => copyUrl(u.url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedUrl === u.url ? '#059669' : '#CBD5E0' }}> ⎘ </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {urls.length === 0 && !crawling && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 20 }}>🕷️</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Crawler de Sitios</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Ingresa un dominio para comenzar el escaneo</div>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '32px 24px', textAlign: 'center', background: '#FFFFFF' }}>
                <a href="/" style={{ color: '#C2410C', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>Audita tu sitio ahora con Inmobiliaria Pilares →</a>
            </div>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: rgba(255,105,0,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}
