class InventoryManager {
    constructor() {
        this.currentUser = null;
        this.items = [];
        this.editingId = null;
        this.init();
    }

    init() {
        // Directly use Firebase's onAuthStateChanged
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                console.log('InventoryManager: User logged in:', user.email);
                document.getElementById('userEmail').textContent = user.email;
                this.loadInventory();
                this.setupEventListeners();
                this.setupLogout();
            } else {
                // User is not authenticated, redirect to login
                console.log('InventoryManager: User not authenticated, redirecting to login');
                window.location.href = '../../pages/login.html';
            }
        });
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addItemBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('itemForm');
        
        if (addBtn && !addBtn.dataset.initialized) {
            addBtn.addEventListener('click', () => this.showForm());
            addBtn.dataset.initialized = 'true';
        }
        
        if (cancelBtn && !cancelBtn.dataset.initialized) {
            cancelBtn.addEventListener('click', () => this.hideForm());
            cancelBtn.dataset.initialized = 'true';
        }
        
        if (form && !form.dataset.initialized) {
            form.addEventListener('submit', (e) => this.handleSave(e));
            form.dataset.initialized = 'true';
        }
    }

    async loadInventory() {
        try {
            console.log('InventoryManager: Loading inventory for user:', this.currentUser.uid);
            // Get all inventory items for this user (no orderBy needed)
            const snapshot = await firebase.firestore()
                .collection('inventory')
                .where('userId', '==', this.currentUser.uid)
                .get();

            this.items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort in memory instead
            this.items.sort((a, b) => {
                const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return timeB - timeA; // Descending order
            });

            console.log('InventoryManager: Loaded', this.items.length, 'items');
            this.renderTable();
        } catch (error) {
            console.error('InventoryManager: Error loading inventory:', error);
        }
    }

    renderTable() {
        const tbody = document.getElementById('inventoryTableBody');
        const emptyRow = document.getElementById('emptyRow');

        // Safety checks
        if (!tbody || !emptyRow) {
            console.error('InventoryManager: Table elements not found');
            return;
        }

        if (this.items.length === 0) {
            emptyRow.style.display = 'table-row';
            tbody.innerHTML = ''; // Clear the table body
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
        if (item.quantity === 0) {
            return '<span class="status-out">Out of Stock</span>';
        } else if (item.quantity <= item.reorderLevel) {
            return '<span class="status-low">Low Stock</span>';
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
            console.log('InventoryManager: Saving item:', itemData);
            if (this.editingId) {
                console.log('InventoryManager: Updating existing item:', this.editingId);
                await firebase.firestore()
                    .collection('inventory')
                    .doc(this.editingId)
                    .update(itemData);
            } else {
                console.log('InventoryManager: Adding new item');
                itemData.createdAt = new Date();
                await firebase.firestore()
                    .collection('inventory')
                    .add(itemData);
            }

            console.log('InventoryManager: Item saved successfully');
            this.hideForm();
            this.loadInventory();
        } catch (error) {
            console.error('InventoryManager: Error saving item:', error);
            alert('Failed to save item: ' + error.message);
        }
    }

    editItem(id) {
        this.showForm(id);
    }

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                console.log('InventoryManager: Deleting item:', id);
                await firebase.firestore()
                    .collection('inventory')
                    .doc(id)
                    .delete();
                
                console.log('InventoryManager: Item deleted successfully');
                await this.loadInventory();
            } catch (error) {
                console.error('InventoryManager: Error deleting item:', error);
                alert('Failed to delete item: ' + error.message);
            }
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    console.log('InventoryManager: Logout clicked');
                    await firebase.auth().signOut();
                } catch (error) {
                    console.error('InventoryManager: Error logging out:', error);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('InventoryManager: DOM ready, initializing');
    window.inventoryManager = new InventoryManager();
});