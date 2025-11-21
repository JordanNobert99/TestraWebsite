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
            document.getElementById('quantity').value = item.quantity;
            document.getElementById('unit').value = item.unit;
            document.getElementById('reorderLevel').value = item.reorderLevel;
            document.getElementById('notes').value = item.notes || '';
            return item.id;
        } else {
            document.getElementById('formTitle').textContent = 'Add New Item';
            document.getElementById('itemForm').reset();
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
        return {
            itemName: document.getElementById('itemName').value,
            quantity: parseInt(document.getElementById('quantity').value),
            unit: document.getElementById('unit').value,
            reorderLevel: parseInt(document.getElementById('reorderLevel').value),
            notes: document.getElementById('notes').value
        };
    }
}