'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────
type CheckStatus = 'pass' | 'warn' | 'fail';

interface FreeCheck {
    id: string;
    label: string;
    status: CheckStatus;
    value: string;
    tip: string;
    points: number;
    maxPoints: number;
}

interface FreeReport {
    url: string;
    finalUrl: string;
    analyzedAt: string;
    platform: string;
    score: number;
    checks: FreeCheck[];
    summary: { passing: number; warning: number; failing: number };
    estimatedFullIssues: number;
}

// ── Score mini gauge ──────────────────────────────────────────────────
function MiniGauge({ score }: { score: number }) {
    const radius = 44;
    const circ = 2 * Math.PI * radius;
    const filled = (score / 100) * circ;
    const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 108, height: 108, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="54" cy="54" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle
                        cx="54" cy="54" r={radius} fill="none"
                        stroke={color} strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${filled} ${circ}`}
                        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
                    />
                </svg>
                <div style={{ position: 'absolute', fontSize: '1.8rem', fontWeight: 900, color }}>{score}</div>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Score SEO
            </div>
        </div>
    );
}

// ── Status config ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<CheckStatus, { icon: string; color: string; bg: string; border: string }> = {
    pass: { icon: '✓', color: '#34D399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    warn: { icon: '⚠', color: '#FCD34D', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    fail: { icon: '✗', color: '#FCA5A5', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
};

// ── Check Row ─────────────────────────────────────────────────────────
function CheckRow({ check, delay }: { check: FreeCheck; delay: number }) {
    const cfg = STATUS_CONFIG[check.status];
    return (
        <div style={{
            display: 'flex', gap: 14, padding: '14px 18px',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 10,
            animation: `fadeInUp 0.4s ease ${delay}s both`,
        }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.color, fontSize: '0.85rem', fontWeight: 700,
            }}>
                {cfg.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{check.label}</span>
                    <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap',
                    }}>
                        {check.points}/{check.maxPoints} pts
                    </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{check.value}</div>
                <div style={{ fontSize: '0.79rem', color: cfg.color, marginTop: 5, lineHeight: 1.4 }}>
                    💡 {check.tip}
                </div>
            </div>
        </div>
    );
}

// ── Locked Section Card ───────────────────────────────────────────────
function LockedCard({ icon, title, teaser }: { icon: string; title: string; teaser: string }) {
    return (
        <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '20px 22px',
        }}>
            {/* Blurred content */}
            <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 8, display: 'flex', gap: 8 }}>
                    {icon} {title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{teaser}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {[80, 120, 100, 90].map((w, i) => (
                        <div key={i} style={{ height: 8, width: w, borderRadius: 4, background: 'rgba(255,255,255,0.1)' }} />
                    ))}
                </div>
            </div>
            {/* Lock overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6,
            }}>
                <div style={{ fontSize: '1.4rem' }}>🔒</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Disponible en el reporte completo
                </div>
            </div>
        </div>
    );
}

// ── Free Report View ──────────────────────────────────────────────────
function FreeReportView({ report, onUpgrade }: { report: FreeReport; onUpgrade: () => void }) {
    const date = new Date(report.analyzedAt).toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

    const scoreLabel = report.score >= 70 ? 'Bien' : report.score >= 40 ? 'Mejorable' : 'Crítico';
    const scoreColor = report.score >= 70 ? '#34D399' : report.score >= 40 ? '#FCD34D' : '#FCA5A5';

    return (
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-logo">
                    <div className="logo-icon">🔍</div>
                    <span>DiagnósticoSEO</span>
                </div>
                <a href="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>← Inicio</a>
            </nav>

            {/* Hero del reporte gratuito */}
            <div style={{
                paddingTop: 80,
                background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.1) 0%, transparent 60%), var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
            }}>
                <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 40px' }}>
                    {/* Badge gratuito */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 20, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600,
                        color: '#34D399', marginBottom: 20,
                    }}>
                        🆓 Análisis Gratuito
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, wordBreak: 'break-all' }}>
                                {report.url}
                            </h1>
                            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span>⚙️ {report.platform}</span>
                                <span>📅 {date}</span>
                            </div>

                            {/* Summary pills */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                                <div style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399',
                                }}>
                                    ✓ {report.summary.passing} pasaron
                                </div>
                                <div style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#FCD34D',
                                }}>
                                    ⚠ {report.summary.warning} por mejorar
                                </div>
                                <div style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5',
                                }}>
                                    ✗ {report.summary.failing} críticos
                                </div>
                            </div>
                        </div>

                        <MiniGauge score={report.score} />
                    </div>

                    {/* Score bar label */}
                    <div style={{
                        marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 8,
                        background: report.score >= 70 ? 'rgba(16,185,129,0.08)' : report.score >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${scoreColor}30`,
                    }}>
                        <span style={{ color: scoreColor, fontWeight: 700 }}>{scoreLabel}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            — {report.score >= 70
                                ? 'Buen trabajo, pero siempre hay mejoras posibles.'
                                : report.score >= 40
                                    ? 'Hay varias oportunidades de mejora importantes.'
                                    : 'Se detectaron problemas críticos que afectan tu posicionamiento.'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 120px' }}>

                {/* Checks gratuitos */}
                <div style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        🔍 Diagnóstico de 9 puntos clave
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                        Análisis básico gratuito con las verificaciones más importantes.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {report.checks.map((check, i) => (
                            <CheckRow key={check.id} check={check} delay={i * 0.05} />
                        ))}
                    </div>
                </div>

                {/* Secciones bloqueadas */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                        padding: '12px 16px',
                        background: 'rgba(59,130,246,0.06)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        borderRadius: 10,
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🔒</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                El reporte completo incluye {report.estimatedFullIssues}+ issues adicionales
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Con análisis profundo de contenido, schema, performance, plan de acción y quick wins
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                        <LockedCard
                            icon="📊"
                            title="Contenido & E-E-A-T"
                            teaser="Thin content, signals de autoridad, calidad de texto…"
                        />
                        <LockedCard
                            icon="🏗️"
                            title="Schema / Datos Estructurados"
                            teaser="Validación JSON-LD, tipos recomendados, rich snippets…"
                        />
                        <LockedCard
                            icon="⚡"
                            title="Core Web Vitals"
                            teaser="LCP, INP, CLS estimados, oportunidades de mejora…"
                        />
                        <LockedCard
                            icon="🗺️"
                            title="Plan de Acción Priorizado"
                            teaser="Crítico → Alto → Medio con tiempos estimados de implementación…"
                        />
                        <LockedCard
                            icon="🎯"
                            title="Quick Wins"
                            teaser="5+ acciones de alto impacto y bajo esfuerzo listas para implementar…"
                        />
                        <LockedCard
                            icon="🏷️"
                            title="Title & Meta Recommendations"
                            teaser="Title tag y meta description recomendados exactos para tu negocio…"
                        />
                    </div>
                </div>

                {/* CTA de upgrade */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.08))',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 20,
                    padding: '40px 32px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Top accent line */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, var(--blue), var(--cyan))',
                    }} />

                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>🚀</div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 10 }}>
                        Desbloquea el Diagnóstico Completo
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
                        Obtén el análisis profundo con ChatGPT: {report.estimatedFullIssues}+ issues detallados,
                        plan de acción con tiempos, quick wins y recomendaciones de title y meta listas para implementar.
                    </p>

                    <button
                        onClick={onUpgrade}
                        style={{
                            background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
                            color: 'white', border: 'none',
                            borderRadius: 12, padding: '14px 40px',
                            fontSize: '1.05rem', fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            boxShadow: '0 8px 30px rgba(59,130,246,0.35)',
                            transition: 'all 0.2s',
                        }}
                    >
                        💎 Ver Diagnóstico Completo — $9.990 CLP
                    </button>

                    <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                        🔒 Pago seguro con MercadoPago · Reporte en ~60 segundos · Descargable en PDF
                    </p>
                </div>
            </div>

            {/* Sticky bottom bar en mobile */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '12px 20px',
                background: 'rgba(6,11,20,0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                zIndex: 50,
            }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Score: <strong style={{ color: scoreColor }}>{report.score}/100</strong>
                    {' '}· {report.summary.failing} críticos, {report.summary.warning} mejoras
                </div>
                <button
                    onClick={onUpgrade}
                    style={{
                        background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
                        color: 'white', border: 'none',
                        borderRadius: 30, padding: '9px 22px',
                        fontSize: '0.85rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                >
                    💎 Reporte completo — $9.990
                </button>
            </div>
        </>
    );
}

