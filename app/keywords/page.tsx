'use client';

import { useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────
type Intent = 'informational' | 'commercial' | 'transactional' | 'navigational';
type Difficulty = 'low' | 'medium' | 'high';
type Tab = 'headTerms' | 'longTail' | 'questions' | 'commercial' | 'local';

interface KeywordItem {
    keyword: string;
    intent: Intent;
    difficulty: Difficulty;
    monthlyVolume: string;
    why: string;
    contentIdea: string;
}

interface KeywordsResult {
    businessType: string;
    summary: string;
    headTerms: KeywordItem[];
    longTail: KeywordItem[];
    questions: KeywordItem[];
    commercial: KeywordItem[];
    local: KeywordItem[];
    negative: string[];
    generatedAt: string;
    model: string;
    input: { description: string; country: string; focus: string };
}

// ── Config visual ─────────────────────────────────────────────────────
const INTENT_CONFIG: Record<Intent, { label: string; color: string; bg: string }> = {
    informational: { label: 'Informacional', color: '#000000', bg: '#f0f0f0' },
    commercial: { label: 'Comercial', color: '#000000', bg: '#eeeeee' },
    transactional: { label: 'Transaccional', color: '#000000', bg: '#dddddd' },
    navigational: { label: 'Navegacional', color: '#000000', bg: '#cccccc' },
};

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string; dots: number }> = {
    low: { label: 'Baja', color: '#000000', dots: 1 },
    medium: { label: 'Media', color: '#000000', dots: 2 },
    high: { label: 'Alta', color: '#000000', dots: 3 },
};

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'headTerms', label: 'Head Terms', icon: '🎯' },
    { id: 'longTail', label: 'Long-Tail', icon: '🔍' },
    { id: 'questions', label: 'Preguntas', icon: '❓' },
    { id: 'commercial', label: 'Comerciales', icon: '🛒' },
    { id: 'local', label: 'Local SEO', icon: '📍' },
];

const COUNTRIES = ['Chile', 'México', 'Argentina', 'Colombia', 'España', 'Perú', 'Ecuador', 'Venezuela'];
const FOCUS_OPTIONS = [
    { value: '', label: 'Todos los tipos' },
    { value: 'informational', label: 'Informacional (blog, guías)' },
    { value: 'commercial', label: 'Comercial (comparar, mejor)' },
    { value: 'transactional', label: 'Transaccional (comprar, contratar)' },
    { value: 'local', label: 'SEO Local (ciudad, barrio)' },
];

// ── Keyword Card ──────────────────────────────────────────────────────
function KeywordCard({ kw, index }: { kw: KeywordItem; index: number }) {
    const [copied, setCopied] = useState(false);
    const intent = INTENT_CONFIG[kw.intent] ?? INTENT_CONFIG.informational;
    const diff = DIFF_CONFIG[kw.difficulty] ?? DIFF_CONFIG.medium;

    const handleCopy = () => {
        navigator.clipboard.writeText(kw.keyword);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div style={{
            background: '#FFFFFF',
            border: '2px solid #000000',
            borderRadius: 0,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.2s',
            animation: `fadeInUp 0.3s ease ${index * 0.04}s both`,
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = '#FFFFFF';
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: '0.97rem', fontWeight: 700, color: 'var(--text)', flex: 1 }}>
                    {kw.keyword}
                </div>
                <button
                    onClick={handleCopy}
                    title="Copiar keyword"
                    style={{
                        background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 6, padding: '4px 10px',
                        fontSize: '0.72rem', fontWeight: 600,
                        color: copied ? '#059669' : '#52525B',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}
                >
                    {copied ? '✓ Copiado' : 'Copiar'}
                </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Intent */}
                <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: intent.bg, color: intent.color,
                    border: `1px solid ${intent.color}30`,
                }}>
                    {intent.label}
                </span>

                {/* Difficulty */}
                <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: `${diff.color}15`, color: diff.color,
                    border: `1px solid ${diff.color}30`,
                    display: 'flex', alignItems: 'center', gap: 3,
                }}>
                    {'●'.repeat(diff.dots)}{'○'.repeat(3 - diff.dots)} {diff.label}
                </span>

                {/* Volume */}
                <span style={{
                    fontSize: '0.7rem', fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    📊 {kw.monthlyVolume}
                </span>
            </div>

            {/* Why */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {kw.why}
            </div>

            {/* Content idea */}
            <div style={{
                fontSize: '0.78rem', color: '#1D4ED8',
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.12)',
                borderRadius: 6, padding: '7px 10px', lineHeight: 1.4,
            }}>
                💡 <strong>Contenido:</strong> {kw.contentIdea}
            </div>
        </div>
    );
}

