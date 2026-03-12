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
    }, [description, country, focus, email]);

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
        <main style={{ minHeight: '100vh', background: '#F8F7FF', color: '#0E0C2C', fontFamily: 'Montserrat, sans-serif' }}>
            {/* Navbar */}
            <nav className="navbar" style={{ background: '#673DE6', height: '80px', borderBottom: 'none', padding: '0 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div className="navbar-logo">
                    <a href="/" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', textDecoration: 'none' }}>SEO DIAGNOSTICO</a>
                </div>
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <a href="/topical-map" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Topical Map</a>
                    <a href="/crawl" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Crawler</a>
                    <a href="/dashboard/seo-wizard" style={{ fontSize: '0.9rem', color: '#D1FD1F', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>SEO Wizard ✨</a>
                    <a href="/" style={{
                        fontSize: '0.85rem', color: '#000000', background: '#D1FD1F',
                        padding: '12px 24px', fontWeight: 900, textTransform: 'uppercase',
                        textDecoration: 'none', borderRadius: '50px'
                    }}>Dashboard</a>
                </div>
            </nav>

            <div style={{ maxWidth: 1000, margin: '110px auto 60px', padding: '0 24px' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #673DE6 0%, #4F2CC9 100%)',
                    padding: '60px 48px',
                    borderRadius: '32px',
                    color: '#FFFFFF',
                    marginBottom: 48,
                    boxShadow: '0 20px 60px rgba(103, 61, 230, 0.15)',
                    textAlign: 'center'
                }}>
                    <span style={{
                        background: 'rgba(209, 253, 31, 0.2)', color: '#D1FD1F',
                        padding: '6px 16px', borderRadius: '50px',
                        fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase'
                    }}>AI Intelligence</span>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '16px 0', letterSpacing: '-0.02em' }}>Keyword Explorer</h1>
                    <p style={{ fontSize: '1.2rem', color: '#E0DAFF', fontWeight: 500, maxWidth: 700, margin: '0 auto' }}>
                        Describe tu negocio y nuestra IA generará una estrategia completa de palabras clave en segundos.
                    </p>
                </div>

                {/* Form Card */}
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px', padding: '48px',
                    marginBottom: 48, border: '1px solid #E0DAFF',
                    boxShadow: '0 10px 40px rgba(103, 61, 230, 0.05)'
                }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: 10, color: '#0E0C2C' }}>CORREO ELECTRÓNICO</label>
                                    <input
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F0EDFF', background: '#F8F7FF', fontWeight: 600, fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: 10, color: '#0E0C2C' }}>PAÍS / MERCADO</label>
                                    <select
                                        value={country}
                                        onChange={e => setCountry(e.target.value)}
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F0EDFF', background: '#F8F7FF', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: 10, color: '#0E0C2C' }}>DESCRIBE TU NEGOCIO O PRODUCTO</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ej: Agencia de marketing digital en Santiago enfocada en pymes del rubro salud..."
                                    rows={4}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F0EDFF', background: '#F8F7FF', fontWeight: 600, fontFamily: 'inherit', resize: 'none' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: '#673DE6', color: '#FFFFFF',
                                    border: 'none', borderRadius: '50px',
                                    padding: '20px', fontSize: '1.1rem', fontWeight: 900,
                                    cursor: 'pointer', textTransform: 'uppercase',
                                    marginTop: 10, boxShadow: '0 10px 30px rgba(103, 61, 230, 0.2)'
                                }}
                            >
                                {loading ? 'PROCESANDO ESTRATEGIA...' : '🔍 GENERAR ESTRATEGIA DE KEYWORDS'}
                            </button>
                        </div>
                    </form>
                    {error && <div style={{ color: '#FF4D4D', marginTop: 24, fontWeight: 800, textAlign: 'center' }}>⚠️ {error}</div>}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 800, color: '#673DE6' }}>Nuestra IA está trabajando...</div>
                        <LoadingSkeleton />
                    </div>
                )}

                {result && !loading && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        {/* Summary Bar */}
                        <div style={{
                            background: '#FFFFFF', padding: '32px', borderRadius: '24px',
                            border: '1px solid #E0DAFF', marginBottom: 32,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6C6893', marginBottom: 4 }}>NEGOCIO IDENTIFICADO</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#673DE6' }}>{result.businessType}</div>
                            </div>
                            <button
                                onClick={copyAll}
                                style={{
                                    background: copied ? '#D1FD1F' : '#F0EDFF',
                                    color: '#000000', border: 'none',
                                    padding: '12px 24px', borderRadius: '50px',
                                    fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem'
                                }}
                            >
                                {copied ? '✓ COPIADAS' : '📋 COPIAR TODAS'}
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
                            {TABS.map(tab => {
                                const count = result[tab.id]?.length ?? 0;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            background: isActive ? '#673DE6' : '#FFFFFF',
                                            color: isActive ? '#FFFFFF' : '#6C6893',
                                            border: '1px solid',
                                            borderColor: isActive ? '#673DE6' : '#E0DAFF',
                                            borderRadius: '50px', padding: '12px 24px',
                                            fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                            whiteSpace: 'nowrap', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                    >
                                        {tab.icon} {tab.label} <span style={{ opacity: 0.6 }}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Keywords Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                            {activeKeywords.map((kw, i) => (
                                <KeywordCard key={kw.keyword + i} kw={kw} index={i} />
                            ))}
                        </div>

                        {/* Footer Info */}
                        <div style={{ textAlign: 'center', marginTop: 80, padding: '40px 0', borderTop: '1px solid #E0DAFF', color: '#6C6893', fontWeight: 600 }}>
                            Investigación generada por {result.model} • {totalKeywords} keywords encontradas • <a href="/" style={{ color: '#673DE6', fontWeight: 800, textDecoration: 'none' }}>Audita tu sitio ahora →</a>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}
