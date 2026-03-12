'use client';

import { useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────
interface TopicalArticle {
    title: string;
    keyword: string;
    intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
    estimatedSearchVolume: string;
}

interface TopicalCluster {
    title: string;
    description: string;
    articles: TopicalArticle[];
}

interface TopicalMapResult {
    pillar: {
        title: string;
        description: string;
    };
    clusters: TopicalCluster[];
    monetizationTips: string[];
    generatedAt: string;
    model: string;
    input?: {
        seedKeyword: string;
        country: string;
    };
}

const COUNTRIES = ['Chile', 'México', 'Argentina', 'Colombia', 'España', 'Perú', 'Ecuador', 'Venezuela'];

// ── Loading Skeleton ──────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
                height: 140, borderRadius: 16,
                background: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(103, 61, 230, 0.1)',
                animation: 'pulse 1.5s ease infinite',
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} style={{
                        height: 300, borderRadius: 16,
                        background: 'rgba(255,255,255,0.4)',
                        border: '1px solid rgba(103, 61, 230, 0.1)',
                        animation: `pulse 1.5s ease ${i * 0.1}s infinite`,
                    }} />
                ))}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function TopicalMapPage() {
    const [seedKeyword, setSeedKeyword] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('Chile');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TopicalMapResult | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
        if (!email.trim() || !isValidEmail(email.trim())) { setError('Ingresa un correo válido.'); return; }
        if (!seedKeyword.trim()) { setError('Ingresa una temática semilla central.'); return; }
        setLoading(true);

        try {
            const res = await fetch('/api/topical-map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seedKeyword: seedKeyword.trim(), country, email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error ?? 'Error al generar el Topical Map.');
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado.');
        } finally {
            setLoading(false);
        }
    }, [seedKeyword, country, email]);

    const copyAll = () => {
        if (!result) return;
        let text = `TOPICAL MAP: ${result.pillar.title}\n${result.pillar.description}\n\n`;
        result.clusters.forEach(c => {
            text += `[CLUSTER] ${c.title}\n`;
            text += `Descripción: ${c.description}\n`;
            c.articles.forEach(a => {
                text += `  - Título: ${a.title}\n`;
                text += `    Keyword: ${a.keyword} | Intención: ${a.intent} | Volumen est.: ${a.estimatedSearchVolume}\n`;
            });
            text += '\n';
        });
        text += `CONSEJOS DE MONETIZACIÓN:\n${result.monetizationTips.map(t => '- ' + t).join('\n')}\n`;

        navigator.clipboard.writeText(text);
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
                    <a href="/crawl" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Crawler</a>
                    <a href="/keywords" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Keywords</a>
                    <a href="/dashboard/seo-wizard" style={{ fontSize: '0.9rem', color: '#D1FD1F', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>SEO Wizard ✨</a>
                    <a href="/dashboard" style={{
                        fontSize: '0.85rem', color: '#000000', background: '#D1FD1F',
                        padding: '12px 24px', fontWeight: 900, textTransform: 'uppercase',
                        textDecoration: 'none', borderRadius: '50px'
                    }}>Dashboard</a>
                </div>
            </nav>

            <div style={{ maxWidth: 1200, margin: '110px auto 60px', padding: '0 24px' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '60px 48px',
                    borderRadius: '32px',
                    color: '#FFFFFF',
                    marginBottom: 48,
                    boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)',
                    textAlign: 'center'
                }}>
                    <span style={{
                        background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF',
                        padding: '6px 16px', borderRadius: '50px',
                        fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase'
                    }}>Estrategia Avanzada</span>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '16px 0', letterSpacing: '-0.02em' }}>Topical Map Generator</h1>
                    <p style={{ fontSize: '1.2rem', color: '#D1FAE5', fontWeight: 500, maxWidth: 700, margin: '0 auto' }}>
                        Dile a la IA tu temática principal y obtén una estructura jerárquica de contenido (Pilar y Clústeres) diseñada para dominar los resultados de Google.
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
                                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: 10, color: '#0E0C2C' }}>MERCADO</label>
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
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: 10, color: '#0E0C2C' }}>TEMÁTICA SEMILLA (Pilar Central)</label>
                                <input
                                    type="text"
                                    value={seedKeyword}
                                    onChange={e => setSeedKeyword(e.target.value)}
                                    placeholder="Ej: Inversión en Bienes Raíces, Adiestramiento Canino, Dieta Keto..."
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #F0EDFF', background: '#F8F7FF', fontWeight: 600, fontFamily: 'inherit' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: '#10b981', color: '#FFFFFF',
                                    border: 'none', borderRadius: '50px',
                                    padding: '20px', fontSize: '1.1rem', fontWeight: 900,
                                    cursor: 'pointer', textTransform: 'uppercase',
                                    marginTop: 10, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                {loading ? 'CREANDO MAPA TEMÁTICO...' : '🗺️ GENERAR TOPICAL MAP (AUTORIDAD)'}
                            </button>
                        </div>
                    </form>
                    {error && <div style={{ color: '#FF4D4D', marginTop: 24, fontWeight: 800, textAlign: 'center' }}>⚠️ {error}</div>}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>Estructurando Clústeres de Autoridad...</div>
                        <LoadingSkeleton />
                    </div>
                )}

                {result && !loading && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        {/* Summary Bar */}
                        <div style={{
                            background: '#FFFFFF', padding: '32px', borderRadius: '24px',
                            border: '1px solid #E0DAFF', marginBottom: 32,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', marginBottom: 4 }}>ESTRATEGIA GENERADA</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#6C6893' }}>
                                    Mapa temático creado para dominar <strong>{result.input?.seedKeyword}</strong> en {result.input?.country} con {result.clusters.length * 5} artículos nuevos.
                                </div>
                            </div>
                            <button
                                onClick={copyAll}
                                style={{
                                    background: copied ? '#673DE6' : '#F0EDFF',
                                    color: copied ? '#FFF' : '#000', border: 'none',
                                    padding: '12px 24px', borderRadius: '50px',
                                    fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                }}
                            >
                                {copied ? '✓ MAPA COPIADO' : '📋 COPIAR TOPICAL MAP'}
                            </button>
                        </div>

                        {/* Pillar Page */}
                        <div style={{
                            background: '#FFFFFF', borderRadius: '24px', padding: '40px',
                            border: '3px solid #673DE6', marginBottom: 40,
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, background: '#673DE6' }}></div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#673DE6', margin: '0 0 16px 0', textTransform: 'uppercase' }}>⭐️ Página Pilar Central</h2>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#0E0C2C', margin: '0 0 12px 0' }}>{result.pillar.title}</h3>
                            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#52525B', margin: 0 }}>{result.pillar.description}</p>

                            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(103, 61, 230, 0.05)', borderRadius: '12px' }}>
                                <strong style={{ color: '#673DE6', display: 'block', marginBottom: 8 }}>💡 Ideas de Lógica de Negocio / Monetización:</strong>
                                <ul style={{ margin: 0, paddingLeft: 20, color: '#0E0C2C', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                    {result.monetizationTips.map((tip, idx) => (
                                        <li key={idx} style={{ marginBottom: 4 }}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Clusters Grid */}
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0E0C2C', marginBottom: 24 }}>Clústeres de Apoyo (Páginas Hijas)</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                            {result.clusters.map((cluster, idx) => (
                                <div key={idx} style={{
                                    background: '#FFFFFF', borderRadius: '20px', padding: '32px',
                                    border: '1px solid #E0DAFF',
                                    boxShadow: '0 10px 30px rgba(103, 61, 230, 0.05)',
                                    display: 'flex', flexDirection: 'column'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ background: '#D1FD1F', color: '#000', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                                            {idx + 1}
                                        </div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0E0C2C', margin: 0, lineHeight: 1.2 }}>
                                            {cluster.title}
                                        </h3>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#6C6893', marginBottom: 24, lineHeight: 1.5 }}>
                                        {cluster.description}
                                    </p>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {cluster.articles.map((article, aIdx) => (
                                            <div key={aIdx} style={{
                                                background: '#F8F7FF', padding: '16px', borderRadius: '12px',
                                                borderLeft: `4px solid ${article.intent === 'transactional' || article.intent === 'commercial' ? '#10b981' : '#673DE6'}`
                                            }}>
                                                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#0E0C2C' }}>{article.title}</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.75rem', fontWeight: 600 }}>
                                                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '12px', color: '#52525B' }}>
                                                        🔑 {article.keyword}
                                                    </span>
                                                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '12px', color: '#52525B', textTransform: 'capitalize' }}>
                                                        🎯 {article.intent}
                                                    </span>
                                                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '12px', color: '#52525B' }}>
                                                        📊 Vol: {article.estimatedSearchVolume}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Info */}
                        <div style={{ textAlign: 'center', marginTop: 60, padding: '40px 0', borderTop: '1px solid #E0DAFF', color: '#6C6893', fontWeight: 600 }}>
                            Generado con {result.model} en base a arquitectura Hub-spoke • {result.clusters.length * 5} artículos propuestos
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}
