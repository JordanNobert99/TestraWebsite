// Firebase inventory operations
class InventoryData {
    constructor(userId) {
        this.userId = userId;
        this.items = [];
    }

    async loadItems() {
        try {
            console.log('InventoryData: Loading inventory for user:', this.userId);
            const snapshot = await firebase.firestore()
                .collection('inventory')
                .where('userId', '==', this.userId)
                .get();

            this.items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.items = InventoryUtils.sortByDate(this.items);
            console.log('InventoryData: Loaded', this.items.length, 'items');
            return this.items;
        } catch (error) {
            console.error('InventoryData: Error loading inventory:', error);
            throw error;
        }
    }

    async saveItem(itemData, itemId = null) {
        try {
            if (itemId) {
                console.log('InventoryData: Updating item:', itemId);
                await firebase.firestore()
                    .collection('inventory')
                    .doc(itemId)
                    .update(itemData);

                const index = this.items.findIndex(i => i.id === itemId);
                if (index !== -1) {
                    this.items[index] = { id: itemId, ...itemData };
                }
            } else {
                console.log('InventoryData: Creating new item');
                itemData.createdAt = new Date();
                const docRef = await firebase.firestore()
                    .collection('inventory')
                    .add(itemData);

                this.items.push({ id: docRef.id, ...itemData });
                console.log('InventoryData: Item created with ID:', docRef.id);
            }

            this.items = InventoryUtils.sortByDate(this.items);
            return this.items;
        } catch (error) {
            console.error('InventoryData: Error saving item:', error);
            throw error;
        }
    }

    async deleteItem(itemId) {
        try {
            console.log('InventoryData: Deleting item:', itemId);
            await firebase.firestore()
                .collection('inventory')
                .doc(itemId)
                .delete();

            this.items = this.items.filter(item => item.id !== itemId);
            console.log('InventoryData: Item deleted successfully');
            return this.items;
        } catch (error) {
            console.error('InventoryData: Error deleting item:', error);
            throw error;
        }
    }

    getItemById(id) {
        return this.items.find(i => i.id === id);
    }
}