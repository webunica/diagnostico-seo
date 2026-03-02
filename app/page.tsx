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
    <div style={{ minHeight: '100vh', background: '#F7F7F9', color: '#101820', fontFamily: 'Montserrat, sans-serif' }}>
      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="navbar" style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="navbar-logo">
          <span style={{ color: '#C2410C', fontWeight: 900, fontSize: '1.25rem' }}>SEO Diagnostico</span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/keywords" style={{ fontSize: '0.85rem', color: '#52525B', fontWeight: 700, textDecoration: 'none' }}>Keywords</a>
          <a href="/crawl" style={{ fontSize: '0.85rem', color: '#52525B', fontWeight: 700, textDecoration: 'none' }}>Crawl</a>
          <a href="/dashboard" style={{ fontSize: '0.85rem', color: '#52525B', fontWeight: 700, textDecoration: 'none' }}>API</a>
          <div style={{ padding: '6px 12px', background: 'rgba(255,105,0,0.1)', color: '#C2410C', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            $9.990 CLP
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 120,
        paddingBottom: 80,
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 0%, rgba(255,105,0,0.05) 0%, transparent 70%), #FFFFFF',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,105,0,0.08)', border: '1px solid rgba(194,65,12,0.3)',
            borderRadius: 20, padding: '6px 16px', fontSize: '0.72rem', fontWeight: 800,
            color: '#C2410C', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C2410C', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            Potenciado por ChatGPT · Resultados en &lt;60 segundos
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, marginBottom: 20, lineHeight: 1.1, color: '#101820', letterSpacing: '-0.03em' }}>
            Gana visibilidad <span style={{ color: '#C2410C' }}>digital</span> en Chile
          </h1>

          <p style={{ fontSize: '1.15rem', color: '#52525B', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 500 }}>
            Analiza cualquier sitio web y descubre exactamente qué necesitas corregir para aparecer primero en Google. Score 0–100, issues priorizados y plan de acción SEO experto.
          </p>

          {/* ── FORM estilo Semrush ─── */}
          <form className="url-form" onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div style={{ maxWidth: 620, margin: '0 auto 12px', display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.5 }}>📧</span>
                <input
                  type="email"
                  placeholder="Tu mejor correo electrónico..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || freeLoading}
                  style={{
                    width: '100%', padding: '14px 14px 14px 44px', borderRadius: 50, border: '1px solid rgba(0,0,0,0.1)',
                    background: 'white', fontSize: '0.95rem', fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                />
              </div>
            </div>

            {/* Barra blanca con botón naranja dentro */}
            <div className="url-form-inner">
              <input
                className="url-input"
                type="text"
                placeholder="Introduce la URL de tu sitio web…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading || freeLoading}
                autoComplete="off"
                spellCheck={false}
              />
              <button className="btn-primary" type="submit" disabled={loading || freeLoading}>
                {couponOk
                  ? '✅ Cupón aplicado…'
                  : loading
                    ? '⟳ Procesando…'
                    : coupon.trim()
                      ? '🎟️ Canjear cupón'
                      : 'Obtener diagnóstico'}
              </button>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#71717A', marginTop: 10, textAlign: 'center' }}>
              * Al continuar, aceptas recibir el diagnóstico en tu correo y nuestras políticas de privacidad.
            </div>

            {/* Botón gratis secundario */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={handleFree}
                disabled={loading || freeLoading}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  color: '#52525B',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 8, padding: '10px 24px',
                  fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {freeLoading ? '⟳ Cargando…' : '🆓 Probar análisis gratuito (sin pago)'}
              </button>
            </div>

            {/* Toggle cupón */}
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => { setShowCoupon(v => !v); setError(''); }}
                style={{
                  background: 'none', border: 'none',
                  color: '#71717A', fontSize: '0.75rem',
                  cursor: 'pointer', fontFamily: 'inherit',
                  textDecoration: 'underline', textDecorationStyle: 'dotted',
                  padding: 4,
                }}
              >
                {showCoupon ? '▴ Ocultar cupón' : '🎟️ ¿Tienes un cupón?'}
              </button>

              {showCoupon && (
                <div style={{
                  marginTop: 8,
                  display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center',
                  animation: 'fadeInUp 0.25s ease',
                }}>
                  <input
                    type="text"
                    placeholder="COD100"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    disabled={loading}
                    style={{
                      background: 'rgba(0,0,0,0.03)',
                      border: couponOk ? '1.5px solid #059669' : '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 8, padding: '8px 14px',
                      color: '#101820', fontSize: '0.88rem',
                      fontFamily: 'monospace', fontWeight: 700,
                      letterSpacing: '0.1em', width: 130, textAlign: 'center',
                      lineHeight: 1.5,
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#71717A' }}>
                    {coupon.trim() ? '↑ Clic en «Obtener diagnóstico»' : 'Ingresa tu código'}
                  </span>
                </div>
              )}
            </div>

            {error && <div className="error-msg">⚠️ {error}</div>}

            <p className="url-form-note">
              <span>🔒 Pago seguro con MercadoPago</span>
              <span>⚡ Resultado en &lt;60s</span>
              <span>📄 PDF incluido</span>
            </p>
          </form>

          {/* Sample preview */}
          <div className="score-preview">
            <div className="score-preview-header">
              <div className="score-preview-url">
                🌐 ejemplo.com — Score:{' '}
                <strong style={{ color: '#B45309', marginLeft: 4 }}>54/100</strong>
              </div>
              <div className="score-preview-date" style={{ color: '#52525B' }}>Vista previa del reporte</div>
            </div>
            <div className="score-bars">
              {SAMPLE_BARS.map(bar => (
                <div className="score-bar-item" key={bar.label}>
                  <div className="score-bar-label">{bar.label}</div>
                  <div className="score-bar-track">
                    <div
                      className={`score-bar-fill ${bar.status}`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                  <div
                    className="score-bar-value"
                    style={{
                      color: bar.status === 'good'
                        ? '#059669'
                        : bar.status === 'warning'
                          ? '#B45309'
                          : '#DC2626',
                    }}
                  >
                    {bar.pct}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <p className="section-label">¿Qué incluye?</p>
          <h2 className="section-title">Todo lo que necesitas saber sobre tu SEO</h2>
          <p className="section-subtitle">
            Un análisis que cubre las 6 dimensiones críticas del SEO moderno,
            con recomendaciones específicas y accionables.
          </p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div className="feature-card" key={f.title}>
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="steps-section">
        <div className="container">
          <p className="section-label">Proceso</p>
          <h2 className="section-title">Listo en 4 pasos simples</h2>
          <p className="section-subtitle">Sin registro, sin suscripciones. Paga y obtén tu reporte al instante.</p>
          <div className="steps-grid">
            {STEPS.map(s => (
              <div className="step-item" key={s.n}>
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <p className="section-label">Precio</p>
          <h2 className="section-title">Un solo precio, todo incluido</h2>
          <p className="section-subtitle">Sin suscripción. Sin registro. Paga solo cuando necesites.</p>

          <div className="pricing-card">
            <div className="pricing-badge">Pago único por reporte</div>
            <div className="pricing-price">
              <span className="pricing-currency">$</span>9.990
            </div>
            <p className="pricing-period">pesos chilenos · por reporte</p>

            <ul className="pricing-features">
              {PRICING_FEATURES.map(f => (
                <li key={f.text}>
                  <span className="check">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 10 }}>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    marginBottom: 8,
                    padding: '12px 16px',
                    boxSizing: 'border-box',
                    color: '#101820',
                    fontWeight: 500
                  }}
                />
                <input
                  className="url-input"
                  type="text"
                  placeholder="https://tusitio.cl"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    boxSizing: 'border-box',
                    color: '#101820',
                    fontWeight: 500
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button className="btn-buy" type="submit" disabled={loading || freeLoading}>
                  {loading ? '⟳ Procesando…' : 'Obtener Diagnóstico Completo — $9.990'}
                </button>
                <button
                  type="button"
                  onClick={handleFree}
                  disabled={loading || freeLoading}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: 10, padding: '11px',
                    color: '#52525B', fontSize: '0.88rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  {freeLoading ? '⟳ Cargando…' : '🆓 Probar análisis gratuito primero'}
                </button>
              </div>
            </form>

            {error && <div className="error-msg">⚠️ {error}</div>}

            <p className="pricing-note">
              🔒 Pago 100% seguro · Tarjetas, débito y transferencia
            </p>
          </div>

          <div className="trust-badges">
            <div className="trust-badge"><span className="icon">🔒</span> Pago SSL seguro</div>
            <div className="trust-badge"><span className="icon">🤖</span> Impulsado por ChatGPT</div>
            <div className="trust-badge"><span className="icon">⚡</span> Resultado en &lt;60s</div>
            <div className="trust-badge"><span className="icon">📄</span> Reporte en PDF</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '60px 24px', textAlign: 'center', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#C2410C', marginBottom: 12 }}>SEO Diagnostico</div>
          <p style={{ fontSize: '0.85rem', color: '#52525B', fontWeight: 600 }}>© {new Date().getFullYear()} — Análisis SEO Experto con IA</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center' }}>
            <a href="#" style={{ fontSize: '0.8rem', color: '#101820', textDecoration: 'none', fontWeight: 700 }}>Términos</a>
            <a href="#" style={{ fontSize: '0.8rem', color: '#101820', textDecoration: 'none', fontWeight: 700 }}>Privacidad</a>
            <a href="mailto:hola@diagnosticoseo.com" style={{ fontSize: '0.8rem', color: '#101820', textDecoration: 'none', fontWeight: 700 }}>Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
