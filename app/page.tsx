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
    <main style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', fontFamily: 'Montserrat, sans-serif' }}>
      {/* Navbar Minimalista Premium */}
      <nav className="navbar" style={{
        background: '#000000',
        borderBottom: '2px solid #FFFFFF',
        height: '74px',
        padding: '0 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0, left: 0, right: 0, zIndex: 1000
      }}>
        <div className="navbar-logo">
          <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#FFFFFF' }}>SEO DIAGNOSTICO</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="/keywords" style={{ fontSize: '0.9rem', color: '#EEEEEE', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'none' }}>Keywords</a>
          <a href="/crawl" style={{ fontSize: '0.9rem', color: '#EEEEEE', fontWeight: 800, textTransform: 'uppercase', textDecoration: 'none' }}>Crawler</a>
          <a href="/dashboard" style={{
            fontSize: '0.85rem', color: '#000000', background: '#FFFFFF',
            padding: '10px 22px', fontWeight: 900, textTransform: 'uppercase',
            textDecoration: 'none', border: '2px solid #FFFFFF'
          }}>Acceso Pro</a>
        </div>
      </nav>

      {/* Hero Night Mode Premium */}
      <section style={{
        paddingTop: 180,
        paddingBottom: 100,
        textAlign: 'center',
        background: '#000000',
        borderBottom: '3px solid #FFFFFF',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            border: '2px solid #FFFFFF', borderRadius: 0,
            padding: '8px 20px', fontSize: '0.8rem', fontWeight: 900,
            color: '#FFFFFF', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.15em'
          }}>
            <span style={{ width: 8, height: 8, background: '#FFFFFF', display: 'inline-block' }} />
            Analiza tu SEO con Inteligencia Artificial
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            fontWeight: 900,
            marginBottom: 24,
            lineHeight: 0.9,
            letterSpacing: '-0.06em',
            color: '#FFFFFF',
            textTransform: 'uppercase'
          }}>
            El Diagnóstico <br />
            <span style={{ color: '#000000', background: '#FFFFFF', padding: '0 10px' }}>Más Rápido</span>
          </h1>

          <p style={{
            fontSize: '1.3rem',
            color: '#AAAAAA',
            maxWidth: 680,
            margin: '0 auto 48px',
            lineHeight: 1.5,
            fontWeight: 600
          }}>
            Auditoría técnica y de contenido en segundos. Identifica errores críticos,
            optimiza tus keywords y supera a tu competencia con reportes profesionales.
          </p>

          {/* URL Bar Premium */}
          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              background: '#000000',
              border: '4px solid #FFFFFF',
              borderRadius: 0,
              padding: '4px',
              overflow: 'hidden',
            }}>
              <input
                type="text"
                placeholder="INGRESA TU SITIO WEB (EJ: WWW.TUSITIO.COM)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading || freeLoading}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: '#FFFFFF',
                  padding: '16px 24px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleFree}
                disabled={loading || freeLoading}
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  padding: '0 40px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {freeLoading ? 'Analizando...' : 'Analizar Gratis'}
              </button>
            </div>
            {error && (
              <div style={{ color: '#FFFFFF', background: '#FF0000', padding: '10px', marginTop: 12, fontWeight: 900, textTransform: 'uppercase' }}>
                ⚠️ {error}
              </div>
            )}
            <p style={{ color: '#888888', marginTop: 24, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Reporte instantáneo con métricas On-Page, Técnico y Contenido
            </p>
          </div>
        </div>
      </section>

      {/* Features Section Night Mode */}
      <section style={{ padding: '120px 24px', background: '#000000' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 16 }}>Herramientas de Elite</h2>
            <div style={{ width: 100, height: 6, background: '#FFFFFF', margin: '0 auto' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            {[
              { title: 'Auditoría Técnica', desc: 'Analizamos sitemaps, robots.txt, velocidad de carga y estructura de tags.' },
              { title: 'Content AI', desc: 'Generamos títulos, descripciones y copys optimizados usando modelos GPT avanzados.' },
              { title: 'Keywords IA', desc: 'Descubre palabras clave estratégicas basadas en el nicho real de tu negocio.' },
            ].map((feat, i) => (
              <div key={i} style={{
                padding: '48px',
                border: '3px solid #FFFFFF',
                transition: 'all 0.3s',
                background: 'transparent'
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = '#FFFFFF';
                  (e.currentTarget as HTMLDivElement).style.color = '#000000';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  (e.currentTarget as HTMLDivElement).style.color = '#FFFFFF';
                }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 16, textTransform: 'uppercase' }}>{feat.title}</h3>
                <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, opacity: 0.8 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="steps-section" style={{ background: '#000000', padding: '120px 24px', borderBottom: '3px solid #FFFFFF' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p className="section-label" style={{ color: '#AAAAAA', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>Proceso</p>
          <h2 className="section-title" style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Listo en 4 pasos simples</h2>
          <p className="section-subtitle" style={{ fontSize: '1.2rem', color: '#AAAAAA', maxWidth: 680, margin: '0 auto 60px', lineHeight: 1.6, fontWeight: 600, textAlign: 'center' }}>Sin registro, sin suscripciones. Paga y obtén tu reporte al instante.</p>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
            {STEPS.map(s => (
              <div className="step-item" key={s.n} style={{ padding: '32px', border: '2px solid #FFFFFF', borderRadius: 0, textAlign: 'center' }}>
                <div className="step-number" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', marginBottom: 16 }}>{s.n}</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>{s.title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#AAAAAA', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" style={{ background: '#000000', padding: '120px 24px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p className="section-label" style={{ color: '#AAAAAA', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>Precio</p>
          <h2 className="section-title" style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Un solo precio, todo incluido</h2>
          <p className="section-subtitle" style={{ fontSize: '1.2rem', color: '#AAAAAA', maxWidth: 680, margin: '0 auto 60px', lineHeight: 1.6, fontWeight: 600, textAlign: 'center' }}>Sin suscripción. Sin registro. Paga solo cuando necesites.</p>

          <div className="pricing-card" style={{ maxWidth: 420, margin: '0 auto', background: '#111111', border: '4px solid #FFFFFF', borderRadius: 0, padding: '48px 32px', textAlign: 'center', position: 'relative' }}>
            <div className="pricing-badge" style={{ display: 'inline-block', background: '#FFFFFF', color: '#000000', padding: '8px 20px', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Pago único por reporte</div>
            <div className="pricing-price" style={{ fontSize: '3.8rem', fontWeight: 900, color: '#FFFFFF', marginBottom: 8 }}>
              <span className="pricing-currency" style={{ fontSize: '2rem', verticalAlign: 'super' }}>$</span>9.990
            </div>
            <p className="pricing-period" style={{ fontSize: '1rem', color: '#AAAAAA', marginBottom: 40, fontWeight: 700 }}>pesos chilenos · por reporte</p>

            <ul className="pricing-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', textAlign: 'left' }}>
              {PRICING_FEATURES.map(f => (
                <li key={f.text} style={{ fontSize: '1rem', color: '#FFFFFF', marginBottom: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 10, height: 10, background: '#FFFFFF' }}></span>
                  {f.text}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="TU@EMAIL.COM"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || freeLoading}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '2px solid #FFFFFF',
                    borderRadius: 0,
                    marginBottom: 10,
                    padding: '14px 16px',
                    boxSizing: 'border-box',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontFamily: 'inherit',
                    textTransform: 'uppercase'
                  }}
                />
                <input
                  type="text"
                  placeholder="HTTPS://TUSITIO.COM"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={loading || freeLoading}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '2px solid #FFFFFF',
                    borderRadius: 0,
                    padding: '14px 16px',
                    boxSizing: 'border-box',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontFamily: 'inherit',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                <button className="btn-buy" type="submit" disabled={loading || freeLoading} style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 0, padding: '18px',
                  fontSize: '1.2rem', fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase'
                }}>
                  {loading ? 'PROCESANDO...' : 'Obtener Reporte — $9.990'}
                </button>
                <button
                  type="button"
                  onClick={handleFree}
                  disabled={loading || freeLoading}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: 0, padding: '12px',
                    color: '#FFFFFF', fontSize: '0.9rem',
                    fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                >
                  {freeLoading ? 'CARGANDO...' : 'Prueba Gratuita'}
                </button>
              </div>
            </form>

            {error && <div style={{ color: '#FF0000', marginTop: 24, fontWeight: 900 }}>⚠️ {error}</div>}

            <p style={{ fontSize: '0.8rem', color: '#888888', marginTop: 40, fontWeight: 800, textTransform: 'uppercase' }}>
              🔒 Pago 100% seguro · PDF Incluido
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#000000',
        color: '#FFFFFF',
        padding: '80px 24px',
        textAlign: 'center',
        borderTop: '3px solid #FFFFFF'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 24, letterSpacing: '-0.04em' }}>SEO DIAGNOSTICO</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            © 2026 WEBUNICA · AGENCIA DE SEO & IA EN CHILE
          </div>
        </div>
      </footer>
    </main>
  );
}
