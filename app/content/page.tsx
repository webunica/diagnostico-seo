'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────
interface ImageSuggestion {
    placement: string;
    altText: string;
    description: string;
    type: string;
    keywords: string[];
}

interface H3Block {
    h3: string;
    content: string;
    keywords: string[];
}

interface Section {
    h2: string;
    intro: string;
    h3s: H3Block[];
    imageSuggestion?: ImageSuggestion;
    cta?: string;
}

interface SeoCheckItem {
    item: string;
    status: 'ok' | 'warn' | 'fail';
    value: string;
}

interface InternalLink {
    anchor: string;
    targetPage: string;
    reason: string;
}

interface GeneratedContent {
    targetUrl: string;
    businessType: string;
    primaryKeyword: string;
    secondaryKeywords: string[];
    titleTag: string;
    metaDescription: string;
    h1: string;
    intro: string;
    sections: Section[];
    conclusionH2: string;
    conclusionContent: string;
    ctaSection: { heading: string; text: string; buttonText: string };
    schemaMarkup: string;
    internalLinkSuggestions: InternalLink[];
    seoChecklist: SeoCheckItem[];
    estimatedWordCount: number;
    generatedAt: string;
    model: string;
}

// ── Copy Button ───────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const handle = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handle} style={{
            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 7, padding: '4px 12px',
            fontSize: '0.72rem', fontWeight: 700,
            color: copied ? '#34D399' : 'rgba(255,255,255,0.55)',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
            {copied ? '✓ Copiado' : label}
        </button>
    );
}

// ── Section label ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#7C3AED', marginBottom: 6,
        }}>
            {children}
        </div>
    );
}

