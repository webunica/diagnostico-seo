'use client';

import { useState, useCallback } from 'react';

/* ── Tokens claros ────────────────────────────────────────────────── */
const T = {
    bg: '#F7F7F9', bgCard: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
    borderMid: 'rgba(0,0,0,0.12)', text: '#101820', textMuted: '#666666',
    textSubtle: '#999999', orange: '#FF6900', orangeDim: 'rgba(255,105,0,0.08)',
    orangeBorder: 'rgba(255,105,0,0.15)', accent: '#101820', green: '#10B981',
    greenDim: 'rgba(16,185,129,0.08)', greenBorder: 'rgba(16,185,129,0.15)',
    blue: '#3B82F6', blueDim: 'rgba(59,130,246,0.08)', blueBorder: 'rgba(59,130,246,0.15)',
    yellow: '#F59E0B', yellowDim: 'rgba(245,158,11,0.06)', yellowBorder: 'rgba(245,158,11,0.15)',
    red: '#EF4444', redDim: 'rgba(239,68,68,0.06)', redBorder: 'rgba(239,68,68,0.15)',
    brand: '#FF6900', brandDim: 'rgba(255,105,0,0.08)', brandBorder: 'rgba(255,105,0,0.15)',
    violet: '#8B5CF6',
} as const;

/* ── Types ────────────────────────────────────────────────────────── */
interface ApiKey {
    id: string; key: string; email: string; plan: string; label: string;
    requestsUsed: number; requestsLimit: number; resetAt: string;
    createdAt: string; lastUsedAt: string | null; isActive: boolean;
}
interface Plan { id: string; name: string; requestsPerMonth: number; priceMontly: number; features: string[]; }

/* ── Copy button ──────────────────────────────────────────────────── */
function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [c, setC] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 2000); }}
            style={{
                background: c ? T.greenDim : '#F1F5F9',
                border: `1px solid ${c ? T.greenBorder : T.border}`,
                borderRadius: 7, padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700,
                color: c ? T.green : T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            {c ? '✓ Copiado' : label}
        </button>
    );
}

/* ── Progress bar ─────────────────────────────────────────────────── */
function UsageBar({ used, limit }: { used: number; limit: number }) {
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const color = pct >= 90 ? T.red : pct >= 70 ? T.yellow : T.green;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 5 }}>
                <span style={{ color: T.textSubtle }}>Requests este mes</span>
                <span style={{ fontWeight: 700, color }}>{used} / {limit}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    transition: 'width 0.5s ease',
                }} />
            </div>
            <div style={{ fontSize: '0.67rem', color: T.textSubtle, marginTop: 3 }}>
                {limit - used} disponibles · Reset {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('es-CL')}
            </div>
        </div>
    );
}

