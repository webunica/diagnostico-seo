'use client';

import { useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────
type ScoreStatus = 'good' | 'warning' | 'critical';

interface FeatureItem {
  icon: string;
  color: string;
  title: string;
  desc: string;
}

interface StepItem {
  n: string;
  title: string;
  desc: string;
}

interface PricingFeature {
  text: string;
}

// ── Data ──────────────────────────────────────────────────────────────
const FEATURES: FeatureItem[] = [
  { icon: '🔧', color: 'blue', title: 'SEO Técnico', desc: 'Rastreabilidad, indexabilidad, robots.txt, sitemap, HTTPS y redirecciones.' },
  { icon: '📝', color: 'cyan', title: 'On-Page SEO', desc: 'Title tags, meta descriptions, headings H1-H6 y estructura semántica.' },
  { icon: '🏗️', color: 'purple', title: 'Datos Estructurados', desc: 'Detección de Schema.org y recomendaciones JSON-LD para rich snippets.' },
  { icon: '🖼️', color: 'yellow', title: 'Imágenes', desc: 'Alt text faltante, formatos, imágenes en sitemap y Google Images.' },
  { icon: '📊', color: 'green', title: 'Contenido & E-E-A-T', desc: 'Thin content, signals de autoridad, expertise y confianza en el sitio.' },
  { icon: '⚡', color: 'red', title: 'Plan de Acción', desc: 'Issues priorizados: Crítico → Alto → Medio → Bajo con tiempos estimados.' },
];

const STEPS: StepItem[] = [
  { n: '1', title: 'Ingresa la URL', desc: 'Escribe la dirección del sitio que quieres analizar.' },
  { n: '2', title: 'Pago seguro', desc: 'Paga $9.990 CLP con MercadoPago. Acepta tarjetas y transferencias.' },
  { n: '3', title: 'Diagnóstico IA', desc: 'ChatGPT analiza el sitio en 30–60 segundos.' },
  { n: '4', title: 'Descarga el PDF', desc: 'Recibe tu reporte completo listo para compartir.' },
];

const PRICING_FEATURES: PricingFeature[] = [
  { text: 'Score SEO global (0–100)' },
  { text: 'Auditoría técnica completa' },
  { text: 'Análisis On-Page en detalle' },
  { text: 'Evaluación de Schema Markup' },
  { text: 'Issues priorizados por severidad' },
  { text: '5+ Quick Wins implementables' },
  { text: 'Plan de acción 30/60/90 días' },
  { text: 'Reporte descargable en PDF' },
  { text: 'Potenciado por ChatGPT (GPT-4o)' },
];

const SAMPLE_BARS = [
  { label: 'SEO Técnico', pct: 35, status: 'critical' as ScoreStatus },
  { label: 'On-Page SEO', pct: 65, status: 'warning' as ScoreStatus },
  { label: 'Contenido', pct: 82, status: 'good' as ScoreStatus },
  { label: 'Schema', pct: 12, status: 'critical' as ScoreStatus },
  { label: 'Imágenes', pct: 55, status: 'warning' as ScoreStatus },
];

// ── Main Component ────────────────────────────────────────────────────
export default function HomePage() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [coupon, setCoupon] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponOk, setCouponOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Validación simple de email ──────────────────────────────────────
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // ── Análisis gratuito ──────────────────────────────────────────────
  const handleFree = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setError('');
    if (!url.trim()) { setError('Por favor ingresa una URL.'); return; }
    if (!email.trim() || !isValidEmail(email.trim())) { setError('Por favor ingresa un correo válido.'); return; }
    setFreeLoading(true);
    // Agregamos email a la URL de preview para seguimiento
    window.location.href = `/preview?url=${encodeURIComponent(url.trim())}&email=${encodeURIComponent(email.trim())}`;
  }, [url, email]);

  // ── Análisis de pago / cupón ───────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCouponOk(false);
    if (!url.trim()) { setError('Por favor ingresa una URL.'); return; }
    if (!email.trim() || !isValidEmail(email.trim())) { setError('Por favor ingresa un correo válido.'); return; }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        url: url.trim(),
        email: email.trim()
      };
      if (coupon.trim()) body.coupon = coupon.trim();

      const res = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Error al procesar.');

      if (data.couponApplied) {
        setCouponOk(true);
        await new Promise(r => setTimeout(r, 800));
      }

      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
      setLoading(false);
    }
  }, [url, email, coupon]);

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF', color: '#0E0C2C', fontFamily: 'Montserrat, sans-serif' }}>
      {/* Navbar Hostinger Style */}
      <nav className="navbar" style={{
        background: '#673DE6',
        borderBottom: 'none',
        height: '80px',
        padding: '0 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0, zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div className="navbar-logo">
          <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#FFFFFF' }}>SEO DIAGNOSTICO</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="/keywords" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Keywords</a>
          <a href="/crawl" style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>Crawler</a>
          <a href="/dashboard" style={{
            fontSize: '0.85rem', color: '#000000', background: '#D1FD1F',
            padding: '12px 24px', fontWeight: 900, textTransform: 'uppercase',
            textDecoration: 'none', borderRadius: '50px',
            transition: 'transform 0.2s'
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >Acceso Pro</a>
        </div>
      </nav>

      {/* Hero Hostinger Style */}
      <section style={{
        paddingTop: 180,
        paddingBottom: 100,
        textAlign: 'center',
        background: 'linear-gradient(135deg, #673DE6 0%, #4F2CC9 100%)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0 0 50px 50px'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(209, 253, 31, 0.15)',
            border: '1px solid #D1FD1F',
            borderRadius: '50px',
            padding: '8px 24px', fontSize: '0.85rem', fontWeight: 800,
            color: '#D1FD1F', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            🔥 Herramienta SEO N°1 en Chile
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            marginBottom: 24,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
          }}>
            Ellos triunfan online, <br />
            <span style={{ color: '#D1FD1F' }}>ahora es tu turno</span>
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: '#E0DAFF',
            maxWidth: 680,
            margin: '0 auto 48px',
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            Analiza tu sitio, identifica errores y mejora tu posicionamiento en minutos.
            Auditoría SEO avanzada impulsada por IA.
          </p>

          {/* URL Bar Hostinger */}
          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              background: '#FFFFFF',
              borderRadius: '50px',
              padding: '6px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}>
              <input
                type="text"
                placeholder="Ingresa tu dominio (ej: tusitio.com)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading || freeLoading}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: '#0E0C2C',
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleFree}
                disabled={loading || freeLoading}
                style={{
                  background: '#12103E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0 40px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  borderRadius: '50px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#000000'}
                onMouseOut={e => e.currentTarget.style.background = '#12103E'}
              >
                {freeLoading ? 'Analizando...' : 'Buscar'}
              </button>
            </div>
            {error && (
              <div style={{ color: '#FF4D4D', background: 'rgba(255, 77, 77, 0.1)', padding: '12px', marginTop: 16, fontWeight: 700, borderRadius: '12px' }}>
                ⚠️ {error}
              </div>
            )}
            <p style={{ color: '#E0DAFF', marginTop: 24, fontSize: '0.85rem', fontWeight: 600 }}>
              Análisis gratuito instantáneo • Resultados precisos • Potenciado con IA
            </p>
          </div>
        </div>
      </section>

      {/* Features Hostinger Style */}
      <section style={{ padding: '120px 24px', background: '#F8F7FF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span style={{
              background: '#E0DAFF', color: '#673DE6',
              padding: '6px 16px', borderRadius: '50px',
              fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase'
            }}>Herramientas</span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginTop: 16 }}>Soluciones SEO de Elite</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            {[
              { title: 'Auditoría Técnica', desc: 'Analizamos sitemaps, robots.txt, velocidad de carga y estructura de tags.' },
              { title: 'Content AI', desc: 'Generamos títulos, descripciones y copys optimizados usando modelos GPT avanzados.' },
              { title: 'Keywords IA', desc: 'Descubre palabras clave estratégicas basadas en el nicho real de tu negocio.' },
            ].map((feat, i) => (
              <div key={i} style={{
                padding: '48px',
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E0DAFF',
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(103, 61, 230, 0.05)'
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-10px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#673DE6';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#E0DAFF';
                }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 16, color: '#673DE6' }}>{feat.title}</h3>
                <p style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, color: '#6C6893' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Hostinger Style */}
      <section style={{ background: '#FFFFFF', padding: '120px 24px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{
              background: '#F0EDFF', color: '#673DE6',
              padding: '6px 16px', borderRadius: '50px',
              fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase'
            }}>Proceso</span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginTop: 16 }}>Listo en 4 pasos simples</h2>
            <p style={{ fontSize: '1.2rem', color: '#6C6893', maxWidth: 680, margin: '16px auto 0' }}>Sin registro, sin suscripciones. Paga y obtén tu reporte al instante.</p>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
            {STEPS.map(s => (
              <div className="step-item" key={s.n} style={{
                padding: '40px',
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E0DAFF',
                textAlign: 'center',
                transition: 'all 0.3s'
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 15px 40px rgba(103, 61, 230, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div className="step-number" style={{
                  fontSize: '3rem', fontWeight: 900,
                  color: '#673DE6', marginBottom: 16, opacity: 0.2
                }}>0{s.n}</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: '1rem', color: '#6C6893', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hostinger Style */}
      <section className="section" style={{ background: '#F8F7FF', padding: '120px 24px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={{
              background: '#D1FD1F', color: '#000000',
              padding: '6px 20px', borderRadius: '50px',
              fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase'
            }}>Oferta por tiempo limitado</span>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginTop: 16 }}>Acceso Completo con Pago Único</h2>
          </div>

          <div className="pricing-card" style={{
            maxWidth: 480, margin: '0 auto',
            background: '#FFFFFF',
            borderRadius: '32px', padding: '60px 48px',
            textAlign: 'center', position: 'relative',
            boxShadow: '0 20px 60px rgba(103, 61, 230, 0.1)',
            border: '2px solid #E0DAFF'
          }}>
            <div className="pricing-price" style={{ fontSize: '4.5rem', fontWeight: 900, color: '#673DE6', marginBottom: 8 }}>
              <span className="pricing-currency" style={{ fontSize: '2rem', verticalAlign: 'super' }}>$</span>9.990
            </div>
            <p className="pricing-period" style={{ fontSize: '1.1rem', color: '#6C6893', marginBottom: 48, fontWeight: 700 }}>pesos chilenos · Pago único</p>

            <ul className="pricing-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 48px 0', textAlign: 'left' }}>
              {PRICING_FEATURES.map(f => (
                <li key={f.text} style={{ fontSize: '1.1rem', color: '#0E0C2C', marginBottom: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: '#D1FD1F', borderRadius: '50%', color: '#000000', fontSize: '14px', fontWeight: 900 }}>✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || freeLoading}
                  style={{
                    width: '100%',
                    background: '#F8F7FF',
                    border: '1px solid #E0DAFF',
                    borderRadius: '12px',
                    marginBottom: 12,
                    padding: '16px 20px',
                    boxSizing: 'border-box',
                    color: '#0E0C2C',
                    fontWeight: 600,
                    fontFamily: 'inherit'
                  }}
                />
                <input
                  type="text"
                  placeholder="https://tu-sitio-web.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={loading || freeLoading}
                  style={{
                    width: '100%',
                    background: '#F8F7FF',
                    border: '1px solid #E0DAFF',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxSizing: 'border-box',
                    color: '#0E0C2C',
                    fontWeight: 600,
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <button className="btn-buy" type="submit" disabled={loading || freeLoading} style={{
                  background: '#D1FD1F',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '50px', padding: '20px',
                  fontSize: '1.2rem', fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase'
                }}>
                  {loading ? 'PROCESANDO...' : 'Obtener Diagnóstico'}
                </button>
              </div>
            </form>

            {error && <div style={{ color: '#FF4D4D', marginTop: 20, fontWeight: 700 }}>⚠️ {error}</div>}

            <p style={{ fontSize: '0.85rem', color: '#6C6893', marginTop: 32, fontWeight: 700, textTransform: 'uppercase' }}>
              🔒 Pago Seguro • Soporte 24/7 • PDF Incluido
            </p>
          </div>
        </div>
      </section>

      {/* Footer Hostinger Style */}
      <footer style={{
        background: '#0E0C2C',
        color: '#FFFFFF',
        padding: '100px 24px',
        textAlign: 'center',
        borderRadius: '50px 50px 0 0'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 24, letterSpacing: '-0.04em' }}>SEO DIAGNOSTICO</div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginBottom: 48 }}>
            <a href="/keywords" style={{ color: '#E0DAFF', textDecoration: 'none', fontWeight: 700 }}>Keywords</a>
            <a href="/crawl" style={{ color: '#E0DAFF', textDecoration: 'none', fontWeight: 700 }}>Crawler</a>
            <a href="/dashboard" style={{ color: '#E0DAFF', textDecoration: 'none', fontWeight: 700 }}>API</a>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            © 2026 WEBUNICA · AGENCIA DE SEO & IA EN CHILE
          </div>
        </div>
      </footer>
    </main>
  );
}
