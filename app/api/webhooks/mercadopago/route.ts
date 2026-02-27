/**
 * POST /api/webhooks/mercadopago
 *
 * Webhook que recibe notificaciones de MercadoPago.
 * Cuando un pago es aprobado para una compra de plan API,
 * llama a upgradePlan() automáticamente.
 *
 * Setup en MercadoPago:
 *  - Dashboard MP → Integraciones → Notificaciones IPN/Webhooks
 *  - URL: https://tudominio.com/api/webhooks/mercadopago
 *  - Eventos: payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { upgradePlan, createApiKey, getKeysByEmail, PLANS } from '@/lib/api-keys';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[webhook/mp] received:', JSON.stringify(body).substring(0, 200));

        // MercadoPago envía dos tipos de notificación
        // 1. IPN: { id, topic: 'payment' }
        // 2. Webhooks modernos: { type: 'payment', data: { id } }

        const paymentId = body?.data?.id ?? body?.id;
        const topic = body?.type ?? body?.topic;

        if (!paymentId || topic !== 'payment') {
            // No es un pago — ignorar silenciosamente
            return NextResponse.json({ received: true });
        }

        // Obtener detalles del pago
        const mpPayment = new Payment(client);
        const payment = await mpPayment.get({ id: String(paymentId) });

        console.log('[webhook/mp] payment status:', payment.status, 'id:', paymentId);

        // Solo procesar pagos aprobados
        if (payment.status !== 'approved') {
            return NextResponse.json({ received: true, status: payment.status });
        }

        // Extraer email + plan del external_reference o metadata
        let email = '';
        let plan = '';
        let keyId = '';

        // Intentar desde external_reference (JSON string)
        if (payment.external_reference) {
            try {
                const ref = JSON.parse(payment.external_reference);
                email = ref.email ?? '';
                plan = ref.plan ?? '';
                keyId = ref.keyId ?? '';
            } catch {
                // No era JSON, podría ser el formato antiguo de diagnósticos
            }
        }

        // Fallback: desde metadata
        if (!email && payment.metadata) {
            email = (payment.metadata as Record<string, string>).email ?? '';
            plan = (payment.metadata as Record<string, string>).plan ?? '';
            keyId = (payment.metadata as Record<string, string>).key_id ?? '';
        }

        // Si no hay email o plan → es un pago de diagnóstico normal, no de plan API
        if (!email || !plan || !PLANS[plan]) {
            console.log('[webhook/mp] no plan data, skipping upgrade');
            return NextResponse.json({ received: true, note: 'No plan upgrade needed' });
        }

        console.log(`[webhook/mp] upgrading ${email} → ${plan} (keyId: ${keyId})`);

        // Si tenemos un keyId específico → upgrade directo
        if (keyId) {
            const result = await upgradePlan(keyId, plan);
            if (result.ok) {
                console.log(`[webhook/mp] ✓ upgraded key ${keyId} to ${plan}`);
                return NextResponse.json({
                    success: true,
                    action: 'upgrade',
                    keyId,
                    plan,
                    email,
                });
            }
            console.warn('[webhook/mp] upgradePlan failed:', result.error);
        }

        // Si no hay keyId o falló → buscar key activa del email y actualizarla
        const existingKeys = await getKeysByEmail(email);
        const activeKey = existingKeys.find(k => k.isActive);

        if (activeKey) {
            const result = await upgradePlan(activeKey.id, plan);
            if (result.ok) {
                console.log(`[webhook/mp] ✓ upgraded existing key ${activeKey.id} of ${email} to ${plan}`);
                return NextResponse.json({
                    success: true,
                    action: 'upgrade-existing',
                    keyId: activeKey.id,
                    plan,
                    email,
                });
            }
        }

        // Si el usuario no tiene key → crear una nueva con el plan pagado
        const { rawKey: _, record } = await createApiKey(email, plan, 'plan-upgrade');
        console.log(`[webhook/mp] ✓ created new ${plan} key for ${email}: ${record.id}`);

        return NextResponse.json({
            success: true,
            action: 'created-new-key',
            keyId: record.id,
            plan,
            email,
            note: 'Nueva key creada. El usuario debe ir a /dashboard para verla.',
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error interno';
        console.error('[webhook/mp] error:', msg);
        // Retornar 200 siempre para que MP no reintente indefinidamente
        return NextResponse.json({ received: true, error: msg });
    }
}

// MercadoPago también envía GET para verificar que el endpoint existe
export async function GET() {
    return NextResponse.json({
        active: true,
        service: 'DiagnósticoSEO MercadoPago Webhook',
        version: '2.0',
    });
}