// ── Loading state ─────────────────────────────────────────────────────
function LoadingFree() {
    return (
        <div className="loading-page">
            <div className="loading-icon">🔍</div>
            <div className="loading-title">Analizando el sitio…</div>
            <p className="loading-subtitle">Revisando 9 puntos clave de SEO. Toma unos segundos.</p>
            <div className="loading-steps" style={{ maxWidth: 340 }}>
                {['Fetching robots.txt y sitemap…', 'Analizando meta tags…', 'Evaluando H1 e imágenes…', 'Calculando score…'].map((s, i) => (
                    <div className="loading-step active" key={i} style={{ fontSize: '0.85rem' }}>
                        <div className="step-indicator active" style={{ animation: 'spin 1s linear infinite' }}>◌</div>
                        {s}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Inner ─────────────────────────────────────────────────────────────
function PreviewInner() {
    const searchParams = useSearchParams();
    const [report, setReport] = useState<FreeReport | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [upgradeLoading, setUpgradeLoading] = useState(false);

    const siteUrl = searchParams.get('url') ?? '';

    useEffect(() => {
        if (!siteUrl) {
            setError('No se proporcionó una URL.');
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const res = await fetch('/api/analyze-free', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: siteUrl }),
                });
                const data = await res.json();
                if (!res.ok || data.error) throw new Error(data.error ?? 'Error');
                setReport(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al analizar.');
            } finally {
                setLoading(false);
            }
        })();
    }, [siteUrl]);

    const handleUpgrade = async () => {
        setUpgradeLoading(true);
        try {
            const res = await fetch('/api/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: siteUrl }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error);
            window.location.href = data.checkoutUrl;
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Error al crear el pago.');
            setUpgradeLoading(false);
        }
    };

    if (loading) return <LoadingFree />;

    if (error) return (
        <div className="failed-page">
            <div className="failed-icon">❌</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>No se pudo analizar</h1>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button className="btn-primary" onClick={() => window.location.href = '/'}>← Volver</button>
        </div>
    );

    if (!report) return null;

    return <FreeReportView report={report} onUpgrade={upgradeLoading ? () => { } : handleUpgrade} />;
}

// ── Page export ───────────────────────────────────────────────────────
export default function PreviewPage() {
    return (
        <Suspense fallback={<LoadingFree />}>
            <PreviewInner />
        </Suspense>
    );
}
