/**
 * Supabase API Client for SoapBuddy
 * 
 * This replaces the previous FastAPI client with direct Supabase calls.
 * All database operations go through Supabase's client library.
 */
import { supabase } from '../lib/supabase';
import { OIL_LIBRARY } from '../data/minimizedOilLibrary';

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

/**
 * Get current authenticated user's ID for multi-tenant inserts.
 * RLS requires user_id = auth.uid() on all insert operations.
 */
const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated. Please sign in.');
    return user.id;
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
    const user_id = await getUserId();
    const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredientData, user_id })
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
    const user_id = await getUserId();
    const { ingredients, ...recipe } = recipeData;

    // First create the recipe
    const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({ ...recipe, user_id })
        .select()
        .single();

    if (recipeError) handleError(recipeError, 'create recipe');

    // Then add ingredients if provided
    if (ingredients && ingredients.length > 0) {
        const recipeIngredients = ingredients.map(ing => ({
            recipe_id: newRecipe.id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit || 'g',
            user_id
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
            const user_id = await getUserId();
            const recipeIngredients = ingredients.map(ing => ({
                recipe_id: id,
                ingredient_id: ing.ingredient_id,
                quantity: ing.quantity,
                unit: ing.unit || 'g',
                user_id
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
    const user_id = await getUserId();
    const { data, error } = await supabase
        .from('production_batches')
        .insert({ ...batchData, user_id })
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
            const { error: rpcError } = await supabase.rpc('increment_stock', {
                recipe_id: currentBatch.recipe_id,
                amount: yieldQty
            });
            if (rpcError) handleError(rpcError, 'increment stock');
        }
    }

    return data;
};

export const startBatch = async (id) => {
    const { error } = await supabase.rpc('start_batch', { p_batch_id: id });
    if (error) handleError(error, 'start batch');
    return { success: true };
};

export const completeBatch = async (id, yieldQuantity = 0) => {
    const { error } = await supabase.rpc('complete_batch', {
        p_batch_id: id,
        p_yield_quantity: yieldQuantity
    });
    if (error) handleError(error, 'complete batch');
    return { success: true };
};

// ============ Lye Calculator ============

export const calculateLye = async (request) => {
    // Separate library oils (numeric IDs) from database oils (UUIDs)
    const libraryOilIds = request.oils.filter(o => typeof o.ingredient_id === 'number').map(o => o.ingredient_id);
    const dbOilIds = request.oils.filter(o => typeof o.ingredient_id !== 'number').map(o => o.ingredient_id);

    // Fetch database ingredients if any
    let dbIngredients = [];
    if (dbOilIds.length > 0) {
        const { data } = await supabase
            .from('ingredients')
            .select(`*, fatty_acid_profile:fatty_acid_profiles(*)`)
            .in('id', dbOilIds);
        dbIngredients = data || [];
    }

    const ingredientMap = {};

    // Add library oils to map
    libraryOilIds.forEach(id => {
        const oil = OIL_LIBRARY.find(o => o.id === id);
        if (oil) {
            ingredientMap[id] = {
                id: oil.id,
                name: oil.name,
                sap_naoh: oil.sap,
                sap_koh: oil.sap * 1.403,
                fatty_acid_profile: {
                    hardness: oil.palmitic + oil.stearic,
                    cleansing: oil.lauric + oil.myristic,
                    bubbly: oil.lauric + oil.myristic + (oil.ricinoleic || 0),
                    conditioning: oil.oleic + oil.linoleic + oil.linolenic + (oil.ricinoleic || 0),
                    creamy: oil.palmitic + oil.stearic + (oil.ricinoleic || 0),
                    iodine: oil.iodine,
                    ins: oil.ins,
                    ...oil
                }
            };
        }
    });

    // Add DB oils to map
    dbIngredients.forEach(ing => {
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
    const user_id = await getUserId();
    const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...supplierData, user_id })
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
    const user_id = await getUserId();
    const { items, ...order } = orderData;

    const { data: newOrder, error: orderError } = await supabase
        .from('supply_orders')
        .insert({ ...order, user_id })
        .select()
        .single();

    if (orderError) handleError(orderError, 'create supply order');

    if (items && items.length > 0) {
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            ...item,
            user_id
        }));

        const { error: itemsError } = await supabase
            .from('supply_order_items')
            .insert(orderItems);

        if (itemsError) handleError(itemsError, 'add supply order items');
    }

    return getSupplyOrder(newOrder.id);
};

export const updateSupplyOrder = async (id, updateData) => {
    ensureClient();

    // Handle items update if provided
    if (updateData.items) {
        // Delete old items
        await supabase.from('supply_order_items').delete().eq('order_id', id);

        // Insert new items
        const user_id = await getUserId();
        const orderItems = updateData.items.map(item => ({
            order_id: id,
            ingredient_id: parseInt(item.ingredient_id),
            quantity: parseFloat(item.quantity),
            unit: item.unit || 'g',
            cost: parseFloat(item.cost),
            user_id
        }));

        const { error: itemsError } = await supabase
            .from('supply_order_items')
            .insert(orderItems);
        if (itemsError) handleError(itemsError, 'update supply order items');

        // Recalculate total cost
        updateData.total_cost = orderItems.reduce((sum, item) => sum + item.cost, 0);
    }

    // Remove items from the update payload (they go in supply_order_items, not supply_orders)
    const { items: _items, ...orderUpdate } = updateData;

    const { data, error } = await supabase
        .from('supply_orders')
        .update(orderUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) handleError(error, 'update supply order');
    return data;
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
    const user_id = await getUserId();
    const { data, error } = await supabase
        .from('customers')
        .insert({ ...customerData, user_id })
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
    const user_id = await getUserId();
    const { items, ...order } = orderData;

    // Calculate total amount
    let totalAmount = 0;
    items?.forEach(item => {
        totalAmount += (item.unit_price * item.quantity) - (item.discount || 0);
    });
    order.total_amount = totalAmount;

    const { data: newOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert({ ...order, user_id })
        .select()
        .single();

    if (orderError) handleError(orderError, 'create sales order');

    if (items && items.length > 0) {
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            ...item,
            user_id
        }));

        const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(orderItems);

        if (itemsError) handleError(itemsError, 'add sales order items');

        // If Draft or Completed, deduct inventory using FIFO
        if (order.status === 'Draft' || order.status === 'Completed') {
            await _deductInventoryForOrder(items, order.source_location_id);
        }
    }

    return newOrder;
};

