// Inventory UI management
class InventoryUI {
    constructor() {
        this.formElement = document.getElementById('inventoryForm');
        this.tableBody = document.getElementById('inventoryTableBody');
        this.emptyRow = document.getElementById('emptyRow');
    }

    renderTable(items) {
        console.log('InventoryUI: renderTable - items count:', items.length);

        if (!this.tableBody) {
            console.error('InventoryUI: inventoryTableBody element not found');
            return;
        }

        if (items.length === 0) {
            console.log('InventoryUI: No items, showing empty state');
            if (this.emptyRow) {
                this.emptyRow.style.display = 'table-row';
            }
            this.tableBody.innerHTML = '';
            return;
        }

        console.log('InventoryUI: Rendering', items.length, 'items');

        if (this.emptyRow) {
            this.emptyRow.style.display = 'none';
        }

        this.tableBody.innerHTML = items.map(item => InventoryUtils.createItemRow(item)).join('');
        console.log('InventoryUI: Table rendered successfully');
    }

    showForm(item = null) {
        this.formElement.style.display = 'block';

        if (item) {
            document.getElementById('formTitle').textContent = 'Edit Item';
            document.getElementById('itemName').value = item.itemName;
            document.getElementById('companyName').value = item.companyName || '';
            document.getElementById('category').value = item.category || '';
            document.getElementById('quantity').value = item.quantity;
            document.getElementById('reorderLevel').value = item.reorderLevel;
            document.getElementById('notes').value = item.notes || '';
            // If allocations textarea exists, populate it as JSON
            const allocEl = document.getElementById('allocations');
            if (allocEl) allocEl.value = JSON.stringify(item.allocations || [], null, 2);
            return item.id;
        } else {
            document.getElementById('formTitle').textContent = 'Add New Item';
            document.getElementById('itemForm').reset();
            const allocEl = document.getElementById('allocations');
            if (allocEl) allocEl.value = '';
            return null;
        }
    }

    hideForm() {
        this.formElement.style.display = 'none';
        const form = document.getElementById('itemForm');
        if (form) {
            form.reset();
        }
    }

    getFormData() {
        // Read allocations JSON if the textarea exists (optional)
        let allocations = [];
        const allocEl = document.getElementById('allocations');
        if (allocEl && allocEl.value && allocEl.value.trim()) {
            try {
                const parsed = JSON.parse(allocEl.value);
                if (Array.isArray(parsed)) {
                    allocations = parsed.map(a => ({
                        companyId: a.companyId || (a.companyName ? a.companyName.toLowerCase().replace(/\s+/g, '-') : 'default'),
                        companyName: a.companyName || 'Unspecified',
                        qty: Number(a.qty) || 0
                    }));
                }
            } catch (err) {
                console.warn('InventoryUI: Invalid allocations JSON, ignoring:', err);
            }
        }

        return {
            itemName: document.getElementById('itemName').value,
            // companyName used to indicate which company this item belongs to (free-text for now)
            companyName: document.getElementById('companyName').value || 'Unspecified',
            category: (document.getElementById('category')?.value || '').trim(),
            // quantity kept for backwards-compatibility, will be overridden by allocations sum if allocations provided
            quantity: parseInt(document.getElementById('quantity').value) || 0,
            reorderLevel: parseInt(document.getElementById('reorderLevel').value) || 0,
            notes: document.getElementById('notes').value,
            allocations
        };
    }
}