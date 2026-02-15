/**
 * soapMath.js — Wrapper around soapCalculator.js
 *
 * Fetches fatty acid profiles from Supabase and returns real-time
 * quality estimates for a given set of recipe ingredients.
 *
 * Usage:
 *   import { computeQualities } from '../utils/soapMath';
 *   const qualities = await computeQualities(recipeIngredients);
 */

import { createClient } from '@supabase/supabase-js';
import { calculateSoapQualities } from './soapCalculator';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Local cache so we don't re-fetch profiles the user already looked up
const profileCache = {};

/**
 * Fetch fatty acid profiles for a list of ingredient IDs.
 * Results are cached per-session.
 *
 * @param {number[]} ingredientIds
 * @returns {Object} Map of ingredient_id → profile object
 */
async function fetchProfiles(ingredientIds) {
    // Find IDs we haven't cached yet
    const missing = ingredientIds.filter(id => id && !profileCache[id]);

    if (missing.length > 0) {
        const { data, error } = await supabase
            .from('fatty_acid_profiles')
            .select('*')
            .in('ingredient_id', missing);

        if (!error && data) {
            data.forEach(profile => {
                profileCache[profile.ingredient_id] = profile;
            });
        }
    }

    // Build map for the requested IDs
    const result = {};
    ingredientIds.forEach(id => {
        if (profileCache[id]) {
            result[id] = profileCache[id];
        }
    });
    return result;
}

/**
 * Compute soap qualities for a list of recipe ingredients.
 *
 * @param {Array<{ingredient_id: number, quantity: number}>} ingredients
 * @returns {Promise<{hardness:number, cleansing:number, conditioning:number,
 *                     bubbly:number, creamy:number, iodine:number, ins:number}>}
 */
export async function computeQualities(ingredients) {
    if (!ingredients || ingredients.length === 0) {
        return null;
    }

    // Filter out blank / zero entries
    const valid = ingredients.filter(
        ing => ing.ingredient_id && (parseFloat(ing.quantity) || 0) > 0
    );

    if (valid.length === 0) return null;

    const ids = valid.map(i => i.ingredient_id);
    const profiles = await fetchProfiles(ids);

    // Only calculate if we got at least one profile back
    if (Object.keys(profiles).length === 0) return null;

    return calculateSoapQualities(valid, profiles);
}

/**
 * Clear the profile cache (e.g. on logout or data refresh).
 */
export function clearProfileCache() {
    Object.keys(profileCache).forEach(key => delete profileCache[key]);
}
