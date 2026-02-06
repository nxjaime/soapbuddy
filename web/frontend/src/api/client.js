/**
 * Supabase API Client for SoapBuddy
 * 
 * This replaces the previous FastAPI client with direct Supabase calls.
 * All database operations go through Supabase's client library.
 */
import { supabase } from '../lib/supabase';

// ============ Helper Functions ============

/**
 * Handle Supabase errors consistently
 */
function handleError(error, operation) {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
    }
    console.error(`Supabase ${operation} error:`, error);
    throw new Error(error.message || `Failed to ${operation}`);
}

/**
 * Ensure supabase is initialized before making a call
 */
const ensureClient = () => {
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables in Vercel settings.');
    }
};

// ============ Ingredients ============

export const getIngredients = async (params = {}) => {
    ensureClient();
    let query = supabase.from('ingredients').select('*');

    if (params.category) {
        query = query.eq('category', params.category);
    }
    if (params.search) {
        query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query.order('name');
    if (error) handleError(error, 'get ingredients');
    return data;
};

export const getIngredient = async (id) => {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();
    if (error) handleError(error, 'get ingredient');
    return data;
};

export const createIngredient = async (ingredientData) => {
    const { data, error } = await supabase
        .from('ingredients')
        .insert(ingredientData)
        .select()
        .single();
    if (error) handleError(error, 'create ingredient');
    return data;
};

export const updateIngredient = async (id, ingredientData) => {
    const { data, error } = await supabase
        .from('ingredients')
        .update(ingredientData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update ingredient');
    return data;
};

export const deleteIngredient = async (id) => {
    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete ingredient');
    return { success: true };
};

// ============ Recipes ============

export const getRecipes = async (params = {}) => {
    let query = supabase
        .from('recipes')
        .select(`
            *,
            ingredients:recipe_ingredients(
                id,
                ingredient_id,
                quantity,
                unit,
                ingredient:ingredients(*)
            )
        `);

    if (params.recipe_type) {
        query = query.eq('recipe_type', params.recipe_type);
    }
    if (params.search) {
        query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query.order('name');
    if (error) handleError(error, 'get recipes');
    return data;
};

export const getRecipe = async (id) => {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
            *,
            ingredients:recipe_ingredients(
                id,
                ingredient_id,
                quantity,
                unit,
                ingredient:ingredients(*)
            )
        `)
        .eq('id', id)
        .single();
    if (error) handleError(error, 'get recipe');
    return data;
};

export const createRecipe = async (recipeData) => {
    const { ingredients, ...recipe } = recipeData;

    // First create the recipe
    const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert(recipe)
        .select()
        .single();

    if (recipeError) handleError(recipeError, 'create recipe');

    // Then add ingredients if provided
    if (ingredients && ingredients.length > 0) {
        const recipeIngredients = ingredients.map(ing => ({
            recipe_id: newRecipe.id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit || 'g'
        }));

        const { error: ingError } = await supabase
            .from('recipe_ingredients')
            .insert(recipeIngredients);

        if (ingError) handleError(ingError, 'add recipe ingredients');
    }

    // Return the full recipe with ingredients
    return getRecipe(newRecipe.id);
};

export const updateRecipe = async (id, recipeData) => {
    const { ingredients, ...recipe } = recipeData;

    // Update recipe fields
    const { error: recipeError } = await supabase
        .from('recipes')
        .update(recipe)
        .eq('id', id);

    if (recipeError) handleError(recipeError, 'update recipe');

    // If ingredients provided, replace them
    if (ingredients !== undefined) {
        // Delete existing ingredients
        await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', id);

        // Add new ingredients
        if (ingredients.length > 0) {
            const recipeIngredients = ingredients.map(ing => ({
                recipe_id: id,
                ingredient_id: ing.ingredient_id,
                quantity: ing.quantity,
                unit: ing.unit || 'g'
            }));

            const { error: ingError } = await supabase
                .from('recipe_ingredients')
                .insert(recipeIngredients);

            if (ingError) handleError(ingError, 'update recipe ingredients');
        }
    }

    return getRecipe(id);
};

export const deleteRecipe = async (id) => {
    // Recipe ingredients will be deleted via cascade
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete recipe');
    return { success: true };
};

// ============ Production Batches ============

export const getBatches = async (params = {}) => {
    ensureClient();
    let query = supabase
        .from('production_batches')
        .select(`
            *,
            recipe:recipes(id, name)
        `);

    if (params.status) {
        query = query.eq('status', params.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) handleError(error, 'get batches');
    return data;
};

export const getBatch = async (id) => {
    const { data, error } = await supabase
        .from('production_batches')
        .select(`
            *,
            recipe:recipes(*),
            ingredient_usage:batch_ingredient_usage(
                *,
                ingredient:ingredients(*)
            )
        `)
        .eq('id', id)
        .single();
    if (error) handleError(error, 'get batch');
    return data;
};

export const createBatch = async (batchData) => {
    const { data, error } = await supabase
        .from('production_batches')
        .insert(batchData)
        .select()
        .single();
    if (error) handleError(error, 'create batch');
    return data;
};

export const updateBatch = async (id, batchData) => {
    const { data: currentBatch } = await supabase
        .from('production_batches')
        .select('status, recipe_id, yield_quantity')
        .eq('id', id)
        .single();

    const { data, error } = await supabase
        .from('production_batches')
        .update(batchData)
        .eq('id', id)
        .select()
        .single();

    if (error) handleError(error, 'update batch');

    // If status changed to Complete, update recipe stock
    if (batchData.status === 'Complete' && currentBatch?.status !== 'Complete') {
        const yieldQty = batchData.yield_quantity || currentBatch?.yield_quantity || 0;
        if (yieldQty > 0 && currentBatch?.recipe_id) {
            await supabase.rpc('increment_stock', {
                recipe_id: currentBatch.recipe_id,
                amount: yieldQty
            });
        }
    }

    return data;
};

// ============ Lye Calculator ============
// Note: This is computed client-side since it doesn't need database

const SAP_VALUES = {
    // Common oils SAP values (NaOH)
    'Olive Oil': 0.135,
    'Coconut Oil': 0.178,
    'Palm Oil': 0.141,
    'Castor Oil': 0.128,
    'Shea Butter': 0.128,
    'Cocoa Butter': 0.137,
    'Sweet Almond Oil': 0.136,
    'Avocado Oil': 0.133,
    'Sunflower Oil': 0.134,
    'Lard': 0.138,
    'Tallow': 0.140
};

export const calculateLye = async (request) => {
    // Fetch ingredients with SAP values from database
    const { data: ingredients } = await supabase
        .from('ingredients')
        .select('id, name, sap_naoh, sap_koh')
        .in('id', request.oils.map(o => o.ingredient_id));

    const ingredientMap = {};
    ingredients?.forEach(ing => {
        ingredientMap[ing.id] = ing;
    });

    let totalOilWeight = 0;
    let totalNaOH = 0;
    let totalKOH = 0;

    request.oils.forEach(oil => {
        const ing = ingredientMap[oil.ingredient_id];
        if (ing) {
            totalOilWeight += oil.weight;
            totalNaOH += oil.weight * (ing.sap_naoh || 0);
            totalKOH += oil.weight * (ing.sap_koh || 0);
        }
    });

    // Apply superfat
    const superfatMultiplier = 1 - (request.superfat_percentage / 100);
    totalNaOH *= superfatMultiplier;
    totalKOH *= superfatMultiplier;

    // Calculate water
    const waterAmount = totalOilWeight * (request.water_percentage / 100);

    let lyeAmount = 0;
    if (request.lye_type === 'NaOH') {
        lyeAmount = totalNaOH;
    } else if (request.lye_type === 'KOH') {
        lyeAmount = totalKOH;
    } else {
        // Dual lye - 50/50 by default
        lyeAmount = (totalNaOH + totalKOH) / 2;
    }

    return {
        lye_amount: Math.round(lyeAmount * 100) / 100,
        water_amount: Math.round(waterAmount * 100) / 100,
        total_oil_weight: totalOilWeight,
        lye_type: request.lye_type,
        superfat_percentage: request.superfat_percentage
    };
};

// ============ Suppliers ============

export const getSuppliers = async () => {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
    if (error) handleError(error, 'get suppliers');
    return data;
};

export const createSupplier = async (supplierData) => {
    const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();
    if (error) handleError(error, 'create supplier');
    return data;
};

export const updateSupplier = async (id, supplierData) => {
    const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update supplier');
    return data;
};

export const deleteSupplier = async (id) => {
    const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete supplier');
    return { success: true };
};

// ============ Supply Orders ============

export const getSupplyOrders = async () => {
    const { data, error } = await supabase
        .from('supply_orders')
        .select(`
            *,
            supplier:suppliers(id, name),
            items:supply_order_items(
                *,
                ingredient:ingredients(id, name)
            )
        `)
        .order('order_date', { ascending: false });
    if (error) handleError(error, 'get supply orders');
    return data;
};

export const getSupplyOrder = async (id) => {
    const { data, error } = await supabase
        .from('supply_orders')
        .select(`
            *,
            supplier:suppliers(*),
            items:supply_order_items(
                *,
                ingredient:ingredients(*)
            )
        `)
        .eq('id', id)
        .single();
    if (error) handleError(error, 'get supply order');
    return data;
};

export const createSupplyOrder = async (orderData) => {
    const { items, ...order } = orderData;

    const { data: newOrder, error: orderError } = await supabase
        .from('supply_orders')
        .insert(order)
        .select()
        .single();

    if (orderError) handleError(orderError, 'create supply order');

    if (items && items.length > 0) {
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            ...item
        }));

        const { error: itemsError } = await supabase
            .from('supply_order_items')
            .insert(orderItems);

        if (itemsError) handleError(itemsError, 'add supply order items');
    }

    return getSupplyOrder(newOrder.id);
};

// ============ Customers ============

export const getCustomers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
    if (error) handleError(error, 'get customers');
    return data;
};

export const createCustomer = async (customerData) => {
    const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
    if (error) handleError(error, 'create customer');
    return data;
};

export const updateCustomer = async (id, customerData) => {
    const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update customer');
    return data;
};

export const deleteCustomer = async (id) => {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete customer');
    return { success: true };
};

// ============ Sales Orders ============

export const getSalesOrders = async () => {
    ensureClient();
    const { data, error } = await supabase
        .from('sales_orders')
        .select(`
            *,
            customer:customers(id, name),
            items:sales_order_items(
                *,
                recipe:recipes(id, name, default_price)
            )
        `)
        .order('sale_date', { ascending: false });
    if (error) handleError(error, 'get sales orders');
    return data;
};

export const createSalesOrder = async (orderData) => {
    const { items, ...order } = orderData;

    // Calculate total amount
    let totalAmount = 0;
    items?.forEach(item => {
        totalAmount += (item.unit_price * item.quantity) - (item.discount || 0);
    });
    order.total_amount = totalAmount;

    const { data: newOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert(order)
        .select()
        .single();

    if (orderError) handleError(orderError, 'create sales order');

    if (items && items.length > 0) {
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            ...item
        }));

        const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(orderItems);

        if (itemsError) handleError(itemsError, 'add sales order items');

        // Deduct stock if order is completed
        if (order.status === 'Completed') {
            for (const item of items) {
                await supabase.rpc('decrement_stock', {
                    recipe_id: item.recipe_id,
                    amount: item.quantity
                });
            }
        }
    }

    return newOrder;
};

// ============ Expenses ============

export const getExpenses = async () => {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
    if (error) handleError(error, 'get expenses');
    return data;
};

export const createExpense = async (expenseData) => {
    const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();
    if (error) handleError(error, 'create expense');
    return data;
};

export const updateExpense = async (id, expenseData) => {
    const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update expense');
    return data;
};

export const deleteExpense = async (id) => {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete expense');
    return { success: true };
};

// ============ Dashboard Stats ============

export const getDashboardStats = async () => {
    ensureClient();
    // Get counts from each table
    const [
        { count: ingredientCount },
        { count: recipeCount },
        { count: batchCount },
        { data: activeBatches }
    ] = await Promise.all([
        supabase.from('ingredients').select('*', { count: 'exact', head: true }),
        supabase.from('recipes').select('*', { count: 'exact', head: true }),
        supabase.from('production_batches').select('*', { count: 'exact', head: true }),
        supabase.from('production_batches')
            .select('id, status')
            .in('status', ['Planned', 'In Progress', 'Curing'])
    ]);

    return {
        total_ingredients: ingredientCount || 0,
        total_recipes: recipeCount || 0,
        total_batches: batchCount || 0,
        active_batches: activeBatches?.length || 0
    };
};

export const getFinancialSummary = async () => {
    // Get sales totals
    const { data: salesOrders } = await supabase
        .from('sales_orders')
        .select('total_amount, status');

    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount');

    const totalRevenue = salesOrders
        ?.filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    const totalExpenses = expenses
        ?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    return {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses
    };
};
