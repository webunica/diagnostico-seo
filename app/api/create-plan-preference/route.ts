/**
 * POST /api/create-plan-preference
 *
 * Crea una preferencia de MercadoPago para comprar un plan de API.
 * El metadata incluye: email, plan, keyId (si ya tiene una key).
 * El webhook /api/webhooks/mercadopago procesará el pago y hará el upgrade.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PLANS } from '@/lib/api-keys';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, plan, keyId } = body;

        // Validaciones
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
        }

        const planDef = PLANS[plan];
        if (!planDef) {
            return NextResponse.json({
                error: `Plan inválido. Opciones: ${Object.keys(PLANS).filter(p => p !== 'starter').join(', ')}`,
            }, { status: 400 });
        }

        if (plan === 'starter') {
            return NextResponse.json({ error: 'El plan Starter es gratuito. No requiere pago.' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: [
                    {
                        id: `diagnosticoseo-api-${plan}`,
                        title: `DiagnósticoSEO API — Plan ${planDef.name}`,
                        description: `${planDef.requestsPerMonth} análisis SEO/mes. ${planDef.features.join('. ')}.`,
                        quantity: 1,
                        unit_price: planDef.priceMontly,
                        currency_id: 'USD',
                    },
                ],
                payer: { email },
                external_reference: JSON.stringify({ email, plan, keyId: keyId ?? '' }),
                back_urls: {
                    success: `${baseUrl}/dashboard?upgraded=1&plan=${plan}`,
                    failure: `${baseUrl}/dashboard?error=payment_failed`,
                    pending: `${baseUrl}/dashboard?status=pending`,
                },
                auto_return: 'approved',
                statement_descriptor: 'DiagnosticoSEO API',
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                metadata: { email, plan, keyId: keyId ?? '' },
            },
        });

        return NextResponse.json({
            checkoutUrl: response.init_point,
            preferenceId: response.id,
            plan: planDef.name,
            price: `$${planDef.priceMontly} USD/mes`,
        });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al crear preferencia';
        console.error('[create-plan-preference]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
