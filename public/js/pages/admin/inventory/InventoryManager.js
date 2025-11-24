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

        // Delegated listener for direct numeric input changes only (no +/- buttons)
        const tbody = document.getElementById('inventoryTableBody');
        if (tbody) {
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
            // apply current sorting & filters when first loading
            this.applyFilters();
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

        // scroll the form into view and focus the first field so user sees the edit view immediately
        const formEl = document.getElementById('inventoryForm');
        if (formEl) {
            // smooth scroll to the top of the form (block: 'start' puts it at top of viewport)
            formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // focus first visible input after a short delay (allow showForm animation/dom updates)
            setTimeout(() => {
                const firstFocusable = formEl.querySelector('input, select, textarea, button');
                if (firstFocusable) firstFocusable.focus();
            }, 250);
        }
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
            this.applyFilters();
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
                this.applyFilters();
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

            // build searchable haystack including status and allocations and numeric values
            const statusText = InventoryUtils.getStatusText(item);
            const allocationsText = InventoryUtils.formatAllocations(item).replace(/<br>/g, ' ');
            const hay = [
                item.itemName,
                item.companyName,
                item.category,
                item.notes,
                String(item.quantity),
                String(item.reorderLevel),
                statusText,
                allocationsText
            ].filter(Boolean).join(' ').toLowerCase();

            return hay.includes(q);
        });

        const sorted = this.applySort(filtered);

        this.inventoryUI.renderTable(sorted);
    }

    applySort(items) {
        if (!this.sortField) return items;
        return InventoryUtils.sortByField(items, this.sortField, this.sortDir);
    }

    toggleSort(field) {
        if (!field) return;
        if (this.sortField === field) {
            // toggle direction
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDir = 'asc';
        }
        this.updateSortIndicators();
        this.applyFilters();
    }

    updateSortIndicators() {
        document.querySelectorAll('.inventory-table thead th[data-sort]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            if (th.dataset.sort === this.sortField) {
                th.classList.add(this.sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });
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