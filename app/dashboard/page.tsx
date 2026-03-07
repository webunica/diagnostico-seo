'use client';

import { useState, useCallback } from 'react';

/* ── Design Tokens ────────────────────────────────────────────────── */
const T = {
    bg: '#F8F7FF',
    bgCard: '#FFFFFF',
    border: '#E0DAFF',
    borderMid: '#F0EDFF',
    text: '#0E0C2C',
    textMuted: '#6C6893',
    textSubtle: '#8F8BA8',
    brand: '#673DE6',
    brandDim: '#F2F0FF',
    brandBorder: '#673DE6',
    accent: '#D1FD1F',
    green: '#22C55E',
    greenDim: '#F0FDF4',
    blue: '#3B82F6',
    blueDim: '#EFF6FF',
    yellow: '#F59E0B',
    yellowDim: '#FFFBEB',
    red: '#EF4444',
    redDim: '#FEF2F2',
    violet: '#4F2CC9',
} as const;

/* ── Types ────────────────────────────────────────────────────────── */
interface ApiKey {
    id: string; key: string; email: string; plan: string; label: string;
    requestsUsed: number; requestsLimit: number; resetAt: string;
    createdAt: string; lastUsedAt: string | null; isActive: boolean;
}
interface Plan { id: string; name: string; requestsPerMonth: number; priceMontly: number; features: string[]; }

/* ── Components ───────────────────────────────────────────────────── */
function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [c, setC] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 2000); }}
            style={{
                background: c ? T.greenDim : '#F1F5F9',
                border: `1px solid ${c ? T.green : T.border}`,
                borderRadius: 7, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800,
                color: c ? T.green : T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            {c ? '✓ COPIADO' : label.toUpperCase()}
        </button>
    );
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const color = pct >= 90 ? T.red : pct >= 70 ? T.yellow : T.green;
    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6, fontWeight: 700 }}>
                <span style={{ color: T.textSubtle }}>CONSUMO MENSUAL</span>
                <span style={{ color }}>{used} / {limit}</span>
            </div>
            <div style={{ background: '#F0EDFF', borderRadius: 50, height: 8, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 50,
                    background: color,
                    transition: 'width 0.5s ease',
                }} />
            </div>
        </div>
    );
}