// Internal helper: Deduct inventory using FIFO from a specific location (or all)
async function _deductInventoryForOrder(items, locationId) {
    for (const item of items) {
        // General stock summary decrement
        const { error: rpcError } = await supabase.rpc('decrement_stock', {
            recipe_id: item.recipe_id,
            amount: item.quantity
        });
        if (rpcError) console.error('decrement_stock error:', rpcError);

        // FIFO lot fulfillment
        let remainingToFulfill = item.quantity;
        let query = supabase
            .from('inventory_items')
            .select('*')
            .eq('recipe_id', item.recipe_id)
            .gt('quantity', 0)
            .order('moved_at', { ascending: true });

        if (locationId) {
            query = query.eq('location_id', locationId);
        }

        const { data: lots, error: lotsError } = await query;

        if (lots && !lotsError) {
            for (const lot of lots) {
                if (remainingToFulfill <= 0) break;
                if (lot.quantity <= remainingToFulfill) {
                    remainingToFulfill -= lot.quantity;
                    await supabase.from('inventory_items').delete().eq('id', lot.id);
                } else {
                    await supabase.from('inventory_items')
                        .update({ quantity: lot.quantity - remainingToFulfill })
                        .eq('id', lot.id);
                    remainingToFulfill = 0;
                }
            }
        }
    }
}

// Internal helper: Return inventory to a location
async function _returnInventoryForOrder(items, locationId) {
    for (const item of items) {
        // General stock summary increment
        const { error: rpcError } = await supabase.rpc('increment_stock', {
            recipe_id: item.recipe_id,
            amount: item.quantity
        });
        if (rpcError) console.error('increment_stock error:', rpcError);

        // Create inventory item at the specified location
        if (locationId) {
            await supabase.from('inventory_items').insert({
                recipe_id: item.recipe_id,
                location_id: locationId,
                quantity: item.quantity,
                notes: 'Returned from cancelled sales order'
            });
        }
    }
}