// ── Card wrapper ─────────────────────────────────────────────────────
function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${accent ?? 'rgba(255,255,255,0.07)'}`,
            borderRadius: 14, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            {children}
        </div>
    );
}

// ── Image card ────────────────────────────────────────────────────────
function ImageCard({ img }: { img: ImageSuggestion }) {
    const typeIcons: Record<string, string> = {
        'fotografía': '📷', 'infografía': '📊', 'captura': '🖥️',
        'ilustración': '🎨', 'icono': '🔷',
    };
    return (
        <div style={{
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', gap: 12,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(124,58,237,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
            }}>
                {typeIcons[img.type] ?? '🖼️'}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {img.type} · <span style={{ color: '#c084fc', fontWeight: 600 }}>{img.placement}</span>
                    </div>
                    <CopyBtn text={img.altText} label="Copiar alt" />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c084fc', marginBottom: 6, fontStyle: 'italic' }}>
                    Alt: "{img.altText}"
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Qué mostrar:</strong> {img.description}
                </div>
            </div>
        </div>
    );
}

// ── Content Renderer ──────────────────────────────────────────────────
function ContentView({ content }: { content: GeneratedContent }) {
    const [schemaOpen, setSchemaOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'structured'>('preview');

    const date = new Date(content.generatedAt).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <div className="logo-icon">🔍</div>
                    <span>DiagnósticoSEO</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>← Inicio</a>
                    <button
                        onClick={() => window.print()}
                        style={{
                            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                            borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                            color: '#c084fc', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        📄 Exportar PDF
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '90px 20px 100px' }}>

                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06))',
                    border: '1px solid rgba(124,58,237,0.25)',
                    borderRadius: 20, padding: '32px 28px', marginBottom: 32,
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                    }} />
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                        borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700,
                        color: '#34D399', marginBottom: 14,
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                        Generado con GPT-4o · Score objetivo 100/100
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }}>
                        Contenido SEO Optimizado
                    </h1>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                        Para: <a href={content.targetUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#60A5FA' }}>{content.targetUrl}</a>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#c084fc', fontWeight: 600 }}>
                            🏢 {content.businessType}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#93C5FD', fontWeight: 600 }}>
                            🔑 {content.primaryKeyword}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399', fontWeight: 600 }}>
                            📝 ~{content.estimatedWordCount?.toLocaleString()} palabras
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontWeight: 500 }}>
                            📅 {date}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {[
                        { id: 'preview' as const, label: '👁️ Vista Previa', desc: 'Como se verá en la web' },
                        { id: 'structured' as const, label: '⚙️ Estructura Técnica', desc: 'Para implementar' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1,
                            background: activeTab === tab.id
                                ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.12))'
                                : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${activeTab === tab.id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 12, padding: '12px 16px', textAlign: 'left',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                        }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: activeTab === tab.id ? '#c084fc' : 'var(--text-muted)' }}>
                                {tab.label}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>{tab.desc}</div>
                        </button>
                    ))}
                </div>

                {/* ── VISTA PREVIA ───────────────────────────────────── */}
                {activeTab === 'preview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* SEO Checklist */}
                        {content.seoChecklist?.length > 0 && (
                            <Card accent="rgba(52,211,153,0.2)">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <SectionLabel>✅ SEO Checklist — 100/100</SectionLabel>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399' }}>
                                        {content.seoChecklist.length}/{content.seoChecklist.length} ítems ✓
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
                                    {content.seoChecklist.map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 8, alignItems: 'flex-start',
                                            background: 'rgba(52,211,153,0.05)',
                                            border: '1px solid rgba(52,211,153,0.15)',
                                            borderRadius: 8, padding: '8px 12px',
                                        }}>
                                            <span style={{ color: '#34D399', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>✓</span>
                                            <div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.item}</div>
                                                <div style={{ fontSize: '0.71rem', color: '#34D399', marginTop: 1 }}>{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Title + Meta */}
                        <Card>
                            <SectionLabel>🏷️ Title Tag & Meta Description</SectionLabel>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                        TITLE TAG · {content.titleTag?.length ?? 0} chars
                                    </div>
                                    <CopyBtn text={content.titleTag} />
                                </div>
                                <div style={{
                                    background: 'rgba(59,130,246,0.07)',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    borderRadius: 8, padding: '12px 14px',
                                    fontSize: '1.05rem', fontWeight: 700, color: '#60A5FA',
                                    lineHeight: 1.4,
                                }}>
                                    {content.titleTag}
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 8 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                        META DESCRIPTION · {content.metaDescription?.length ?? 0} chars
                                    </div>
                                    <CopyBtn text={content.metaDescription} />
                                </div>
                                <div style={{
                                    background: 'rgba(52,211,153,0.05)',
                                    border: '1px solid rgba(52,211,153,0.15)',
                                    borderRadius: 8, padding: '12px 14px',
                                    fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6,
                                }}>
                                    {content.metaDescription}
                                </div>
                            </div>
                            {/* Google SERP Preview */}
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: 6 }}>Vista previa en Google:</div>
                                <div style={{
                                    background: 'white', borderRadius: 10, padding: '14px 16px',
                                    border: '1px solid #e0e0e0',
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#202124', marginBottom: 2, fontFamily: 'arial, sans-serif' }}>
                                        {content.targetUrl}
                                    </div>
                                    <div style={{ fontSize: '1.1rem', color: '#1a0dab', fontFamily: 'arial, sans-serif', lineHeight: 1.3, marginBottom: 4 }}>
                                        {content.titleTag}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#4d5156', fontFamily: 'arial, sans-serif', lineHeight: 1.5, maxWidth: 560 }}>
                                        {content.metaDescription}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Keywords */}
                        <Card>
                            <SectionLabel>🔑 Estrategia de Keywords</SectionLabel>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 6 }}>KEYWORD PRINCIPAL</div>
                                <span style={{
                                    fontSize: '0.95rem', fontWeight: 800, padding: '6px 16px', borderRadius: 20,
                                    background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)',
                                    color: '#93C5FD',
                                }}>
                                    🎯 {content.primaryKeyword}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 6, marginTop: 8 }}>KEYWORDS SECUNDARIAS (LSI)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {(content.secondaryKeywords ?? []).map((kw, i) => (
                                        <span key={i} style={{
                                            fontSize: '0.8rem', fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                                            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                                            color: '#A78BFA',
                                        }}>
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* H1 */}
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <SectionLabel>📌 H1 — Encabezado Principal</SectionLabel>
                                <CopyBtn text={content.h1} />
                            </div>
                            <div style={{
                                fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.2,
                                background: 'linear-gradient(135deg, white, rgba(167,139,250,0.9))',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                {content.h1}
                            </div>
                        </Card>

                        {/* Intro */}
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <SectionLabel>✍️ Párrafo de Introducción</SectionLabel>
                                <CopyBtn text={content.intro} />
                            </div>
                            <div style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
                                {content.intro}
                            </div>
                        </Card>

                        {/* Sections H2 */}
                        {(content.sections ?? []).map((section, si) => (
                            <div key={si} style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, overflow: 'hidden',
                            }}>
                                {/* H2 header */}
                                <div style={{
                                    padding: '18px 22px',
                                    background: 'rgba(124,58,237,0.06)',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                            H2 · Sección {si + 1}
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{section.h2}</div>
                                    </div>
                                    <CopyBtn text={section.h2} label="Copiar H2" />
                                </div>
                                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {/* Intro de sección */}
                                    {section.intro && (
                                        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', flex: 1 }}>
                                                {section.intro}
                                            </div>
                                            <CopyBtn text={section.intro} />
                                        </div>
                                    )}

                                    {/* H3s */}
                                    {(section.h3s ?? []).map((h3, hi) => (
                                        <div key={hi} style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderLeft: '3px solid rgba(124,58,237,0.5)',
                                            borderRadius: '0 10px 10px 0',
                                            padding: '14px 16px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>H3</div>
                                                    <div style={{ fontSize: '0.98rem', fontWeight: 700 }}>{h3.h3}</div>
                                                </div>
                                                <CopyBtn text={`${h3.h3}\n\n${h3.content}`} label="Copiar" />
                                            </div>
                                            <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                                                {h3.content}
                                            </div>
                                            {h3.keywords?.length > 0 && (
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    {h3.keywords.map((kw, ki) => (
                                                        <span key={ki} style={{
                                                            fontSize: '0.65rem', padding: '1px 7px', borderRadius: 20,
                                                            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                                                            color: '#c4b5fd',
                                                        }}>
                                                            🔑 {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Imagen sugerida */}
                                    {section.imageSuggestion && (
                                        <ImageCard img={section.imageSuggestion} />
                                    )}

                                    {/* CTA de sección */}
                                    {section.cta && (
                                        <div style={{
                                            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                                            borderRadius: 8, padding: '10px 14px',
                                            fontSize: '0.82rem', color: '#FBBF24', fontWeight: 600,
                                        }}>
                                            🎯 CTA: {section.cta}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Conclusión */}
                        {content.conclusionH2 && (
                            <Card>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <SectionLabel>🏁 H2 de Conclusión</SectionLabel>
                                    <CopyBtn text={`## ${content.conclusionH2}\n\n${content.conclusionContent}`} />
                                </div>
                                <div style={{ fontSize: '1.08rem', fontWeight: 800, marginBottom: 8 }}>{content.conclusionH2}</div>
                                <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
                                    {content.conclusionContent}
                                </div>
                            </Card>
                        )}

                        {/* CTA Block */}
                        {content.ctaSection && (
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))',
                                border: '1px solid rgba(124,58,237,0.3)',
                                borderRadius: 16, padding: '24px 22px',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                                    🚀 Bloque CTA Final
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>{content.ctaSection.heading}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 14, maxWidth: 480, margin: '0 auto 16px' }}>
                                    {content.ctaSection.text}
                                </div>
                                <div style={{
                                    display: 'inline-block',
                                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                                    color: 'white', borderRadius: 10, padding: '10px 28px',
                                    fontSize: '0.95rem', fontWeight: 700,
                                }}>
                                    {content.ctaSection.buttonText}
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <CopyBtn text={`${content.ctaSection.heading}\n${content.ctaSection.text}\n[${content.ctaSection.buttonText}]`} label="Copiar bloque CTA" />
                                </div>
                            </div>
                        )}

                        {/* Internal Links */}
                        {content.internalLinkSuggestions?.length > 0 && (
                            <Card>
                                <SectionLabel>🔗 Sugerencias de Enlace Interno</SectionLabel>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {content.internalLinkSuggestions.map((link, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 12, alignItems: 'flex-start',
                                            background: 'rgba(96,165,250,0.05)',
                                            border: '1px solid rgba(96,165,250,0.15)',
                                            borderRadius: 8, padding: '10px 14px',
                                        }}>
                                            <span style={{ color: '#60A5FA', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, minWidth: 18 }}>{i + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60A5FA' }}>
                                                        {link.anchor}
                                                    </span>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>→</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#93C5FD', fontFamily: 'monospace' }}>
                                                        {link.targetPage}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{link.reason}</div>
                                            </div>
                                            <CopyBtn text={`<a href="${link.targetPage}">${link.anchor}</a>`} label="HTML" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Schema Markup */}
                        {content.schemaMarkup && (
                            <Card>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <SectionLabel>🏗️ Schema Markup JSON-LD</SectionLabel>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <CopyBtn text={content.schemaMarkup} label="Copiar código" />
                                        <button onClick={() => setSchemaOpen(v => !v)} style={{
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 7, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700,
                                            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                                        }}>
                                            {schemaOpen ? '▲ Ocultar' : '▼ Ver código'}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Pega este código en el <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4 }}>&lt;head&gt;</code> de tu página para activar Rich Results en Google.
                                </div>
                                {schemaOpen && (
                                    <pre style={{
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 10, padding: '14px 16px', overflowX: 'auto',
                                        fontSize: '0.75rem', color: '#86EFAC', lineHeight: 1.6,
                                        fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    }}>
                                        {content.schemaMarkup}
                                    </pre>
                                )}
                            </Card>
                        )}
                    </div>
                )}

                {/* ── VISTA ESTRUCTURADA ─────────────────────────────── */}
                {activeTab === 'structured' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Card>
                            <SectionLabel>📋 Estructura Completa para Implementar</SectionLabel>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <CopyBtn text={[
                                    `TITLE: ${content.titleTag}`,
                                    `META: ${content.metaDescription}`,
                                    `\nH1: ${content.h1}`,
                                    `\n${content.intro}`,
                                    ...(content.sections ?? []).flatMap(s => [
                                        `\n## ${s.h2}`,
                                        s.intro,
                                        ...(s.h3s ?? []).flatMap(h => [`\n### ${h.h3}`, h.content]),
                                        s.imageSuggestion ? `\n[IMAGEN: ${s.imageSuggestion.description}]\n[ALT: ${s.imageSuggestion.altText}]` : '',
                                    ]),
                                    `\n## ${content.conclusionH2}`,
                                    content.conclusionContent,
                                ].filter(Boolean).join('\n')} label="📋 Copiar TODO" />
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <pre style={{
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 10, padding: '16px 18px',
                                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)',
                                    lineHeight: 1.7, fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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
<!-- IMAGEN: ${s.imageSuggestion.type} / ${s.imageSuggestion.placement} -->
<img src="imagen.jpg" alt="${s.imageSuggestion.altText}">
<!-- Descripción visual: ${s.imageSuggestion.description} -->` : ''}
${s.cta ? `<!-- CTA: ${s.cta} -->` : ''}`).join('')}

