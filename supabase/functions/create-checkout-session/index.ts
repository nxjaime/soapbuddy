import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "./_shared/stripe.ts";
import { getSupabaseAdmin } from "./_shared/supabase.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Server-side Price Allowlist ──────────────────────────────────────
// Only these Stripe Price IDs are accepted. Any other value is rejected.
// This prevents clients from injecting arbitrary or tampered price IDs.
const ALLOWED_PRICE_IDS = new Set(
    (Deno.env.get("ALLOWED_STRIPE_PRICE_IDS") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
);

/**
 * Structured log helper for billing events.
 * All billing-related logs use a consistent JSON format for traceability.
 */
function billingLog(
    level: "info" | "warn" | "error",
    event: string,
    details: Record<string, unknown>
) {
    const entry = {
        timestamp: new Date().toISOString(),
        service: "create-checkout-session",
        level,
        event,
        ...details,
    };
    if (level === "error") {
        console.error(JSON.stringify(entry));
    } else if (level === "warn") {
        console.warn(JSON.stringify(entry));
    } else {
        console.log(JSON.stringify(entry));
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // ── Environment validation ──────────────────────────────────
        if (!Deno.env.get("STRIPE_SECRET_KEY")) {
            billingLog("error", "missing_env", { variable: "STRIPE_SECRET_KEY" });
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
            );
        }

        if (ALLOWED_PRICE_IDS.size === 0) {
            billingLog("error", "missing_env", {
                variable: "ALLOWED_STRIPE_PRICE_IDS",
                message: "No allowed price IDs configured — all checkout requests will be rejected",
            });
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
            );
        }

        // ── Auth validation ─────────────────────────────────────────
        const supabase = getSupabaseAdmin();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            billingLog("warn", "auth_missing", { ip: req.headers.get("x-forwarded-for") });
            return new Response(
                JSON.stringify({ error: "No authorization header" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            billingLog("warn", "auth_invalid", {
                error: userError?.message ?? "No user returned",
                ip: req.headers.get("x-forwarded-for"),
            });
            return new Response(
                JSON.stringify({ error: "Invalid user token" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        // ── Parse and validate request body ─────────────────────────
        const { price, return_url } = await req.json();

        if (!price || typeof price !== "string") {
            billingLog("warn", "invalid_request", {
                userId: user.id,
                reason: "Missing or invalid price field",
            });
            return new Response(
                JSON.stringify({ error: "Missing or invalid price" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // ── Price allowlist enforcement ──────────────────────────────
        if (!ALLOWED_PRICE_IDS.has(price)) {
            billingLog("error", "price_rejected", {
                userId: user.id,
                attemptedPrice: price,
                allowedPrices: [...ALLOWED_PRICE_IDS],
                message: "Client sent a price ID not in the server allowlist",
            });
            return new Response(
                JSON.stringify({ error: "Invalid plan selected" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
            );
        }

        // ── Return URL validation (prevent open redirect) ───────────
        if (return_url && typeof return_url === "string") {
            try {
                const url = new URL(return_url);
                const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(o => o.trim()).filter(Boolean);
                if (allowedOrigins.length > 0 && !allowedOrigins.includes(url.origin)) {
                    billingLog("warn", "redirect_rejected", {
                        userId: user.id,
                        attemptedUrl: return_url,
                        allowedOrigins,
                    });
                    return new Response(
                        JSON.stringify({ error: "Invalid return URL" }),
                        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
                    );
                }
            } catch {
                billingLog("warn", "redirect_malformed", {
                    userId: user.id,
                    attemptedUrl: return_url,
                });
                return new Response(
                    JSON.stringify({ error: "Invalid return URL" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
                );
            }
        }

        // ── Customer lookup / creation ──────────────────────────────
        const { data: customerData } = await supabase
            .from("stripe_customers")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single();

        let customerId = customerData?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_uid: user.id },
            });
            await supabase.from("stripe_customers").insert({
                user_id: user.id,
                stripe_customer_id: customer.id,
            });
            customerId = customer.id;

            billingLog("info", "customer_created", {
                userId: user.id,
                stripeCustomerId: customer.id,
            });
        }

        // ── Create Checkout Session ─────────────────────────────────
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{ price, quantity: 1 }],
            mode: "subscription",
            customer: customerId,
            subscription_data: {
                trial_period_days: 14,
            },
            success_url: `${return_url || "https://soapbuddy.co"}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: return_url || "https://soapbuddy.co",
        });

        billingLog("info", "checkout_created", {
            userId: user.id,
            stripeCustomerId: customerId,
            sessionId: session.id,
            priceId: price,
        });

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        billingLog("error", "checkout_failed", {
            error: error.message,
            stack: error.stack,
        });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
