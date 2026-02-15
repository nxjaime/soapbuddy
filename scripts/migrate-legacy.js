#!/usr/bin/env node
/**
 * migrate-legacy.js — SQLite → Supabase migration script
 *
 * Migrates legacy SoapManager data (soapmanager.db) into the Supabase
 * multi-tenant schema for a target user.
 *
 * Usage:
 *   node scripts/migrate-legacy.js <path-to-db>
 *
 * Required environment variables:
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
 *   TARGET_USER_ID            — UUID of the user to migrate data for
 *
 * Column mapping (legacy → Supabase):
 *   batch_ingredient_usage.actual_quantity → quantity_used
 *   All rows get user_id = TARGET_USER_ID
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

// ── Config ───────────────────────────────────────────────────────────────────

const DB_PATH = process.argv[2];
if (!DB_PATH) {
    console.error('Usage: node scripts/migrate-legacy.js <path-to-soapmanager.db>');
    process.exit(1);
}

const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    TARGET_USER_ID,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TARGET_USER_ID) {
    console.error(
        'Missing required environment variables:\n' +
        '  SUPABASE_URL\n' +
        '  SUPABASE_SERVICE_ROLE_KEY\n' +
        '  TARGET_USER_ID'
    );
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\nSoapManager SQLite → Supabase Migration`);
    console.log(`DB: ${path.resolve(DB_PATH)}`);
    console.log(`Target user: ${TARGET_USER_ID}\n`);

    const db = new Database(DB_PATH, { readonly: true });

    const summary = {
        ingredients: { migrated: 0, skipped: 0, errors: 0 },
        recipes: { migrated: 0, skipped: 0, errors: 0 },
        recipe_ingredients: { migrated: 0, skipped: 0, errors: 0 },
    };

    // ── 1. Ingredients ───────────────────────────────────────────────────────
    console.log('--- Migrating ingredients ---');

    const legacyIngredients = db.prepare('SELECT * FROM ingredients').all();
    console.log(`Found ${legacyIngredients.length} legacy ingredients`);

    // Map: legacy_id → new Supabase id
    const ingredientIdMap = {};

    for (const ing of legacyIngredients) {
        const row = {
            user_id: TARGET_USER_ID,
            name: ing.name,
            category: ing.category || 'Base Oil',
            unit: ing.unit || 'g',
            quantity_on_hand: ing.quantity_on_hand ?? ing.quantity ?? 0,
            cost_per_unit: ing.cost_per_unit ?? ing.cost ?? 0,
            sap_naoh: ing.sap_naoh ?? ing.sap_value ?? null,
            sap_koh: ing.sap_koh ?? null,
            notes: ing.notes || null,
        };

        const { data, error } = await supabase
            .from('ingredients')
            .upsert(row, { onConflict: 'user_id,name', ignoreDuplicates: false })
            .select('id')
            .single();

        if (error) {
            console.error(`  ERR ingredient "${ing.name}":`, error.message);
            summary.ingredients.errors++;
        } else {
            ingredientIdMap[ing.id] = data.id;
            summary.ingredients.migrated++;
            console.log(`  ✓ ${ing.name} (${ing.id} → ${data.id})`);
        }
    }

    // ── 2. Recipes ───────────────────────────────────────────────────────────
    console.log('\n--- Migrating recipes ---');

    const legacyRecipes = db.prepare('SELECT * FROM recipes').all();
    console.log(`Found ${legacyRecipes.length} legacy recipes`);

    // Map: legacy_id → new Supabase id
    const recipeIdMap = {};

    for (const rec of legacyRecipes) {
        const row = {
            user_id: TARGET_USER_ID,
            name: rec.name,
            recipe_type: rec.recipe_type || 'Soap',
            description: rec.description || null,
            lye_type: rec.lye_type || 'NaOH',
            superfat_percentage: rec.superfat ?? rec.superfat_percentage ?? 5,
            water_percentage: rec.water_percentage ?? rec.water_ratio ?? 38,
            total_oils_weight: rec.total_oils_weight ?? rec.oil_weight ?? 0,
            notes: rec.notes || null,
            stock_quantity: rec.stock_quantity ?? 0,
        };

        const { data, error } = await supabase
            .from('recipes')
            .upsert(row, { onConflict: 'user_id,name', ignoreDuplicates: false })
            .select('id')
            .single();

        if (error) {
            console.error(`  ERR recipe "${rec.name}":`, error.message);
            summary.recipes.errors++;
        } else {
            recipeIdMap[rec.id] = data.id;
            summary.recipes.migrated++;
            console.log(`  ✓ ${rec.name} (${rec.id} → ${data.id})`);
        }
    }

    // ── 3. Recipe Ingredients ─────────────────────────────────────────────────
    console.log('\n--- Migrating recipe_ingredients ---');

    const legacyRI = db.prepare('SELECT * FROM recipe_ingredients').all();
    console.log(`Found ${legacyRI.length} legacy recipe_ingredient rows`);

    for (const ri of legacyRI) {
        const newRecipeId = recipeIdMap[ri.recipe_id];
        const newIngredientId = ingredientIdMap[ri.ingredient_id];

        if (!newRecipeId || !newIngredientId) {
            console.warn(`  SKIP recipe_ingredient: unmapped recipe ${ri.recipe_id} or ingredient ${ri.ingredient_id}`);
            summary.recipe_ingredients.skipped++;
            continue;
        }

        const row = {
            user_id: TARGET_USER_ID,
            recipe_id: newRecipeId,
            ingredient_id: newIngredientId,
            quantity: ri.quantity ?? 0,
            unit: ri.unit || 'g',
        };

        const { error } = await supabase
            .from('recipe_ingredients')
            .upsert(row, { onConflict: 'recipe_id,ingredient_id', ignoreDuplicates: true });

        if (error) {
            console.error(`  ERR recipe_ingredient r=${newRecipeId} i=${newIngredientId}:`, error.message);
            summary.recipe_ingredients.errors++;
        } else {
            summary.recipe_ingredients.migrated++;
            console.log(`  ✓ recipe ${newRecipeId} ← ingredient ${newIngredientId} (${ri.quantity}${ri.unit || 'g'})`);
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n==============================');
    console.log('Migration Summary');
    console.log('==============================');
    for (const [table, s] of Object.entries(summary)) {
        console.log(`${table}: ${s.migrated} migrated, ${s.skipped} skipped, ${s.errors} errors`);
    }
    console.log('');

    db.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