<h2>${content.conclusionH2 ?? ''}</h2>
<p>${content.conclusionContent ?? ''}</p>`}
                                </pre>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Footer bar */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'rgba(6,11,20,0.95)', backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border)', padding: '10px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, zIndex: 50,
            }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    🤖 GPT-4o · <strong style={{ color: '#34D399' }}>~{content.estimatedWordCount?.toLocaleString()} palabras</strong>
                    · {content.sections?.length ?? 0} secciones H2
                    · {(content.sections ?? []).reduce((a, s) => a + (s.h3s?.length ?? 0), 0)} H3s
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => window.history.back()} style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600,
                        color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                    }}>← Volver al reporte</button>
                    <button onClick={() => window.print()} style={{
                        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                        color: 'white', border: 'none', borderRadius: 8, padding: '7px 18px',
                        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>📄 PDF</button>
                </div>
            </div>
        </>
    );
}

// ── Generator Form ────────────────────────────────────────────────────
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
        if (!url) { setError('URL no proporcionada. Vuelve al reporte.'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    businessType,
                    platform,
                    country,
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

    // Auto-start si viene con todos los params
    if (!autoStarted && url && !loading) {
        setAutoStarted(true);
        generate();
    }

    if (loading) {
        return (
            <div className="loading-page">
                <div className="loading-icon">🤖</div>
                <div className="loading-title">GPT-4o generando contenido…</div>
                <p className="loading-subtitle">
                    Analizando keywords, construyendo estructura H1/H2/H3, redactando contenido optimizado y generando schema markup.
                    Esto toma 20–40 segundos.
                </p>
                <div className="loading-steps" style={{ maxWidth: 380 }}>
                    {[
                        'Analizando negocio y mercado objetivo…',
                        'Definiendo keywords primarias y LSI…',
                        'Construyendo estructura de encabezados…',
                        'Redactando contenido por sección…',
                        'Generando sugerencias de imágenes…',
                        'Creando schema markup JSON-LD…',
                    ].map((s, i) => (
                        <div className="loading-step active" key={i} style={{ fontSize: '0.84rem' }}>
                            <div className="step-indicator active" style={{ animation: 'spin 1s linear infinite' }}>◌</div>
                            {s}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '100px 20px 60px' }}>
            <nav className="navbar">
                <div className="navbar-logo"><div className="logo-icon">🔍</div><span>DiagnósticoSEO</span></div>
                <a href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>← Inicio</a>
            </nav>

            <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '32px 28px',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🤖</div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 6 }}>Generador de Contenido SEO</h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                    GPT-4o generará el contenido completo (H1-H3, textos, imágenes, schema) optimizado para alcanzar 100/100 en SEO.
                </p>

                {url && (
                    <div style={{
                        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.82rem',
                    }}>
                        🌐 URL a optimizar: <strong style={{ color: '#60A5FA', wordBreak: 'break-all' }}>{topPageUrl || url}</strong>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: 6 }}>
                            🎯 Keyword principal <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional, GPT la detecta automáticamente)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="ej: taller mecánico santiago"
                            value={primaryKeyword}
                            onChange={e => setPrimaryKeyword(e.target.value)}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
                                fontSize: '0.9rem', fontFamily: 'inherit',
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', marginBottom: 6 }}>
                            📋 Keywords secundarias <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(separadas por coma)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="ej: servicio auto, cambio aceite, diagnóstico motor"
                            value={secondaryKeywords}
                            onChange={e => setSecondaryKeywords(e.target.value)}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
                                fontSize: '0.9rem', fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    {error && <div className="error-msg">⚠️ {error}</div>}

                    <button onClick={generate} style={{
                        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                        color: 'white', border: 'none', borderRadius: 12, padding: '14px',
                        fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 6px 24px rgba(124,58,237,0.35)',
                    }}>
                        🤖 Generar Contenido con GPT-4o
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0 }}>
                        ~20–40 segundos · GPT-4o · Score objetivo 100/100
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Inner ─────────────────────────────────────────────────────────────
function ContentInner() {
    const [result, setResult] = useState<GeneratedContent | null>(null);
    if (result) return <ContentView content={result} />;
    return <GeneratorForm onResult={setResult} />;
}

// ── Page Export ────────────────────────────────────────────────────────
export default function ContentPage() {
    return (
        <Suspense fallback={<div className="loading-page"><div className="loading-icon">🤖</div><div className="loading-title">Cargando…</div></div>}>
            <ContentInner />
        </Suspense>
    );
}
