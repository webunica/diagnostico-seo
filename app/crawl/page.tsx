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
    if (s >= 200 && s < 300) return '#34D399';
    if (s >= 300 && s < 400) return '#FCD34D';
    if (s >= 400 && s < 500) return '#F87171';
    if (s >= 500) return '#FF8C5A';
    return '#94A3B8'; // error/timeout
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
    const [maxUrls, setMaxUrls] = useState(100);
    const [crawling, setCrawling] = useState(false);
    const [done, setDone] = useState(false);
    const [urls, setUrls] = useState<CrawledUrl[]>([]);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [copiedUrl, setCopiedUrl] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const handleCrawl = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setDone(false); setUrls([]); setFilter('all'); setSearch('');
        if (!domain.trim()) { setError('Ingresa un dominio o URL.'); return; }

        setCrawling(true);
        const ac = new AbortController();
        abortRef.current = ac;

        try {
            const res = await fetch('/api/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: domain.trim(), maxUrls }),
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
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <div className="logo-icon">🔍</div>
                    <span>DiagnósticoSEO</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Análisis SEO</a>
                    <a href="/keywords" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Keywords</a>
                    <div style={{
                        fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px',
                        background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: 20, color: '#c084fc',
                    }}>
                        🕷️ Crawl — Gratis
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                paddingTop: 90,
                background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.5) 0%, transparent 60%), #1a0038',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 52px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: 20, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
                        color: '#c084fc', marginBottom: 20,
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                        Crawler BFS en tiempo real · 100% Gratis
                    </div>

                    <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.7rem)', fontWeight: 900, marginBottom: 14, lineHeight: 1.12, letterSpacing: '-0.02em', color: 'white' }}>
                        Descubre todas las{' '}
                        <span style={{ background: 'linear-gradient(135deg, #d8b4fe, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            URLs de un dominio
                        </span>
                    </h1>

                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
                        Crawl inteligente con BFS — sigue todos los enlaces internos y muestra
                        URLs en tiempo real con estado HTTP, tipo y título de página.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleCrawl} style={{ maxWidth: 680, margin: '0 auto' }}>
                        {/* URL bar estilo Semrush */}
                        <div style={{ display: 'flex', background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.35)', marginBottom: 14 }}>
                            <input
                                type="text"
                                placeholder="ejemplo.cl o https://ejemplo.cl"
                                value={domain}
                                onChange={e => setDomain(e.target.value)}
                                disabled={crawling}
                                style={{
                                    flex: 1, border: 'none', outline: 'none',
                                    color: '#1a1a2e', fontSize: '0.97rem',
                                    padding: '14px 18px', fontFamily: 'inherit',
                                    background: 'transparent',
                                }}
                            />
                            <select
                                value={maxUrls}
                                onChange={e => setMaxUrls(Number(e.target.value))}
                                disabled={crawling}
                                style={{
                                    border: 'none', borderLeft: '1px solid #e5e7eb',
                                    background: 'white', color: '#6b7280',
                                    fontSize: '0.85rem', padding: '0 14px',
                                    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value={50}>50 URLs</option>
                                <option value={100}>100 URLs</option>
                                <option value={200}>200 URLs</option>
                                <option value={500}>500 URLs</option>
                            </select>
                            {crawling ? (
                                <button
                                    type="button"
                                    onClick={stopCrawl}
                                    style={{
                                        background: '#EF4444', color: 'white', border: 'none',
                                        padding: '14px 22px', fontSize: '0.9rem', fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                    }}
                                >
                                    ⬛ Detener
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: 'white', border: 'none',
                                        padding: '14px 24px', fontSize: '0.9rem', fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                    }}
                                >
                                    🕷️ Iniciar Crawl
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="error-msg">⚠️ {error}</div>
                        )}

                        <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                            El crawler sigue solo enlaces internos del mismo dominio · Máx. 500 URLs
                        </p>
                    </form>
                </div>
            </section>

            {/* Results area */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

                {/* Stat pills */}
                {urls.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        {/* Progress / done header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                                {crawling
                                    ? <span>🕷️ Crawleando <strong style={{ color: '#c084fc' }}>{detectedDomain}</strong>… <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{urls.length} URLs encontradas</span></span>
                                    : <span>✅ Crawl completo — <strong style={{ color: '#c084fc' }}>{urls.length}</strong> URLs en <strong>{detectedDomain}</strong></span>
                                }
                            </div>
                            {done && (
                                <button
                                    onClick={() => exportCSV(urls, detectedDomain)}
                                    style={{
                                        background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                                        borderRadius: 8, padding: '8px 16px',
                                        fontSize: '0.82rem', fontWeight: 600, color: '#c084fc',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    ⬇️ Exportar CSV ({urls.length})
                                </button>
                            )}
                        </div>

                        {/* Filtros */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            <StatPill label="Todas" count={urls.length} color="#c084fc" active={filter === 'all'} onClick={() => setFilter('all')} />
                            <StatPill label="2xx OK" count={count2xx} color="#34D399" active={filter === '2xx'} onClick={() => setFilter('2xx')} />
                            <StatPill label="3xx" count={count3xx} color="#FCD34D" active={filter === '3xx'} onClick={() => setFilter('3xx')} />
                            <StatPill label="4xx" count={count4xx} color="#F87171" active={filter === '4xx'} onClick={() => setFilter('4xx')} />
                            <StatPill label="5xx" count={count5xx} color="#FF8C5A" active={filter === '5xx'} onClick={() => setFilter('5xx')} />
                            {countErr > 0 && (
                                <StatPill label="Errores" count={countErr} color="#94A3B8" active={filter === 'error'} onClick={() => setFilter('error')} />
                            )}
                        </div>

                        {/* Buscador */}
                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Filtrar por URL o título…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 10, padding: '11px 14px 11px 40px',
                                    color: 'var(--text)', fontSize: '0.9rem',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                            />
                        </div>

                        {/* Tabla */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 14, overflow: 'hidden',
                        }}>
                            {/* Cabecera tabla */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '48px 1fr 90px 90px 36px',
                                gap: 0,
                                background: 'rgba(0,0,0,0.2)',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                padding: '10px 16px',
                                fontSize: '0.72rem', fontWeight: 700,
                                color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>
                                <span>#</span>
                                <span>URL / Título</span>
                                <span style={{ textAlign: 'center' }}>Estado</span>
                                <span style={{ textAlign: 'center' }}>Tipo</span>
                                <span />
                            </div>

                            {/* Filas */}
                            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                {filtered.length === 0 ? (
                                    <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                        No hay URLs que coincidan con el filtro.
                                    </div>
                                ) : filtered.map((u, i) => (
                                    <div
                                        key={u.url}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '48px 1fr 90px 90px 36px',
                                            alignItems: 'center',
                                            gap: 0,
                                            padding: '10px 16px',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* # */}
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                                            {u.index}
                                        </span>

                                        {/* URL y título */}
                                        <div style={{ minWidth: 0 }}>
                                            <a
                                                href={u.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontSize: '0.82rem', fontWeight: 500, color: '#93c5fd',
                                                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    textDecoration: 'none',
                                                }}
                                                title={u.url}
                                            >
                                                {u.url}
                                            </a>
                                            {u.title && (
                                                <span style={{
                                                    fontSize: '0.74rem', color: 'var(--text-subtle)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    display: 'block', marginTop: 1,
                                                }}>
                                                    {u.title}
                                                </span>
                                            )}
                                        </div>

                                        {/* Estado HTTP */}
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.73rem', fontWeight: 700,
                                                padding: '3px 8px', borderRadius: 6,
                                                background: statusBg(u.status),
                                                color: statusColor(u.status),
                                                border: `1px solid ${statusColor(u.status)}33`,
                                            }}>
                                                {statusLabel(u.status)}
                                            </span>
                                        </div>

                                        {/* Tipo */}
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)',
                                                padding: '2px 7px', borderRadius: 6,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                            }}>
                                                {u.type}
                                            </span>
                                        </div>

                                        {/* Copiar */}
                                        <div style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => copyUrl(u.url)}
                                                title="Copiar URL"
                                                style={{
                                                    background: 'none', border: 'none',
                                                    fontSize: '0.85rem', cursor: 'pointer',
                                                    color: copiedUrl === u.url ? '#34D399' : 'var(--text-subtle)',
                                                    transition: 'color 0.2s',
                                                    padding: 4,
                                                }}
                                            >
                                                {copiedUrl === u.url ? '✓' : '⎘'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer tabla */}
                            {crawling && (
                                <div style={{
                                    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(124,58,237,0.06)',
                                    fontSize: '0.8rem', color: '#c084fc',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                                    Crawleando… encontradas {urls.length} / {maxUrls} URLs objetivo
                                </div>
                            )}
                        </div>

                        {/* Copy all buttons */}
                        {done && (
                            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(urls.map(u => u.url).join('\n')); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8, padding: '8px 16px',
                                        fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    📋 Copiar todas las URLs ({urls.length})
                                </button>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(urls.filter(u => u.status >= 200 && u.status < 300).map(u => u.url).join('\n')); }}
                                    style={{
                                        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                                        borderRadius: 8, padding: '8px 16px',
                                        fontSize: '0.82rem', fontWeight: 600, color: '#34D399',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    ✅ Copiar solo URLs 200 OK ({count2xx})
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Estado inicial vacío */}
                {urls.length === 0 && !crawling && !error && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🕷️</div>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                            Ingresa un dominio y haz clic en <strong style={{ color: 'white' }}>Iniciar Crawl</strong>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                            El crawler seguirá todos los enlaces internos en tiempo real
                        </div>
                    </div>
                )}

                {/* Crawling inicial sin resultados aún */}
                {urls.length === 0 && crawling && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🕷️</div>
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                            Iniciando crawl en <strong style={{ color: 'white' }}>{detectedDomain}</strong>…
                        </div>
                    </div>
                )}
            </div>

            {/* Footer CTA */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                    ¿Quieres un análisis SEO profundo de tu sitio?{' '}
                    <a href="/" style={{ color: '#c084fc' }}>Obtener Diagnóstico SEO →</a>
                </p>
            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 10px; }
      `}</style>
        </>
    );
}