// ── CSV Export ────────────────────────────────────────────────────────
function exportCSV(result: KeywordsResult) {
    const allKws: (KeywordItem & { category: string })[] = [
        ...(result.headTerms ?? []).map(k => ({ ...k, category: 'Head Term' })),
        ...(result.longTail ?? []).map(k => ({ ...k, category: 'Long-Tail' })),
        ...(result.questions ?? []).map(k => ({ ...k, category: 'Pregunta' })),
        ...(result.commercial ?? []).map(k => ({ ...k, category: 'Comercial' })),
        ...(result.local ?? []).map(k => ({ ...k, category: 'Local SEO' })),
    ];

    const header = 'Keyword,Categoría,Intención,Dificultad,Volumen/mes,Por qué,Idea de contenido';
    const rows = allKws.map(k =>
        [k.keyword, k.category, k.intent, k.difficulty, k.monthlyVolume, k.why, k.contentIdea]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
    );

    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `keywords-${result.businessType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
    link.click();
}

// ── Loading Skeleton ──────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                    height: 110, borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    animation: `pulse 1.5s ease ${i * 0.1}s infinite`,
                }} />
            ))}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function KeywordsPage() {
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('Chile');
    const [focus, setFocus] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<KeywordsResult | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('headTerms');
    const [copied, setCopied] = useState(false);

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
        if (!email.trim() || !isValidEmail(email.trim())) { setError('Ingresa un correo válido.'); return; }
        if (!description.trim()) { setError('Describe tu negocio o servicio.'); return; }
        setLoading(true);

        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: description.trim(), country, focus, email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error ?? 'Error al generar keywords.');
            setResult(data);
            setActiveTab('headTerms');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado.');
        } finally {
            setLoading(false);
        }
    }, [description, country, focus]);

    const activeKeywords = result ? ((result[activeTab] as KeywordItem[]) ?? []) : [];
    const totalKeywords = result
        ? (result.headTerms?.length ?? 0) + (result.longTail?.length ?? 0) +
        (result.questions?.length ?? 0) + (result.commercial?.length ?? 0) +
        (result.local?.length ?? 0)
        : 0;

    const copyAll = () => {
        if (!result) return;
        const allKws = [
            ...(result.headTerms ?? []), ...(result.longTail ?? []),
            ...(result.questions ?? []), ...(result.commercial ?? []),
            ...(result.local ?? []),
        ].map(k => k.keyword);
        navigator.clipboard.writeText(allKws.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#333333', fontFamily: 'Montserrat, sans-serif' }}>

            {/* Navbar */}
            <nav className="navbar" style={{ background: '#FFFFFF', borderBottom: '2px solid #000000', height: '70px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000000' }}>SEO Diagnostico</span>
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.9rem', color: '#333333', fontWeight: 900, textDecoration: 'none', textTransform: 'uppercase' }}>← Inicio</a>
                    <a href="/dashboard" style={{ fontSize: '0.9rem', color: '#333333', fontWeight: 900, textDecoration: 'none', textTransform: 'uppercase' }}>Portal API</a>
                    <div style={{ padding: '6px 16px', border: '2px solid #000000', color: '#000000', borderRadius: 0, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>Beta IA</div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                paddingTop: 120,
                paddingBottom: 80,
                textAlign: 'center',
                background: '#FFFFFF',
                borderBottom: '2px solid #000000',
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,105,0,0.08)', border: '1px solid rgba(194,65,12,0.15)',
                        borderRadius: 20, padding: '6px 16px', fontSize: '0.72rem', fontWeight: 800,
                        color: '#C2410C', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                        Potenciado por Llama 3.3 (Groq) · 100% Gratis
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', fontWeight: 900, marginBottom: 20, lineHeight: 1, color: '#000000', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
                        Investigación de{' '}
                        <span style={{ textDecoration: 'underline' }}>Palabras Clave</span>
                        {' '}con IA
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#52525B', maxWidth: 600, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
                        Describe tu negocio y obtén 35–45 keywords estratégicas en segundos:
                        head terms, long-tail, preguntas, intención de compra y SEO local.
                    </p>
                </div>
            </section>

            {/* Main */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

                {/* Form Card */}
                <div style={{
                    background: '#FFFFFF',
                    border: '3px solid #000000',
                    borderRadius: 0, padding: '40px',
                    marginBottom: 40, position: 'relative', overflow: 'hidden',
                }}>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: 18 }}>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: 8, color: '#101820' }}>
                                    📧 Tu Correo Electrónico *
                                </label>
                                <input
                                    type="email"
                                    placeholder="tu@negocio.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: '#FFFFFF',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        borderRadius: 10, padding: '12px 14px',
                                        color: '#101820', fontSize: '0.92rem',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: 8, color: '#101820' }}>
                                    🏢 Describe tu negocio, producto o servicio *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ej: Taller mecánico especializado en autos japoneses, service, diagnóstico y reparación de motor en Santiago…"
                                    rows={3}
                                    disabled={loading}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: '#FFFFFF',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        borderRadius: 10, padding: '12px 14px',
                                        color: '#101820', fontSize: '0.92rem',
                                        fontFamily: 'inherit', resize: 'vertical',
                                        lineHeight: 1.5,
                                        transition: 'border-color 0.2s',
                                    }}
                                />
                                <div style={{ fontSize: '0.74rem', color: '#71717A', marginTop: 4 }}>
                                    {description.length}/500 chars — más detalle = mejores resultados
                                </div>
                            </div>

                            {/* País + Enfoque */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: 8, color: '#101820' }}>
                                        🌎 País / Mercado objetivo
                                    </label>
                                    <select
                                        value={country}
                                        onChange={e => setCountry(e.target.value)}
                                        disabled={loading}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: '#FFFFFF',
                                            border: '1px solid rgba(0,0,0,0.15)',
                                            borderRadius: 10, padding: '11px 14px',
                                            color: '#101820', fontSize: '0.9rem',
                                            fontFamily: 'inherit', cursor: 'pointer',
                                        }}
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c} style={{ background: 'white', color: '#101820' }}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', marginBottom: 8, color: '#101820' }}>
                                        🎯 Enfoque de keywords
                                    </label>
                                    <select
                                        value={focus}
                                        onChange={e => setFocus(e.target.value)}
                                        disabled={loading}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: '#FFFFFF',
                                            border: '1px solid rgba(0,0,0,0.15)',
                                            borderRadius: 10, padding: '11px 14px',
                                            color: '#101820', fontSize: '0.9rem',
                                            fontFamily: 'inherit', cursor: 'pointer',
                                        }}
                                    >
                                        {FOCUS_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: 'white', color: '#101820' }}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Botón */}
                            {error && (
                                <div style={{ color: '#EF4444', fontSize: '0.85rem' }}>⚠️ {error}</div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: '#000000',
                                    color: 'white', border: 'none',
                                    borderRadius: 0, padding: '16px',
                                    fontSize: '1.1rem', fontWeight: 900,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {loading ? 'Generando...' : '🔍 Generar Keywords'}
                            </button>

                            <div style={{ fontSize: '0.7rem', color: '#71717A', textAlign: 'center' }}>
                                * Enviaremos el reporte extendido de palabras clave a tu correo corporativo.
                            </div>
                        </div>
                    </form>
                </div >

                {/* Loading */}
                {
                    loading && (
                        <div>
                            <div style={{ textAlign: 'center', padding: '20px 0 28px', color: '#52525B', fontSize: '0.88rem' }}>
                                <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: 8 }}>🧠</span>
                                Generando keywords estratégicas…
                            </div>
                            <LoadingSkeleton />
                        </div>
                    )
                }

                {/* Results */}
                {
                    result && !loading && (
                        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                            {/* Summary bar */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                flexWrap: 'wrap', gap: 16, marginBottom: 24, padding: '20px 22px',
                                background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                                borderRadius: 14,
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginBottom: 4 }}>🎯 NEGOCIO IDENTIFICADO</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{result.businessType}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#52525B', marginTop: 6, maxWidth: 460 }}>{result.summary}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={copyAll}
                                        style={{
                                            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.05)',
                                            border: `1px solid ${copied ? '#10B981' : 'rgba(0,0,0,0.1)'}`,
                                            borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700,
                                            color: copied ? '#059669' : '#101820', cursor: 'pointer', fontFamily: 'inherit',
                                        }}
                                    >
                                        {copied ? '✓ Copiadas' : `📋 Copiar todas (${totalKeywords})`}
                                    </button>
                                    <button
                                        onClick={() => exportCSV(result)}
                                        style={{
                                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                                            borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700,
                                            color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit',
                                        }}
                                    >
                                        ⬇️ Exportar CSV
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                                {TABS.map(tab => {
                                    const count = result ? ((result[tab.id] as KeywordItem[])?.length ?? 0) : 0;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                background: isActive ? 'rgba(255,105,0,0.1)' : 'rgba(0,0,0,0.03)',
                                                border: `1px solid ${isActive ? '#C2410C' : 'rgba(0,0,0,0.06)'}`,
                                                borderRadius: 10, padding: '8px 16px', color: isActive ? '#C2410C' : '#52525B',
                                                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                                            }}
                                        >
                                            {tab.icon} {tab.label} <span style={{ opacity: 0.6 }}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab label */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {activeTab === 'headTerms' && '🎯 Términos principales de alto volumen — base de tu estrategia SEO'}
                                    {activeTab === 'longTail' && '🔍 Keywords de nicho con menor competencia y mayor conversión'}
                                    {activeTab === 'questions' && '❓ Preguntas reales de usuarios — ideales para blog, FAQ y featured snippets'}
                                    {activeTab === 'commercial' && '🛒 Keywords con intención de compra o contratación — las más valiosas'}
                                    {activeTab === 'local' && '📍 Keywords con modificadores geográficos — clave para negocios físicos'}
                                </div>
                            </div>

                            {/* Keywords Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
                                {activeKeywords.map((kw, i) => (
                                    <KeywordCard key={kw.keyword + i} kw={kw} index={i} />
                                ))}
                            </div>

                            {/* Negative Keywords */}
                            {(result?.negative?.length ?? 0) > 0 && (
                                <div style={{ marginTop: 32, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '18px 20px' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 10, color: '#DC2626' }}>
                                        🚫 Keywords Negativas (a excluir)
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {result?.negative?.map((kw, i) => (
                                            <span key={i} style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626' }}>
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer info */}
                            <div style={{ textAlign: 'center', marginTop: 36, padding: '24px 0', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.8rem', color: '#71717A' }}>
                                Generado con {result?.model} · {totalKeywords} keywords en total ·{' '}
                                <a href="/" style={{ color: '#C2410C', fontWeight: 700 }}>Audita tu sitio ahora →</a>
                            </div>
                        </div>
                    )
                }
            </div >

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                select option { background: #0F172A !important; color: white; }
            `}</style>
        </div >
    );
}
