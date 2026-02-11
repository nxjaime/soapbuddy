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

export const calculateLye = async (request) => {
    // Fetch ingredients with SAP values and Fatty Acid profiles from database
    const { data: ingredientsData } = await supabase
        .from('ingredients')
        .select(`
            *,
            fatty_acid_profile:fatty_acid_profiles(*)
        `)
        .in('id', request.oils.map(o => o.ingredient_id));

    const ingredientMap = {};
    ingredientsData?.forEach(ing => {
        ingredientMap[ing.id] = ing;
    });

    let totalWeight = 0;
    let totalNaOH = 0;
    let totalKOH = 0;

    // Quality totals (weighted averages)
    const qualities = {
        hardness: 0,
        cleansing: 0,
        conditioning: 0,
        bubbly: 0,
        creamy: 0,
        iodine: 0,
        ins: 0
    };

    // Fatty acid totals (percentages)
    const fattyAcids = {
        lauric: 0,
        myristic: 0,
        palmitic: 0,
        stearic: 0,
        ricinoleic: 0,
        oleic: 0,
        linoleic: 0,
        linolenic: 0
    };

    request.oils.forEach(oil => {
        const ing = ingredientMap[oil.ingredient_id];
        if (ing) {
            const weight = parseFloat(oil.weight) || 0;
            totalWeight += weight;
            totalNaOH += weight * (ing.sap_naoh || 0);
            totalKOH += weight * (ing.sap_koh || 0);

            // Fetch profile data
            const profile = ing.fatty_acid_profile;
            if (profile) {
                // We'll calculate qualities as weighted averages
                // SoapCalc often uses the percentage of the oil in the blend
                // but weight is also fine for ratios.
                Object.keys(qualities).forEach(key => {
                    qualities[key] += (parseFloat(profile[key]) || 0) * weight;
                });
                Object.keys(fattyAcids).forEach(key => {
                    fattyAcids[key] += (parseFloat(profile[key]) || 0) * weight;
                });
            }
        }
    });

    if (totalWeight > 0) {
        // Normalize qualities and fatty acids by total weight
        Object.keys(qualities).forEach(key => qualities[key] /= totalWeight);
        Object.keys(fattyAcids).forEach(key => fattyAcids[key] /= totalWeight);
    }

    // Apply superfat
    const superfatMultiplier = 1 - (request.superfat_percentage / 100);
    totalNaOH *= superfatMultiplier;
    totalKOH *= superfatMultiplier;

    // Handle KOH purity (typically 90%)
    if (request.koh_purity_90) {
        totalKOH /= 0.90;
    }

    // Calculate water based on method
    let waterAmount = 0;
    if (request.water_method === 'percentage') {
        waterAmount = totalWeight * (request.water_value / 100);
    } else if (request.water_method === 'ratio') {
        const lyeWeight = request.lye_type === 'NaOH' ? totalNaOH : totalKOH;
        waterAmount = lyeWeight * request.water_value;
    } else if (request.water_method === 'concentration') {
        const lyeWeight = request.lye_type === 'NaOH' ? totalNaOH : totalKOH;
        // concentration = lye / (lye + water)
        // water = (lye / concentration) - lye
        waterAmount = (lyeWeight / (request.water_value / 100)) - lyeWeight;
    }

    // Calculate Fragrance
    const fragranceAmount = totalWeight * (request.fragrance_ratio || 0);

    return {
        lye_naoh: Math.round(totalNaOH * 100) / 100,
        lye_koh: Math.round(totalKOH * 100) / 100,
        water: Math.round(waterAmount * 100) / 100,
        fragrance: Math.round(fragranceAmount * 100) / 100,
        total_oils: Math.round(totalWeight * 100) / 100,
        total_batch_weight: Math.round((totalWeight + (request.lye_type === 'NaOH' ? totalNaOH : totalKOH) + waterAmount + fragranceAmount) * 100) / 100,
        qualities: Object.fromEntries(Object.entries(qualities).map(([k, v]) => [k, Math.round(v)])),
        fattyAcids: Object.fromEntries(Object.entries(fattyAcids).map(([k, v]) => [k, Math.round(v)])),
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
        active_batches: activeBatches?.length || 0,
        total_customers: 0,
        total_sales: 0,
        total_supplies: 0
    };

    // Add remaining counts
    const [
        { count: customerCount },
        { count: salesCount },
        { count: supplyCount }
    ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('sales_orders').select('*', { count: 'exact', head: true }),
        supabase.from('supply_orders').select('*', { count: 'exact', head: true })
    ]);

    return {
        total_ingredients: ingredientCount || 0,
        total_recipes: recipeCount || 0,
        total_batches: batchCount || 0,
        active_batches: activeBatches?.length || 0,
        total_customers: customerCount || 0,
        total_sales: salesCount || 0,
        total_supplies: supplyCount || 0
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
        net_profit: totalRevenue - totalExpenses,
        margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
    };
};

export const getRecentActivity = async () => {
    ensureClient();
    const [
        { data: sales },
        { data: batches },
        { data: expenses }
    ] = await Promise.all([
        supabase.from('sales_orders').select('*').order('sale_date', { ascending: false }).limit(5),
        supabase.from('production_batches').select('*, recipe:recipes(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('expenses').select('*').order('date', { ascending: false }).limit(5)
    ]);

    const activities = [];

    sales?.forEach(s => {
        activities.push({
            type: 'sale',
            title: `Sale: $${s.total_amount.toFixed(2)}`,
            date: s.sale_date,
            amount: s.total_amount
        });
    });

    batches?.forEach(b => {
        activities.push({
            type: 'batch',
            title: `Batch: ${b.lot_number}`,
            subtitle: b.recipe?.name || 'Unknown',
            date: b.created_at
        });
    });

    expenses?.forEach(e => {
        activities.push({
            type: 'expense',
            title: `Expense: ${e.description}`,
            subtitle: `$${e.amount.toFixed(2)}`,
            date: e.date,
            amount: e.amount
        });
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
};
