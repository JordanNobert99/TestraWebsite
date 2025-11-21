// Main inventory manager orchestrator
class InventoryManager {
    constructor() {
        this.currentUser = null;
        this.inventoryData = null;
        this.inventoryUI = new InventoryUI();
        this.editingId = null;
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
    }

    async loadInventory() {
        try {
            await this.inventoryData.loadItems();
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
            setTimeout(() => {
                this.inventoryUI.renderTable(this.inventoryData.items);
            }, 50);
        } catch (error) {
            console.error('InventoryManager: Error saving item:', error);
            alert('Failed to save item: ' + error.message);
        }
    }

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await this.inventoryData.deleteItem(id);
                this.inventoryUI.renderTable(this.inventoryData.items);
            } catch (error) {
                console.error('InventoryManager: Error deleting item:', error);
                alert('Failed to delete item: ' + error.message);
            }
        }
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