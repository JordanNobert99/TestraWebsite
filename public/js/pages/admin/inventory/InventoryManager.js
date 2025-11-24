// Main inventory manager orchestrator
class InventoryManager {
    constructor() {
        this.currentUser = null;
        this.inventoryData = null;
        this.inventoryUI = new InventoryUI();
        this.editingId = null;

        // sorting state
        this.sortField = null; // e.g. 'itemName', 'companyName', 'category', 'quantity', 'reorderLevel'
        this.sortDir = 'asc'; // 'asc' or 'desc'

        this.init();
    }

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                console.log('InventoryManager: User logged in:', user.email);
                document.getElementById('userEmail').textContent = user.email;

                this.inventoryData = new InventoryData(user.uid);
                this.loadInventory();
                this.setupEventListeners();
                this.setupLogout();
            } else {
                console.log('InventoryManager: User not authenticated, redirecting to login');
                window.location.href = '../../pages/login.html';
            }
        });
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addItemBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('itemForm');

        addBtn?.addEventListener('click', () => this.handleAddClick());
        cancelBtn?.addEventListener('click', () => this.inventoryUI.hideForm());
        form?.addEventListener('submit', (e) => this.handleSave(e));

        // Search & category filter
        const searchEl = document.getElementById('inventorySearch');
        const categoryEl = document.getElementById('categoryFilter');
        if (searchEl) {
            searchEl.addEventListener('input', () => this.applyFilters());
        }
        if (categoryEl) {
            categoryEl.addEventListener('change', () => this.applyFilters());
        }

        // Header sorting - attach to any th[data-sort]
        document.querySelectorAll('.inventory-table thead th[data-sort]').forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                this.toggleSort(field);
            });
        });

        // Delegated listeners for inline quantity controls
        const tbody = document.getElementById('inventoryTableBody');
        if (tbody) {
            // Clicks for +/- buttons
            tbody.addEventListener('click', async (e) => {
                const btn = e.target.closest('.qty-btn');
                if (!btn) return;
                const action = btn.dataset.action;
                const itemId = btn.dataset.id;
                if (!itemId || !action) return;

                const item = this.inventoryData.getItemById(itemId);
                if (!item) return;

                const current = Number(item.quantity || 0);
                let newQty = current;
                if (action === 'inc') newQty = current + 1;
                if (action === 'dec') newQty = Math.max(0, current - 1);

                try {
                    await this.inventoryData.setItemQuantity(itemId, newQty);
                    await this.inventoryData.loadItems();
                    this.applyFilters();
                } catch (err) {
                    console.error('InventoryManager: Error updating quantity:', err);
                    alert('Failed to update quantity: ' + err.message);
                }
            });

            // Change / blur for direct numeric input
            tbody.addEventListener('change', async (e) => {
                const input = e.target.closest('.qty-input');
                if (!input) return;
                const itemId = input.dataset.id;
                if (!itemId) return;
                const parsed = parseInt(input.value, 10);
                const newQty = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

                try {
                    await this.inventoryData.setItemQuantity(itemId, newQty);
                    await this.inventoryData.loadItems();
                    this.applyFilters();
                } catch (err) {
                    console.error('InventoryManager: Error updating quantity:', err);
                    alert('Failed to update quantity: ' + err.message);
                }
            });
        }
    }

    async loadInventory() {
        try {
            await this.inventoryData.loadItems();
            this.populateCategoryFilter();
            this.inventoryUI.renderTable(this.inventoryData.items);
        } catch (error) {
            console.error('InventoryManager: Error loading inventory:', error);
        }
    }

    handleAddClick() {
        this.editingId = null;
        this.inventoryUI.showForm();
    }

    editItem(id) {
        this.editingId = id;
        const item = this.inventoryData.getItemById(id);
        this.inventoryUI.showForm(item);
    }

    async handleSave(e) {
        e.preventDefault();

        try {
            const itemData = this.inventoryUI.getFormData();
            itemData.userId = this.currentUser.uid;
            itemData.updatedAt = new Date();

            await this.inventoryData.saveItem(itemData, this.editingId);

            this.inventoryUI.hideForm();
            // Refresh local UI and filters
            await this.inventoryData.loadItems();
            this.populateCategoryFilter();
            this.inventoryUI.renderTable(this.inventoryData.items);
        } catch (error) {
            console.error('InventoryManager: Error saving item:', error);
            alert('Failed to save item: ' + error.message);
        }
    }

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await this.inventoryData.deleteItem(id);
                await this.inventoryData.loadItems();
                this.populateCategoryFilter();
                this.inventoryUI.renderTable(this.inventoryData.items);
            } catch (error) {
                console.error('InventoryManager: Error deleting item:', error);
                alert('Failed to delete item: ' + error.message);
            }
        }
    }

    // Build category filter options from loaded items
    populateCategoryFilter() {
        const categoryEl = document.getElementById('categoryFilter');
        if (!categoryEl) return;

        const categories = new Set();
        (this.inventoryData.items || []).forEach(it => {
            if (it.category && it.category.trim()) categories.add(it.category.trim());
        });

        // preserve current selection
        const current = categoryEl.value || 'all';
        categoryEl.innerHTML = '<option value="all">All Categories</option>';
        Array.from(categories).sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categoryEl.appendChild(opt);
        });

        if (Array.from(categories).includes(current)) {
            categoryEl.value = current;
        } else {
            categoryEl.value = 'all';
        }
    }

    applyFilters() {
        const searchEl = document.getElementById('inventorySearch');
        const categoryEl = document.getElementById('categoryFilter');
        const q = (searchEl?.value || '').trim().toLowerCase();
        const cat = (categoryEl?.value || 'all');

        const filtered = (this.inventoryData.items || []).filter(item => {
            if (cat !== 'all' && (item.category || '').trim() !== cat) return false;

            if (!q) return true;

            const hay = [
                item.itemName,
                item.companyName,
                item.category,
                item.notes
            ].filter(Boolean).join(' ').toLowerCase();

            return hay.includes(q);
        });

        this.inventoryUI.renderTable(filtered);
    }

    toggleSort(field) {
        if (this.sortField === field) {
            // If already sorted by this field, toggle direction
            this.sortDir = (this.sortDir === 'asc') ? 'desc' : 'asc';
        } else {
            // Otherwise, set new field and default to ascending
            this.sortField = field;
            this.sortDir = 'asc';
        }

        // Sort items array
        const direction = (this.sortDir === 'asc') ? 1 : -1;
        this.inventoryData.items.sort((a, b) => {
            if (a[field] < b[field]) return -1 * direction;
            if (a[field] > b[field]) return 1 * direction;
            return 0;
        });

        // Reapply filters after sorting
        this.applyFilters();
    }

    setupLogout() {
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            try {
                console.log('InventoryManager: Logout clicked');
                await firebase.auth().signOut();
            } catch (error) {
                console.error('InventoryManager: Error logging out:', error);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('InventoryManager: DOM ready, initializing');
    window.inventoryManager = new InventoryManager();
});