const API_BASE = 'http://localhost:8000/api';

async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// Dashboard
export const getDashboardStats = () => fetchAPI('/dashboard/stats');

// Ingredients
export const getIngredients = (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchAPI(`/ingredients${query ? `?${query}` : ''}`);
};

export const getIngredient = (id) => fetchAPI(`/ingredients/${id}`);

export const createIngredient = (data) =>
    fetchAPI('/ingredients', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateIngredient = (id, data) =>
    fetchAPI(`/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteIngredient = (id) =>
    fetchAPI(`/ingredients/${id}`, {
        method: 'DELETE',
    });

// Recipes
export const getRecipes = (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.recipe_type) searchParams.set('recipe_type', params.recipe_type);
    if (params.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchAPI(`/recipes${query ? `?${query}` : ''}`);
};

export const getRecipe = (id) => fetchAPI(`/recipes/${id}`);

export const createRecipe = (data) =>
    fetchAPI('/recipes', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateRecipe = (id, data) =>
    fetchAPI(`/recipes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteRecipe = (id) =>
    fetchAPI(`/recipes/${id}`, {
        method: 'DELETE',
    });

// Production Batches
export const getBatches = (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return fetchAPI(`/batches${query ? `?${query}` : ''}`);
};

export const getBatch = (id) => fetchAPI(`/batches/${id}`);

export const createBatch = (data) =>
    fetchAPI('/batches', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateBatch = (id, data) =>
    fetchAPI(`/batches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

// Lye Calculator
export const calculateLye = (data) =>
    fetchAPI('/calculator/lye', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// Suppliers
export const getSuppliers = () => fetchAPI('/suppliers');

export const createSupplier = (data) =>
    fetchAPI('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateSupplier = (id, data) =>
    fetchAPI(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteSupplier = (id) =>
    fetchAPI(`/suppliers/${id}`, {
        method: 'DELETE',
    });

// Supply Orders
export const getSupplyOrders = () => fetchAPI('/supply-orders');

export const getSupplyOrder = (id) => fetchAPI(`/supply-orders/${id}`);

export const createSupplyOrder = (data) =>
    fetchAPI('/supply-orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// Customers
export const getCustomers = () => fetchAPI('/customers');

export const createCustomer = (data) =>
    fetchAPI('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateCustomer = (id, data) =>
    fetchAPI(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });


// Sales Orders
export const getSalesOrders = () => fetchAPI('/sales-orders');

export const createSalesOrder = (data) =>
    fetchAPI('/sales-orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });


// Expenses
export const getExpenses = () => fetchAPI('/expenses');

export const createExpense = (data) =>
    fetchAPI('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const deleteExpense = (id) =>
    fetchAPI(`/expenses/${id}`, {
        method: 'DELETE',
    });

export const updateExpense = (id, data) =>
    fetchAPI(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });


// Dashboard Stats
export const getFinancialSummary = () => fetchAPI('/dashboard/financial-summary');

