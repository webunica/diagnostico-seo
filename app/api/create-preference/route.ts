import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

// ── Cupones válidos (100% descuento) ─────────────────────────────────
// Se leen desde .env para que nunca queden expuestos en el cliente
const VALID_COUPONS_100 = (process.env.COUPON_100 ?? 'COD100')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

export async function POST(req: NextRequest) {
    try {
        const { url, coupon } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
        }

        // Normalizar y validar URL
        let normalizedUrl: string;
        try {
            normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
            new URL(normalizedUrl);
        } catch {
            return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
        }

        // ── Lógica de cupón 100% ─────────────────────────────────────
        if (coupon) {
            const normalizedCoupon = coupon.trim().toUpperCase();

            if (!VALID_COUPONS_100.includes(normalizedCoupon)) {
                return NextResponse.json(
                    { error: 'Cupón inválido o expirado.' },
                    { status: 400 }
                );
            }

            // Cupón válido → bypass de pago
            // Codificamos la URL en base64url y generamos un payment_id especial
            const encodedUrl = Buffer.from(normalizedUrl).toString('base64url');
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;

            // El payment_id "COUPON_COD100" es verificado en /api/analyze
            const checkoutUrl = `${baseUrl}/success?status=approved&payment_id=COUPON_${normalizedCoupon}&external_reference=${encodedUrl}`;

            return NextResponse.json({
                checkoutUrl,
                couponApplied: true,
                discount: '100%',
            });
        }

        // ── Flujo normal: crear preferencia MercadoPago ───────────────
        const encodedUrl = Buffer.from(normalizedUrl).toString('base64url');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
        const price = Number(process.env.NEXT_PUBLIC_PRICE_CLP ?? 9990);

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: [
                    {
                        id: 'diagnostico-seo',
                        title: `Diagnóstico SEO — ${normalizedUrl}`,
                        description: 'Análisis SEO completo con score, issues y plan de acción. Potenciado por ChatGPT.',
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'CLP',
                    },
                ],
                external_reference: encodedUrl,
                back_urls: {
                    success: `${baseUrl}/success`,
                    failure: `${baseUrl}/?error=payment_failed`,
                    pending: `${baseUrl}/?status=pending`,
                },
                auto_return: 'approved',
                statement_descriptor: 'DiagnosticoSEO',
                metadata: { url: normalizedUrl },
            },
        });

        return NextResponse.json({
            checkoutUrl: response.init_point,
            preferenceId: response.id,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al crear pago';
        console.error('[create-preference]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
