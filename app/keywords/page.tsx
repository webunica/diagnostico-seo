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
    informational: { label: 'Informacional', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    commercial: { label: 'Comercial', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    transactional: { label: 'Transaccional', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    navigational: { label: 'Navegacional', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
};

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string; dots: number }> = {
    low: { label: 'Baja', color: '#34D399', dots: 1 },
    medium: { label: 'Media', color: '#FBBF24', dots: 2 },
    high: { label: 'Alta', color: '#F87171', dots: 3 },
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
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            transition: 'border-color 0.2s, background 0.2s',
            animation: `fadeInUp 0.3s ease ${index * 0.04}s both`,
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.3)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(59,130,246,0.04)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
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
                        color: copied ? '#34D399' : 'var(--text-muted)',
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
                fontSize: '0.78rem', color: '#60A5FA',
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
    const [country, setCountry] = useState('Chile');
    const [focus, setFocus] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<KeywordsResult | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('headTerms');
    const [copied, setCopied] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
        if (!description.trim()) { setError('Describe tu negocio o servicio.'); return; }
        setLoading(true);

        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: description.trim(), country, focus }),
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
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <div className="logo-icon">🔍</div>
                    <span>DiagnósticoSEO</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Análisis SEO</a>
                    <div style={{
                        fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 20, color: '#34D399',
                    }}>
                        🆓 Keywords — Gratis
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                paddingTop: 90,
                background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.55) 0%, transparent 65%), #1a0038',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 52px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: 20, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
                        color: '#c084fc', marginBottom: 20,
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                        Potenciado por Llama 3.3 (Groq) · 100% Gratis
                    </div>

                    <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.7rem)', fontWeight: 900, marginBottom: 14, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'white' }}>
                        Investigación de{' '}
                        <span style={{ background: 'linear-gradient(135deg, #d8b4fe, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Palabras Clave</span>
                        {' '}con IA
                    </h1>
                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
                        Describe tu negocio y obtén 35–45 keywords estratégicas en segundos:
                        head terms, long-tail, preguntas, intención de compra y SEO local.
                    </p>
                </div>
            </section>

            {/* Main */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

                {/* Form Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 16, padding: '28px 28px',
                    marginBottom: 36, position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                    }} />

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: 18 }}>

                            {/* Descripción */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: 8, color: 'var(--text)' }}>
                                    🏢 Describe tu negocio, producto o servicio *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ej: Taller mecánico especializado en autos japoneses, service, diagnóstico y reparación de motor en Santiago..."
                                    rows={3}
                                    disabled={loading}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 10, padding: '12px 14px',
                                        color: 'var(--text)', fontSize: '0.92rem',
                                        fontFamily: 'inherit', resize: 'vertical',
                                        outline: 'none', lineHeight: 1.5,
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: 4 }}>
                                    {description.length}/500 chars — más detalle = mejores resultados
                                </div>
                            </div>

                            {/* País + Enfoque */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: 8, color: 'var(--text)' }}>
                                        🌎 País / Mercado objetivo
                                    </label>
                                    <select
                                        value={country}
                                        onChange={e => setCountry(e.target.value)}
                                        disabled={loading}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 10, padding: '11px 14px',
                                            color: 'var(--text)', fontSize: '0.9rem',
                                            fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: 8, color: 'var(--text)' }}>
                                        🎯 Enfoque de keywords
                                    </label>
                                    <select
                                        value={focus}
                                        onChange={e => setFocus(e.target.value)}
                                        disabled={loading}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 10, padding: '11px 14px',
                                            color: 'var(--text)', fontSize: '0.9rem',
                                            fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {FOCUS_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0f172a' }}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Botón */}
                            {error && (
                                <div className="error-msg">⚠️ {error}</div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: loading
                                        ? 'rgba(16,185,129,0.3)'
                                        : 'linear-gradient(135deg, #10B981, #3B82F6)',
                                    color: 'white', border: 'none',
                                    borderRadius: 12, padding: '14px',
                                    fontSize: '1rem', fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    boxShadow: loading ? 'none' : '0 6px 24px rgba(16,185,129,0.3)',
                                }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                                        Generando keywords con IA…
                                    </span>
                                ) : (
                                    '🔍 Generar Keywords — Gratis'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Loading */}
                {loading && (
                    <div>
                        <div style={{
                            textAlign: 'center', padding: '20px 0 28px',
                            color: 'var(--text-muted)', fontSize: '0.88rem',
                        }}>
                            <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: 8 }}>🧠</span>
                            Llama 3.3 está analizando tu negocio y generando keywords estratégicas…
                        </div>
                        <LoadingSkeleton />
                    </div>
                )}

                {/* Results */}
                {result && !loading && (
                    <div style={{ animation: 'fadeInUp 0.4s ease' }}>

                        {/* Summary bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            flexWrap: 'wrap', gap: 16, marginBottom: 24,
                            padding: '20px 22px',
                            background: 'rgba(16,185,129,0.05)',
                            border: '1px solid rgba(16,185,129,0.15)',
                            borderRadius: 14,
                        }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 600, marginBottom: 4 }}>
                                    🎯 Tipo de negocio identificado
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.businessType}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6, maxWidth: 460 }}>
                                    {result.summary}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={copyAll}
                                    style={{
                                        background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.12)'}`,
                                        borderRadius: 8, padding: '8px 16px',
                                        fontSize: '0.82rem', fontWeight: 600,
                                        color: copied ? '#34D399' : 'var(--text-muted)',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    {copied ? '✓ Copiadas' : `📋 Copiar todas (${totalKeywords})`}
                                </button>
                                <button
                                    onClick={() => exportCSV(result)}
                                    style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        border: '1px solid rgba(59,130,246,0.25)',
                                        borderRadius: 8, padding: '8px 16px',
                                        fontSize: '0.82rem', fontWeight: 600,
                                        color: '#60A5FA', cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    ⬇️ Exportar CSV
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex', gap: 6, marginBottom: 20,
                            overflowX: 'auto', paddingBottom: 4,
                        }}>
                            {TABS.map(tab => {
                                const count = ((result[tab.id] as KeywordItem[]) ?? []).length;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            background: isActive
                                                ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2))'
                                                : 'rgba(255,255,255,0.04)',
                                            border: isActive
                                                ? '1px solid rgba(59,130,246,0.4)'
                                                : '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 10, padding: '8px 16px',
                                            color: isActive ? 'var(--text)' : 'var(--text-muted)',
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer', fontFamily: 'inherit',
                                            whiteSpace: 'nowrap',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                        <span style={{
                                            background: isActive ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
                                            borderRadius: 20, padding: '1px 7px',
                                            fontSize: '0.72rem', fontWeight: 700,
                                            color: isActive ? '#60A5FA' : 'var(--text-subtle)',
                                        }}>
                                            {count}
                                        </span>
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
                        {result.negative?.length > 0 && (
                            <div style={{
                                marginTop: 32,
                                background: 'rgba(239,68,68,0.04)',
                                border: '1px solid rgba(239,68,68,0.15)',
                                borderRadius: 12, padding: '18px 20px',
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, color: '#FCA5A5' }}>
                                    🚫 Keywords Negativas (a excluir en Google Ads / filtrar en SEO)
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {result.negative.map((kw, i) => (
                                        <span key={i} style={{
                                            fontSize: '0.8rem', padding: '4px 12px', borderRadius: 20,
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            color: '#FCA5A5',
                                        }}>
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer info */}
                        <div style={{
                            textAlign: 'center', marginTop: 36, padding: '16px 0',
                            borderTop: '1px solid var(--border)',
                            fontSize: '0.78rem', color: 'var(--text-subtle)',
                        }}>
                            Generado con {result.model} · {totalKeywords} keywords en total ·{' '}
                            <a href="/" style={{ color: 'var(--blue)' }}>
                                ¿Quieres auditar el SEO de tu sitio? →
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        select option { background: #0a0f1e !important; color: white; }
      `}</style>
        </>
    );
}
