'use client';

import { useState } from 'react';
import Link from 'next/link';

const T = {
    bg: '#F7F7F9', bgCard: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
    text: '#101820', textMuted: '#52525B', orange: '#C2410C',
    green: '#059669', red: '#B91C1C', primary: '#A855F7', secondary: '#84CC16'
} as const;

export default function SeoWizardPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);

    // Form State
    const [topic, setTopic] = useState('');
    const [primaryKeyword, setPrimaryKeyword] = useState('');
    const [secondaryKeywords, setSecondaryKeywords] = useState('');
    const [location, setLocation] = useState('España');
    const [targetAudience, setTargetAudience] = useState('');
    const [tone, setTone] = useState('Profesional');
    const [apiKey, setApiKey] = useState('');

    const nextStep = () => {
        if (step === 1 && (!topic || !primaryKeyword)) {
            setError('Tema y Keyword Principal son obligatorios.');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const generateContent = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await fetch('/api/seo-wizard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    primaryKeyword,
                    secondaryKeywords,
                    location,
                    targetAudience,
                    tone,
                    apiKey
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al generar contenido');
            setResult(data);
            setStep(4); // Mostrar resultados
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicators = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: T.border, zIndex: 0 }}></div>
            {[1, 2, 3, 4].map(num => {
                const isActive = step >= num;
                return (
                    <div key={num} style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: isActive ? T.primary : T.bgCard,
                        color: isActive ? '#fff' : T.textMuted, border: `2px solid ${isActive ? T.primary : T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 1,
                        transition: 'all 0.3s'
                    }}>
                        {num}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '40px 20px', fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Link href="/dashboard" style={{ color: '#52525B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>← Volver al Dashboard</Link>

                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: 20, color: T.primary }}>✨ Creador de Páginas SEO (Wizard)</h1>
                <p style={{ color: '#52525B', marginBottom: 30, fontSize: '1.05rem' }}>Genera estructuras y contenidos 100/100 optimizados SEO respondiendo unas breves preguntas.</p>

                {renderStepIndicators()}

                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    
                    {error && <div style={{ color: T.red, background: '#FEE2E2', padding: '12px', borderRadius: 8, marginBottom: 20, fontSize: '0.9rem', fontWeight: 600 }}>⚠️ {error}</div>}

                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Paso 1: Temática Básica</h2>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Tema de la Página / Título Inicial *</label>
                                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: Servicios de Fontanería en Madrid" style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Keyword Principal *</label>
                                <input type="text" value={primaryKeyword} onChange={e => setPrimaryKeyword(e.target.value)} placeholder="Ej: fontanero madrid" style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem' }} />
                                <small style={{ color: T.textMuted, fontSize: '0.75rem', marginTop: 4, display: 'block' }}>La palabra clave por la que quieres que te encuentren en Google.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Keywords Secundarias (Opcional)</label>
                                <input type="text" value={secondaryKeywords} onChange={e => setSecondaryKeywords(e.target.value)} placeholder="Ej: urgencias 24h, desatascos baratos" style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                                <button onClick={nextStep} style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '14px 28px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)' }}>
                                    Siguiente Paso →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Paso 2: Audiencia y Contexto</h2>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Localidad / País (Opcional)</label>
                                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ej: Madrid, España / Ciudad de México / Global" style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem' }} />
                                <small style={{ color: T.textMuted, fontSize: '0.75rem', marginTop: 4, display: 'block' }}>Para adaptar el vocabulario y las intenciones de búsqueda locales.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Público Objetivo (Opcional)</label>
                                <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Ej: Propietarios de viviendas, Empresas multinacionales..." style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Tono de Voz</label>
                                <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem', background: '#fff', appearance: 'auto' }}>
                                    <option value="Profesional">Profesional y Confiable</option>
                                    <option value="Cercano">Cercano y Amigable</option>
                                    <option value="Técnico">Técnico y Experto</option>
                                    <option value="Urgente">Orientado a la Urgencia / Acción</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                <button onClick={prevStep} style={{ background: '#E4E4E7', color: T.text, border: 'none', borderRadius: 8, padding: '14px 28px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    ← Volver
                                </button>
                                <button onClick={nextStep} style={{ background: T.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '14px 28px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)' }}>
                                    Siguiente Paso →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Paso 3: Generación</h2>
                            <p style={{ color: T.textMuted }}>Estamos listos para construir la página SEO perfecta. Por favor revisa que cuentes con saldo o ingresa tu API Key si estás usando tu propia cuota.</p>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, color: T.textMuted }}>Tu API Key (Opcional, si no envías usarás la del sistema)</label>
                                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." style={{ width: '100%', padding: '14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', fontSize: '1rem' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                                <button onClick={prevStep} disabled={loading} style={{ background: '#E4E4E7', color: T.text, border: 'none', borderRadius: 8, padding: '14px 28px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.6 : 1 }}>
                                    ← Volver
                                </button>
                                <button onClick={generateContent} disabled={loading} style={{ background: T.secondary, color: '#fff', border: 'none', borderRadius: 8, padding: '14px 28px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(132, 204, 22, 0.3)', opacity: loading ? 0.6 : 1 }}>
                                    {loading ? 'Haciendo Magia... ⏳' : '🚀 Generar Página SEO'}
                                </button>
                            </div>
                            {loading && (
                                <div style={{ textAlign: 'center', marginTop: 20, color: T.secondary, fontWeight: 700 }}>
                                    Analizando SERPs y creando contenido optimizado... Esto puede tardar unos 30 segundos.
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && result && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.green }}>✨ Página Generada con Éxito</h2>
                                <button onClick={() => setStep(1)} style={{ background: '#E4E4E7', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
                                    Crear otra
                                </button>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: `1px solid ${T.border}` }}>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: T.primary, fontWeight: 800, marginBottom: 8 }}>Configuración Meta</h3>
                                <div style={{ marginBottom: 15 }}>
                                    <span style={{ fontWeight: 800 }}>Slug URL:</span> <span style={{ color: T.textMuted }}>/{result.slug}</span>
                                </div>
                                <div style={{ marginBottom: 15 }}>
                                    <span style={{ fontWeight: 800 }}>Title Tag:</span> <span style={{ color: T.textMuted }}>{result.titleTag}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 800 }}>Meta Description:</span> <span style={{ color: T.textMuted }}>{result.metaDescription}</span>
                                </div>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: `1px solid ${T.border}` }}>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: T.primary, fontWeight: 800, marginBottom: 12 }}>Contenido Principal</h3>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>{result.h1}</h1>
                                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: T.textMuted, marginBottom: 20 }}>{result.intro}</p>
                                
                                {result.sections?.map((sec: any, i: number) => (
                                    <div key={i} style={{ marginBottom: 20 }}>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 10, color: '#1E293B' }}>{sec.h2}</h2>
                                        <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: T.textMuted }} dangerouslySetInnerHTML={{ __html: sec.content?.replace(/\n/g, '<br/>') || '' }} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ background: '#FFFBEB', padding: 20, borderRadius: 12, border: '1px solid #FEF3C7' }}>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#D97706', fontWeight: 800, marginBottom: 12 }}>Sugerencias de Imágenes (Alt Texts)</h3>
                                <ul style={{ margin: 0, paddingLeft: 20, color: '#92400E', fontSize: '0.95rem' }}>
                                    {result.imageSuggestions?.map((img: any, i: number) => (
                                        <li key={i} style={{ marginBottom: 10 }}>
                                            <strong>{img.altText}:</strong> {img.description}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ background: '#F0FDF4', padding: 20, borderRadius: 12, border: '1px solid #DCFCE7' }}>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#166534', fontWeight: 800, marginBottom: 12 }}>Llamada a la Acción (CTA)</h3>
                                <p style={{ color: '#166534', fontWeight: 600, fontSize: '1.05rem', margin: 0 }}>{result.cta}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
