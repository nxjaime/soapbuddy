import { useEffect, useState } from 'react';
import {
    FileSearch,
    Package,
    ChevronDown,
    ChevronUp,
    Calendar,
    FlaskConical,
    Layers,
    MapPin,
    Search,
    Truck,
    ClipboardList,
    Lock
} from 'lucide-react';
import {
    getBatches,
    getSupplyOrders
} from '../api/client';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function Traceability() {
    const { meetsMinTier, tier } = useSubscription();
    const [batches, setBatches] = useState([]);
    const [supplyOrders, setSupplyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedBatch, setExpandedBatch] = useState(null);

    const hasAccess = meetsMinTier('manufacturer');

    // Filter batches by lot number search
    const filteredBatches = batches.filter(batch =>
        batch.lot_number?.toLowerCase().includes(search.toLowerCase()) ||
        batch.recipe?.name?.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (!hasAccess) return;
        loadData();
    }, [hasAccess]);

    useEffect(() => {
        if (!hasAccess) return;
        const params = new URLSearchParams(window.location.search);
        const lotParam = params.get('lot');
        if (lotParam && filteredBatches.length > 0) {
            const matchingBatch = filteredBatches.find(b => b.lot_number === lotParam);
            if (matchingBatch) {
                setSearch(lotParam);
                setExpandedBatch(matchingBatch.id);
                setTimeout(() => {
                    const element = document.querySelector(`[data-lot="${lotParam}"]`);
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    }, [filteredBatches, hasAccess]);

    async function loadData() {
        try {
            setLoading(true);
            const [batchData, supplyData] = await Promise.all([
                getBatches(),
                getSupplyOrders()
            ]);
            setBatches(batchData);
            setSupplyOrders(supplyData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Gate: only manufacturer tier can access
    if (!hasAccess) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">
                        <FileSearch className="icon" />
                        Traceability Report
                    </h1>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                    <Lock size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Manufacturer Feature</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto var(--spacing-md)' }}>
                        Full batch traceability and supply chain tracking is available on the <strong>Manufacturer</strong> plan.
                        Your current plan: <span className="badge badge-info">{tier}</span>
                    </p>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/settings'}>
                        Upgrade Plan
                    </button>
                </div>
            </div>
        );
    }

    const toggleExpand = (id) => {
        setExpandedBatch(expandedBatch === id ? null : id);
    };

    // Find supply order items that might have contributed to a batch
    // This is a simplified version - in production you'd have explicit lot tracking
    const findRelatedSupplyItems = (batch) => {
        // Get ingredient IDs used in the recipe
        const ingredientIds = batch.recipe?.ingredients?.map(ri => ri.ingredient_id) || [];

        // Find supply order items for those ingredients
        const relatedItems = [];
        supplyOrders.forEach(order => {
            order.items?.forEach(item => {
                if (ingredientIds.includes(item.ingredient_id)) {
                    relatedItems.push({
                        ...item,
                        supplier: order.supplier,
                        order_date: order.order_date
                    });
                }
            });
        });

        return relatedItems;
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <FileSearch className="icon" />
                    Traceability Report
                </h1>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Track the complete history of any production batch. Search by <strong>Lot Number</strong> or <strong>Recipe Name</strong> to see the ingredients used, their source suppliers, and related supply orders.
                </p>
            </div>

            {/* Search */}
            <div className="search-bar" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by lot number or recipe..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner" />
                </div>
            ) : filteredBatches.length === 0 ? (
                <div className="empty-state">
                    <FileSearch size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3>No batches found</h3>
                    <p>{search ? 'Try a different search term.' : 'Production batches will appear here for traceability.'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {filteredBatches.map(batch => {
                        const relatedSupplies = findRelatedSupplyItems(batch);
                        const isExpanded = expandedBatch === batch.id;

                        return (
                            <div key={batch.id} className="card" style={{ padding: 0, overflow: 'hidden' }} data-lot={batch.lot_number}>
                                {/* Header */}
                                <div
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        background: 'var(--glass-bg)'
                                    }}
                                    onClick={() => toggleExpand(batch.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '50%',
                                            background: 'var(--color-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-primary)'
                                        }}>
                                            <Package size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                                                {batch.lot_number}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {batch.recipe?.name || 'Unknown Recipe'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                                        <div className={`badge ${batch.status === 'Complete' ? 'badge-green' : 'badge-blue'}`}>
                                            {batch.status}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {batch.production_date ? new Date(batch.production_date).toLocaleDateString() : 'Not produced'}
                                        </div>
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.15)' }}>
                                        {/* Batch Info */}
                                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                            <h4 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                                <ClipboardList size={16} />
                                                Batch Details
                                            </h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                gap: 'var(--spacing-md)',
                                                background: 'var(--glass-bg)',
                                                padding: 'var(--spacing-md)',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scale Factor</div>
                                                    <div style={{ fontWeight: 500 }}>{batch.scale_factor}x</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Weight</div>
                                                    <div style={{ fontWeight: 500 }}>{batch.total_weight}g</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Cost</div>
                                                    <div style={{ fontWeight: 500 }}>${batch.total_cost?.toFixed(2) || '0.00'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ingredients Used */}
                                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                            <h4 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                                <FlaskConical size={16} />
                                                Ingredients Used
                                            </h4>
                                            {batch.recipe?.ingredients?.length > 0 ? (
                                                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                                            <th style={{ padding: '8px 0' }}>Ingredient</th>
                                                            <th style={{ padding: '8px 0' }}>Quantity</th>
                                                            <th style={{ padding: '8px 0' }}>Unit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {batch.recipe.ingredients.map((ri, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                                <td style={{ padding: '8px 0' }}>{ri.ingredient?.name || `ID: ${ri.ingredient_id}`}</td>
                                                                <td style={{ padding: '8px 0' }}>{(ri.quantity * batch.scale_factor).toFixed(1)}</td>
                                                                <td style={{ padding: '8px 0' }}>{ri.unit}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No ingredient data available</div>
                                            )}
                                        </div>

                                        {/* Related Supply Orders */}
                                        <div>
                                            <h4 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                                <Truck size={16} />
                                                Related Supply Orders
                                            </h4>
                                            {relatedSupplies.length > 0 ? (
                                                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                                            <th style={{ padding: '8px 0' }}>Supplier</th>
                                                            <th style={{ padding: '8px 0' }}>Ingredient</th>
                                                            <th style={{ padding: '8px 0' }}>Lot #</th>
                                                            <th style={{ padding: '8px 0' }}>Order Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {relatedSupplies.map((item, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                                <td style={{ padding: '8px 0' }}>{item.supplier?.name || 'Unknown'}</td>
                                                                <td style={{ padding: '8px 0' }}>{item.ingredient?.name || `ID: ${item.ingredient_id}`}</td>
                                                                <td style={{ padding: '8px 0' }}>{item.lot_number || '-'}</td>
                                                                <td style={{ padding: '8px 0' }}>{new Date(item.order_date).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    No matching supply orders found for ingredients in this batch.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
