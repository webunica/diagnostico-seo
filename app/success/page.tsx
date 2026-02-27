'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────
interface Issue {
    title: string;
    description: string;
    fix?: string;
    impact?: string;
}

interface SectionData {
    score: number;
    status: 'good' | 'warning' | 'critical';
    summary: string;
    issues: Issue[];
    passes: string[];
}

interface ActionItem {
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    description: string;
    timeEstimate: string;
}

interface QuickWin {
    title: string;
    description: string;
    effort: string;
    impact: string;
}

interface MetaAnalysis {
    current: string;
    length: number;
    status: 'good' | 'warning' | 'critical';
    recommendation: string;
}

interface CurrentKeyword {
    keyword: string;
    source: string;
    relevance: 'alta' | 'media' | 'baja';
    assessment: string;
}

interface MissedKeyword {
    keyword: string;
    monthlyVolume: string;
    intent: 'informacional' | 'comercial' | 'transaccional' | 'local';
    opportunity: string;
}

interface KeywordAnalysis {
    currentKeywords: CurrentKeyword[];
    missedKeywords: MissedKeyword[];
    topicGaps: string[];
}

interface Competitor {
    name: string;
    url: string;
    type: 'directo' | 'indirecto';
    reason: string;
    estimatedStrengths: string;
    opportunity: string;
}

interface Report {
    score: number;
    businessType: string;
    platform: string;
    country?: string;
    summary: string;
    analyzedUrl: string;
    analyzedAt: string;
    sections: {
        technical: SectionData;
        onpage: SectionData;
        content: SectionData;
        schema: SectionData;
        images: SectionData;
    };
    criticalIssues: Issue[];
    quickWins: QuickWin[];
    actionPlan: ActionItem[];
    titleAnalysis: MetaAnalysis;
    descriptionAnalysis: MetaAnalysis;
    keywordAnalysis?: KeywordAnalysis;
    competitors?: Competitor[];
    topPages?: TopPage[];
}

interface TopPage {
    url: string;
    title: string;
    targetKeywords: string[];
    rankingPotential: 'alto' | 'medio' | 'bajo';
    estimatedPosition: string;
    rankingStrengths: string;
    rankingWeaknesses: string;
    improvement: string;
}

// ── Modal content types ───────────────────────────────────────────────
type ModalItem =
    | { kind: 'issue'; data: Issue; section?: string }
    | { kind: 'quickwin'; data: QuickWin }
    | { kind: 'action'; data: ActionItem };

// ── Helpers ───────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
    critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#64748B',
};
const PRIORITY_LABELS: Record<string, string> = {
    critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo',
};
const SECTION_ICONS: Record<string, string> = {
    technical: '🔧', onpage: '📝', content: '📊', schema: '🏗️', images: '🖼️',
};
const SECTION_NAMES: Record<string, string> = {
    technical: 'SEO Técnico', onpage: 'On-Page SEO',
    content: 'Contenido & E-E-A-T', schema: 'Schema / Datos Estructurados', images: 'Imágenes',
};
const LOADING_STEPS = [
    'Verificando el pago…',
    'Crawleando robots.txt y sitemap…',
    'Analizando meta tags y headings…',
    'Evaluando estructura On-Page…',
    'Procesando con ChatGPT (GPT-4o)…',
    'Generando reporte final…',
];

// Genera los "pasos detallados" según el tipo de ítem
function buildSteps(item: ModalItem): { n: number; text: string }[] {
    if (item.kind === 'issue') {
        const issue = item.data;
        return [
            { n: 1, text: `Identifica dónde ocurre el problema: ${issue.description}` },
            { n: 2, text: issue.fix ? `Aplica la corrección: ${issue.fix}` : 'Revisa la documentación oficial de Google Search Console para este tipo de problema.' },
            { n: 3, text: 'Valida el cambio con Google Rich Results Test o PageSpeed Insights.' },
            { n: 4, text: 'Solicita reindexación en Google Search Console → URL Inspection → Request Indexing.' },
            { n: 5, text: 'Monitorea el impacto en clics e impresiones durante 14–30 días en GSC → Performance.' },
        ];
    }
    if (item.kind === 'quickwin') {
        const qw = item.data;
        return [
            { n: 1, text: `Prioriza esta tarea — impacto estimado: ${qw.impact}, esfuerzo: ${qw.effort}.` },
            { n: 2, text: `Implementa: ${qw.description}` },
            { n: 3, text: 'Verifica el cambio con Google Search Console o una herramienta de auditoría.' },
            { n: 4, text: 'Documenta el cambio con fecha para medir el impacto en los próximos 30 días.' },
        ];
    }
    // action
    const action = item.data;
    return [
        { n: 1, text: `Prioridad ${PRIORITY_LABELS[action.priority] ?? action.priority} — reserva tiempo estimado: ${action.timeEstimate}.` },
        { n: 2, text: `Objetivo: ${action.description}` },
        { n: 3, text: 'Asigna esta tarea a un responsable en tu equipo o agencia SEO.' },
        { n: 4, text: 'Usa un gestor de tareas (Notion, Trello, Asana) para hacer seguimiento.' },
        { n: 5, text: 'Revisa el impacto después de 4–6 semanas en Google Analytics y Search Console.' },
    ];
}

