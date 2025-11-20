class InventoryManager {
    constructor() {
        this.currentUser = null;
        this.items = [];
        this.editingId = null;
        this.authGuard = null;
        this.init();
    }

    init() {
        // Use auth guard to check if user is logged in
        this.authGuard = new AuthGuard((user) => {
            this.currentUser = user;
            document.getElementById('userEmail').textContent = user.email;
            this.loadInventory();
            this.setupEventListeners();
            this.setupLogout();
        });
    }

    setupEventListeners() {
        document.getElementById('addItemBtn').addEventListener('click', () => this.showForm());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleSave(e));
    }

    async loadInventory() {
        try {
            const snapshot = await firebase.firestore()
                .collection('inventory')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            this.items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderTable();
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    renderTable() {
        const tbody = document.getElementById('inventoryTableBody');
        const emptyRow = document.getElementById('emptyRow');

        if (this.items.length === 0) {
            emptyRow.style.display = 'table-row';
            return;
        }

        emptyRow.style.display = 'none';
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${item.reorderLevel}</td>
                <td>${this.getStatus(item)}</td>
                <td>${item.notes || '-'}</td>
                <td class="actions">
                    <button class="btn-small" onclick="inventoryManager.editItem('${item.id}')">Edit</button>
                    <button class="btn-small btn-danger" onclick="inventoryManager.deleteItem('${item.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    getStatus(item) {
        if (item.quantity <= item.reorderLevel) {
            return '<span class="status-low">Low Stock</span>';
        } else if (item.quantity === 0) {
            return '<span class="status-out">Out of Stock</span>';
        }
        return '<span class="status-ok">In Stock</span>';
    }

    showForm(id = null) {
        document.getElementById('inventoryForm').style.display = 'block';
        
        if (id) {
            this.editingId = id;
            const item = this.items.find(i => i.id === id);
            document.getElementById('formTitle').textContent = 'Edit Item';
            document.getElementById('itemName').value = item.itemName;
            document.getElementById('quantity').value = item.quantity;
            document.getElementById('unit').value = item.unit;
            document.getElementById('reorderLevel').value = item.reorderLevel;
            document.getElementById('notes').value = item.notes || '';
        } else {
            document.getElementById('formTitle').textContent = 'Add New Item';
            document.getElementById('itemForm').reset();
            this.editingId = null;
        }
    }

    hideForm() {
        document.getElementById('inventoryForm').style.display = 'none';
        document.getElementById('itemForm').reset();
    }

    async handleSave(e) {
        e.preventDefault();

        const itemData = {
            itemName: document.getElementById('itemName').value,
            quantity: parseInt(document.getElementById('quantity').value),
            unit: document.getElementById('unit').value,
            reorderLevel: parseInt(document.getElementById('reorderLevel').value),
            notes: document.getElementById('notes').value,
            userId: this.currentUser.uid,
            updatedAt: new Date()
        };

        try {
            if (this.editingId) {
                await firebase.firestore()
                    .collection('inventory')
                    .doc(this.editingId)
                    .update(itemData);
            } else {
                itemData.createdAt = new Date();
                await firebase.firestore()
                    .collection('inventory')
                    .add(itemData);
            }

            this.hideForm();
            this.loadInventory();
        } catch (error) {
            console.error('Error saving item:', error);
            alert('Failed to save item');
        }
    }

    async editItem(id) {
        this.showForm(id);
    }

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await firebase.firestore()
                    .collection('inventory')
                    .doc(id)
                    .delete();
                this.loadInventory();
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Failed to delete item');
            }
        }
    }

    setupLogout() {
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await firebase.auth().signOut();
            window.location.href = '../../pages/login.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});