export const updateSalesOrder = async (id, updateData) => {
    ensureClient();

    // Get the current order state + items to detect status changes
    const { data: currentOrder, error: fetchError } = await supabase
        .from('sales_orders')
        .select(`*, items:sales_order_items(*)`)
        .eq('id', id)
        .single();

    if (fetchError) handleError(fetchError, 'fetch current sales order');

    const oldStatus = currentOrder.status;
    const newStatus = updateData.status || oldStatus;

    // Handle items update if provided
    if (updateData.items) {
        // Delete old items
        await supabase.from('sales_order_items').delete().eq('order_id', id);

        // Insert new items
        const user_id = await getUserId();
        const orderItems = updateData.items.map(item => ({
            order_id: id,
            recipe_id: parseInt(item.recipe_id),
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
            discount: parseFloat(item.discount || 0),
            user_id
        }));

        const { error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(orderItems);
        if (itemsError) handleError(itemsError, 'update sales order items');

        // Recalculate total
        updateData.total_amount = orderItems.reduce(
            (sum, item) => sum + (item.unit_price * item.quantity) - (item.discount || 0), 0
        );
    }

    // Prepare update payload (exclude items array from the orders table update)
    const { items: _items, source_location_id, return_location_id, ...orderUpdate } = updateData;

    // Update the order record
    const { data, error } = await supabase
        .from('sales_orders')
        .update(orderUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) handleError(error, 'update sales order');

    // Handle inventory changes based on status transitions
    const orderItems = updateData.items || currentOrder.items;

    // Moving INTO reserved/sold state → deduct from inventory
    if ((newStatus === 'Draft' || newStatus === 'Completed') &&
        oldStatus !== 'Draft' && oldStatus !== 'Completed') {
        await _deductInventoryForOrder(orderItems, source_location_id);
    }

    // Cancelling → return inventory
    if (newStatus === 'Cancelled' && (oldStatus === 'Draft' || oldStatus === 'Completed')) {
        await _returnInventoryForOrder(orderItems, return_location_id);
    }

    return data;
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
    const user_id = await getUserId();
    const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expenseData, user_id })
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
        { data: expenses },
        { data: inventory }
    ] = await Promise.all([
        supabase.from('sales_orders').select('*').order('sale_date', { ascending: false }).limit(5),
        supabase.from('production_batches').select('*, recipe:recipes(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('expenses').select('*').order('date', { ascending: false }).limit(5),
        supabase.from('inventory_items').select('*, recipe:recipes(name), location:inventory_locations(name)').order('moved_at', { ascending: false }).limit(5)
    ]);

    const activities = [];

    sales?.forEach(s => {
        activities.push({
            type: 'sale',
            title: `Sale: $${(s.total_amount || 0).toFixed(2)}`,
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
            subtitle: `$${(e.amount || 0).toFixed(2)}`,
            date: e.date,
            amount: e.amount
        });
    });

    inventory?.forEach(i => {
        activities.push({
            type: 'inventory',
            title: `Inventory: ${i.recipe?.name || 'Item'}`,
            subtitle: `Moved to ${i.location?.name || 'Location'}`,
            date: i.moved_at,
            amount: i.quantity
        });
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
};

// ============ Inventory Locations ============

export const getLocations = async () => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_locations')
        .select('*')
        .order('name');
    if (error) handleError(error, 'get locations');
    return data;
};

export const createLocation = async (locationData) => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_locations')
        .insert(locationData)
        .select()
        .single();
    if (error) handleError(error, 'create location');
    return data;
};

export const updateLocation = async (id, locationData) => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_locations')
        .update(locationData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update location');
    return data;
};

export const deleteLocation = async (id) => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_locations')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete location');
    return data;
};

// ============ Inventory Items ============

export const getInventoryItems = async (params = {}) => {
    ensureClient();
    let query = supabase
        .from('inventory_items')
        .select(`
            *,
            batch:production_batches(id, lot_number, production_date, cure_end_date, status),
            location:inventory_locations(id, name, type),
            recipe:recipes(id, name, default_price)
        `);

    if (params.location_id) {
        query = query.eq('location_id', params.location_id);
    }
    if (params.recipe_id) {
        query = query.eq('recipe_id', params.recipe_id);
    }

    const { data, error } = await query.order('moved_at', { ascending: true });
    if (error) handleError(error, 'get inventory items');
    return data;
};