function buildWhy(item: ModalItem): string {
    if (item.kind === 'issue') {
        return `Los problemas de este tipo afectan directamente cómo Google rastrea, indexa y rankea tu sitio. 
Al no corregirlo, el motor de búsqueda puede perder señales importantes sobre el contenido de tu página, 
lo que impacta negativamente tu posición en los resultados y el tráfico orgánico.`;
    }
    if (item.kind === 'quickwin') {
        return `Los quick wins son mejoras de alto impacto y bajo esfuerzo que suelen dar resultados visibles 
en 2–4 semanas. Al ejecutar esta optimización, le das señales claras a Google sobre la relevancia y calidad 
de tu contenido, mejorando tu visibilidad sin necesidad de grandes inversiones.`;
    }
    return `Los planes de acción priorizados son la hoja de ruta estratégica para mejorar tu SEO de forma 
sistemática. Las acciones de alta prioridad pueden marcar la diferencia entre aparecer en la primera 
página de Google o quedar relegado en posiciones no competitivas.`;
}

function buildResources(item: ModalItem): { label: string; url: string }[] {
    const base: { label: string; url: string }[] = [
        { label: 'Google Search Console', url: 'https://search.google.com/search-console' },
        { label: 'Google PageSpeed Insights', url: 'https://pagespeed.web.dev/' },
    ];
    if (item.kind === 'issue') {
        return [
            ...base,
            { label: 'Guía de SEO de Google', url: 'https://developers.google.com/search/docs' },
            { label: 'Rich Results Test', url: 'https://search.google.com/test/rich-results' },
        ];
    }
    if (item.kind === 'quickwin') {
        return [
            ...base,
            { label: 'Semrush — Auditoría de sitio', url: 'https://www.semrush.com/siteaudit/' },
            { label: 'Ahrefs — Herramientas SEO', url: 'https://ahrefs.com/webmaster-tools' },
        ];
    }
    return [
        ...base,
        { label: 'Google Analytics', url: 'https://analytics.google.com' },
        { label: 'Core Web Vitals Report', url: 'https://search.google.com/search-console/core-web-vitals' },
    ];
}

// ── Pill labels ───────────────────────────────────────────────────────
function DifficultyPill({ level }: { level: 'Fácil' | 'Media' | 'Alta' }) {
    const colors: Record<string, string> = {
        'Fácil': '#34D399', 'Media': '#FCD34D', 'Alta': '#F87171',
    };
    return (
        <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px',
            borderRadius: 20, background: `${colors[level]}15`,
            border: `1px solid ${colors[level]}40`, color: colors[level],
        }}>
            {level === 'Fácil' ? '⚡' : level === 'Media' ? '⚙️' : '🔥'} {level}
        </span>
    );
}

