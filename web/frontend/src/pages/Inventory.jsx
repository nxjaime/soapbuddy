import { useEffect, useState } from 'react';
import {
    Warehouse,
    Plus,
    MapPin,
    Package,
    Search,
    Edit2,
    Trash2,
    X,
    ArrowRightLeft,
    Calendar,
    Filter,
    Info,
    Lock
} from 'lucide-react';
import {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    getInventoryItems,
    moveToInventory,
    deleteInventoryItem,
    getBatches,
    getRecipes,
    transferInventory
} from '../api/client';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function Inventory() {
    const { formatCurrency } = useSettings();
    const { hasFeature } = useSubscription();
    const canTransfer = hasFeature('inventoryTransfers');
    const [locations, setLocations] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [completedBatches, setCompletedBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'locations'
    const [filterLocation, setFilterLocation] = useState('');
    const [filterRecipe, setFilterRecipe] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [transferSaving, setTransferSaving] = useState(false);

    const [locationForm, setLocationForm] = useState({
        name: '',
        type: 'Warehouse',
        address: '',
        notes: ''
    });

    const [moveForm, setMoveForm] = useState({
        batch_id: '',
        location_id: '',
        recipe_id: '',
        quantity: 0,
        notes: ''
    });

    const [transferForm, setTransferForm] = useState({
        inventory_item_id: '',
        destination_location_id: '',
        quantity: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [locs, items, recs, batches] = await Promise.all([
                getLocations(),
                getInventoryItems(),
                getRecipes(),
                getBatches()
            ]);
            setLocations(locs || []);
            setInventoryItems(items || []);
            setRecipes(recs || []);
            // Only show Complete batches that haven't been fully moved to inventory yet
            setCompletedBatches((batches || []).filter(b => b.status === 'Complete'));
        } catch (err) {
            console.error('Failed to load inventory data:', err);
        }
        setLoading(false);
    }

    // ---- Location CRUD ----
    function openLocationModal(location = null) {
        if (location) {
            setEditingLocation(location);
            setLocationForm({
                name: location.name,
                type: location.type,
                address: location.address || '',
                notes: location.notes || ''
            });
        } else {
            setEditingLocation(null);
            setLocationForm({ name: '', type: 'Warehouse', address: '', notes: '' });
        }
        setIsLocationModalOpen(true);
    }

    async function handleSaveLocation(e) {
        e.preventDefault();
        try {
            if (editingLocation) {
                await updateLocation(editingLocation.id, locationForm);
            } else {
                await createLocation(locationForm);
            }
            setIsLocationModalOpen(false);
            loadData();
        } catch (err) {
            alert('Failed to save location: ' + err.message);
        }
    }

    async function handleDeleteLocation(id) {
        if (!confirm('Delete this location? Any inventory items here must be moved first.')) return;
        try {
            await deleteLocation(id);
            loadData();
        } catch (err) {
            alert('Failed to delete location: ' + err.message);
        }
    }

    // ---- Move to Inventory ----
    function openMoveModal() {
        const firstBatch = completedBatches.length > 0 ? completedBatches[0] : null;
        setMoveForm({
            batch_id: firstBatch ? firstBatch.id : '',
            location_id: locations.length > 0 ? locations[0].id : '',
            recipe_id: firstBatch ? firstBatch.recipe_id : '',
            quantity: firstBatch ? (firstBatch.yield_quantity || 0) : 0,
            notes: ''
        });
        setIsMoveModalOpen(true);
    }

    // Auto-fill recipe / quantity when batch changes
    function handleBatchChange(batchId) {
        const batch = completedBatches.find(b => b.id === parseInt(batchId));
        setMoveForm(prev => ({
            ...prev,
            batch_id: batchId,
            recipe_id: batch?.recipe_id || '',
            quantity: batch?.yield_quantity || 0
        }));
    }

    async function handleMoveToInventory(e) {
        e.preventDefault();
        try {
            const batchId = parseInt(moveForm.batch_id);
            const locationId = parseInt(moveForm.location_id);
            const recipeId = parseInt(moveForm.recipe_id);
            const qty = parseInt(moveForm.quantity);

            if (!batchId || !locationId || !recipeId) {
                throw new Error('Please select a valid batch, location, and ensure the recipe is identified.');
            }

            await moveToInventory({
                batch_id: batchId,
                location_id: locationId,
                recipe_id: recipeId,
                quantity: qty,
                notes: moveForm.notes
            });
            setIsMoveModalOpen(false);
            loadData();
        } catch (err) {
            alert('Failed to move to inventory: ' + err.message);
        }
    }

    async function handleDeleteItem(id) {
        if (!confirm('Remove this inventory record?')) return;
        try {
            await deleteInventoryItem(id);
            loadData();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    }

    // ---- Transfer Inventory ----
    function openTransferModal(item = null) {
        setTransferForm({
            inventory_item_id: item ? String(item.id) : '',
            destination_location_id: '',
            quantity: item ? item.quantity : 0
        });
        setIsTransferModalOpen(true);
    }

    async function handleTransferInventory(e) {
        e.preventDefault();
        setTransferSaving(true);
        try {
            const itemId = parseInt(transferForm.inventory_item_id);
            const destId = parseInt(transferForm.destination_location_id);
            const qty = parseInt(transferForm.quantity);

            const sourceItem = inventoryItems.find(i => i.id === itemId);
            if (!sourceItem) throw new Error('Please select an inventory item.');
            if (!destId) throw new Error('Please select a destination location.');
            if (qty <= 0 || qty > sourceItem.quantity) throw new Error(`Quantity must be between 1 and ${sourceItem.quantity}.`);
            if (sourceItem.location_id === destId) throw new Error('Source and destination must be different locations.');

            await transferInventory({
                inventory_item_id: itemId,
                destination_location_id: destId,
                quantity: qty
            });
            setIsTransferModalOpen(false);
            loadData();
        } catch (err) {
            alert('Transfer failed: ' + err.message);
        } finally {
            setTransferSaving(false);
        }
    }

    // ---- Filtering ----
    const filteredItems = inventoryItems.filter(item => {
        if (filterLocation && item.location_id !== parseInt(filterLocation)) return false;
        if (filterRecipe && item.recipe_id !== parseInt(filterRecipe)) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesLot = item.batch?.lot_number?.toLowerCase().includes(term);
            const matchesRecipe = item.recipe?.name?.toLowerCase().includes(term);
            const matchesLocation = item.location?.name?.toLowerCase().includes(term);
            if (!matchesLot && !matchesRecipe && !matchesLocation) return false;
        }
        return true;
    });

    // Summary stats
    const totalUnits = filteredItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const totalValue = filteredItems.reduce((sum, i) => sum + ((i.quantity || 0) * (i.recipe?.default_price || 0)), 0);
    const uniqueProducts = new Set(filteredItems.map(i => i.recipe_id)).size;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    <Warehouse className="icon" />
                    Inventory
                </h1>
                <div className="flex-responsive">
                    <button className="btn btn-secondary" onClick={() => setActiveTab(activeTab === 'inventory' ? 'locations' : 'inventory')}>
                        <MapPin size={18} />
                        <span className="hide-on-mobile">{activeTab === 'inventory' ? 'Locations' : 'Inventory'}</span>
                    </button>
                    {activeTab === 'inventory' ? (
                        <div className="flex-responsive" style={{ gap: 'var(--spacing-sm)' }}>
                            <button className="btn btn-secondary" onClick={() => openTransferModal()} disabled={!canTransfer || inventoryItems.length === 0 || locations.length < 2} title={!canTransfer ? 'Upgrade to Maker to transfer inventory' : ''}>
                                {!canTransfer ? <Lock size={16} /> : <ArrowRightLeft size={18} />}
                                <span className="hide-on-mobile">{!canTransfer ? 'Transfer (Maker)' : 'Transfer'}</span>
                            </button>
                            <button className="btn btn-primary" onClick={openMoveModal} disabled={completedBatches.length === 0 || locations.length === 0}>
                                <Plus size={18} />
                                Move
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={() => openLocationModal()}>
                            <Plus size={18} />
                            Add Location
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            {activeTab === 'inventory' && (
                <div className="stats-grid">
                    <div className="stat-card primary">
                        <div className="stat-icon"><Package size={24} /></div>
                        <div className="stat-value">{totalUnits}</div>
                        <div className="stat-label">Total Units</div>
                    </div>
                    <div className="stat-card secondary">
                        <div className="stat-icon"><Warehouse size={24} /></div>
                        <div className="stat-value">{formatCurrency(totalValue)}</div>
                        <div className="stat-label">Inventory Value</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><MapPin size={24} /></div>
                        <div className="stat-value">{locations.length}</div>
                        <div className="stat-label">Locations</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon"><Package size={24} /></div>
                        <div className="stat-value">{uniqueProducts}</div>
                        <div className="stat-label">Product Types</div>
                    </div>
                </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
                <>
                    {/* Filters */}
                    <div className="card flex-responsive" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', alignItems: 'center' }}>
                        <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search lots, products, locations..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                        <select
                            className="form-input form-select"
                            value={filterLocation}
                            onChange={e => setFilterLocation(e.target.value)}
                            style={{ width: 'auto', minWidth: '160px' }}
                        >
                            <option value="">All Locations</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                        <select
                            className="form-input form-select"
                            value={filterRecipe}
                            onChange={e => setFilterRecipe(e.target.value)}
                            style={{ width: 'auto', minWidth: '160px' }}
                        >
                            <option value="">All Products</option>
                            {recipes.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Inventory Table */}
                    {filteredItems.length === 0 ? (
                        <div className="empty-state">
                            <Package />
                            <h3>No inventory items</h3>
                            <p>Complete production batches and move them here to track inventory across locations.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Lot #</th>
                                        <th>Product</th>
                                        <th>Location</th>
                                        <th>Qty</th>
                                        <th className="hide-on-mobile">Unit Value</th>
                                        <th className="hide-on-mobile">Total Value</th>
                                        <th className="hide-on-mobile">Moved</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="badge badge-purple">
                                                    {item.batch?.lot_number || '—'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{item.recipe?.name || '—'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {item.location?.name || '—'}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                                            <td className="hide-on-mobile">{formatCurrency(item.recipe?.default_price || 0)}</td>
                                            <td className="hide-on-mobile" style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                                                {formatCurrency((item.quantity || 0) * (item.recipe?.default_price || 0))}
                                            </td>
                                            <td className="hide-on-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {item.moved_at ? new Date(item.moved_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className="btn-icon" onClick={() => openTransferModal(item)} title={canTransfer ? 'Transfer' : 'Upgrade to Maker'} disabled={!canTransfer} style={{ color: canTransfer ? 'var(--color-info)' : 'var(--text-muted)' }}>
                                                        {canTransfer ? <ArrowRightLeft size={16} /> : <Lock size={16} />}
                                                    </button>
                                                    <button className="btn-icon" onClick={() => handleDeleteItem(item.id)} title="Remove">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* LOCATIONS TAB */}
            {activeTab === 'locations' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    {locations.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <MapPin />
                            <h3>No locations yet</h3>
                            <p>Add your first store or warehouse location to start tracking inventory.</p>
                        </div>
                    ) : (
                        locations.map(loc => {
                            const locItems = inventoryItems.filter(i => i.location_id === loc.id);
                            const locUnits = locItems.reduce((s, i) => s + (i.quantity || 0), 0);
                            const locValue = locItems.reduce((s, i) => s + ((i.quantity || 0) * (i.recipe?.default_price || 0)), 0);

                            return (
                                <div key={loc.id} className="card" style={{ padding: 'var(--spacing-lg)' }}>
                                    <div className="card-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                                background: 'var(--gradient-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {loc.type === 'Store' ? <MapPin size={20} /> : <Warehouse size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="card-title">{loc.name}</h3>
                                                <span className="badge badge-info">{loc.type}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn-icon" onClick={() => openLocationModal(loc)} title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon" onClick={() => handleDeleteLocation(loc.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {loc.address && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                            {loc.address}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
                                        <div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{locUnits}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Units</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                                {formatCurrency(locValue)}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Value</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{locItems.length}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lots</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* LOCATION MODAL */}
            {isLocationModalOpen && (
                <div className="modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
                            <button className="btn-icon" onClick={() => setIsLocationModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveLocation}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={locationForm.name}
                                        onChange={e => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Main Warehouse"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-input form-select"
                                        value={locationForm.type}
                                        onChange={e => setLocationForm(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="Warehouse">Warehouse</option>
                                        <option value="Store">Store</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address (optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={locationForm.address}
                                        onChange={e => setLocationForm(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="123 Main St"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <textarea
                                        className="form-input"
                                        value={locationForm.notes}
                                        onChange={e => setLocationForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsLocationModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingLocation ? 'Update' : 'Create'} Location
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MOVE TO INVENTORY MODAL */}
            {isMoveModalOpen && (
                <div className="modal-overlay" onClick={() => setIsMoveModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Move Batch to Inventory</h2>
                            <button className="btn-icon" onClick={() => setIsMoveModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleMoveToInventory}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Completed Batch
                                        <span className="info-bubble">
                                            <Info size={14} />
                                            <span className="info-tooltip">Select a completed production batch. Only batches with status "Complete" are shown.</span>
                                        </span>
                                    </label>
                                    <select
                                        className="form-input form-select"
                                        value={moveForm.batch_id}
                                        onChange={e => handleBatchChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select batch...</option>
                                        {completedBatches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.lot_number} — {recipes.find(r => r.id === b.recipe_id)?.name || 'Unknown'} ({b.yield_quantity || 0} units)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Destination Location</label>
                                    <select
                                        className="form-input form-select"
                                        value={moveForm.location_id}
                                        onChange={e => setMoveForm(prev => ({ ...prev, location_id: e.target.value }))}
                                        required
                                    >
                                        {locations.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={moveForm.quantity}
                                            onChange={e => setMoveForm(prev => ({ ...prev, quantity: e.target.value }))}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <textarea
                                        className="form-input"
                                        value={moveForm.notes}
                                        onChange={e => setMoveForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                        placeholder="e.g., Shelf A, Row 3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsMoveModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    <ArrowRightLeft size={18} />
                                    Move to Inventory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSFER INVENTORY MODAL */}
            {isTransferModalOpen && (
                <div className="modal-overlay" onClick={() => setIsTransferModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Transfer Inventory</h2>
                            <button className="btn-icon" onClick={() => setIsTransferModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleTransferInventory}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Inventory Item</label>
                                    <select
                                        className="form-input form-select"
                                        value={transferForm.inventory_item_id}
                                        onChange={e => {
                                            const item = inventoryItems.find(i => i.id === parseInt(e.target.value));
                                            setTransferForm(prev => ({
                                                ...prev,
                                                inventory_item_id: e.target.value,
                                                quantity: item ? item.quantity : 0
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">Select inventory item...</option>
                                        {inventoryItems.filter(i => i.quantity > 0).map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.recipe?.name || 'Unknown'} — {item.batch?.lot_number || 'No Lot'} — {item.location?.name || 'Unknown'} ({item.quantity} units)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Destination Location</label>
                                    <select
                                        className="form-input form-select"
                                        value={transferForm.destination_location_id}
                                        onChange={e => setTransferForm(prev => ({ ...prev, destination_location_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select destination...</option>
                                        {locations
                                            .filter(l => {
                                                const selectedItem = inventoryItems.find(i => i.id === parseInt(transferForm.inventory_item_id));
                                                return !selectedItem || l.id !== selectedItem.location_id;
                                            })
                                            .map(l => (
                                                <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Quantity
                                        {transferForm.inventory_item_id && (() => {
                                            const item = inventoryItems.find(i => i.id === parseInt(transferForm.inventory_item_id));
                                            return item ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (max: {item.quantity})</span> : null;
                                        })()}
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={transferForm.quantity}
                                        onChange={e => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                                        min="1"
                                        max={(() => {
                                            const item = inventoryItems.find(i => i.id === parseInt(transferForm.inventory_item_id));
                                            return item ? item.quantity : 9999;
                                        })()}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={transferSaving}>
                                    <ArrowRightLeft size={18} />
                                    {transferSaving ? 'Transferring...' : 'Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
