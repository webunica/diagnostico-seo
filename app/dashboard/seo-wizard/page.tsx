'use client';

import { useState } from 'react';
import Link from 'next/link';

const T = {
    bg: '#F8F7FF', bgCard: '#FFFFFF', border: '#E0DAFF',
    borderMid: '#F0EDFF', text: '#0E0C2C', textMuted: '#6C6893',
    textSubtle: '#8F8BA8', brand: '#673DE6', brandDim: '#F2F0FF',
    accent: '#D1FD1F', green: '#22C55E', greenDim: '#F0FDF4',
    greenBorder: '#DCFCE7', blue: '#3B82F6', blueDim: '#EFF6FF',
    blueBorder: '#DBEAFE', yellow: '#F59E0B', yellowDim: '#FFFBEB',
    yellowBorder: '#FEF3C7', red: '#EF4444', redDim: '#FEF2F2',
    violet: '#4F2CC9', violetDim: 'rgba(79,44,201,0.06)',
    violetBorder: 'rgba(79,44,201,0.15)',
} as const;

function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [c, setC] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 2000); }}
            style={{
                background: c ? T.greenDim : '#F1F5F9', border: `1px solid ${c ? T.green : T.border}`,
                borderRadius: 7, padding: '5px 12px', fontSize: '0.72rem', fontWeight: 800,
                color: c ? T.green : T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            {c ? '✓ COPIADO' : label.toUpperCase()}
        </button>
    );
}