// ── MODAL COMPONENT ───────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: ModalItem; onClose: () => void }) {
    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const title = item.kind === 'issue' ? item.data.title
        : item.kind === 'quickwin' ? item.data.title
            : item.data.action;
    const desc = item.kind === 'issue' ? item.data.description
        : item.kind === 'quickwin' ? item.data.description
            : item.data.description;
    const steps = buildSteps(item);
    const why = buildWhy(item);
    const resources = buildResources(item);

    const badgeColor = item.kind === 'issue'
        ? '#EF4444'
        : item.kind === 'quickwin'
            ? '#FF6B2D'
            : PRIORITY_COLORS[item.data.priority] ?? '#7C3AED';

    const badgeLabel = item.kind === 'issue' ? '🔴 Problema detectado'
        : item.kind === 'quickwin' ? '⚡ Quick Win'
            : `🗺️ Acción ${PRIORITY_LABELS[(item.data as ActionItem).priority] ?? ''}`;

    const difficultyMap: Record<string, 'Fácil' | 'Media' | 'Alta'> = {
        'bajo': 'Fácil', 'low': 'Fácil', 'fácil': 'Fácil', 'facil': 'Fácil',
        'medio': 'Media', 'medium': 'Media', 'media': 'Media',
        'alto': 'Alta', 'high': 'Alta', 'alta': 'Alta', 'crítico': 'Alta', 'critical': 'Alta',
    };
    const effortKey = (item.kind === 'quickwin' ? item.data.effort : item.kind === 'action' ? item.data.priority : 'medio').toLowerCase();
    const difficulty = difficultyMap[effortKey] ?? 'Media';

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                    animation: 'fadeIn 0.2s ease',
                }}
            />

            {/* Panel */}
            <div style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1001,
                width: 'min(680px, calc(100vw - 32px))',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                background: 'linear-gradient(135deg, #1e0050 0%, #160030 100%)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 20,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.1)',
                animation: 'slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
                {/* Header del modal */}
                <div style={{
                    padding: '24px 28px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    position: 'sticky', top: 0,
                    background: 'linear-gradient(135deg, #1e0050 0%, #160030 100%)',
                    borderRadius: '20px 20px 0 0',
                    zIndex: 1,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <span style={{
                                display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
                                padding: '3px 10px', borderRadius: 20, marginBottom: 10,
                                background: `${badgeColor}18`,
                                border: `1px solid ${badgeColor}40`,
                                color: badgeColor,
                            }}>
                                {badgeLabel}
                            </span>
                            <h2 style={{
                                fontSize: '1.15rem', fontWeight: 800, color: 'white',
                                lineHeight: 1.3, margin: 0,
                            }}>
                                {title}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.6)', borderRadius: 8,
                                width: 34, height: 34, fontSize: '1rem',
                                cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Meta pills */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <DifficultyPill level={difficulty} />
                        {item.kind === 'quickwin' && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,107,45,0.12)', border: '1px solid rgba(255,107,45,0.3)', color: '#FF8C5A' }}>
                                💥 Impacto: {item.data.impact}
                            </span>
                        )}
                        {item.kind === 'action' && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA' }}>
                                ⏱ {item.data.timeEstimate}
                            </span>
                        )}
                        {item.kind === 'issue' && item.data.impact && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                                💥 {item.data.impact}
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* ¿Qué es? */}
                    <div>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                            📋 Descripción
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: 0 }}>
                            {desc}
                        </p>
                    </div>

                    {/* ¿Por qué importa? */}
                    <div style={{
                        background: 'rgba(124,58,237,0.08)',
                        border: '1px solid rgba(168,85,247,0.18)',
                        borderRadius: 12, padding: '16px 20px',
                    }}>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                            🎯 ¿Por qué importa para tu SEO?
                        </h3>
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
                            {why}
                        </p>
                    </div>

                    {/* Cómo implementarlo */}
                    <div>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                            🛠️ Cómo implementarlo paso a paso
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {steps.map(s => (
                                <div key={s.n} style={{
                                    display: 'flex', gap: 14, alignItems: 'flex-start',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 10, padding: '12px 16px',
                                }}>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.72rem', fontWeight: 800, color: 'white',
                                    }}>
                                        {s.n}
                                    </div>
                                    <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>
                                        {s.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fix específico (solo issues) */}
                    {item.kind === 'issue' && item.data.fix && (
                        <div style={{
                            background: 'rgba(52,211,153,0.06)',
                            border: '1px solid rgba(52,211,153,0.2)',
                            borderRadius: 12, padding: '14px 18px',
                        }}>
                            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                                🔧 Corrección recomendada
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: 0 }}>
                                {item.data.fix}
                            </p>
                        </div>
                    )}

                    {/* Recursos */}
                    <div>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                            🔗 Recursos útiles
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {resources.map(r => (
                                <a
                                    key={r.url}
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '0.8rem', fontWeight: 600,
                                        padding: '7px 14px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#93c5fd', textDecoration: 'none',
                                        transition: 'all 0.2s', display: 'inline-flex',
                                        alignItems: 'center', gap: 5,
                                    }}
                                >
                                    ↗ {r.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                }}>
                    <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        Presiona <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontSize: '0.7rem' }}>Esc</kbd> para cerrar
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: 'white', border: 'none', borderRadius: 8,
                            padding: '9px 22px', fontSize: '0.88rem', fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Entendido ✓
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
            `}</style>
        </>
    );
}

// ── Score Gauge SVG ───────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
    const radius = 54;
    const circ = 2 * Math.PI * radius;
    const filled = (score / 100) * circ;
    const color = score >= 70 ? '#37FFDB' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="score-gauge">
            <div className="score-wrapper">
                <svg width="130" height="130" viewBox="0 0 130 130">
                    <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    <circle
                        cx="65" cy="65" r={radius} fill="none"
                        stroke={color} strokeWidth="12"
                        strokeLinecap="butt"
                        strokeDasharray={`${filled} ${circ}`}
                        style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(4px 4px 0px ${color})` }}
                    />
                </svg>
                <div className="score-number" style={{ color }}>{score}</div>
            </div>
            <div className="score-gauge-label">Score SEO</div>
        </div>
    );
}

