'use client';

import { useState } from 'react';
import Link from 'next/link';

const T = {
    bg: '#F7F7F9', bgCard: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
    text: '#101820', textMuted: '#52525B', orange: '#C2410C',
    green: '#059669', red: '#B91C1C'
} as const;

export default function ProductOptimizerPage() {
    const [apiKey, setApiKey] = useState('');
    const [name, setName] = useState('');
    const [kws, setKws] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const run = async () => {
        if (!apiKey || !name) { setError('API Key y Nombre de producto son obligatorios'); return; }
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await fetch('/api/v1/generate-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
                body: JSON.stringify({ productName: name, keywords: kws.split(',').map(k => k.trim()) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            setResult(data);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '40px 20px', fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Link href="/dashboard" style={{ color: '#52525B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>← Volver al Dashboard</Link>

                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: 20 }}>🛒 Optimizador de Fichas de Producto</h1>
                <p style={{ color: '#52525B', marginBottom: 30 }}>Genera contenido de alto rendimiento para e-commerce usando IA y SEO avanzado.</p>

                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Tu API Key (sk_live_...)</label>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Nombre del Producto</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ej: Smartwatch Pro X1" style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Keywords (separadas por coma)</label>
                        <input type="text" value={kws} onChange={e => setKws(e.target.value)} placeholder="ej: reloj inteligente, fitness tracker, oximetro" style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }} />
                    </div>

                    {error && <div style={{ color: T.red, fontSize: '0.85rem' }}>⚠️ {error}</div>}

                    <button onClick={run} disabled={loading} style={{
                        background: T.orange, color: '#fff', border: 'none', borderRadius: 50, padding: '14px',
                        fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(194,65,12,0.15)'
                    }}>
                        {loading ? 'Generando ficha...' : '🚀 Generar Ficha Optimizada'}
                    </button>
                </div>

                {result && (
                    <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: 16, border: `1px solid ${T.border}` }}>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: T.orange, marginBottom: 10 }}>Nombre Optimizado</h3>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{result.productName}</div>
                        </div>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: 16, border: `1px solid ${T.border}` }}>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: T.orange, marginBottom: 10 }}>Descripción</h3>
                            <div style={{ fontWeight: 800, marginBottom: 15 }}>{result.shortDescription}</div>
                            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: T.textMuted }}>{result.longDescription}</div>
                        </div>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: 16, border: `1px solid ${T.border}` }}>
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: T.orange, marginBottom: 10 }}>Ficha Técnica</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {result.technicalSpecs?.map((s: any, i: number) => (
                                    <div key={i} style={{ borderBottom: `1px solid ${T.border}`, padding: '8px 0', fontSize: '0.85rem' }}>
                                        <strong>{s.label}:</strong> {s.value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