export default function SeoWizardPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);
    const [resultTab, setResultTab] = useState<'preview' | 'html' | 'schema'>('preview');

    // Form
    const [topic, setTopic] = useState('');
    const [primaryKeyword, setPrimaryKeyword] = useState('');
    const [secondaryKeywords, setSecondaryKeywords] = useState('');
    const [location, setLocation] = useState('España');
    const [targetAudience, setTargetAudience] = useState('');
    const [tone, setTone] = useState('Profesional');
    const [contentType, setContentType] = useState('Página de servicios');
    const [apiKey, setApiKey] = useState('');

    const nextStep = () => {
        if (step === 1 && (!topic || !primaryKeyword)) { setError('Tema y Keyword Principal son obligatorios.'); return; }
        setError(''); setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const generateContent = async () => {
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await fetch('/api/seo-wizard', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, primaryKeyword, secondaryKeywords, location, targetAudience, tone, contentType, apiKey })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al generar contenido');
            setResult(data); setStep(4);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const buildFullHTML = () => {
        if (!result) return '';
        let html = `<title>${result.titleTag}</title>\n`;
        html += `<meta name="description" content="${result.metaDescription}">\n`;
        if (result.ogTitle) html += `<meta property="og:title" content="${result.ogTitle}">\n`;
        if (result.ogDescription) html += `<meta property="og:description" content="${result.ogDescription}">\n`;
        html += `\n<h1>${result.h1}</h1>\n<p>${result.intro}</p>\n`;
        (result.sections ?? []).forEach((s: any) => {
            html += `\n<h2>${s.h2}</h2>\n<p>${s.intro}</p>\n`;
            (s.h3s ?? []).forEach((h: any) => { html += `<h3>${h.h3}</h3>\n<p>${h.content}</p>\n`; });
            if (s.imageSuggestion) html += `<img src="imagen.webp" alt="${s.imageSuggestion.altText}" loading="lazy">\n`;
        });
        if (result.faqSection?.length) {
            html += `\n<h2>Preguntas Frecuentes</h2>\n`;
            result.faqSection.forEach((f: any) => { html += `<h3>${f.question}</h3>\n<p>${f.answer}</p>\n`; });
        }
        html += `\n<h2>${result.conclusionH2 ?? ''}</h2>\n<p>${result.conclusionContent ?? ''}</p>\n`;
        if (result.schemaMarkup) html += `\n<script type="application/ld+json">\n${result.schemaMarkup}\n</script>`;
        return html;
    };

    const stepLabels = ['Temática', 'Audiencia', 'Generar', 'Resultado'];

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Montserrat, sans-serif' }}>
            {/* Navbar */}
            <nav style={{ background: T.brand, height: 80, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <a href="/" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFF', textDecoration: 'none' }}>SEO DIAGNOSTICO</a>
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <a href="/keywords" style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Keywords</a>
                    <a href="/crawl" style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Crawler</a>
                    <a href="/dashboard" style={{ fontSize: '0.85rem', color: '#000', background: T.accent, padding: '12px 24px', fontWeight: 900, borderRadius: 50, textDecoration: 'none' }}>Dashboard</a>
                </div>
            </nav>

            <div style={{ maxWidth: 900, margin: '50px auto 60px', padding: '0 24px' }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${T.brand} 0%, ${T.violet} 100%)`, padding: '50px 48px', borderRadius: 32, color: '#FFF', marginBottom: 40, textAlign: 'center', boxShadow: '0 20px 60px rgba(103,61,230,0.15)' }}>
                    <span style={{ background: 'rgba(209,253,31,0.2)', color: T.accent, padding: '6px 16px', borderRadius: 50, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Wizard IA</span>
                    <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '16px 0', letterSpacing: '-0.02em' }}>Creador de Páginas SEO 100/100</h1>
                    <p style={{ fontSize: '1.1rem', color: '#E0DAFF', fontWeight: 500, maxWidth: 600, margin: '0 auto' }}>
                        Genera estructura completa, contenido extenso, Schema, FAQs y HTML listo para publicar.
                    </p>
                </div>

                {/* Step Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                    {stepLabels.map((label, i) => {
                        const num = i + 1;
                        const isActive = step >= num;
                        return (
                            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', background: isActive ? T.brand : '#FFF',
                                    color: isActive ? '#FFF' : T.textMuted, border: `2px solid ${isActive ? T.brand : T.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem',
                                    transition: 'all 0.3s',
                                }}>{num}</div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? T.brand : T.textSubtle }}>{label}</span>
                                {i < 3 && <div style={{ width: 40, height: 2, background: step > num ? T.brand : T.border, borderRadius: 2 }} />}
                            </div>
                        );
                    })}
                </div>

                {/* Main Card */}
                <div style={{ background: '#FFF', border: `1px solid ${T.border}`, borderRadius: 24, padding: 40, boxShadow: '0 10px 40px rgba(103,61,230,0.05)' }}>

                    {error && <div style={{ color: T.red, background: T.redDim, padding: 14, borderRadius: 12, marginBottom: 24, fontSize: '0.9rem', fontWeight: 700 }}>⚠️ {error}</div>}

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Paso 1: Temática y Keywords</h2>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Tema de la Página *</label>
                                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: Servicios de Fontanería en Madrid"
                                    style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Keyword Principal *</label>
                                <input type="text" value={primaryKeyword} onChange={e => setPrimaryKeyword(e.target.value)} placeholder="Ej: fontanero madrid"
                                    style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg }} />
                                <small style={{ color: T.textSubtle, fontSize: '0.75rem', marginTop: 4, display: 'block' }}>La palabra clave principal por la que quieres posicionar en Google.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Keywords Secundarias (Opcional)</label>
                                <input type="text" value={secondaryKeywords} onChange={e => setSecondaryKeywords(e.target.value)} placeholder="Ej: urgencias 24h, desatascos baratos, reparación tuberías"
                                    style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={nextStep} style={{ background: T.brand, color: '#FFF', border: 'none', borderRadius: 50, padding: '16px 36px', fontSize: '1rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 6px 20px rgba(103,61,230,0.2)' }}>
                                    Siguiente →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Paso 2: Audiencia y Contexto</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Localidad / País</label>
                                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: Madrid, España"
                                        style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Público Objetivo</label>
                                    <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Ej: Propietarios de viviendas"
                                        style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Tono de Voz</label>
                                    <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg, cursor: 'pointer' }}>
                                        <option value="Profesional">Profesional y Confiable</option>
                                        <option value="Cercano">Cercano y Amigable</option>
                                        <option value="Técnico">Técnico y Experto</option>
                                        <option value="Urgente">Urgencia / Acción</option>
                                        <option value="Persuasivo">Persuasivo / Ventas</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Tipo de Contenido</label>
                                    <select value={contentType} onChange={e => setContentType(e.target.value)} style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg, cursor: 'pointer' }}>
                                        <option value="Página de servicios">Página de Servicios</option>
                                        <option value="Artículo de blog">Artículo de Blog</option>
                                        <option value="Landing page">Landing Page</option>
                                        <option value="Ficha de producto">Ficha de Producto</option>
                                        <option value="Guía completa">Guía Completa / Pilar</option>
                                        <option value="Página local">Página Local (SEO Local)</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={prevStep} style={{ background: '#F0EDFF', color: T.text, border: 'none', borderRadius: 50, padding: '16px 36px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>← Volver</button>
                                <button onClick={nextStep} style={{ background: T.brand, color: '#FFF', border: 'none', borderRadius: 50, padding: '16px 36px', fontSize: '1rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 6px 20px rgba(103,61,230,0.2)' }}>Siguiente →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Paso 3: Generación con IA</h2>
                            <div style={{ background: T.brandDim, borderRadius: 16, padding: 24, border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: T.brand, marginBottom: 12 }}>RESUMEN DE TU SOLICITUD</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.88rem' }}>
                                    <div><strong>Tema:</strong> {topic}</div>
                                    <div><strong>Keyword:</strong> {primaryKeyword}</div>
                                    <div><strong>Localidad:</strong> {location}</div>
                                    <div><strong>Tono:</strong> {tone}</div>
                                    <div><strong>Tipo:</strong> {contentType}</div>
                                    {targetAudience && <div><strong>Audiencia:</strong> {targetAudience}</div>}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>API Key OpenAI (opcional)</label>
                                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-... (si no envías, usa la del sistema)"
                                    style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${T.borderMid}`, outline: 'none', fontSize: '1rem', fontWeight: 600, background: T.bg }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={prevStep} disabled={loading} style={{ background: '#F0EDFF', color: T.text, border: 'none', borderRadius: 50, padding: '16px 36px', fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>← Volver</button>
                                <button onClick={generateContent} disabled={loading} style={{ background: T.accent, color: '#000', border: 'none', borderRadius: 50, padding: '16px 40px', fontSize: '1.05rem', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(209,253,31,0.3)', opacity: loading ? 0.6 : 1 }}>
                                    {loading ? 'GPT-4o Procesando... ⏳' : '🚀 GENERAR PÁGINA SEO'}
                                </button>
                            </div>
                            {loading && (
                                <div style={{ textAlign: 'center', marginTop: 16, color: T.brand, fontWeight: 700, fontSize: '0.95rem' }}>
                                    Creando estructura H2/H3, redactando contenido, generando FAQ y Schema... Esto toma ~30-60 segundos.
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4 — RESULTS */}
                    {step === 4 && result && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: T.green, margin: 0 }}>✅ Página Generada</h2>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                                        <span style={{ background: T.brandDim, color: T.brand, padding: '4px 12px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 800 }}>~{result.estimatedWordCount?.toLocaleString()} palabras</span>
                                        <span style={{ background: T.brandDim, color: T.brand, padding: '4px 12px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 800 }}>{result.structureStats?.h2s} H2 · {result.structureStats?.h3s} H3</span>
                                        <span style={{ background: T.greenDim, color: T.green, padding: '4px 12px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 800 }}>GPT-4o</span>
                                    </div>
                                </div>
                                <button onClick={() => { setStep(1); setResult(null); }} style={{ background: '#F0EDFF', border: 'none', borderRadius: 50, padding: '10px 24px', fontWeight: 800, cursor: 'pointer', color: T.brand }}>+ Crear otra</button>
                            </div>

                            {/* Tab switcher */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                {([{ id: 'preview' as const, label: '👁️ Vista Previa' }, { id: 'html' as const, label: '📋 HTML Listo' }, { id: 'schema' as const, label: '🏗️ Schema + SEO' }]).map(t => (
                                    <button key={t.id} onClick={() => setResultTab(t.id)} style={{
                                        flex: 1, padding: '14px', borderRadius: 12, border: `2px solid ${resultTab === t.id ? T.brand : T.border}`,
                                        background: resultTab === t.id ? T.brandDim : '#FFF', color: resultTab === t.id ? T.brand : T.textMuted,
                                        fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                                    }}>{t.label}</button>
                                ))}
                            </div>

                            {/* PREVIEW TAB */}
                            {resultTab === 'preview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* Meta */}
                                    <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase', marginBottom: 14 }}>Configuración Meta</div>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div><strong>Slug:</strong> <span style={{ color: T.textMuted }}>/{result.slug}</span></div>
                                                <CopyBtn text={`/${result.slug}`} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div><strong>Title ({result.titleLength || result.titleTag?.length} chars):</strong> <span style={{ color: T.blue }}>{result.titleTag}</span></div>
                                                <CopyBtn text={result.titleTag} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div><strong>Meta ({result.metaLength || result.metaDescription?.length} chars):</strong> <span style={{ color: T.textMuted }}>{result.metaDescription}</span></div>
                                                <CopyBtn text={result.metaDescription} />
                                            </div>
                                        </div>
                                        {/* Google SERP Preview */}
                                        <div style={{ marginTop: 16, background: '#FFF', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
                                            <div style={{ fontSize: '0.7rem', color: T.textSubtle, marginBottom: 6, textTransform: 'uppercase' }}>Vista previa en Google</div>
                                            <div style={{ fontSize: '0.78rem', color: '#3c4043', fontFamily: 'arial', marginBottom: 3 }}>example.com › {result.slug}</div>
                                            <div style={{ fontSize: '1.1rem', color: '#1a0dab', fontFamily: 'arial', marginBottom: 4, fontWeight: 500 }}>{result.titleTag}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#4d5156', fontFamily: 'arial', lineHeight: 1.5 }}>{result.metaDescription}</div>
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    {result.secondaryKeywords?.length > 0 && (
                                        <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase', marginBottom: 10 }}>🔑 Keywords Estratégicas</div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ background: T.blueDim, color: T.blue, padding: '5px 14px', borderRadius: 50, fontSize: '0.85rem', fontWeight: 800, border: `1px solid ${T.blueBorder}` }}>🎯 {result.primaryKeyword}</span>
                                                {result.secondaryKeywords.map((kw: string, i: number) => (
                                                    <span key={i} style={{ background: T.violetDim, color: T.violet, padding: '4px 12px', borderRadius: 50, fontSize: '0.8rem', fontWeight: 700, border: `1px solid ${T.violetBorder}` }}>{kw}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* H1 + Intro */}
                                    <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase' }}>📌 H1 + Introducción</div>
                                            <CopyBtn text={`${result.h1}\n\n${result.intro}`} />
                                        </div>
                                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 16, background: `linear-gradient(135deg, ${T.text}, ${T.brand})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{result.h1}</h1>
                                        <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: T.textMuted }}>{result.intro}</p>
                                    </div>

                                    {/* Sections */}
                                    {(result.sections ?? []).map((sec: any, si: number) => (
                                        <div key={si} style={{ background: '#FFF', borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                                            <div style={{ padding: '16px 24px', background: T.brandDim, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase' }}>H2 · Sección {si + 1}</div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{sec.h2}</div>
                                                </div>
                                                <CopyBtn text={sec.h2} label="Copiar H2" />
                                            </div>
                                            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                {sec.intro && <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: T.textMuted, margin: 0 }}>{sec.intro}</p>}
                                                {(sec.h3s ?? []).map((h3: any, hi: number) => (
                                                    <div key={hi} style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.brand}`, borderRadius: '0 12px 12px 0', padding: '16px 18px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                            <div><span style={{ fontSize: '0.6rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase' }}>H3</span> <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{h3.h3}</span></div>
                                                            <CopyBtn text={`${h3.h3}\n\n${h3.content}`} />
                                                        </div>
                                                        <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: T.textMuted }} dangerouslySetInnerHTML={{ __html: h3.content?.replace(/\n/g, '<br/>') || '' }} />
                                                        {h3.keywords?.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                                                {h3.keywords.map((kw: string, ki: number) => (
                                                                    <span key={ki} style={{ background: T.violetDim, color: T.violet, padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${T.violetBorder}` }}>🔑 {kw}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {sec.imageSuggestion && (
                                                    <div style={{ background: T.brandDim, border: `1px solid ${T.violetBorder}`, borderRadius: 12, padding: 14, display: 'flex', gap: 12 }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(103,61,230,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🖼️</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>{sec.imageSuggestion.type} · <span style={{ color: T.brand }}>{sec.imageSuggestion.placement}</span></div>
                                                            <div style={{ fontSize: '0.78rem', color: T.brand, fontStyle: 'italic', marginBottom: 4 }}>alt=&quot;{sec.imageSuggestion.altText}&quot;</div>
                                                            <div style={{ fontSize: '0.77rem', color: T.textMuted }}>{sec.imageSuggestion.description}</div>
                                                        </div>
                                                        <CopyBtn text={sec.imageSuggestion.altText} label="Alt" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* FAQ */}
                                    {result.faqSection?.length > 0 && (
                                        <div style={{ background: T.yellowDim, padding: 24, borderRadius: 16, border: `1px solid ${T.yellowBorder}` }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: 14 }}>❓ Preguntas Frecuentes (FAQ Schema)</div>
                                            {result.faqSection.map((faq: any, i: number) => (
                                                <div key={i} style={{ marginBottom: 16 }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4 }}>{faq.question}</div>
                                                    <div style={{ fontSize: '0.88rem', color: T.textMuted, lineHeight: 1.6 }}>{faq.answer}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Conclusion + CTA */}
                                    {result.conclusionH2 && (
                                        <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase', marginBottom: 10 }}>🏁 Conclusión</div>
                                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 10 }}>{result.conclusionH2}</h2>
                                            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: T.textMuted, margin: 0 }}>{result.conclusionContent}</p>
                                        </div>
                                    )}
                                    {result.ctaSection && (
                                        <div style={{ background: `linear-gradient(135deg, rgba(103,61,230,0.1), rgba(34,197,94,0.05))`, border: `1px solid ${T.violetBorder}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 10 }}>{result.ctaSection.heading}</div>
                                            <p style={{ fontSize: '0.92rem', color: T.textMuted, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>{result.ctaSection.text}</p>
                                            <div style={{ display: 'inline-block', background: T.brand, color: '#FFF', borderRadius: 50, padding: '14px 36px', fontSize: '1rem', fontWeight: 900 }}>{result.ctaSection.buttonText}</div>
                                        </div>
                                    )}

                                    {/* Internal Links */}
                                    {result.internalLinkSuggestions?.length > 0 && (
                                        <div style={{ background: T.blueDim, padding: 24, borderRadius: 16, border: `1px solid ${T.blueBorder}` }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.blue, textTransform: 'uppercase', marginBottom: 14 }}>🔗 Sugerencias de Enlace Interno</div>
                                            {result.internalLinkSuggestions.map((link: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: '0.88rem' }}>
                                                    <span style={{ fontWeight: 800, color: T.blue }}>{i + 1}.</span>
                                                    <span style={{ fontWeight: 700, color: T.blue }}>{link.anchor}</span>
                                                    <span style={{ color: T.textSubtle }}>→</span>
                                                    <code style={{ fontSize: '0.8rem', color: T.brand, background: T.brandDim, padding: '2px 8px', borderRadius: 4 }}>{link.targetPage}</code>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* SEO Checklist */}
                                    {result.seoChecklist?.length > 0 && (
                                        <div style={{ background: T.greenDim, padding: 24, borderRadius: 16, border: `1px solid ${T.greenBorder}` }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: 14 }}>✅ SEO Checklist — {result.seoChecklist.length}/{result.seoChecklist.length}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                                                {result.seoChecklist.map((item: any, i: number) => (
                                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FFF', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.greenBorder}` }}>
                                                        <span style={{ color: T.green, fontWeight: 800 }}>✓</span>
                                                        <div>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.item}</div>
                                                            <div style={{ fontSize: '0.7rem', color: T.green }}>{item.value}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HTML TAB */}
                            {resultTab === 'html' && (
                                <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase' }}>📋 HTML Completo — Listo para implementar</div>
                                        <CopyBtn text={buildFullHTML()} label="📋 Copiar TODO" />
                                    </div>
                                    <pre style={{
                                        background: '#0F172A', borderRadius: 12, padding: 20, color: '#E2E8F0',
                                        fontSize: '0.78rem', lineHeight: 1.75, fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto', maxHeight: 600,
                                    }}>{buildFullHTML()}</pre>
                                </div>
                            )}

                            {/* SCHEMA TAB */}
                            {resultTab === 'schema' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {result.schemaMarkup && (
                                        <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase' }}>🏗️ Schema Markup JSON-LD</div>
                                                <CopyBtn text={`<script type="application/ld+json">\n${result.schemaMarkup}\n</script>`} label="Copiar Schema" />
                                            </div>
                                            <p style={{ fontSize: '0.82rem', color: T.textMuted, marginBottom: 12 }}>Pega este código en el <code style={{ background: T.brandDim, padding: '2px 6px', borderRadius: 4, color: T.brand }}>&lt;head&gt;</code> de tu página para Rich Results en Google.</p>
                                            <pre style={{
                                                background: '#0F172A', borderRadius: 12, padding: 20, color: '#10B981',
                                                fontSize: '0.76rem', lineHeight: 1.65, fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto',
                                            }}>{result.schemaMarkup}</pre>
                                        </div>
                                    )}
                                    {result.ogTitle && (
                                        <div style={{ background: T.bg, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.brand, textTransform: 'uppercase', marginBottom: 12 }}>📱 Open Graph (Redes Sociales)</div>
                                            <div style={{ fontSize: '0.9rem', marginBottom: 8 }}><strong>og:title:</strong> {result.ogTitle}</div>
                                            <div style={{ fontSize: '0.9rem' }}><strong>og:description:</strong> {result.ogDescription}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
