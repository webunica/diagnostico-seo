import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, getKeysByEmail, revokeKey, adminListAll, PLANS } from '@/lib/api-keys';

// ── Admin password (simple, env-based) ───────────────────────────────
const ADMIN_PASS = process.env.ADMIN_SECRET ?? 'admin1234';

// ── POST /api/keys — Create a new API key ────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, plan = 'starter', label = 'default', adminSecret } = body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
        }

        const planDef = PLANS[plan];
        if (!planDef) {
            return NextResponse.json({
                error: `Plan inválido. Opciones: ${Object.keys(PLANS).join(', ')}`,
            }, { status: 400 });
        }

        // Admin can create any plan; regular users only get 'starter'
        const resolvedPlan = adminSecret === ADMIN_PASS ? plan : 'starter';

        const { rawKey, record } = createApiKey(email, resolvedPlan, label);

        return NextResponse.json({
            success: true,
            apiKey: rawKey,                    // ⚠️ Se muestra SOLO esta vez
            keyPreview: record.key,            // sk_live_xxxx…
            id: record.id,
            plan: record.plan,
            requestsLimit: record.requestsLimit,
            resetAt: record.resetAt,
            warning: 'Guarda esta API key ahora. No se puede recuperar después.',
        }, { status: 201 });

    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error interno';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ── GET /api/keys?email=xxx — List keys for email ────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const adminSecret = searchParams.get('adminSecret');

    // Admin: list all
    if (adminSecret === ADMIN_PASS) {
        return NextResponse.json({ keys: adminListAll() });
    }

    if (!email) {
        return NextResponse.json({ error: 'Parámetro email requerido.' }, { status: 400 });
    }

    const keys = getKeysByEmail(email);
    return NextResponse.json({
        email,
        keys,
        plans: Object.values(PLANS).map(p => ({
            id: p.id,
            name: p.name,
            requestsPerMonth: p.requestsPerMonth,
            priceMontly: p.priceMontly,
            features: p.features,
        })),
    });
}

// ── DELETE /api/keys — Revoke a key ──────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, email } = body;

        if (!id || !email) {
            return NextResponse.json({ error: 'id y email requeridos.' }, { status: 400 });
        }

        const ok = revokeKey(id, email);
        if (!ok) {
            return NextResponse.json({ error: 'Key no encontrada o no pertenece a ese email.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'API key revocada correctamente.' });

    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error interno';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
