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

    try {
        const supabase = getSupabaseAdmin();
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) throw new Error("Invalid user token");

        const { price, return_url } = await req.json();

        // Check if customer exists in our mapping table
        const { data: customerData } = await supabase
            .from("stripe_customers")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single();

        let customerId = customerData?.stripe_customer_id;

        if (!customerId) {
            // Create customer in Stripe
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_uid: user.id },
            });
            // Save mapping
            await supabase.from("stripe_customers").insert({ user_id: user.id, stripe_customer_id: customer.id });
            customerId = customer.id;
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: price, // API ID from Stripe Dashboard
                    quantity: 1,
                },
            ],
            mode: "subscription",
            customer: customerId,
            subscription_data: {
                trial_period_days: 14,
            },
            success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: return_url,
        });

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