/* ── Plan badge ────────────────────────────────────────────────────── */
function PlanBadge({ plan }: { plan: string }) {
    const cfg: Record<string, { color: string; dim: string; border: string }> = {
        starter: { color: T.textMuted, dim: 'rgba(255,255,255,0.06)', border: T.border },
        pro: { color: T.blue, dim: T.blueDim, border: T.blueBorder },
        agency: { color: T.yellow, dim: T.yellowDim, border: T.yellowBorder },
    };
    const c = cfg[plan] ?? cfg.starter;
    return (
        <span style={{
            fontSize: '0.68rem', fontWeight: 800, padding: '2px 10px', borderRadius: 20,
            background: c.dim, border: `1px solid ${c.border}`, color: c.color,
            textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
            {plan}
        </span>
    );
}

/* ── Main Dashboard ───────────────────────────────────────────────── */
export default function DashboardPage() {
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [newKeyShown, setNewKeyShown] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [revoking, setRevoking] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [paying, setPaying] = useState<string | null>(null);

    // Detectar ?upgraded=1 al volver de MercadoPago
    const upgraded = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('upgraded') === '1'
        : false;
    const upgradedPlan = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('plan') ?? ''
        : '';

    /* Load keys for email */
    const loadKeys = useCallback(async (em: string) => {
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError('Email inválido.'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch(`/api/keys?email=${encodeURIComponent(em)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error');
            setKeys(data.keys ?? []);
            setPlans(data.plans ?? []);
            setEmailSent(true);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setLoading(false); }
    }, []);

    /* Create new key */
    const createKey = useCallback(async () => {
        setCreating(true); setError(''); setNewKeyShown(null);
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan: 'starter', label: newLabel || 'default' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error');
            setNewKeyShown(data.apiKey);
            await loadKeys(email);
            setNewLabel('');
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setCreating(false); }
    }, [email, newLabel, loadKeys]);

    /* Buy plan — redirect to MercadoPago */
    const buyPlan = useCallback(async (planId: string, keyId?: string) => {
        setPaying(planId); setError('');
        try {
            const res = await fetch('/api/create-plan-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan: planId, keyId: keyId ?? '' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error al crear pago');
            window.location.href = data.checkoutUrl;
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setPaying(null); }
    }, [email]);

    /* Revoke key */
    const revokeKey = useCallback(async (id: string) => {
        setRevoking(id);
        try {
            const res = await fetch('/api/keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error');
            await loadKeys(email);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setRevoking(null); }
    }, [email, loadKeys]);

    const activeKeys = keys.filter(k => k.isActive);

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Montserrat, sans-serif' }}>

            {/* Navbar */}
            <nav className="navbar" style={{
                position: 'fixed', inset: '0 0 auto 0', zIndex: 100, height: 62,
                padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.border}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: T.brand, textDecoration: 'none' }}>SEO Diagnostico</span>
                    <span style={{ color: T.border }}>|</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: T.textMuted }}>Portal Desarrolladores</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <a href="/" style={{ fontSize: '0.84rem', color: T.textMuted, fontWeight: 700, textDecoration: 'none' }}>← Volver a la Web</a>
                    <a href="/admin" style={{ fontSize: '0.84rem', color: T.textMuted, fontWeight: 700, textDecoration: 'none' }}>Panel Admin</a>
                </div>
            </nav>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 20px 80px' }}>

                {/* Header */}
                <div style={{ marginBottom: 36, paddingTop: 12 }}>
                    <div style={{ fontSize: '0.63rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.brand, marginBottom: 10 }}>
                        🔑 API Keys
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, marginBottom: 10 }}>
                        Panel de Desarrolladores
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: T.textMuted, lineHeight: 1.6, maxWidth: 520 }}>
                        Gestiona tus API keys para integrar DiagnósticoSEO en cualquier CMS, plugin o aplicación.
                    </p>
                </div>

                {/* Email auth */}
                {!emailSent ? (
                    <div style={{
                        background: T.bgCard, border: `1px solid ${T.brandBorder}`,
                        borderRadius: 16, padding: '28px 26px',
                        position: 'relative', overflow: 'hidden', maxWidth: 500,
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.brand}, ${T.blue})` }} />
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 18 }}>Accede con tu email</div>
                        <p style={{ fontSize: '0.84rem', color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                            Introduce tu email para ver y gestionar tus API keys.
                        </p>
                        <input
                            type="email" placeholder="tu@email.com" value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadKeys(email)}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                                borderRadius: 9, padding: '11px 14px', color: T.text,
                                fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: 12, outline: 'none',
                            }}
                        />
                        {error && <div style={{ background: T.redDim, border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: '0.82rem', color: T.red, marginBottom: 12 }}>⚠️ {error}</div>}
                        <button onClick={() => loadKeys(email)} disabled={loading} style={{
                            width: '100%', background: `linear-gradient(135deg, ${T.brand}, ${T.blue})`,
                            color: 'white', border: 'none', borderRadius: 50, padding: '12px',
                            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                            opacity: loading ? 0.6 : 1, textTransform: 'uppercase',
                        }}>
                            {loading ? 'Cargando…' : '→ Ver mis API Keys'}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Banner upgrade exitoso */}
                        {upgraded && (
                            <div style={{
                                background: T.greenDim, border: `1px solid ${T.greenBorder}`,
                                borderRadius: 14, padding: '16px 22px',
                                display: 'flex', alignItems: 'center', gap: 14,
                            }}>
                                <span style={{ fontSize: '1.6rem' }}>🎉</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: T.green, marginBottom: 3 }}>
                                        ¡Pago aprobado! Tu plan fue actualizado
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: T.textMuted }}>
                                        Tu API key ya tiene acceso al plan {upgradedPlan.toUpperCase()}. Puede tardar unos segundos en reflejarse.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User info bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px',
                            flexWrap: 'wrap', gap: 10,
                        }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: T.textSubtle, marginBottom: 2 }}>Email autenticado</div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{email}</div>
                            </div>
                            <button onClick={() => { setEmailSent(false); setKeys([]); setNewKeyShown(null); }}
                                style={{
                                    background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8,
                                    padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                ← Cambiar email
                            </button>
                        </div>

                        {/* ⚠️ New key revealed */}
                        {newKeyShown && (
                            <div style={{
                                background: 'rgba(251,191,36,0.07)', border: `1px solid ${T.yellowBorder}`,
                                borderRadius: 14, padding: '20px 22px',
                            }}>
                                <div style={{ fontWeight: 800, color: T.yellow, fontSize: '0.88rem', marginBottom: 8 }}>
                                    ⚠️ Copia esta API Key ahora — No se mostrará de nuevo
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <code style={{
                                        flex: 1, background: 'rgba(0,0,0,0.35)', border: `1px solid ${T.border}`,
                                        borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem',
                                        color: T.green, fontFamily: 'monospace', wordBreak: 'break-all',
                                    }}>
                                        {newKeyShown}
                                    </code>
                                    <CopyBtn text={newKeyShown} label="📋 Copiar key" />
                                </div>
                                <div style={{ fontSize: '0.73rem', color: T.textSubtle, marginTop: 10 }}>
                                    Úsala en el header: <code style={{ color: T.violet }}>X-API-Key: {newKeyShown}</code>
                                </div>
                            </div>
                        )}

                        {/* Active keys */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                                    🔑 Mis API Keys <span style={{ color: T.textSubtle, fontWeight: 400, fontSize: '0.82rem' }}>({activeKeys.length})</span>
                                </div>
                            </div>

                            {activeKeys.length === 0 ? (
                                <div style={{
                                    background: T.bgCard, border: `1px solid ${T.border}`,
                                    borderRadius: 14, padding: '32px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>🗝️</div>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>No tienes API keys aún</div>
                                    <div style={{ fontSize: '0.84rem', color: T.textMuted }}>Crea tu primera key gratuita (Plan Starter) abajo.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {activeKeys.map(k => (
                                        <div key={k.id} style={{
                                            background: T.bgCard, border: `1px solid ${T.border}`,
                                            borderRadius: 14, padding: '20px 22px',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: k.plan === 'agency' ? T.yellow : k.plan === 'pro' ? T.blue : T.textSubtle }} />
                                            <div style={{ paddingLeft: 8 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                                                    <div>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                                            <PlanBadge plan={k.plan} />
                                                            <span style={{ fontSize: '0.78rem', color: T.textSubtle }}>{k.label}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            <code style={{
                                                                fontSize: '0.84rem', color: T.textMuted,
                                                                background: 'rgba(255,255,255,0.05)',
                                                                padding: '3px 10px', borderRadius: 6,
                                                            }}>
                                                                {k.key}
                                                            </code>
                                                            <span style={{ fontSize: '0.68rem', color: T.textSubtle }}>
                                                                (Key truncada por seguridad)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => revoking !== k.id && revokeKey(k.id)}
                                                        disabled={revoking === k.id}
                                                        style={{
                                                            background: T.redDim, border: `1px solid ${T.redBorder}`,
                                                            borderRadius: 8, padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700,
                                                            color: T.red, cursor: 'pointer', fontFamily: 'inherit',
                                                            opacity: revoking === k.id ? 0.5 : 1,
                                                        }}
                                                    >
                                                        {revoking === k.id ? 'Revocando…' : '🗑 Revocar'}
                                                    </button>
                                                </div>
                                                <UsageBar used={k.requestsUsed} limit={k.requestsLimit} />
                                                <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '0.68rem', color: T.textSubtle, flexWrap: 'wrap' }}>
                                                    <span>Creada: {new Date(k.createdAt).toLocaleDateString('es-CL')}</span>
                                                    {k.lastUsedAt && <span>Último uso: {new Date(k.lastUsedAt).toLocaleDateString('es-CL')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Create new key */}
                        <div style={{ background: T.bgCard, border: `1px solid ${T.brandBorder}`, borderRadius: 14, padding: '20px 22px' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 14 }}>➕ Crear nueva API Key (Starter gratuito)</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <input
                                    type="text" placeholder="Nombre/etiqueta (ej: wordpress-prod)"
                                    value={newLabel} onChange={e => setNewLabel(e.target.value)}
                                    style={{
                                        flex: 1, minWidth: 200, boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                                        borderRadius: 8, padding: '9px 12px', color: T.text,
                                        fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none',
                                    }}
                                />
                                <button onClick={createKey} disabled={creating} style={{
                                    background: `linear-gradient(135deg, ${T.brand}, ${T.blue})`,
                                    color: 'white', border: 'none', borderRadius: 50, padding: '9px 20px',
                                    fontSize: '0.86rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                    opacity: creating ? 0.6 : 1, whiteSpace: 'nowrap', textTransform: 'uppercase',
                                }}>
                                    {creating ? 'Creando…' : '+ Generar key'}
                                </button>
                            </div>
                            {error && <div style={{ background: T.redDim, border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: T.red, marginTop: 10 }}>⚠️ {error}</div>}
                        </div>

                        {/* Plans */}
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 14 }}>📦 Planes disponibles</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                                {plans.map(p => {
                                    const isYours = activeKeys.some(k => k.plan === p.id);
                                    const accent = p.id === 'agency' ? T.yellow : p.id === 'pro' ? T.blue : T.textSubtle;
                                    return (
                                        <div key={p.id} style={{
                                            background: T.bgCard,
                                            border: `1px solid ${isYours ? accent + '55' : T.border}`,
                                            borderRadius: 14, padding: '18px',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            {isYours && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                                <div>
                                                    <PlanBadge plan={p.id} />
                                                    {isYours && <span style={{ fontSize: '0.65rem', color: T.green, marginLeft: 6 }}>✓ Tu plan</span>}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: T.text }}>
                                                        {p.priceMontly === 0 ? 'Gratis' : `$${p.priceMontly}`}
                                                    </div>
                                                    {p.priceMontly > 0 && <div style={{ fontSize: '0.65rem', color: T.textSubtle }}>/mes USD</div>}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: accent, marginBottom: 10 }}>
                                                {p.requestsPerMonth.toLocaleString()} requests/mes
                                            </div>
                                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                {p.features.map((f, i) => (
                                                    <li key={i} style={{ fontSize: '0.78rem', color: T.textMuted, display: 'flex', gap: 6 }}>
                                                        <span style={{ color: T.green, flexShrink: 0 }}>✓</span>{f}
                                                    </li>
                                                ))}
                                            </ul>
                                            {!isYours && p.priceMontly > 0 && (
                                                <button
                                                    onClick={() => buyPlan(p.id, activeKeys[0]?.id)}
                                                    disabled={paying === p.id || !email}
                                                    style={{
                                                        marginTop: 14, width: '100%', fontFamily: 'inherit',
                                                        background: p.id === 'agency'
                                                            ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                                                            : 'linear-gradient(135deg,#3b82f6,#60a5fa)',
                                                        color: '#000', border: 'none', borderRadius: 9,
                                                        padding: '10px 0', fontSize: '0.84rem', fontWeight: 900,
                                                        cursor: paying === p.id ? 'not-allowed' : 'pointer',
                                                        opacity: paying === p.id ? 0.7 : 1,
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {paying === p.id ? '⏳ Redirigiendo…' : `💳 Contratar ${p.name} — $${p.priceMontly}/mes`}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* API Docs */}
                        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: '22px' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 16 }}>📖 Cómo usar la API</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    {
                                        title: 'POST /api/v1/analyze',
                                        badge: 'Todos los planes',
                                        badgeColor: T.green,
                                        desc: 'Analiza una URL y retorna score SEO, keywords, competidores y más.',
                                        code: `curl -X POST https://diagnosticoseo.vercel.app/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_TU_KEY" \\
  -d '{"url": "https://tu-sitio.com"}'`,
                                    },
                                    {
                                        title: 'POST /api/v1/generate-content',
                                        badge: 'Pro / Agency',
                                        badgeColor: T.blue,
                                        desc: 'Genera H1/H2/H3/párrafos/schema optimizados con GPT-4o.',
                                        code: `curl -X POST https://diagnosticoseo.vercel.app/api/v1/generate-content \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_TU_KEY" \\
  -d '{"url": "https://tu-sitio.com", "primaryKeyword": "tu keyword"}'`,
                                    },
                                ].map((ep, i) => (
                                    <div key={i} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                            <div>
                                                <code style={{ fontSize: '0.84rem', color: T.violet, fontWeight: 700 }}>{ep.title}</code>
                                                <span style={{ fontSize: '0.68rem', marginLeft: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: ep.badgeColor, fontWeight: 600 }}>
                                                    {ep.badge}
                                                </span>
                                            </div>
                                            <CopyBtn text={ep.code} label="Copiar curl" />
                                        </div>
                                        <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: T.textSubtle }}>{ep.desc}</div>
                                        <pre style={{
                                            padding: '12px 16px', margin: 0, overflowX: 'auto',
                                            fontSize: '0.72rem', color: '#86EFAC', fontFamily: 'monospace', lineHeight: 1.65,
                                            background: 'rgba(0,0,0,0.35)',
                                        }}>
                                            {ep.code}
                                        </pre>
                                    </div>
                                ))}
                            </div>

                            {/* Rate limit headers */}
                            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 9, border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textMuted, marginBottom: 8 }}>Headers de rate limit en cada respuesta:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {[
                                        ['X-RateLimit-Limit', 'Total requests de tu plan este mes'],
                                        ['X-RateLimit-Remaining', 'Requests disponibles'],
                                        ['X-RateLimit-Reset', 'Fecha de reset (ISO 8601)'],
                                        ['X-RateLimit-Plan', 'Tu plan actual: starter | pro | agency'],
                                    ].map(([h, d]) => (
                                        <div key={h} style={{ display: 'flex', gap: 10, fontSize: '0.72rem', alignItems: 'baseline' }}>
                                            <code style={{ color: T.violet, flexShrink: 0, minWidth: 200 }}>{h}</code>
                                            <span style={{ color: T.textSubtle }}>{d}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
