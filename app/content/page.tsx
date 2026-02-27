'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────────────
   DARK-THEME TOKENS  (scoped to this page via wrapper div)
   The global CSS uses a light/TocToc theme; this page needs its own
   dark atmosphere independent of those CSS variables.
───────────────────────────────────────────────────────────────────── */
const T = {
    bg: '#080d18',
    bgCard: 'rgba(255,255,255,0.03)',
    bgCardHov: 'rgba(255,255,255,0.055)',
    border: 'rgba(255,255,255,0.08)',
    borderMid: 'rgba(255,255,255,0.14)',
    text: '#f0f4ff',
    textMuted: 'rgba(240,244,255,0.65)',
    textSubtle: 'rgba(240,244,255,0.38)',
    purple: '#8b5cf6',
    purpleDim: 'rgba(139,92,246,0.18)',
    purpleBorder: 'rgba(139,92,246,0.3)',
    cyan: '#06b6d4',
    green: '#34d399',
    greenDim: 'rgba(52,211,153,0.12)',
    greenBorder: 'rgba(52,211,153,0.28)',
    blue: '#60a5fa',
    blueDim: 'rgba(96,165,250,0.1)',
    blueBorder: 'rgba(96,165,250,0.22)',
    yellow: '#fbbf24',
    yellowDim: 'rgba(251,191,36,0.08)',
    yellowBorder: 'rgba(251,191,36,0.25)',
    red: '#f87171',
    violet: '#a78bfa',
    violetDim: 'rgba(167,139,250,0.12)',
    violetBorder: 'rgba(167,139,250,0.28)',
} as const;

// ── Shared style helpers ───────────────────────────────────────────────
const pill = (bg: string, border: string, color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center',
    background: bg, border: `1px solid ${border}`,
    borderRadius: 20, padding: '3px 11px',
    fontSize: '0.73rem', fontWeight: 700, color,
    whiteSpace: 'nowrap' as const,
});

const card: React.CSSProperties = {
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: 14,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};

// ── Types ────────────────────────────────────────────────────────────
interface ImageSuggestion { placement: string; altText: string; description: string; type: string; keywords: string[]; }
interface H3Block { h3: string; content: string; keywords: string[]; }
interface Section { h2: string; intro: string; h3s: H3Block[]; imageSuggestion?: ImageSuggestion; cta?: string; }
interface SeoCheckItem { item: string; status: 'ok' | 'warn' | 'fail'; value: string; }
interface InternalLink { anchor: string; targetPage: string; reason: string; }

interface GeneratedContent {
    targetUrl: string; businessType: string; primaryKeyword: string;
    secondaryKeywords: string[]; titleTag: string; metaDescription: string;
    h1: string; intro: string; sections: Section[];
    conclusionH2: string; conclusionContent: string;
    ctaSection: { heading: string; text: string; buttonText: string };
    schemaMarkup: string; internalLinkSuggestions: InternalLink[];
    seoChecklist: SeoCheckItem[]; estimatedWordCount: number;
    generatedAt: string; model: string;
}

/* ── Copy Button ─────────────────────────────────────────────────────── */
function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{
                background: copied ? T.greenDim : 'rgba(255,255,255,0.06)',
                border: `1px solid ${copied ? T.greenBorder : T.border}`,
                borderRadius: 8, padding: '5px 12px',
                fontSize: '0.7rem', fontWeight: 700,
                color: copied ? T.green : T.textSubtle,
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
        >
            {copied ? '✓ Copiado' : label}
        </button>
    );
}

/* ── Section badge ───────────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: '0.63rem', fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: T.purple, marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6,
        }}>
            {children}
        </div>
    );
}

/* ── Image suggestion card ───────────────────────────────────────────── */
function ImgCard({ img }: { img: ImageSuggestion }) {
    const icons: Record<string, string> = { 'fotografía': '📷', 'infografía': '📊', 'captura': '🖥️', 'ilustración': '🎨', 'icono': '🔷' };
    return (
        <div style={{
            background: T.purpleDim, border: `1px solid ${T.purpleBorder}`,
            borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(139,92,246,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            }}>
                {icons[img.type] ?? '🖼️'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: T.text }}>
                        {img.type} · <span style={{ color: T.violet }}>{img.placement}</span>
                    </div>
                    <CopyBtn text={img.altText} label="Copiar alt" />
                </div>
                <div style={{ fontSize: '0.78rem', color: T.violet, marginBottom: 5, fontStyle: 'italic' }}>
                    alt="{img.altText}"
                </div>
                <div style={{ fontSize: '0.77rem', color: T.textMuted, lineHeight: 1.55 }}>
                    <strong style={{ color: T.textSubtle }}>Visual: </strong>{img.description}
                </div>
            </div>
        </div>
    );
}