// ── Report Renderer ───────────────────────────────────────────────────
function ReportView({ report }: { report: Report }) {
    const [modal, setModal] = useState<ModalItem | null>(null);
    const openModal = useCallback((item: ModalItem) => setModal(item), []);
    const closeModal = useCallback(() => setModal(null), []);

    const date = new Date(report.analyzedAt).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
        <div className="report-page">
            {/* Modal */}
            {modal && <DetailModal item={modal} onClose={closeModal} />}

            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <div className="logo-icon">🔍</div>
                    <span>DiagnósticoSEO</span>
                </div>
                <a href="/">← Nuevo análisis</a>
            </nav>

            {/* Header */}
            <div className="report-header">
                <div className="report-header-inner">
                    <div className="report-site-info">
                        <div className="report-site-url">{report.analyzedUrl}</div>
                        <div className="report-meta">
                            <span>🏢 {report.businessType}</span>
                            <span>⚙️ {report.platform}</span>
                            <span>📅 {date}</span>
                        </div>
                        <p style={{ marginTop: 16, fontSize: '0.96rem', color: 'var(--text-on-dark-muted)', maxWidth: 680, lineHeight: 1.6, fontWeight: 500 }}>
                            {report.summary}
                        </p>
                    </div>
                    <ScoreGauge score={report.score} />
                </div>
            </div>

            {/* Body */}
            <div className="report-body">

                {/* Resumen por categoría */}
                <div className="report-section">
                    <div className="report-section-header">
                        <div className="report-section-title">📈 Resumen por Categoría</div>
                    </div>
                    <div className="report-section-body">
                        <div className="score-bars-report" style={{ gap: 16 }}>
                            {Object.entries(report.sections).map(([key, sec]) => (
                                <div className="score-bar-item-r" key={key}>
                                    <div className="score-bar-label-r" style={{ width: 220, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                                        {SECTION_ICONS[key]} {SECTION_NAMES[key]}
                                    </div>
                                    <div className="score-bar-track-r">
                                        <div
                                            className={`score-bar-fill ${sec.status}`}
                                            style={{ width: `${sec.score}%` }}
                                        />
                                    </div>
                                    <div className="score-bar-value" style={{
                                        color: sec.score >= 70 ? 'var(--orange)' : sec.score >= 40 ? 'var(--yellow)' : 'var(--red)',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        width: '40px',
                                        textAlign: 'right'
                                    }}>
                                        {sec.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Title & Meta Analysis */}
                <div className="report-section">
                    <div className="report-section-header">
                        <div className="report-section-title">🏷️ Title Tag & Meta Description</div>
                    </div>
                    <div className="report-section-body">
                        <div className="meta-analysis">
                            {/* Title */}
                            <div className="meta-card">
                                <div className="meta-label">Title Tag actual</div>
                                <div className="meta-current">{report.titleAnalysis.current || '—'}</div>
                                <div className="length-bar" style={{ borderRadius: 2, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.06)' }}>
                                    <div
                                        className={`length-fill ${report.titleAnalysis.status}`}
                                        style={{ width: `${Math.min((report.titleAnalysis.length / 70) * 100, 100)}%`, borderRadius: 0 }}
                                    />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 8 }}>
                                    {report.titleAnalysis.length} / 60–70 chars óptimos
                                </div>
                                <div
                                    className="meta-recommendation"
                                    style={{ cursor: 'pointer' }}
                                    title="Click para ver más detalles"
                                    onClick={() => openModal({
                                        kind: 'issue',
                                        data: {
                                            title: 'Optimización del Title Tag',
                                            description: report.titleAnalysis.recommendation,
                                            fix: `El Title Tag actual tiene ${report.titleAnalysis.length} caracteres. El rango óptimo es 50–70 caracteres para que no sea truncado en Google.`,
                                            impact: 'Alto impacto en CTR y rankings',
                                        },
                                    })}
                                >
                                    💡 {report.titleAnalysis.recommendation}
                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700 }}>Ver guía completa →</span>
                                </div>
                            </div>
                            {/* Meta */}
                            <div className="meta-card">
                                <div className="meta-label">Meta Description actual</div>
                                <div className="meta-current">{report.descriptionAnalysis.current || '—'}</div>
                                <div className="length-bar" style={{ borderRadius: 2, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.06)' }}>
                                    <div
                                        className={`length-fill ${report.descriptionAnalysis.status}`}
                                        style={{ width: `${Math.min((report.descriptionAnalysis.length / 160) * 100, 100)}%`, borderRadius: 0 }}
                                    />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 8 }}>
                                    {report.descriptionAnalysis.length} / 140–160 chars óptimos
                                </div>
                                <div
                                    className="meta-recommendation"
                                    style={{ cursor: 'pointer' }}
                                    title="Click para ver más detalles"
                                    onClick={() => openModal({
                                        kind: 'issue',
                                        data: {
                                            title: 'Optimización de la Meta Description',
                                            description: report.descriptionAnalysis.recommendation,
                                            fix: `La Meta Description actual tiene ${report.descriptionAnalysis.length} caracteres. Idealmente debe estar entre 140–160 caracteres, incluir la palabra clave principal y un llamado a la acción.`,
                                            impact: 'Impacto directo en CTR desde los resultados de búsqueda',
                                        },
                                    })}
                                >
                                    💡 {report.descriptionAnalysis.recommendation}
                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700 }}>Ver guía completa →</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Critical Issues */}
                {report.criticalIssues?.length > 0 && (
                    <div className="report-section">
                        <div className="report-section-header">
                            <div className="report-section-title">🚨 Issues Críticos</div>
                            <span className="section-score-pill critical">{report.criticalIssues.length} problemas</span>
                        </div>
                        <div className="report-section-body">
                            <div className="issues-list">
                                {report.criticalIssues.map((issue, i) => (
                                    <button
                                        key={i}
                                        className="issue-item critical issue-clickable"
                                        onClick={() => openModal({ kind: 'issue', data: issue })}
                                    >
                                        <div className="issue-icon">🔴</div>
                                        <div className="issue-content">
                                            <div className="issue-title">{issue.title}</div>
                                            <div className="issue-description">{issue.description}</div>
                                            {issue.impact && (
                                                <div className="issue-fix">💥 Impacto: {issue.impact}</div>
                                            )}
                                        </div>
                                        <div className="issue-expand-hint">Ver guía →</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sections detail */}
                {Object.entries(report.sections).map(([key, sec]) => (
                    <div className="report-section" key={key}>
                        <div className="report-section-header">
                            <div className="report-section-title">
                                {SECTION_ICONS[key]} {SECTION_NAMES[key]}
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '1.1rem', fontWeight: 800,
                                    color: sec.score >= 70 ? '#34D399' : sec.score >= 40 ? '#FCD34D' : '#FCA5A5',
                                }}>
                                    {sec.score}/100
                                </span>
                                <span className={`section-score-pill ${sec.status}`}>
                                    {sec.status === 'good' ? 'Bien' : sec.status === 'warning' ? 'Mejorable' : 'Crítico'}
                                </span>
                            </div>
                        </div>
                        <div className="report-section-body">
                            <p className="section-summary">{sec.summary}</p>

                            {sec.issues?.length > 0 && (
                                <div className="issues-list">
                                    {sec.issues.map((issue, i) => (
                                        <button
                                            key={i}
                                            className={`issue-item ${i === 0 ? 'high' : 'medium'} issue-clickable`}
                                            onClick={() => openModal({ kind: 'issue', data: issue, section: key })}
                                        >
                                            <div className="issue-icon">{i === 0 ? '🟠' : '🔵'}</div>
                                            <div className="issue-content">
                                                <div className="issue-title">{issue.title}</div>
                                                <div className="issue-description">{issue.description}</div>
                                                {issue.fix && (
                                                    <div className="issue-fix">🔧 {issue.fix}</div>
                                                )}
                                            </div>
                                            <div className="issue-expand-hint">Ver guía →</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {sec.passes?.length > 0 && (
                                <div className="passes-list">
                                    {sec.passes.map((p, i) => (
                                        <span className="pass-tag" key={i}>✓ {p}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Quick Wins */}
                {report.quickWins?.length > 0 && (
                    <div className="report-section">
                        <div className="report-section-header">
                            <div className="report-section-title">⚡ Quick Wins</div>
                            <span className="section-score-pill good">{report.quickWins.length} oportunidades</span>
                        </div>
                        <div className="report-section-body">
                            <div className="quick-wins-grid">
                                {report.quickWins.map((qw, i) => (
                                    <button
                                        key={i}
                                        className="quick-win-card quick-win-clickable"
                                        onClick={() => openModal({ kind: 'quickwin', data: qw })}
                                    >
                                        <div className="quick-win-title">
                                            🎯 {qw.title}
                                            <span className="effort-badge">Esfuerzo: {qw.effort}</span>
                                        </div>
                                        <div className="quick-win-description">{qw.description}</div>
                                        <div className="quick-win-cta">Ver implementación →</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Plan */}
                {report.actionPlan?.length > 0 && (
                    <div className="report-section">
                        <div className="report-section-header">
                            <div className="report-section-title">🗺️ Plan de Acción Priorizado</div>
                        </div>
                        <div className="report-section-body">
                            <div className="action-plan">
                                {report.actionPlan.map((item, i) => (
                                    <button
                                        key={i}
                                        className="action-item action-clickable"
                                        onClick={() => openModal({ kind: 'action', data: item })}
                                    >
                                        <div className="action-priority">
                                            <div
                                                className="priority-dot"
                                                style={{ background: PRIORITY_COLORS[item.priority] ?? '#475569' }}
                                            />
                                        </div>
                                        <div className="action-info">
                                            <div className="action-title">{item.action}</div>
                                            <div className="action-description">{item.description}</div>
                                            <div className="action-meta">
                                                <span className={`priority-label ${item.priority}`}>
                                                    {PRIORITY_LABELS[item.priority] ?? item.priority}
                                                </span>
                                                {item.timeEstimate && (
                                                    <span className="time-estimate">⏱ {item.timeEstimate}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="action-expand-hint">Ver cómo →</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── KEYWORD ANALYSIS ────────────────────────── */}
                {report.keywordAnalysis && (
                    <div className="report-section">
                        <div className="report-section-header">
                            <div className="report-section-title">🔑 Análisis de Palabras Clave</div>
                        </div>
                        <div className="report-section-body">

                            {/* Keywords actuales */}
                            {report.keywordAnalysis.currentKeywords?.length > 0 && (
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                                        📍 Keywords que el sitio está apuntando actualmente
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {report.keywordAnalysis.currentKeywords.map((kw, i) => {
                                            const relColor = kw.relevance === 'alta' ? '#34D399' : kw.relevance === 'media' ? '#FCD34D' : '#F87171';
                                            return (
                                                <div key={i} style={{
                                                    display: 'flex', gap: 12, alignItems: 'flex-start',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: 10, padding: '12px 16px',
                                                }}>
                                                    <div style={{
                                                        flexShrink: 0, padding: '3px 10px', borderRadius: 20,
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                        background: `${relColor}15`, color: relColor,
                                                        border: `1px solid ${relColor}30`, whiteSpace: 'nowrap',
                                                        alignSelf: 'center',
                                                    }}>
                                                        {kw.relevance === 'alta' ? '●●●' : kw.relevance === 'media' ? '●●○' : '●○○'} {kw.relevance}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3 }}>{kw.keyword}</div>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', background: 'rgba(255,255,255,0.05)', padding: '1px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                                                                📜 {kw.source}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{kw.assessment}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Keywords perdidas / oportunidades */}
                            {report.keywordAnalysis.missedKeywords?.length > 0 && (
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FB923C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                                        🚀 Oportunidades de keywords NO aprovechadas
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                                        {report.keywordAnalysis.missedKeywords.map((kw, i) => {
                                            const intentColors: Record<string, string> = {
                                                informacional: '#60A5FA', comercial: '#A78BFA',
                                                transaccional: '#34D399', local: '#FBBF24',
                                            };
                                            const ic = intentColors[kw.intent] ?? '#60A5FA';
                                            return (
                                                <div key={i} style={{
                                                    background: 'rgba(251,146,60,0.04)',
                                                    border: '1px solid rgba(251,146,60,0.2)',
                                                    borderRadius: 12, padding: '14px 16px',
                                                    display: 'flex', flexDirection: 'column', gap: 8,
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{kw.keyword}</div>
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${ic}15`, color: ic, border: `1px solid ${ic}30`, whiteSpace: 'nowrap' }}>
                                                            {kw.intent}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#FB923C', fontWeight: 600 }}>📊 {kw.monthlyVolume}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{kw.opportunity}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Topic gaps */}
                            {report.keywordAnalysis.topicGaps?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                                        🕳️ Vacíos de contenido (Topic Gaps)
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {report.keywordAnalysis.topicGaps.map((gap, i) => (
                                            <span key={i} style={{
                                                fontSize: '0.82rem', padding: '6px 14px', borderRadius: 20,
                                                background: 'rgba(239,68,68,0.07)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                color: '#FCA5A5',
                                            }}>
                                                ✗ {gap}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── COMPETITORS ─────────────────────────────────── */}
                {report.competitors && report.competitors.length > 0 && (
                    <div className="report-section">
                        <div className="report-section-header">
                            <div className="report-section-title">⚔️ Análisis de Competencia</div>
                            <span className="section-score-pill warning">{report.competitors.length} competidores</span>
                        </div>
                        <div className="report-section-body">
                            <p className="section-summary" style={{ marginBottom: 20 }}>
                                Competidores estimados por IA basados en el nicho, tipo de negocio y mercado detectado. Úsalos como referencia para tu estrategia SEO.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {report.competitors.map((comp, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${comp.type === 'directo' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                        borderRadius: 12, padding: '16px 20px',
                                        display: 'flex', gap: 16, alignItems: 'flex-start',
                                    }}>
                                        {/* Número */}
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                            background: comp.type === 'directo' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                            border: `1.5px solid ${comp.type === 'directo' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.85rem', fontWeight: 800,
                                            color: comp.type === 'directo' ? '#FCA5A5' : '#FCD34D',
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{comp.name}</div>
                                                    <a href={`https://${comp.url.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                                                        style={{ fontSize: '0.75rem', color: '#60A5FA', textDecoration: 'none' }}>↗ {comp.url}</a>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                                    background: comp.type === 'directo' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                    border: `1px solid ${comp.type === 'directo' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                                    color: comp.type === 'directo' ? '#FCA5A5' : '#FCD34D',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {comp.type === 'directo' ? '⚔️ Directo' : '🔀 Indirecto'}
                                                </span>
                                            </div>
                                            {/* Razón */}
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                                                {comp.reason}
                                            </div>
                                            {/* Fortalezas y oportunidad */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>💪 Sus fortalezas</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{comp.estimatedStrengths}</div>
                                                </div>
                                                <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34D399', marginBottom: 4 }}>🎯 Tu oportunidad</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{comp.opportunity}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TOP PAGES RANKING ───────────────────────────────── */}
                {report.topPages && report.topPages.length > 0 && (
                    <div className="report-section">
                        <div className="report-section-header">
                            <div className="report-section-title">📊 Ranking de URLs — Potencial de Posicionamiento</div>
                            <span className="section-score-pill good">{report.topPages.length} páginas</span>
                        </div>
                        <div className="report-section-body">
                            <p className="section-summary" style={{ marginBottom: 20 }}>
                                Análisis de las páginas internas del sitio: keywords objetivo, posición estimada en Google y acciones para subir en los rankings.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {report.topPages.map((page, i) => {
                                    const potentialColors = { alto: '#34D399', medio: '#FCD34D', bajo: '#F87171' };
                                    const positionBg: Record<string, string> = {
                                        'Top 3': 'rgba(52,211,153,0.12)', 'Top 10': 'rgba(52,211,153,0.07)',
                                        'Top 20': 'rgba(252,211,77,0.07)', 'Top 50': 'rgba(248,113,113,0.07)',
                                        'No rankea': 'rgba(248,113,113,0.12)',
                                    };
                                    const pc = potentialColors[page.rankingPotential] ?? '#60A5FA';
                                    const posKey = Object.keys(positionBg).find(k => (page.estimatedPosition ?? '').includes(k.replace('Top ', ''))) ?? 'Top 50';
                                    return (
                                        <div key={i} style={{
                                            background: positionBg[posKey] ?? 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${pc}25`,
                                            borderRadius: 14, padding: '18px 20px',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            {/* Barra lateral de color según potencial */}
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                                                background: pc, borderRadius: '4px 0 0 4px',
                                            }} />
                                            <div style={{ paddingLeft: 12 }}>
                                                {/* Header: URL + posición */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <a
                                                            href={page.url}
                                                            target="_blank" rel="noopener noreferrer"
                                                            style={{ fontSize: '0.82rem', color: '#60A5FA', textDecoration: 'none', wordBreak: 'break-all', display: 'block', marginBottom: 3 }}
                                                        >
                                                            ↗ {page.url}
                                                        </a>
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', wordBreak: 'break-word' }}>
                                                            {page.title || <em style={{ color: 'var(--text-subtle)' }}>Sin title tag</em>}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                                        <span style={{
                                                            fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                                                            background: `${pc}18`, color: pc, border: `1px solid ${pc}35`,
                                                        }}>
                                                            {page.estimatedPosition}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                                            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                        }}>
                                                            Potencial: {page.rankingPotential}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Keywords objetivo */}
                                                {page.targetKeywords?.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                                        {page.targetKeywords.map((kw, ki) => (
                                                            <span key={ki} style={{
                                                                fontSize: '0.75rem', fontWeight: 600,
                                                                padding: '3px 10px', borderRadius: 20,
                                                                background: 'rgba(59,130,246,0.1)',
                                                                border: '1px solid rgba(59,130,246,0.25)',
                                                                color: '#93C5FD',
                                                            }}>
                                                                🔑 {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Fortalezas y debilidades + mejora */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                                                    <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34D399', marginBottom: 4 }}>✅ Fortalezas SEO</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{page.rankingStrengths}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>⚠️ Debilidades</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{page.rankingWeaknesses}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 8, padding: '10px 12px', gridColumn: 'span 2' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#FBBF24', marginBottom: 4 }}>🚀 Acción prioritaria</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{page.improvement}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── GENERADOR DE CONTENIDO SEO ──────────────────────────────── */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.07))',
                    border: '1px solid rgba(124,58,237,0.32)',
                    borderRadius: 20, padding: '30px 28px',
                    position: 'relative', overflow: 'hidden',
                    textAlign: 'center',
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                    }} />
                    <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🤖</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 8 }}>
                        Genera el contenido optimizado para llegar al 100%
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>
                        GPT-4o redactará el H1, H2, H3, párrafos, sugerencias de imágenes con alt text, schema markup y enlaces internos — todo diseñado para alcanzar un score SEO de <strong style={{ color: '#34D399' }}>100/100</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                        {[
                            '✅ H1 · H2 · H3 optimizados',
                            '🖼️ Sugerencias de imágenes + alt text',
                            '🏗️ Schema Markup JSON-LD',
                            '🔗 Enlaces internos sugeridos',
                            '📋 SEO Checklist 100/100',
                            '📄 Export a PDF',
                        ].map((f, i) => (
                            <span key={i} style={{
                                fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.6)', fontWeight: 600,
                            }}>{f}</span>
                        ))}
                    </div>
                    {/* Botones por URL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, margin: '0 auto' }}>
                        {/* Homepage */}
                        <a
                            href={`/content?url=${encodeURIComponent(report.analyzedUrl)}&bt=${encodeURIComponent(report.businessType)}&country=${encodeURIComponent((report as unknown as Record<string, string>).country ?? 'Chile')}&kw=${encodeURIComponent(report.keywordAnalysis?.currentKeywords?.[0]?.keyword ?? '')}`}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                                color: 'white', borderRadius: 12, padding: '13px 24px',
                                fontSize: '0.96rem', fontWeight: 700, textDecoration: 'none',
                                boxShadow: '0 6px 28px rgba(124,58,237,0.4)',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            🤖 Generar contenido para Homepage
                            <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>{report.analyzedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                        </a>
                        {/* Top Pages */}
                        {report.topPages && report.topPages.slice(0, 5).map((page, i) => (
                            <a
                                key={i}
                                href={`/content?url=${encodeURIComponent(report.analyzedUrl)}&pageUrl=${encodeURIComponent(page.url)}&bt=${encodeURIComponent(report.businessType)}&country=${encodeURIComponent((report as unknown as Record<string, string>).country ?? 'Chile')}&kw=${encodeURIComponent(page.targetKeywords?.[0] ?? '')}`}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                                    background: 'rgba(124,58,237,0.08)',
                                    border: '1px solid rgba(124,58,237,0.25)',
                                    color: '#c084fc', borderRadius: 10, padding: '11px 18px',
                                    fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <span>📄 Generar contenido para página #{i + 1}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.65, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {page.url.replace(/^https?:\/\//, '')}
                                </span>
                            </a>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-subtle)', marginTop: 16 }}>
                        Usa GPT-4o · ~20–40 segundos · Incluido en tu reporte
                    </p>
                </div>

                {/* CTA footer */}
                <div style={{ textAlign: 'center', padding: '20px 0 60px' }}>
                    <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
                        Reporte generado por DiagnósticoSEO.com · Potenciado por ChatGPT (GPT-4o-mini)
                    </p>
                </div>
            </div>

            {/* Floating action bar */}
            <div className="report-actions">
                <div className="report-actions-inner">
                    <button className="btn-secondary" onClick={() => window.location.href = '/'}>
                        ← Nuevo análisis
                    </button>
                    <button className="btn-download" onClick={() => window.print()}>
                        📄 Descargar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Loading View ───────────────────────────────────────────────────────
function LoadingView({ currentStep }: { currentStep: number }) {
    return (
        <div className="loading-page">
            <div className="loading-icon">🔍</div>
            <div className="loading-title">Analizando tu sitio web…</div>
            <p className="loading-subtitle">
                ChatGPT está revisando cada aspecto SEO de tu sitio. Esto tomará unos 30–60 segundos.
            </p>
            <div className="loading-steps">
                {LOADING_STEPS.map((step, i) => {
                    const status = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
                    return (
                        <div className={`loading-step ${status}`} key={i}>
                            <div className={`step-indicator ${status}`}>
                                {status === 'done' ? '✓' : status === 'active' ? '◌' : i + 1}
                            </div>
                            {step}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Failed View ────────────────────────────────────────────────────────
function FailedView({ msg }: { msg: string }) {
    return (
        <div className="failed-page">
            <div className="failed-icon">❌</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Algo salió mal</h1>
            <p style={{ color: 'var(--text-muted)' }}>{msg}</p>
            <button className="btn-primary" onClick={() => window.location.href = '/'}>
                ← Volver al inicio
            </button>
        </div>
    );
}

// ── Inner ─────────────────────────────────────────────────────────────
function SuccessInner() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(0);
    const [report, setReport] = useState<Report | null>(null);
    const [failed, setFailed] = useState('');
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        const status = searchParams.get('status');
        const paymentId = searchParams.get('payment_id') ?? '';
        const externalRef = searchParams.get('external_reference') ?? '';

        if (status !== 'approved' || !externalRef) {
            setFailed('El pago no fue aprobado o no se recibió la información del sitio. Vuelve al inicio e inténtalo de nuevo.');
            return;
        }

        let siteUrl: string;
        try {
            const b64 = externalRef.replace(/-/g, '+').replace(/_/g, '/');
            siteUrl = atob(b64);
        } catch {
            setFailed('No se pudo decodificar la URL del sitio.');
            return;
        }

        const runAnalysis = async () => {
            for (let i = 0; i < LOADING_STEPS.length; i++) {
                setStep(i);
                await new Promise(r => setTimeout(r, 600));
            }
            try {
                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: siteUrl, paymentId }),
                });
                const data = await res.json();
                if (!res.ok || data.error) { setFailed(data.error ?? 'Error al generar el análisis.'); return; }
                setReport(data);
            } catch (err: unknown) {
                console.error(err);
                setFailed('Error al conectar con el servidor.');
            }
        };

        runAnalysis();
    }, [searchParams]);

    if (failed) return <FailedView msg={failed} />;
    if (report) return <ReportView report={report} />;
    return <LoadingView currentStep={step} />;
}

// ── Page Export ────────────────────────────────────────────────────────
export default function SuccessPage() {
    return (
        <Suspense fallback={<LoadingView currentStep={0} />}>
            <SuccessInner />
        </Suspense>
    );
}
