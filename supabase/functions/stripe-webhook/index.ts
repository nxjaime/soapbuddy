import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from "./_shared/stripe.ts";
import { getSupabaseAdmin } from "./_shared/supabase.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
        return new Response("Webhook Error: Missing Stripe-Signature", { status: 400 });
    }

    try {
        const body = await req.text();
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        if (!webhookSecret) {
            throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                // Lookup user_id
                const { data: customerData } = await supabase
                    .from("stripe_customers")
                    .select("user_id")
                    .eq("stripe_customer_id", subscription.customer)
                    .single();

                let userId = customerData?.user_id;

                if (!userId) {
                    // Fetch customer from Stripe to find metadata
                    const customer = await stripe.customers.retrieve(subscription.customer);
                    if (customer.deleted) break;
                    userId = customer.metadata.supabase_uid;

                    if (userId) {
                        // Save mapping
                        await supabase.from("stripe_customers").upsert({
                            user_id: userId,
                            stripe_customer_id: subscription.customer
                        });
                    }
                }

                if (userId) {
                    await supabase.from("subscriptions").upsert({
                        id: subscription.id,
                        user_id: userId,
                        status: subscription.status,
                        price_id: subscription.items.data[0].price.id,
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

                    // Update profile tier based on subscription status and product metadata
                    try {
                        const productId = subscription.items.data[0].price.product;
                        // const product = await stripe.products.retrieve(productId); // Requires additional permission? Standard key has full access.

                        // Optimize: Only fetch if status indicates a valid tier
                        if (['active', 'trialing'].includes(subscription.status)) {
                            const product = await stripe.products.retrieve(productId);
                            const tier = product.metadata.tier;
                            if (tier) {
                                await supabase.from('profiles').update({ plan_tier: tier }).eq('id', userId);
                            }
                        } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
                            // If subscription is not valid, downgrade to free
                            // Note: 'past_due' might warrant a grace period, but strict logic is safer for now.
                            await supabase.from('profiles').update({ plan_tier: 'free' }).eq('id', userId);
                        }
                    } catch (err) {
                        console.error("Error updating profile tier:", err);
                    }
                }
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