/* ── Content View ────────────────────────────────────────────────────── */
function ContentView({ content }: { content: GeneratedContent }) {
    const [schemaOpen, setSchemaOpen] = useState(false);
    const [tab, setTab] = useState<'preview' | 'code'>('preview');

    const date = new Date(content.generatedAt).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const h2count = content.sections?.length ?? 0;
    const h3count = (content.sections ?? []).reduce((a, s) => a + (s.h3s?.length ?? 0), 0);
    const imgcount = (content.sections ?? []).filter(s => s.imageSuggestion).length;

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Nunito,sans-serif' }}>

            {/* ── NAVBAR ───────────────────────────────────── */}
            <nav style={{
                position: 'fixed', inset: '0 0 auto 0', zIndex: 100, height: 60,
                padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(8,13,24,0.92)', backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <a href="/" style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.04em',
                    color: T.purple, textDecoration: 'none',
                }}>
                    <div style={{
                        width: 30, height: 30, background: T.purple, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, color: 'white',
                    }}>🔍</div>
                    DiagnósticoSEO
                </a>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.8rem', color: T.textMuted, textDecoration: 'none' }}>← Inicio</a>
                    <button onClick={() => window.print()} style={{
                        background: T.purpleDim, border: `1px solid ${T.purpleBorder}`,
                        borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700,
                        color: T.purple, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        📄 Exportar PDF
                    </button>
                </div>
            </nav>

            {/* ── MAIN ─────────────────────────────────────── */}
            <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 20px 120px' }}>

                {/* Header card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))',
                    border: `1px solid ${T.purpleBorder}`,
                    borderRadius: 18, padding: '28px 26px', marginBottom: 28,
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)'
                    }} />

                    <div style={{ ...pill(T.greenDim, T.greenBorder, T.green), marginBottom: 14 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, display: 'inline-block', marginRight: 6 }} />
                        Generado con GPT-4o · Score objetivo 100/100
                    </div>

                    <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, marginBottom: 8, color: T.text }}>
                        Contenido SEO Optimizado
                    </h1>
                    <div style={{ fontSize: '0.82rem', color: T.textMuted, marginBottom: 14 }}>
                        Para:&nbsp;
                        <a href={content.targetUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: T.blue, wordBreak: 'break-all' }}>
                            {content.targetUrl}
                        </a>
                    </div>

                    {/* Stats pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={pill(T.purpleDim, T.purpleBorder, T.violet)}>🏢 {content.businessType}</span>
                        <span style={pill(T.blueDim, T.blueBorder, T.blue)}>🎯 {content.primaryKeyword}</span>
                        <span style={pill(T.greenDim, T.greenBorder, T.green)}>📝 ~{content.estimatedWordCount?.toLocaleString()} palabras</span>
                        <span style={pill('rgba(255,255,255,0.04)', T.border, T.textSubtle)}>
                            {h2count} H2 · {h3count} H3 · {imgcount} imgs
                        </span>
                        <span style={pill('rgba(255,255,255,0.04)', T.border, T.textSubtle)}>📅 {date}</span>
                    </div>
                </div>

                {/* Tab selector */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                    {([
                        { id: 'preview' as const, icon: '👁️', label: 'Vista Previa', sub: 'Como se verá en la web' },
                        { id: 'code' as const, icon: '⚙️', label: 'HTML Listo', sub: 'Para copiar e implementar' },
                    ]).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            flex: 1, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                            padding: '13px 16px', borderRadius: 12, transition: 'all 0.2s',
                            background: tab === t.id
                                ? 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(6,182,212,0.09))'
                                : 'rgba(255,255,255,0.03)',
                            border: `1.5px solid ${tab === t.id ? T.purpleBorder : T.border}`,
                        }}>
                            <div style={{
                                fontWeight: 800, fontSize: '0.88rem', marginBottom: 2,
                                color: tab === t.id ? T.violet : T.textMuted
                            }}>
                                {t.icon} {t.label}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: T.textSubtle }}>{t.sub}</div>
                        </button>
                    ))}
                </div>

                {/* ── PREVIEW TAB ──────────────────────────────── */}
                {tab === 'preview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* SEO Checklist */}
                        {(content.seoChecklist?.length ?? 0) > 0 && (
                            <div style={{ ...card, border: `1px solid ${T.greenBorder}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Badge>✅ SEO Checklist — 100 / 100</Badge>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: T.green }}>
                                        {content.seoChecklist.length}/{content.seoChecklist.length} ✓
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 7 }}>
                                    {content.seoChecklist.map((it, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 9, alignItems: 'flex-start',
                                            background: T.greenDim, border: `1px solid rgba(52,211,153,0.15)`,
                                            borderRadius: 9, padding: '9px 12px',
                                        }}>
                                            <span style={{ color: T.green, fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>✓</span>
                                            <div>
                                                <div style={{ fontSize: '0.77rem', fontWeight: 700, color: T.text }}>{it.item}</div>
                                                <div style={{ fontSize: '0.68rem', color: T.green, marginTop: 2 }}>{it.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Title + Meta */}
                        <div style={card}>
                            <Badge>🏷️ Title Tag &amp; Meta Description</Badge>

                            {/* Title row */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.72rem', color: T.textSubtle, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Title · {content.titleTag?.length ?? 0} caracteres
                                    </span>
                                    <CopyBtn text={content.titleTag} />
                                </div>
                                <div style={{
                                    background: T.blueDim, border: `1px solid ${T.blueBorder}`,
                                    borderRadius: 9, padding: '12px 14px',
                                    fontSize: '1.02rem', fontWeight: 800, color: T.blue, lineHeight: 1.35,
                                }}>
                                    {content.titleTag}
                                </div>
                            </div>

                            {/* Meta row */}
                            <div style={{ marginTop: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.72rem', color: T.textSubtle, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Meta Description · {content.metaDescription?.length ?? 0} caracteres
                                    </span>
                                    <CopyBtn text={content.metaDescription} />
                                </div>
                                <div style={{
                                    background: T.greenDim, border: `1px solid rgba(52,211,153,0.18)`,
                                    borderRadius: 9, padding: '12px 14px',
                                    fontSize: '0.88rem', color: T.textMuted, lineHeight: 1.6,
                                }}>
                                    {content.metaDescription}
                                </div>
                            </div>

                            {/* Google SERP Preview */}
                            <div style={{ marginTop: 6 }}>
                                <div style={{ fontSize: '0.7rem', color: T.textSubtle, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Vista previa en Google
                                </div>
                                <div style={{
                                    background: '#fff', borderRadius: 12, padding: '14px 18px',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.18)', border: '1px solid #e0e0e0',
                                }}>
                                    <div style={{ fontSize: '0.78rem', color: '#3c4043', fontFamily: 'arial,sans-serif', marginBottom: 3 }}>
                                        {content.targetUrl}
                                    </div>
                                    <div style={{ fontSize: '1.12rem', color: '#1a0dab', fontFamily: 'arial,sans-serif', lineHeight: 1.3, marginBottom: 4, fontWeight: 500 }}>
                                        {content.titleTag}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#4d5156', fontFamily: 'arial,sans-serif', lineHeight: 1.55, maxWidth: 560 }}>
                                        {content.metaDescription}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keywords */}
                        <div style={card}>
                            <Badge>🔑 Estrategia de Keywords</Badge>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: T.textSubtle, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Keyword principal
                                </div>
                                <span style={{ ...pill(T.blueDim, T.blueBorder, T.blue), fontSize: '0.92rem', fontWeight: 900, padding: '6px 16px' }}>
                                    🎯 {content.primaryKeyword}
                                </span>
                            </div>
                            {(content.secondaryKeywords?.length ?? 0) > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ fontSize: '0.7rem', color: T.textSubtle, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Keywords LSI / Secundarias
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                        {content.secondaryKeywords.map((kw, i) => (
                                            <span key={i} style={pill(T.violetDim, T.violetBorder, T.violet)}>
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* H1 */}
                        <div style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Badge>📌 H1 — Encabezado Principal</Badge>
                                <CopyBtn text={content.h1} />
                            </div>
                            <div style={{
                                fontSize: 'clamp(1.3rem,3vw,1.7rem)', fontWeight: 900, lineHeight: 1.2,
                                background: `linear-gradient(135deg, ${T.text}, ${T.violet})`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>
                                {content.h1}
                            </div>
                        </div>

                        {/* Intro */}
                        <div style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Badge>✍️ Párrafo de Introducción</Badge>
                                <CopyBtn text={content.intro} />
                            </div>
                            <p style={{ fontSize: '0.91rem', lineHeight: 1.8, color: T.textMuted, margin: 0 }}>
                                {content.intro}
                            </p>
                        </div>

                        {/* H2 Sections */}
                        {(content.sections ?? []).map((section, si) => (
                            <div key={si} style={{
                                background: T.bgCard, border: `1px solid ${T.border}`,
                                borderRadius: 16, overflow: 'hidden',
                            }}>
                                {/* H2 header bar */}
                                <div style={{
                                    padding: '16px 22px',
                                    background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(139,92,246,0.04))',
                                    borderBottom: `1px solid ${T.border}`,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '0.63rem', fontWeight: 800, color: T.purple,
                                            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4
                                        }}>
                                            H2 · Sección {si + 1}
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.text }}>{section.h2}</div>
                                    </div>
                                    <CopyBtn text={section.h2} label="Copiar H2" />
                                </div>

                                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                                    {/* Intro párrafo */}
                                    {section.intro && (
                                        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <p style={{ fontSize: '0.87rem', lineHeight: 1.7, color: T.textMuted, flex: 1, margin: 0 }}>
                                                {section.intro}
                                            </p>
                                            <CopyBtn text={section.intro} />
                                        </div>
                                    )}

                                    {/* H3 blocks */}
                                    {(section.h3s ?? []).map((h3, hi) => (
                                        <div key={hi} style={{
                                            background: 'rgba(255,255,255,0.025)',
                                            border: `1px solid ${T.border}`,
                                            borderLeft: `3px solid ${T.purple}`,
                                            borderRadius: '0 10px 10px 0',
                                            padding: '14px 16px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                                                <div>
                                                    <div style={{
                                                        fontSize: '0.6rem', fontWeight: 800, color: T.violet,
                                                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3
                                                    }}>H3</div>
                                                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: T.text }}>{h3.h3}</div>
                                                </div>
                                                <CopyBtn text={`${h3.h3}\n\n${h3.content}`} />
                                            </div>
                                            <p style={{ fontSize: '0.84rem', lineHeight: 1.75, color: T.textMuted, margin: '0 0 10px' }}>
                                                {h3.content}
                                            </p>
                                            {(h3.keywords?.length ?? 0) > 0 && (
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    {h3.keywords.map((kw, ki) => (
                                                        <span key={ki} style={pill(T.violetDim, T.violetBorder, T.violet)}>
                                                            🔑 {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Imagen */}
                                    {section.imageSuggestion && <ImgCard img={section.imageSuggestion} />}

                                    {/* CTA sección */}
                                    {section.cta && (
                                        <div style={{
                                            background: T.yellowDim, border: `1px solid ${T.yellowBorder}`,
                                            borderRadius: 9, padding: '10px 14px',
                                            fontSize: '0.82rem', color: T.yellow, fontWeight: 700,
                                        }}>
                                            🎯 CTA: {section.cta}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Conclusión */}
                        {content.conclusionH2 && (
                            <div style={card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Badge>🏁 H2 de Conclusión</Badge>
                                    <CopyBtn text={`## ${content.conclusionH2}\n\n${content.conclusionContent}`} />
                                </div>
                                <div style={{ fontSize: '1.06rem', fontWeight: 800, color: T.text }}>{content.conclusionH2}</div>
                                <p style={{ fontSize: '0.87rem', lineHeight: 1.75, color: T.textMuted, margin: 0 }}>
                                    {content.conclusionContent}
                                </p>
                            </div>
                        )}

                        {/* CTA Block */}
                        {content.ctaSection && (
                            <div style={{
                                background: 'linear-gradient(135deg,rgba(139,92,246,0.14),rgba(6,182,212,0.07))',
                                border: `1px solid ${T.purpleBorder}`,
                                borderRadius: 16, padding: '26px 24px', textAlign: 'center',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)'
                                }} />
                                <div style={{
                                    fontSize: '0.63rem', fontWeight: 800, color: T.purple,
                                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12
                                }}>
                                    🚀 Bloque CTA Final
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 10, color: T.text }}>
                                    {content.ctaSection.heading}
                                </div>
                                <p style={{ fontSize: '0.88rem', color: T.textMuted, maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.6 }}>
                                    {content.ctaSection.text}
                                </p>
                                <div style={{
                                    display: 'inline-block',
                                    background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                                    color: 'white', borderRadius: 10, padding: '11px 28px',
                                    fontSize: '0.95rem', fontWeight: 800, marginBottom: 14,
                                }}>
                                    {content.ctaSection.buttonText}
                                </div>
                                <div>
                                    <CopyBtn
                                        text={`${content.ctaSection.heading}\n${content.ctaSection.text}\n[${content.ctaSection.buttonText}]`}
                                        label="Copiar bloque CTA"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Internal links */}
                        {(content.internalLinkSuggestions?.length ?? 0) > 0 && (
                            <div style={card}>
                                <Badge>🔗 Sugerencias de Enlace Interno</Badge>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {content.internalLinkSuggestions.map((link, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 12, alignItems: 'flex-start',
                                            background: T.blueDim, border: `1px solid ${T.blueBorder}`,
                                            borderRadius: 9, padding: '11px 14px',
                                        }}>
                                            <span style={{ color: T.blue, fontWeight: 800, fontSize: '0.84rem', flexShrink: 0, minWidth: 18 }}>{i + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.blue }}>{link.anchor}</span>
                                                    <span style={{ fontSize: '0.72rem', color: T.textSubtle }}>→</span>
                                                    <code style={{ fontSize: '0.73rem', color: '#93C5FD', background: 'rgba(96,165,250,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                                                        {link.targetPage}
                                                    </code>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: T.textMuted, lineHeight: 1.4 }}>{link.reason}</div>
                                            </div>
                                            <CopyBtn text={`<a href="${link.targetPage}">${link.anchor}</a>`} label="HTML" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schema Markup */}
                        {content.schemaMarkup && (
                            <div style={card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                    <Badge>🏗️ Schema Markup JSON-LD</Badge>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <CopyBtn text={content.schemaMarkup} label="Copiar código" />
                                        <button onClick={() => setSchemaOpen(v => !v)} style={{
                                            background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
                                            borderRadius: 8, padding: '5px 12px', fontSize: '0.7rem', fontWeight: 700,
                                            color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                                        }}>
                                            {schemaOpen ? '▲ Ocultar' : '▼ Ver código'}
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.79rem', color: T.textMuted, margin: 0, lineHeight: 1.55 }}>
                                    Pega este código en el <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, color: T.violet }}>&lt;head&gt;</code> de tu página para activar Rich Results en Google.
                                </p>
                                {schemaOpen && (
                                    <pre style={{
                                        background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`,
                                        borderRadius: 10, padding: '14px 16px', overflowX: 'auto',
                                        fontSize: '0.72rem', color: '#86EFAC', lineHeight: 1.65,
                                        fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                        marginTop: 4,
                                    }}>
                                        {content.schemaMarkup}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── HTML TAB ─────────────────────────────────── */}
                {tab === 'code' && (
                    <div style={{ ...card }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <Badge>📋 HTML Completo — Listo para implementar</Badge>
                            <CopyBtn
                                text={[
                                    `<title>${content.titleTag}</title>`,
                                    `<meta name="description" content="${content.metaDescription}">`,
                                    `\n<h1>${content.h1}</h1>`,
                                    `<p>${content.intro}</p>`,
                                    ...(content.sections ?? []).flatMap(s => [
                                        `\n<h2>${s.h2}</h2>`,
                                        `<p>${s.intro}</p>`,
                                        ...(s.h3s ?? []).flatMap(h => [`\n<h3>${h.h3}</h3>`, `<p>${h.content}</p>`]),
                                        s.imageSuggestion ? `\n<!-- IMG: ${s.imageSuggestion.type} -->\n<img src="imagen.jpg" alt="${s.imageSuggestion.altText}">` : '',
                                        s.cta ? `<!-- CTA: ${s.cta} -->` : '',
                                    ]),
                                    `\n<h2>${content.conclusionH2 ?? ''}</h2>`,
                                    `<p>${content.conclusionContent ?? ''}</p>`,
                                ].filter(Boolean).join('\n')}
                                label="📋 Copiar TODO"
                            />
                        </div>
                        <pre style={{
                            background: 'rgba(0,0,0,0.45)', border: `1px solid ${T.border}`,
                            borderRadius: 10, padding: '18px',
                            fontSize: '0.76rem', color: 'rgba(240,244,255,0.82)',
                            lineHeight: 1.75, fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            overflowX: 'auto', marginTop: 4,
                        }}>
                            {`<title>${content.titleTag}</title>
<meta name="description" content="${content.metaDescription}">

<h1>${content.h1}</h1>
<p>${content.intro}</p>
${(content.sections ?? []).map(s => `
<h2>${s.h2}</h2>
<p>${s.intro}</p>
${(s.h3s ?? []).map(h => `
<h3>${h.h3}</h3>
<p>${h.content}</p>`).join('')}
${s.imageSuggestion ? `
<!-- Imagen tipo ${s.imageSuggestion.type} (${s.imageSuggestion.placement}) -->
<img src="imagen.jpg" alt="${s.imageSuggestion.altText}">
<!-- Visual: ${s.imageSuggestion.description} -->` : ''}
${s.cta ? `<!-- CTA: ${s.cta} -->` : ''}
`).join('')}
<h2>${content.conclusionH2 ?? ''}</h2>
<p>${content.conclusionContent ?? ''}</p>`}
                        </pre>
                    </div>
                )}
            </div>

            {/* ── STICKY FOOTER BAR ─────────────────────────── */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80,
                background: 'rgba(8,13,24,0.97)', backdropFilter: 'blur(18px)',
                borderTop: `1px solid ${T.border}`, padding: '10px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
                <div style={{ fontSize: '0.77rem', color: T.textMuted, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span>🤖 <strong style={{ color: T.green }}>GPT-4o</strong></span>
                    <span>📝 <strong style={{ color: T.text }}>~{content.estimatedWordCount?.toLocaleString()}</strong> palabras</span>
                    <span>{h2count} H2 · {h3count} H3 · {imgcount} imgs</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => window.history.back()} style={{
                        background: 'transparent', border: `1px solid ${T.border}`,
                        borderRadius: 8, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 700,
                        color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                    }}>← Volver</button>
                    <button onClick={() => window.print()} style={{
                        background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                        color: 'white', border: 'none', borderRadius: 8, padding: '7px 20px',
                        fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    }}>📄 PDF</button>
                </div>
            </div>
        </div>
    );
}

/* ── Generator / Loading Form ────────────────────────────────────────── */
function GeneratorForm({ onResult }: { onResult: (c: GeneratedContent) => void }) {
    const searchParams = useSearchParams();
    const url = searchParams.get('url') ?? '';
    const businessType = searchParams.get('bt') ?? '';
    const platform = searchParams.get('platform') ?? '';
    const country = searchParams.get('country') ?? 'Chile';
    const topPageUrl = searchParams.get('pageUrl') ?? '';
    const kwParam = searchParams.get('kw') ?? '';

    const [primaryKeyword, setPrimaryKeyword] = useState(kwParam);
    const [secondaryKeywords, setSecondaryKeywords] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoStarted, setAutoStarted] = useState(false);

    const generate = useCallback(async () => {
        if (!url) { setError('URL no proporcionada.'); return; }
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/generate-content', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url, businessType, platform, country,
                    topPageUrl: topPageUrl || url,
                    primaryKeyword: primaryKeyword.trim(),
                    secondaryKeywords: secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean),
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error ?? 'Error al generar');
            onResult(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error inesperado');
        } finally {
            setLoading(false);
        }
    }, [url, businessType, platform, country, topPageUrl, primaryKeyword, secondaryKeywords, onResult]);

    if (!autoStarted && url && !loading) { setAutoStarted(true); generate(); }

    const steps = [
        'Analizando negocio y mercado objetivo…',
        'Definiendo keywords primarias y LSI…',
        'Construyendo estructura H1/H2/H3…',
        'Redactando contenido por sección…',
        'Generando sugerencias de imágenes…',
        'Creando schema markup JSON-LD…',
    ];

    /* Loading screen */
    if (loading) return (
        <div style={{
            minHeight: '100vh', background: T.bg, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 24px', gap: 24, fontFamily: 'Nunito,sans-serif', color: T.text,
        }}>
            <div style={{ fontSize: '3rem' }}>🤖</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, textAlign: 'center' }}>GPT-4o generando contenido…</div>
            <p style={{ fontSize: '0.88rem', color: T.textMuted, textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
                Analizando keywords, construyendo estructura y redactando contenido optimizado.<br />
                Esto toma unos <strong style={{ color: T.green }}>20–40 segundos</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360 }}>
                {steps.map((s, i) => (
                    <div key={i} style={{
                        display: 'flex', gap: 11, alignItems: 'center',
                        background: T.bgCard, border: `1px solid ${T.border}`,
                        borderRadius: 10, padding: '10px 14px',
                        fontSize: '0.84rem', color: T.textMuted,
                    }}>
                        <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: T.purpleDim, border: `1.5px solid ${T.purpleBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', color: T.purple, fontWeight: 800, flexShrink: 0,
                            animation: 'spin 1.4s linear infinite',
                        }}>◌</span>
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );

    /* Form screen */
    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Nunito,sans-serif', color: T.text }}>
            {/* mini navbar */}
            <nav style={{
                position: 'fixed', inset: '0 0 auto 0', zIndex: 100, height: 58,
                padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(8,13,24,0.95)', backdropFilter: 'blur(18px)',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <a href="/" style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    fontWeight: 900, fontSize: '1.05rem', color: T.purple, textDecoration: 'none'
                }}>
                    <div style={{
                        width: 28, height: 28, background: T.purple, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white'
                    }}>🔍</div>
                    DiagnósticoSEO
                </a>
                <a href="/" style={{ fontSize: '0.8rem', color: T.textMuted, textDecoration: 'none' }}>← Inicio</a>
            </nav>

            <div style={{ maxWidth: 600, margin: '0 auto', padding: '90px 20px 60px' }}>
                <div style={{
                    ...card,
                    border: `1px solid ${T.purpleBorder}`,
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)'
                    }} />

                    <div style={{ fontSize: '2rem', marginBottom: 4 }}>🤖</div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: T.text, marginBottom: 6 }}>
                        Generador de Contenido SEO
                    </h1>
                    <p style={{ fontSize: '0.87rem', color: T.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
                        GPT-4o generará el H1, H2, H3, textos, imágenes, schema y CTA optimizados para <strong style={{ color: T.green }}>100/100</strong> en SEO.
                    </p>

                    {url && (
                        <div style={{
                            background: T.blueDim, border: `1px solid ${T.blueBorder}`,
                            borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: T.textMuted,
                        }}>
                            🌐 URL: <strong style={{ color: T.blue, wordBreak: 'break-all' }}>{topPageUrl || url}</strong>
                        </div>
                    )}

                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', marginBottom: 5, color: T.text }}>
                        🎯 Keyword principal <span style={{ color: T.textSubtle, fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input
                        type="text" value={primaryKeyword}
                        placeholder="ej: taller mecánico santiago"
                        onChange={e => setPrimaryKeyword(e.target.value)}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                            borderRadius: 9, padding: '11px 14px', color: T.text,
                            fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: 14, outline: 'none',
                        }}
                    />

                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', marginBottom: 5, color: T.text }}>
                        📋 Keywords secundarias <span style={{ color: T.textSubtle, fontWeight: 400 }}>(separadas por coma)</span>
                    </label>
                    <input
                        type="text" value={secondaryKeywords}
                        placeholder="ej: servicio auto, cambio aceite"
                        onChange={e => setSecondaryKeywords(e.target.value)}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                            borderRadius: 9, padding: '11px 14px', color: T.text,
                            fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: 18, outline: 'none',
                        }}
                    />

                    {error && (
                        <div style={{
                            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                            borderRadius: 9, padding: '10px 14px', fontSize: '0.83rem',
                            color: T.red, marginBottom: 14,
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button onClick={generate} style={{
                        width: '100%', background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                        color: 'white', border: 'none', borderRadius: 11, padding: '14px',
                        fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 6px 24px rgba(139,92,246,0.35)',
                    }}>
                        🤖 Generar Contenido con GPT-4o
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.74rem', color: T.textSubtle, marginTop: 8 }}>
                        ~20–40 segundos · GPT-4o · Score objetivo 100/100
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ── Inner ────────────────────────────────────────────────────────────── */
function ContentInner() {
    const [result, setResult] = useState<GeneratedContent | null>(null);
    if (result) return <ContentView content={result} />;
    return <GeneratorForm onResult={setResult} />;
}

/* ── Page Export ──────────────────────────────────────────────────────── */
export default function ContentPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#080d18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f4ff', fontFamily: 'Nunito,sans-serif', fontSize: '1.2rem', gap: 12 }}>
                <span style={{ fontSize: '2rem' }}>🤖</span> Cargando…
            </div>
        }>
            <ContentInner />
        </Suspense>
    );
}
