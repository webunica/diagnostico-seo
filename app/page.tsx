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
  const [coupon, setCoupon] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponOk, setCouponOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Análisis gratuito ──────────────────────────────────────────────
  const handleFree = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setError('');
    if (!url.trim()) { setError('Por favor ingresa una URL.'); return; }
    setFreeLoading(true);
    window.location.href = `/preview?url=${encodeURIComponent(url.trim())}`;
  }, [url]);

  // ── Análisis de pago / cupón ───────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCouponOk(false);
    if (!url.trim()) { setError('Por favor ingresa una URL.'); return; }
    setLoading(true);
    try {
      const body: Record<string, string> = { url: url.trim() };
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
  }, [url, coupon]);

  return (
    <>
      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="logo-icon">🔍</div>
          <span>DiagnósticoSEO</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/keywords">🔑 Keywords</a>
          <a href="/crawl">🕷️ Crawl</a>
          <div className="badge-price">$9.990 CLP / reporte</div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot" />
            Potenciado por ChatGPT · Resultados en &lt;60 segundos
          </div>

          <h1>
            Gana visibilidad{' '}
            <span className="gradient-text">digital</span>
            {' '}en Chile
          </h1>

          <p className="hero-subtitle">
            Analiza cualquier sitio web y descubre exactamente qué necesitas corregir
            para aparecer primero en Google. Score 0–100, issues priorizados y plan de acción.
          </p>

          {/* ── FORM estilo Semrush ─── */}
          <form className="url-form" onSubmit={handleSubmit}>
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

            {/* Botón gratis secundario */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={handleFree}
                disabled={loading || freeLoading}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 8, padding: '10px 24px',
                  fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s', backdropFilter: 'blur(8px)',
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
                  color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem',
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
                      background: 'rgba(255,255,255,0.1)',
                      border: couponOk ? '1.5px solid #34D399' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8, padding: '8px 14px',
                      color: 'white', fontSize: '0.88rem',
                      fontFamily: 'monospace', fontWeight: 700,
                      letterSpacing: '0.1em', width: 130, textAlign: 'center',
                      lineHeight: 1.5,
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>
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
                <strong style={{ color: '#F59E0B', marginLeft: 4 }}>54/100</strong>
              </div>
              <div className="score-preview-date">Vista previa del reporte</div>
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
                        ? '#34D399'
                        : bar.status === 'warning'
                          ? '#FCD34D'
                          : '#FF8C5A',
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
                  marginBottom: 10,
                  padding: '12px 16px',
                  boxSizing: 'border-box',
                }}
              />
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
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, padding: '11px',
                    color: 'var(--text-muted)', fontSize: '0.88rem',
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
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} DiagnósticoSEO.com — Análisis SEO potenciado por ChatGPT</p>
          <p style={{ marginTop: 8 }}>
            <a href="#">Términos de uso</a> · <a href="#">Privacidad</a> · <a href="mailto:hola@diagnosticoseo.com">Contacto</a>
          </p>
        </div>
      </footer>
    </>
  );
}
