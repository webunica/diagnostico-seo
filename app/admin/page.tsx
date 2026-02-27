'use client';

import { useState, useCallback } from 'react';

/* ── Tokens ────────────────────────────────────────────────────────── */
const T = {
    bg: '#07090f', bgCard: 'rgba(255,255,255,0.03)', bgCardHov: 'rgba(255,255,255,0.055)',
    border: 'rgba(255,255,255,0.08)', borderMid: 'rgba(255,255,255,0.14)',
    text: '#f0f4ff', textMuted: 'rgba(240,244,255,0.65)', textSubtle: 'rgba(240,244,255,0.36)',
    purple: '#8b5cf6', purpleDim: 'rgba(139,92,246,0.14)', purpleBorder: 'rgba(139,92,246,0.3)',
    cyan: '#06b6d4', green: '#34d399', greenDim: 'rgba(52,211,153,0.1)', greenBorder: 'rgba(52,211,153,0.25)',
    blue: '#60a5fa', blueDim: 'rgba(96,165,250,0.09)', blueBorder: 'rgba(96,165,250,0.22)',
    yellow: '#fbbf24', yellowDim: 'rgba(251,191,36,0.08)', yellowBorder: 'rgba(251,191,36,0.25)',
    red: '#f87171', redDim: 'rgba(248,113,113,0.09)', redBorder: 'rgba(248,113,113,0.25)',
    violet: '#a78bfa',
} as const;

const pill = (bg: string, border: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: bg, border: `1px solid ${border}`,
    borderRadius: 20, padding: '2px 10px',
    fontSize: '0.68rem', fontWeight: 800,
    color, textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    whiteSpace: 'nowrap' as const,
    ...extra,
});

/* ── Types ────────────────────────────────────────────────────────── */
interface ApiKey {
    id: string; key: string; email: string; plan: string; label: string;
    requestsUsed: number; requestsLimit: number; resetAt: string;
    createdAt: string; lastUsedAt: string | null; isActive: boolean;
}

interface PlanDef { id: string; name: string; requestsPerMonth: number; priceMontly: number; }

const PLAN_STYLE: Record<string, { color: string; dim: string; border: string }> = {
    starter: { color: T.textMuted, dim: 'rgba(255,255,255,0.06)', border: T.border },
    pro: { color: T.blue, dim: T.blueDim, border: T.blueBorder },
    agency: { color: T.yellow, dim: T.yellowDim, border: T.yellowBorder },
};

function PlanBadge({ plan }: { plan: string }) {
    const s = PLAN_STYLE[plan] ?? PLAN_STYLE.starter;
    return <span style={pill(s.dim, s.border, s.color)}>{plan}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
    return active
        ? <span style={pill(T.greenDim, T.greenBorder, T.green)}>● activa</span>
        : <span style={pill(T.redDim, T.redBorder, T.red)}>○ revocada</span>;
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const color = pct >= 90 ? T.red : pct >= 70 ? T.yellow : T.green;
    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 3 }}>
                <span style={{ color: T.textSubtle }}>Uso</span>
                <span style={{ fontWeight: 700, color }}>{used}/{limit}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
        </div>
    );
}

/* ── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.68rem', color: T.textSubtle, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{value}</div>
        </div>
    );
}

/* ── Key row ───────────────────────────────────────────────────────── */
function KeyRow({ k, plans, onAction, busy }: {
    k: ApiKey;
    plans: PlanDef[];
    onAction: (action: string, id: string, extra?: Record<string, string>) => Promise<void>;
    busy: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [selPlan, setSelPlan] = useState(k.plan);

    return (
        <div style={{
            background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: 12, overflow: 'hidden',
            opacity: busy ? 0.6 : 1, transition: 'opacity 0.2s',
        }}>
            {/* Row header */}
            <div
                onClick={() => setExpanded(v => !v)}
                style={{
                    padding: '14px 18px', cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto',
                    gap: 14, alignItems: 'center',
                    userSelect: 'none',
                    background: expanded ? 'rgba(139,92,246,0.06)' : 'transparent',
                }}
            >
                {/* Email + label */}
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>{k.email}</div>
                    <div style={{ fontSize: '0.68rem', color: T.textSubtle, marginTop: 2 }}>
                        {k.label} · <code style={{ color: T.violet }}>{k.key}</code>
                    </div>
                </div>

                {/* Plan */}
                <PlanBadge plan={k.plan} />

                {/* Status */}
                <StatusBadge active={k.isActive} />

                {/* Usage */}
                <div style={{ width: 100 }}>
                    <UsageBar used={k.requestsUsed} limit={k.requestsLimit} />
                </div>

                {/* Expand */}
                <span style={{ color: T.textSubtle, fontSize: '0.8rem' }}>
                    {expanded ? '▲' : '▼'}
                </span>
            </div>

            {/* Expanded panel */}
            {expanded && (
                <div style={{
                    padding: '16px 18px', borderTop: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                    {/* Metadata */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.74rem', color: T.textSubtle }}>
                        <span>🆔 ID: <code style={{ color: T.textMuted }}>{k.id}</code></span>
                        <span>📅 Creada: {new Date(k.createdAt).toLocaleDateString('es-CL')}</span>
                        {k.lastUsedAt && <span>🕒 Último uso: {new Date(k.lastUsedAt).toLocaleDateString('es-CL')}</span>}
                        <span>🔄 Reset: {new Date(k.resetAt).toLocaleDateString('es-CL')}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* Plan selector + upgrade */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <select
                                value={selPlan}
                                onChange={e => setSelPlan(e.target.value)}
                                disabled={busy}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
                                    borderRadius: 8, padding: '6px 10px', color: T.text,
                                    fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer',
                                }}
                            >
                                {plans.map(p => (
                                    <option key={p.id} value={p.id} style={{ background: '#1a1f2e' }}>
                                        {p.name} ({p.requestsPerMonth} req/mes)
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => onAction('upgrade', k.id, { plan: selPlan })}
                                disabled={busy || selPlan === k.plan}
                                style={{
                                    background: selPlan === k.plan ? 'rgba(255,255,255,0.04)'
                                        : 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                                    color: selPlan === k.plan ? T.textSubtle : 'white',
                                    border: 'none', borderRadius: 8, padding: '6px 14px',
                                    fontSize: '0.8rem', fontWeight: 800, cursor: busy || selPlan === k.plan ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit', transition: 'all 0.2s',
                                }}
                            >
                                {busy ? '…' : selPlan === k.plan ? 'Plan actual' : `⬆ Cambiar a ${selPlan}`}
                            </button>
                        </div>

                        {/* Separador visual */}
                        <div style={{ width: 1, height: 28, background: T.border }} />

                        {/* Reset uso */}
                        <button
                            onClick={() => onAction('reset-usage', k.id)}
                            disabled={busy}
                            style={{
                                background: T.yellowDim, border: `1px solid ${T.yellowBorder}`,
                                borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700,
                                color: T.yellow, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            🔄 Reset contador
                        </button>

                        {/* Revocar / Reactivar */}
                        {k.isActive ? (
                            <button
                                onClick={() => onAction('revoke', k.id, { email: k.email })}
                                disabled={busy}
                                style={{
                                    background: T.redDim, border: `1px solid ${T.redBorder}`,
                                    borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700,
                                    color: T.red, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                🚫 Revocar
                            </button>
                        ) : (
                            <button
                                onClick={() => onAction('reactivate', k.id)}
                                disabled={busy}
                                style={{
                                    background: T.greenDim, border: `1px solid ${T.greenBorder}`,
                                    borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700,
                                    color: T.green, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                ✓ Reactivar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Admin Page ────────────────────────────────────────────────────── */
export default function AdminPage() {
    const [secret, setSecret] = useState('');
    const [authed, setAuthed] = useState(false);
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [plans, setPlans] = useState<PlanDef[]>([]);
    const [stats, setStats] = useState<{ total: number; active: number; backend: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const load = useCallback(async (sec = secret) => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`/api/admin/keys`, {
                headers: { 'X-Admin-Secret': sec },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'No autorizado');
            setKeys(data.keys ?? []);
            setPlans(data.plans ?? []);
            setStats({ total: data.total, active: data.active, backend: data.backend });
            setAuthed(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error');
        } finally {
            setLoading(false);
        }
    }, [secret]);

    const handleAction = useCallback(async (action: string, id: string, extra: Record<string, string> = {}) => {
        setBusyId(id); setError('');
        try {
            const res = await fetch('/api/admin/keys', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
                body: JSON.stringify({ action, id, ...extra }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error');
            showToast(`✓ ${data.message}`);
            await load(secret);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error');
        } finally {
            setBusyId(null);
        }
    }, [secret, load]);

    // Filter + search
    const filteredKeys = keys.filter(k => {
        const matchPlan = filter === 'all' || k.plan === filter || (filter === 'inactive' && !k.isActive);
        const matchSearch = !search || k.email.includes(search) || k.label.includes(search);
        return matchPlan && matchSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Nunito, sans-serif' }}>

            {/* Navbar */}
            <nav style={{
                position: 'fixed', inset: '0 0 auto 0', zIndex: 100, height: 58,
                padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: '1rem', color: T.purple, textDecoration: 'none' }}>
                        <div style={{ width: 28, height: 28, background: T.purple, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white' }}>🔍</div>
                        DiagnósticoSEO
                    </a>
                    <span style={{ color: T.border }}>›</span>
                    <span style={{ fontSize: '0.84rem', color: T.textSubtle }}>Panel Admin</span>
                </div>
                {stats && (
                    <div style={{ fontSize: '0.72rem', color: T.textSubtle }}>
                        Storage: <strong style={{ color: stats.backend === 'upstash' ? T.green : T.yellow }}>
                            {stats.backend === 'upstash' ? '⚡ Upstash Redis' : '📁 Local JSON'}
                        </strong>
                    </div>
                )}
            </nav>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '74px 20px 60px' }}>

                {/* ── AUTH ────────────────────────────────────────────── */}
                {!authed ? (
                    <div style={{ maxWidth: 420, margin: '60px auto 0' }}>
                        <div style={{
                            background: T.bgCard, border: `1px solid ${T.purpleBorder}`,
                            borderRadius: 16, padding: '28px 26px', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)' }} />
                            <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>🔐</div>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>Acceso Administrador</div>
                            <p style={{ fontSize: '0.84rem', color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                                Ingresa el <strong>ADMIN_SECRET</strong> definido en tus variables de entorno.
                            </p>
                            <input
                                type="password" placeholder="Admin secret…" value={secret}
                                onChange={e => setSecret(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && load()}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                                    borderRadius: 9, padding: '11px 14px', color: T.text,
                                    fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: 12, outline: 'none',
                                }}
                            />
                            {error && <div style={{ background: T.redDim, border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: T.red, marginBottom: 12 }}>⚠️ {error}</div>}
                            <button onClick={() => load()} disabled={loading} style={{
                                width: '100%', background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                                color: 'white', border: 'none', borderRadius: 10, padding: '12px',
                                fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                opacity: loading ? 0.6 : 1,
                            }}>
                                {loading ? 'Verificando…' : '→ Entrar al panel'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                            <StatCard label="Total keys" value={stats?.total ?? 0} color={T.text} />
                            <StatCard label="Keys activas" value={stats?.active ?? 0} color={T.green} />
                            <StatCard label="Plan Starter" value={keys.filter(k => k.plan === 'starter' && k.isActive).length} color={T.textMuted} />
                            <StatCard label="Plan Pro" value={keys.filter(k => k.plan === 'pro' && k.isActive).length} color={T.blue} />
                            <StatCard label="Plan Agency" value={keys.filter(k => k.plan === 'agency' && k.isActive).length} color={T.yellow} />
                        </div>

                        {/* Search + filter */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                                type="text" placeholder="🔍 Buscar por email o label…"
                                value={search} onChange={e => setSearch(e.target.value)}
                                style={{
                                    flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${T.border}`, borderRadius: 9,
                                    padding: '9px 14px', color: T.text, fontSize: '0.86rem',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                            />
                            {['all', 'starter', 'pro', 'agency', 'inactive'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{
                                    background: filter === f ? T.purpleDim : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${filter === f ? T.purpleBorder : T.border}`,
                                    borderRadius: 8, padding: '7px 14px', fontSize: '0.78rem', fontWeight: 700,
                                    color: filter === f ? T.violet : T.textSubtle,
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                    textTransform: 'capitalize',
                                }}>
                                    {f === 'all' ? `Todos (${keys.length})` : f}
                                </button>
                            ))}
                            <button onClick={() => load()} style={{
                                background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                                borderRadius: 8, padding: '7px 14px', fontSize: '0.78rem', fontWeight: 700,
                                color: T.textSubtle, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                ↻ Refrescar
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{ background: T.redDim, border: `1px solid ${T.redBorder}`, borderRadius: 9, padding: '10px 14px', fontSize: '0.83rem', color: T.red }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Table header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto auto auto',
                            gap: 14, padding: '8px 18px',
                            fontSize: '0.65rem', color: T.textSubtle,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            borderBottom: `1px solid ${T.border}`,
                        }}>
                            <span>Usuario / Key</span>
                            <span>Plan</span>
                            <span>Estado</span>
                            <span style={{ width: 100 }}>Uso</span>
                            <span></span>
                        </div>

                        {/* Key list */}
                        {filteredKeys.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: T.textSubtle, fontSize: '0.88rem' }}>
                                No hay keys que coincidan con el filtro.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {filteredKeys.map(k => (
                                    <KeyRow
                                        key={k.id} k={k} plans={plans}
                                        onAction={handleAction}
                                        busy={busyId === k.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 200,
                    background: T.greenDim, border: `1px solid ${T.greenBorder}`,
                    borderRadius: 12, padding: '12px 20px', fontSize: '0.85rem',
                    color: T.green, fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
}
