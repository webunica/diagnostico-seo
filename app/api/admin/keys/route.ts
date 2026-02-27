/**
 * PATCH /api/admin/keys
 * Admin-only endpoint to manage API key plans.
 * Requires header  X-Admin-Secret: tu ADMIN_SECRET
 *
 * Actions:
 *  { action: 'upgrade',    id, plan }           → cambia plan
 *  { action: 'revoke',     id, email }           → revoca key
 *  { action: 'reactivate', id }                  → reactiva key
 *  { action: 'reset-usage',id }                  → resetea contador
 *
 * GET /api/admin/keys  → lista todas las keys
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    adminListAll, upgradePlan, revokeKey,
    reactivateKey, resetUsage, storageBackend, PLANS,
} from '@/lib/api-keys';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'admin1234';

function checkAuth(req: NextRequest): boolean {
    const header = req.headers.get('X-Admin-Secret') ?? req.headers.get('x-admin-secret');
    const query = new URL(req.url).searchParams.get('secret');
    return header === ADMIN_SECRET || query === ADMIN_SECRET;
}

// ── GET — lista todas las keys ────────────────────────────────────────
export async function GET(req: NextRequest) {
    if (!checkAuth(req)) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const keys = await adminListAll();
    const grouped = keys.reduce<Record<string, typeof keys>>((acc, k) => {
        acc[k.plan] ??= [];
        acc[k.plan].push(k);
        return acc;
    }, {});

    return NextResponse.json({
        total: keys.length,
        active: keys.filter(k => k.isActive).length,
        byPlan: grouped,
        plans: Object.values(PLANS).map(p => ({
            id: p.id, name: p.name, requestsPerMonth: p.requestsPerMonth, priceMontly: p.priceMontly,
        })),
        backend: storageBackend(),
        keys,
    });
}

// ── PATCH — modificar una key ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
    if (!checkAuth(req)) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    let body: Record<string, string>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 }); }

    const { action, id, plan, email } = body;

    if (!id) return NextResponse.json({ error: 'Campo id requerido.' }, { status: 400 });

    switch (action) {

        case 'upgrade': {
            if (!plan) return NextResponse.json({ error: 'Campo plan requerido.' }, { status: 400 });
            const result = await upgradePlan(id, plan);
            if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });
            return NextResponse.json({
                success: true,
                message: `Plan actualizado a "${plan}".`,
                record: result.record,
            });
        }

        case 'revoke': {
            if (!email) return NextResponse.json({ error: 'Campo email requerido.' }, { status: 400 });
            const ok = await revokeKey(id, email);
            if (!ok) return NextResponse.json({ error: 'Key no encontrada.' }, { status: 404 });
            return NextResponse.json({ success: true, message: 'Key revocada.' });
        }

        case 'reactivate': {
            const ok = await reactivateKey(id);
            if (!ok) return NextResponse.json({ error: 'Key no encontrada.' }, { status: 404 });
            return NextResponse.json({ success: true, message: 'Key reactivada.' });
        }

        case 'reset-usage': {
            const ok = await resetUsage(id);
            if (!ok) return NextResponse.json({ error: 'Key no encontrada.' }, { status: 404 });
            return NextResponse.json({ success: true, message: 'Contador de requests reseteado.' });
        }

        default:
            return NextResponse.json({
                error: `Acción desconocida: "${action}". Usa: upgrade | revoke | reactivate | reset-usage`,
            }, { status: 400 });
    }
}
