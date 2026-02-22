/**
 * Environment validation — fail fast if critical config is missing.
 * This runs once at module load time (before the app renders).
 *
 * Errors are surfaced clearly in the console rather than causing
 * cryptic runtime failures deep in the component tree.
 */

const REQUIRED_ENV = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

const OPTIONAL_ENV = {
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_STRIPE_PRICE_MAKER: import.meta.env.VITE_STRIPE_PRICE_MAKER,
    VITE_STRIPE_PRICE_MANUFACTURER: import.meta.env.VITE_STRIPE_PRICE_MANUFACTURER,
};

export function validateEnv() {
    const missing = [];
    const warnings = [];

    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
        if (!value) missing.push(key);
    }

    for (const [key, value] of Object.entries(OPTIONAL_ENV)) {
        if (!value) warnings.push(key);
    }

    if (missing.length > 0) {
        const msg = `❌ SoapBuddy: Missing required environment variables:\n${missing.map(k => `   - ${k}`).join('\n')}\n\nThe app cannot function without these. Check your .env file.`;
        console.error(msg);

        // In production, show error UI instead of crashing silently
        if (import.meta.env.PROD) {
            document.body.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;text-align:center;padding:2rem;">
                    <h1 style="color:#ef4444;margin-bottom:1rem;">Configuration Error</h1>
                    <p style="color:#6b7280;max-width:400px;">The application is missing required configuration. Please contact the administrator.</p>
                </div>
            `;
        }

        throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }

    if (warnings.length > 0) {
        console.warn(
            `⚠️ SoapBuddy: Optional environment variables not set:\n${warnings.map(k => `   - ${k}`).join('\n')}\n\nStripe billing features will not work without these.`
        );
    }

    return { valid: true, warnings };
}
