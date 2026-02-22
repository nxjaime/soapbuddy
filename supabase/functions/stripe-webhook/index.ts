import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "./_shared/stripe.ts";
import { getSupabaseAdmin } from "./_shared/supabase.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Structured log helper for webhook billing events.
 */
function billingLog(
    level: "info" | "warn" | "error",
    event: string,
    details: Record<string, unknown>
) {
    const entry = {
        timestamp: new Date().toISOString(),
        service: "stripe-webhook",
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

// ── Server-side Price Allowlist ──────────────────────────────────────
// Used to validate that incoming subscription price IDs map to known tiers.
const ALLOWED_PRICE_IDS = new Set(
    (Deno.env.get("ALLOWED_STRIPE_PRICE_IDS") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
);

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // ── Signature validation ────────────────────────────────────────
    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
        billingLog("warn", "signature_missing", { ip: req.headers.get("x-forwarded-for") });
        return new Response("Webhook Error: Missing Stripe-Signature", { status: 400 });
    }

    try {
        // ── Environment validation ──────────────────────────────────
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        if (!webhookSecret) {
            billingLog("error", "missing_env", { variable: "STRIPE_WEBHOOK_SECRET" });
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { headers: { "Content-Type": "application/json" }, status: 500 }
            );
        }

        if (!Deno.env.get("STRIPE_SECRET_KEY")) {
            billingLog("error", "missing_env", { variable: "STRIPE_SECRET_KEY" });
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                { headers: { "Content-Type": "application/json" }, status: 500 }
            );
        }

        // ── Parse and verify webhook event ──────────────────────────
        const body = await req.text();
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            billingLog("error", "signature_invalid", {
                error: err.message,
                ip: req.headers.get("x-forwarded-for"),
            });
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        billingLog("info", "webhook_received", {
            type: event.type,
            eventId: event.id,
        });

        const supabase = getSupabaseAdmin();

        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const priceId = subscription.items?.data?.[0]?.price?.id;

                // ── Validate subscription price against allowlist ───
                if (priceId && ALLOWED_PRICE_IDS.size > 0 && !ALLOWED_PRICE_IDS.has(priceId)) {
                    billingLog("error", "webhook_price_unknown", {
                        eventType: event.type,
                        eventId: event.id,
                        priceId,
                        stripeCustomerId: subscription.customer,
                        message: "Subscription contains a price ID not in the server allowlist",
                    });
                    // Still process but log the anomaly — don't reject Stripe webhooks
                }

                // ── Lookup user_id ──────────────────────────────────
                const { data: customerData } = await supabase
                    .from("stripe_customers")
                    .select("user_id")
                    .eq("stripe_customer_id", subscription.customer)
                    .single();

                let userId = customerData?.user_id;

                if (!userId) {
                    const customer = await stripe.customers.retrieve(subscription.customer as string);
                    if ((customer as { deleted?: boolean }).deleted) {
                        billingLog("warn", "customer_deleted", {
                            stripeCustomerId: subscription.customer,
                            eventType: event.type,
                        });
                        break;
                    }
                    userId = (customer as { metadata: Record<string, string> }).metadata.supabase_uid;

                    if (userId) {
                        await supabase.from("stripe_customers").upsert({
                            user_id: userId,
                            stripe_customer_id: subscription.customer,
                        });
                        billingLog("info", "customer_mapping_created", {
                            userId,
                            stripeCustomerId: subscription.customer,
                        });
                    } else {
                        billingLog("error", "customer_no_uid", {
                            stripeCustomerId: subscription.customer,
                            eventType: event.type,
                            message: "Stripe customer has no supabase_uid in metadata",
                        });
                    }
                }

                if (userId) {
                    // ── Upsert subscription record ──────────────────
                    await supabase.from("subscriptions").upsert({
                        id: subscription.id,
                        user_id: userId,
                        status: subscription.status,
                        price_id: priceId,
                        quantity: subscription.items.data[0].quantity,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        created: new Date(subscription.created * 1000).toISOString(),
                        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
                        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
                        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
                        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                    });

                    billingLog("info", "subscription_upserted", {
                        userId,
                        subscriptionId: subscription.id,
                        status: subscription.status,
                        priceId,
                        eventType: event.type,
                    });

                    // ── Update profile tier ─────────────────────────
                    try {
                        const productId = subscription.items.data[0].price.product;

                        if (["active", "trialing"].includes(subscription.status)) {
                            const product = await stripe.products.retrieve(productId as string);
                            const tier = product.metadata.tier;
                            if (tier) {
                                await supabase.from("profiles").update({ plan_tier: tier }).eq("id", userId);
                                billingLog("info", "tier_updated", {
                                    userId,
                                    newTier: tier,
                                    status: subscription.status,
                                });
                            } else {
                                billingLog("warn", "product_no_tier", {
                                    userId,
                                    productId,
                                    message: "Stripe product is missing 'tier' metadata",
                                });
                            }
                        } else if (["canceled", "unpaid", "past_due"].includes(subscription.status)) {
                            await supabase.from("profiles").update({ plan_tier: "free" }).eq("id", userId);
                            billingLog("info", "tier_downgraded", {
                                userId,
                                newTier: "free",
                                reason: subscription.status,
                            });
                        }
                    } catch (err) {
                        billingLog("error", "tier_update_failed", {
                            userId,
                            error: err.message,
                            stack: err.stack,
                        });
                    }
                }
                break;
            }
            default:
                billingLog("info", "webhook_unhandled", { type: event.type, eventId: event.id });
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        billingLog("error", "webhook_failed", {
            error: error.message,
            stack: error.stack,
        });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
