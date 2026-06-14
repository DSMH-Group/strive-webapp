import { NextRequest, NextResponse } from "next/server";

// Dev-only Backend-for-Frontend proxy.
//
// The deployed backend's CORS allow-list only includes localhost:3000 and
// *.dsmhgroup.com — NOT the *.localhost tenant hosts we use in local dev (a
// preflight from http://test.localhost:3000 is rejected). So any client-side
// call straight to the backend from a tenant subdomain gets blocked by the
// browser ("Ecosystem handshake failed").
//
// Routing those calls through this same-origin handler avoids browser CORS
// entirely: we forward the request server-to-server WITHOUT an Origin header,
// which the backend's `!origin` CORS rule permits. Production talks to the
// backend directly (see lib/api.ts), so this only matters locally.

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://strive-core-development.up.railway.app";

// Forward only what the backend needs. Origin/Host are deliberately dropped so
// the backend treats this as a non-browser (origin-less) request.
const FORWARD_HEADERS = ["authorization", "x-tenant-id", "content-type", "accept"];

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { path } = await ctx.params;
    const target = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

    const headers = new Headers();
    for (const name of FORWARD_HEADERS) {
        const value = req.headers.get(name);
        if (value) headers.set(name, value);
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";

    try {
        const upstream = await fetch(target, {
            method: req.method,
            headers,
            body: hasBody ? await req.arrayBuffer() : undefined,
            redirect: "manual",
        });

        const out = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status });
        const contentType = upstream.headers.get("content-type");
        if (contentType) out.headers.set("content-type", contentType);
        return out;
    } catch (err) {
        return NextResponse.json(
            { error: "Backend proxy failed", detail: (err as Error).message },
            { status: 502 }
        );
    }
}

export {
    handler as GET,
    handler as POST,
    handler as PATCH,
    handler as PUT,
    handler as DELETE,
};
