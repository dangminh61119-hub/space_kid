/**
 * api-auth.ts — Lightweight auth + rate limiting for API routes
 * 
 * - requireAuth: verifies Supabase JWT from Authorization header
 * - rateLimit: simple in-memory rate limiter (per IP)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface AuthResult {
    authenticated: boolean;
    userId?: string;
    error?: string;
}

/**
 * Verify the JWT from Authorization header.
 * Returns the auth user ID if valid.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
    if (!supabaseUrl || !supabaseAnonKey) {
        return { authenticated: false, error: "Supabase not configured" };
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return { authenticated: false, error: "No auth token" };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { authenticated: false, error: "Invalid token" };
    }

    return { authenticated: true, userId: user.id };
}

export function unauthorizedResponse(message = "Authentication required") {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
    });
}

/* ─── Rate Limiter (in-memory, per IP) ─── */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiter. Returns true if the request should be allowed.
 * @param ip - IP address or identifier
 * @param maxRequests - max requests per window
 * @param windowMs - time window in milliseconds (default: 60s)
 */
export function checkRateLimit(
    ip: string,
    maxRequests: number = 30,
    windowMs: number = 60_000
): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    entry.count++;
    if (entry.count > maxRequests) {
        return false;
    }
    return true;
}

export function rateLimitResponse() {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
    });
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitMap.entries()) {
            if (now > entry.resetTime) rateLimitMap.delete(key);
        }
    }, 5 * 60_000);
}
