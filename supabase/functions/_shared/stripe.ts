import Stripe from "stripe";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2023-10-16",
});