function PlanBadge({ plan }: { plan: string }) {
    const cfg: Record<string, { color: string; dim: string }> = {
        starter: { color: T.textMuted, dim: '#F0EDFF' },
        pro: { color: T.blue, dim: T.blueDim },
        agency: { color: T.yellow, dim: T.yellowDim },
    };
    const c = cfg[plan] ?? cfg.starter;
    return (
        <span style={{
            fontSize: '0.7rem', fontWeight: 900, padding: '4px 12px', borderRadius: 50,
            background: c.dim, color: c.color, textTransform: 'uppercase', letterSpacing: '0.05em'
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

    const revokeKey = useCallback(async (id: string) => {
        if (!confirm('¿Estás seguro de revocar esta key? Dejará de funcionar inmediatamente.')) return;
        setRevoking(id);
        try {
            const res = await fetch('/api/keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, email }),
            });
            if (!res.ok) throw new Error('Error al revocar');
            await loadKeys(email);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setRevoking(null); }
    }, [email, loadKeys]);

    const buyPlan = useCallback(async (planId: string, keyId?: string) => {
        setPaying(planId);
        try {
            const res = await fetch('/api/create-plan-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, plan: planId, keyId: keyId ?? '' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Error');
            window.location.href = data.checkoutUrl;
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setPaying(null); }
    }, [email]);

    return (
        <main style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'Montserrat, sans-serif' }}>
            {/* Navbar */}
            <nav className="navbar" style={{ background: T.brand, height: '80px', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div className="navbar-logo">
                    <a href="/" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', textDecoration: 'none' }}>SEO DIAGNOSTICO</a>
                </div>
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <a href="/keywords" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Keywords</a>
                    <a href="/crawl" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Crawler</a>
                    <a href="/" style={{ fontSize: '0.85rem', color: '#000000', background: T.accent, padding: '12px 24px', fontWeight: 900, borderRadius: '50px', textDecoration: 'none' }}>Landing</a>
                </div>
            </nav>

            <div style={{ maxWidth: 1000, margin: '110px auto 60px', padding: '0 24px' }}>
                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg, #673DE6 0%, #4F2CC9 100%)', padding: '60px 48px', borderRadius: '32px', color: '#FFFFFF', marginBottom: 48, textAlign: 'center', boxShadow: '0 20px 60px rgba(103,61,230,0.15)' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: 16 }}>API Developer Center</h1>
                    <p style={{ fontSize: '1.2rem', color: '#E0DAFF', fontWeight: 500, maxWidth: 600, margin: '0 auto' }}>Gestiona tus llaves, revisa tu consumo e integra nuestra IA en tus productos profesionales.</p>
                </div>

                {!emailSent ? (
                    /* Login Form */
                    <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '24px', border: '1px solid #E0DAFF', maxWidth: 500, margin: '0 auto', boxShadow: '0 10px 40px rgba(103,61,230,0.05)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 24, textAlign: 'center' }}>Acceso al Portal</h2>
                        <div style={{ display: 'grid', gap: 20 }}>
                            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '2px solid #F0EDFF', background: '#F8F7FF', fontWeight: 600, fontFamily: 'inherit' }} />
                            <button onClick={() => loadKeys(email)} disabled={loading} style={{ background: T.brand, color: '#FFFFFF', border: 'none', borderRadius: '50px', padding: '16px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>{loading ? 'CARGANDO...' : 'VER MIS LLAVES API'}</button>
                            {error && <div style={{ color: T.red, fontWeight: 700, textAlign: 'center', fontSize: '0.9rem' }}>⚠️ {error}</div>}
                        </div>
                    </div>
                ) : (
                    /* Dashboard View */
                    <div style={{ display: 'grid', gap: 40 }}>
                        {/* User Bar */}
                        <div style={{ background: '#FFFFFF', padding: '24px 32px', borderRadius: '20px', border: '1px solid #E0DAFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: T.textMuted }}>USUARIO ACREDITADO</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: T.brand }}>{email}</div>
                            </div>
                            <button onClick={() => setEmailSent(false)} style={{ background: '#F0EDFF', color: T.text, border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 800, cursor: 'pointer' }}>CAMBIAR EMAIL</button>
                        </div>

                        {/* New Key Alert */}
                        {newKeyShown && (
                            <div style={{ background: T.yellowDim, border: `2px solid ${T.yellow}`, padding: '24px', borderRadius: '20px', animation: 'fadeIn 0.5s ease' }}>
                                <div style={{ fontWeight: 900, color: T.yellow, marginBottom: 12 }}>⚠️ GUARDA TU LLAVE API AHORA (SOLO SE MUESTRA UNA VEZ)</div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <code style={{ flex: 1, background: '#FFFFFF', padding: '14px', borderRadius: '10px', fontWeight: 700, border: '1px solid #F59E0B' }}>{newKeyShown}</code>
                                    <CopyBtn text={newKeyShown} label="Copiar Key" />
                                </div>
                            </div>
                        )}

                        {/* API Keys List */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>LLAVES API ACTIVAS</h2>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <input type="text" placeholder="Etiqueta para nueva key..." value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ padding: '10px 16px', borderRadius: '50px', border: '2px solid #F0EDFF', fontWeight: 600, fontSize: '0.85rem' }} />
                                    <button onClick={createKey} disabled={creating} style={{ background: T.brand, color: '#FFFFFF', border: 'none', padding: '10px 24px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}>{creating ? 'CREANDO...' : '+ NUEVA KEY'}</button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gap: 20 }}>
                                {keys.filter(k => k.isActive).length === 0 ? (
                                    <div style={{ padding: '48px', textAlign: 'center', background: '#FFFFFF', borderRadius: '24px', border: '1px dashed #E0DAFF', color: T.textMuted }}>No tienes llaves activas. Crea una arriba.</div>
                                ) : (
                                    keys.filter(k => k.isActive).map(k => (
                                        <div key={k.id} style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E0DAFF', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                                <div>
                                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                                        <PlanBadge plan={k.plan} />
                                                        <span style={{ fontWeight: 800, color: T.text }}>{k.label.toUpperCase()}</span>
                                                    </div>
                                                    <code style={{ fontSize: '0.9rem', color: T.textMuted }}>{k.key}</code>
                                                </div>
                                                <button onClick={() => revokeKey(k.id)} disabled={revoking === k.id} style={{ background: T.redDim, color: T.red, border: 'none', padding: '8px 16px', borderRadius: '50px', fontWeight: 900, cursor: 'pointer' }}>{revoking === k.id ? '...' : 'ELIMINAR'}</button>
                                            </div>
                                            <UsageBar used={k.requestsUsed} limit={k.requestsLimit} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Documentation Table */}
                        <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E0DAFF', overflow: 'hidden' }}>
                            <div style={{ background: T.brand, color: '#FFFFFF', padding: '24px 32px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>GUÍA RÁPIDA DE INTEGRACIÓN</h3>
                            </div>
                            <div style={{ padding: '32px' }}>
                                <div style={{ display: 'grid', gap: 16 }}>
                                    {[
                                        { ep: 'POST /api/v1/analyze', desc: 'Análisis SEO completo de una URL.' },
                                        { ep: 'POST /api/v1/keywords', desc: 'Exploración de keywords IA para un nicho.' },
                                    ].map(item => (
                                        <div key={item.ep} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#F8F7FF', borderRadius: '12px' }}>
                                            <div>
                                                <code style={{ fontWeight: 800, color: T.brand }}>{item.ep}</code>
                                                <div style={{ fontSize: '0.8rem', color: T.textMuted, marginTop: 4 }}>{item.desc}</div>
                                            </div>
                                            <CopyBtn text={`curl -X POST https://diagnosticoseo.vercel.app${item.ep.split(' ')[1]} -H "X-API-Key: TU_KEY"`} label="Curl" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </main>
    );
}
