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
    if (s >= 200 && s < 300) return '#000000';
    if (s >= 300 && s < 400) return '#000000';
    if (s >= 400 && s < 500) return '#000000';
    if (s >= 500) return '#000000';
    return '#333333'; // error/timeout
}

function statusBg(s: number) {
    if (s >= 200 && s < 300) return '#FFFFFF';
    if (s >= 300 && s < 400) return '#f0f0f0';
    if (s >= 400 && s < 500) return '#eeeeee';
    if (s >= 500) return '#dddddd';
    return '#f0f0f0';
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
                background: active ? `${color}15` : 'rgba(0,0,0,0.04)',
                border: `1px solid ${active ? color : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 10, padding: '8px 18px',
                color: active ? color : '#52525B',
                fontWeight: active ? 700 : 600,
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
    }, [domain, maxUrls, email]);

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
        <main style={{ minHeight: '100vh', background: '#F8F7FF', color: '#0E0C2C', fontFamily: 'Montserrat, sans-serif' }}>
            {/* Navbar */}
            <nav className="navbar" style={{ background: '#673DE6', height: '80px', borderBottom: 'none', padding: '0 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div className="navbar-logo">
                    <a href="/" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', textDecoration: 'none' }}>SEO DIAGNOSTICO</a>
                </div>
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <a href="/keywords" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Keywords</a>
                    <a href="/" style={{
                        fontSize: '0.85rem', color: '#000000', background: '#D1FD1F',
                        padding: '12px 24px', fontWeight: 900, textTransform: 'uppercase',
                        textDecoration: 'none', borderRadius: '50px'
                    }}>Dashboard</a>
                </div>
            </nav>

            <div style={{ maxWidth: 1100, margin: '110px auto 60px', padding: '0 24px' }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #673DE6 0%, #4F2CC9 100%)',
                    padding: '60px 48px',
                    borderRadius: '32px',
                    color: '#FFFFFF',
                    marginBottom: 48,
                    boxShadow: '0 20px 60px rgba(103, 61, 230, 0.15)',
                    textAlign: 'center'
                }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: 16 }}>Technical Crawler</h1>
                    <p style={{ fontSize: '1.2rem', color: '#E0DAFF', fontWeight: 500, maxWidth: 600, margin: '0 auto 32px' }}>
                        Analiza la salud técnica de tu sitio web y descubre todas sus URLs en tiempo real.
                    </p>

                    {/* Crawl Form */}
                    <div style={{
                        background: '#FFFFFF', padding: '12px', borderRadius: '20px',
                        display: 'flex', gap: 10, maxWidth: 800, margin: '0 auto',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                        <input
                            type="text"
                            placeholder="https://tusitio.com"
                            value={domain}
                            onChange={e => setDomain(e.target.value)}
                            disabled={crawling}
                            style={{
                                flex: 1, padding: '16px 20px', borderRadius: '12px', border: 'none',
                                background: '#F8F7FF', fontSize: '1rem', fontWeight: 600, outline: 'none', color: '#0E0C2C'
                            }}
                        />
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={crawling}
                            style={{
                                width: '220px', padding: '16px 20px', borderRadius: '12px', border: 'none',
                                background: '#F8F7FF', fontSize: '1rem', fontWeight: 600, outline: 'none', color: '#0E0C2C'
                            }}
                        />
                        <button
                            onClick={handleCrawl}
                            disabled={crawling}
                            style={{
                                background: '#673DE6', color: '#FFFFFF', border: 'none',
                                borderRadius: '12px', padding: '0 32px', fontSize: '1rem',
                                fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase'
                            }}
                        >
                            {crawling ? 'SPIIDER...' : 'START'}
                        </button>
                    </div>
                    {error && <div style={{ color: '#FF4D4D', marginTop: 16, fontWeight: 700 }}>⚠️ {error}</div>}
                </div>

                {/* Results Control Panel */}
                {(urls.length > 0 || crawling) && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <StatPill label="TOTAL" count={urls.length} color="#673DE6" active={filter === 'all'} onClick={() => setFilter('all')} />
                                <StatPill label="2xx OK" count={count2xx} color="#22C55E" active={filter === '2xx'} onClick={() => setFilter('2xx')} />
                                <StatPill label="3xx REDIRECT" count={count3xx} color="#F59E0B" active={filter === '3xx'} onClick={() => setFilter('3xx')} />
                                <StatPill label="4xx ERROR" count={count4xx} color="#EF4444" active={filter === '4xx'} onClick={() => setFilter('4xx')} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {crawling && (
                                    <button onClick={stopCrawl} style={{ background: '#FF4D4D', color: '#FFFFFF', border: 'none', padding: '8px 20px', borderRadius: '50px', fontWeight: 800, cursor: 'pointer' }}>STOP</button>
                                )}
                                {done && (
                                    <button onClick={() => exportCSV(urls, detectedDomain)} style={{ background: '#D1FD1F', color: '#000000', border: 'none', padding: '8px 20px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}>EXPORT CSV</button>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <input
                                type="text"
                                placeholder="Filtrar por URL o título..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', padding: '16px 24px', borderRadius: '16px',
                                    border: '1px solid #E0DAFF', background: '#FFFFFF',
                                    fontSize: '0.95rem', fontWeight: 600, color: '#0E0C2C', outline: 'none'
                                }}
                            />
                        </div>

                        {/* Results List */}
                        <div style={{
                            background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E0DAFF',
                            overflow: 'hidden', boxShadow: '0 10px 40px rgba(103, 61, 230, 0.05)'
                        }}>
                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {filtered.length === 0 ? (
                                    <div style={{ padding: '60px', textAlign: 'center', color: '#6C6893', fontWeight: 600 }}>No hay datos para mostrar.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 1 }}>
                                        {filtered.map((u, i) => (
                                            <div key={u.url + i} style={{
                                                display: 'grid', gridTemplateColumns: '1fr 100px 140px 60px',
                                                alignItems: 'center', padding: '16px 24px', background: '#FFFFFF',
                                                borderBottom: '1px solid #F0EDFF', transition: 'background 0.2s'
                                            }} onMouseEnter={e => e.currentTarget.style.background = '#F8F7FF'} onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
                                                <div style={{ minWidth: 0, paddingRight: 20 }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0E0C2C', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.url}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6C6893', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.title || 'Sin título'}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '50px',
                                                        background: statusBg(u.status), color: statusColor(u.status)
                                                    }}>
                                                        {statusLabel(u.status)}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6C6893', textTransform: 'uppercase', textAlign: 'center' }}>{u.type}</div>
                                                <button onClick={() => copyUrl(u.url)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.4 }}>
                                                    {copiedUrl === u.url ? '✅' : 'Copy'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {urls.length === 0 && !crawling && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: '100px', marginBottom: 24, filter: 'grayscale(1)', opacity: 0.1 }}>🕷️</div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0E0C2C', marginBottom: 12 }}>Auditores de sitios en tiempo real</h2>
                        <p style={{ fontSize: '1.1rem', color: '#6C6893', maxWidth: 500, margin: '0 auto' }}>Descubre la arquitectura de tu sitio, identifica errores de rastreo y analiza cada URL al instante.</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #F8F7FF; }
                ::-webkit-scrollbar-thumb { background: #E0DAFF; border-radius: 10px; }
            `}</style>
        </main>
    );
}
