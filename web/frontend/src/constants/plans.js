// Plan definitions — shared across components and contexts
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'Perfect for hobbyists starting their soap-making journey.',
        features: [
            { id: 'maxRecipes', label: 'Up to 3 Recipes', value: 3 },
            { id: 'production', label: 'Production Batches', value: false },
            { id: 'inventory', label: 'Inventory Management', value: false },
            { id: 'supplyChain', label: 'Suppliers & Supply Orders', value: false },
            { id: 'salesTracking', label: 'Customers, Sales & Expenses', value: false },
            { id: 'inventoryTransfers', label: 'Basic Inventory', value: false },
            { id: 'financialInsights', label: 'Financial Insights', value: false },
            { id: 'traceability', label: 'Batch Traceability', value: false },
            { id: 'labelCreator', label: 'Label Creator', value: false },
            { id: 'admin', label: 'Admin Access', value: false },
        ]
    },
    maker: {
        id: 'maker',
        name: 'Maker',
        price: '$6',
        period: '/mo',
        description: 'For growing craft businesses who need more control.',
        priceId: import.meta.env.VITE_STRIPE_PRICE_MAKER,
        features: [
            { id: 'maxRecipes', label: 'Unlimited Recipes', value: Infinity },
            { id: 'production', label: 'Production Batches', value: true },
            { id: 'inventory', label: 'Inventory Management', value: true },
            { id: 'supplyChain', label: 'Suppliers & Supply Orders', value: true },
            { id: 'salesTracking', label: 'Customers, Sales & Expenses', value: true },
            { id: 'inventoryTransfers', label: 'Inventory Transfers', value: true },
            { id: 'financialInsights', label: 'Financial Insights', value: true },
            { id: 'traceability', label: 'Batch Traceability', value: false },
            { id: 'labelCreator', label: 'Label Creator', value: false },
            { id: 'admin', label: 'Admin Access', value: false },
        ]
    },
    manufacturer: {
        id: 'manufacturer',
        name: 'Manufacturer',
        price: '$19',
        period: '/mo',
        description: 'Advanced features for professional soap manufacturing.',
        priceId: import.meta.env.VITE_STRIPE_PRICE_MANUFACTURER,
        features: [
            { id: 'maxRecipes', label: 'Unlimited Recipes', value: Infinity },
            { id: 'production', label: 'Production Batches', value: true },
            { id: 'inventory', label: 'Inventory Management', value: true },
            { id: 'supplyChain', label: 'Suppliers & Supply Orders', value: true },
            { id: 'salesTracking', label: 'Customers, Sales & Expenses', value: true },
            { id: 'inventoryTransfers', label: 'Inventory Transfers', value: true },
            { id: 'financialInsights', label: 'Financial Insights', value: true },
            { id: 'traceability', label: 'End-to-end Traceability', value: true },
            { id: 'labelCreator', label: 'Label Creator', value: true },
            { id: 'admin', label: 'Admin Access', value: false }, // Only super admins
        ]
    }
};

export const TIER_LEVELS = { free: 0, maker: 1, manufacturer: 2 };