export const moveToInventory = async ({ batch_id, location_id, recipe_id, quantity, notes }) => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_items')
        .insert({ batch_id, location_id, recipe_id, quantity, notes })
        .select(`
            *,
            batch:production_batches(id, lot_number),
            location:inventory_locations(id, name)
        `)
        .single();
    if (error) handleError(error, 'move to inventory');
    return data;
};

export const updateInventoryItem = async (id, itemData) => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update inventory item');
    return data;
};

export const deleteInventoryItem = async (id) => {
    ensureClient();
    const { data, error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete inventory item');
    return data;
};

export const transferInventory = async (itemId, toLocationId, transferQty) => {
    ensureClient();

    // Get the current inventory item
    const { data: item, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

    if (fetchError) handleError(fetchError, 'fetch inventory item for transfer');

    if (transferQty > item.quantity) {
        throw new Error('Transfer quantity exceeds available stock');
    }

    if (transferQty === item.quantity) {
        // Move entire lot to new location
        const { data, error } = await supabase
            .from('inventory_items')
            .update({ location_id: toLocationId })
            .eq('id', itemId)
            .select()
            .single();
        if (error) handleError(error, 'transfer inventory (full)');
        return data;
    } else {
        // Partial transfer: reduce source, create new lot at destination
        const newQty = item.quantity - transferQty;
        const { error: updateErr } = await supabase
            .from('inventory_items')
            .update({ quantity: newQty })
            .eq('id', itemId);

        if (updateErr) handleError(updateErr, 'reduce source inventory');

        const { data: newItem, error: insertErr } = await supabase
            .from('inventory_items')
            .insert({
                batch_id: item.batch_id,
                location_id: toLocationId,
                recipe_id: item.recipe_id,
                quantity: transferQty,
                notes: `Transferred from location`
            })
            .select()
            .single();

        if (insertErr) handleError(insertErr, 'create transferred inventory');
        return newItem;
    }
};

// ============ Bulk Oil Import ============

/**
 * Import oils from the OIL_LIBRARY into the user's ingredients table.
 * Also inserts fatty acid profiles.
 * @param {Array} oils - array of oil objects from minimizedOilLibrary
 * @returns {{ imported: number, skipped: number }}
 */
export const bulkImportOils = async (oils) => {
    ensureClient();
    const user_id = await getUserId();

    // Fetch existing ingredient names to avoid duplicates
    const { data: existing } = await supabase
        .from('ingredients')
        .select('name')
        .eq('user_id', user_id);

    const existingNames = new Set((existing || []).map(i => i.name.toLowerCase()));

    const toInsert = oils.filter(oil => !existingNames.has(oil.name.toLowerCase()));

    if (toInsert.length === 0) return { imported: 0, skipped: oils.length };

    // Build ingredient rows
    const ingredientRows = toInsert.map(oil => ({
        user_id,
        name: oil.name,
        category: 'Base Oil',
        unit: 'g',
        quantity_on_hand: 0,
        cost_per_unit: 0,
        sap_naoh: oil.sap,
        sap_koh: oil.sap ? parseFloat((oil.sap * 1.403).toFixed(4)) : null,
        iodine_value: oil.iodine || null,
    }));

    const { data: inserted, error } = await supabase
        .from('ingredients')
        .insert(ingredientRows)
        .select('id, name');

    if (error) handleError(error, 'bulk import oils');

    // Build fatty acid profile rows
    const profileRows = (inserted || []).map(ing => {
        const oil = toInsert.find(o => o.name === ing.name);
        if (!oil) return null;
        return {
            ingredient_id: ing.id,
            lauric: oil.lauric || 0,
            myristic: oil.myristic || 0,
            palmitic: oil.palmitic || 0,
            stearic: oil.stearic || 0,
            ricinoleic: oil.ricinoleic || 0,
            oleic: oil.oleic || 0,
            linoleic: oil.linoleic || 0,
            linolenic: oil.linolenic || 0,
            hardness: (oil.palmitic || 0) + (oil.stearic || 0),
            cleansing: (oil.lauric || 0) + (oil.myristic || 0),
            conditioning: (oil.oleic || 0) + (oil.linoleic || 0) + (oil.linolenic || 0) + (oil.ricinoleic || 0),
            bubbly: (oil.lauric || 0) + (oil.myristic || 0) + (oil.ricinoleic || 0),
            creamy: (oil.palmitic || 0) + (oil.stearic || 0) + (oil.ricinoleic || 0),
            iodine: oil.iodine || 0,
            ins: oil.ins || 0,
        };
    }).filter(Boolean);

    if (profileRows.length > 0) {
        const { error: profileError } = await supabase
            .from('fatty_acid_profiles')
            .insert(profileRows);
        if (profileError) console.warn('Fatty acid profile insert error:', profileError);
    }

    return { imported: inserted?.length || 0, skipped: oils.length - toInsert.length };
};

// ============ Profiles (Admin) ============

export const getProfiles = async () => {
    ensureClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) handleError(error, 'get profiles');
    return data;
};

export const updateProfileTier = async (userId, tier) => {
    ensureClient();
    const { data, error } = await supabase
        .from('profiles')
        .update({ plan_tier: tier })
        .eq('id', userId)
        .select()
        .single();
    if (error) handleError(error, 'update profile tier');
    return data;
};

export const updateProfile = async (updates) => {
    ensureClient();
    const user_id = await getUserId();
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user_id)
        .select()
        .single();
    if (error) handleError(error, 'update profile');
    return data;
};

