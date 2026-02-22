import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "./_shared/stripe.ts";
import { getSupabaseAdmin } from "./_shared/supabase.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Structured log helper for billing events.
 */
function billingLog(
    level: "info" | "warn" | "error",
    event: string,
    details: Record<string, unknown>
) {
    const entry = {
        timestamp: new Date().toISOString(),
        service: "create-portal-session",
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
        const { return_url } = await req.json();

        // ── Return URL validation ───────────────────────────────────
        let validReturnUrl = "https://soapbuddy.co";
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
                validReturnUrl = return_url;
            } catch {
                billingLog("warn", "redirect_malformed", {
                    userId: user.id,
                    attemptedUrl: return_url,
                });
                // Fall back to default URL
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

        // ── Create Portal Session ───────────────────────────────────
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: validReturnUrl,
        });

        billingLog("info", "portal_created", {
            userId: user.id,
            stripeCustomerId: customerId,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        billingLog("error", "portal_failed", {
            error: error.message,
            stack: error.stack,
        });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