// ============ Molds ============

export const getMolds = async () => {
    ensureClient();
    const user_id = await getCurrentUserId();
    const { data, error } = await supabase
        .from('molds')
        .select('*')
        .eq('user_id', user_id)
        .order('name');
    if (error) handleError(error, 'get molds');
    return data;
};

export const createMold = async (moldData) => {
    ensureClient();
    const user_id = await getCurrentUserId();
    const { data, error } = await supabase
        .from('molds')
        .insert({ ...moldData, user_id })
        .select()
        .single();
    if (error) handleError(error, 'create mold');
    return data;
};

export const updateMold = async (id, moldData) => {
    ensureClient();
    const { data, error } = await supabase
        .from('molds')
        .update(moldData)
        .eq('id', id)
        .select()
        .single();
    if (error) handleError(error, 'update mold');
    return data;
};

export const deleteMold = async (id) => {
    ensureClient();
    const { error } = await supabase
        .from('molds')
        .delete()
        .eq('id', id);
    if (error) handleError(error, 'delete mold');
};

// ============ Data Management ============

export const getAllData = async () => {
    ensureClient();
    const [
        ingredients,
        recipes,
        customers,
        sales,
        supplies,
        expenses,
        batches,
        molds
    ] = await Promise.all([
        getIngredients(),
        getRecipes(),
        getCustomers(),
        getSalesOrders(),
        getSupplyOrders(),
        getExpenses(),
        getBatches(),
        getMolds()
    ]);
    return {
        ingredients,
        recipes,
        customers,
        sales,
        supplies,
        expenses,
        batches,
        molds,
        exportedAt: new Date().toISOString()
    };
};

export const bulkInsertIngredients = async (items) => {
    ensureClient();
    const user_id = await getUserId();
    const rows = items.map(item => ({
        user_id,
        name: item.name,
        category: item.category || 'Additive',
        cost_per_unit: parseFloat(item.cost || 0),
        quantity_on_hand: parseFloat(item.stock || 0),
        unit: item.unit || 'g'
    }));
    
    const { data, error } = await supabase
        .from('ingredients')
        .insert(rows)
        .select();
        
    if (error) handleError(error, 'bulk insert ingredients');
    return data;
};

export const bulkInsertCustomers = async (items) => {
    ensureClient();
    const user_id = await getUserId();
    const rows = items.map(item => ({
        user_id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        customer_type: item.type || 'Retail'
    }));

    const { data, error } = await supabase
        .from('customers')
        .insert(rows)
        .select();

    if (error) handleError(error, 'bulk insert customers');
    return data;
};
