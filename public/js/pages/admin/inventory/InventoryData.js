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

            this.items = snapshot.docs.map(doc => {
                const data = doc.data() || {};
                // normalize allocations for backward compatibility
                const allocations = Array.isArray(data.allocations) ? data.allocations.slice() : [];
                if (allocations.length === 0) {
                    // legacy support: if doc had a flat quantity, convert to a default allocation
                    const legacyQty = typeof data.quantity === 'number' ? data.quantity : 0;
                    allocations.push({
                        companyId: data.companyId || 'default',
                        companyName: data.companyName || 'Unspecified',
                        qty: legacyQty
                    });
                }
                const totalQty = allocations.reduce((s, a) => s + (Number(a.qty) || 0), 0);

                return {
                    id: doc.id,
                    ...data,
                    allocations,
                    quantity: totalQty
                };
            });

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
            // Ensure allocations exist and quantity is the sum
            const allocations = Array.isArray(itemData.allocations) ? itemData.allocations : [];
            if (allocations.length === 0 && typeof itemData.quantity === 'number') {
                allocations.push({
                    companyId: itemData.companyId || 'default',
                    companyName: itemData.companyName || 'Unspecified',
                    qty: itemData.quantity
                });
            }
            itemData.allocations = allocations;
            itemData.quantity = allocations.reduce((s, a) => s + (Number(a.qty) || 0), 0);

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

    // New: update or add allocation for a company on an item (atomic-ish)
    async updateAllocation(itemId, companyId, companyName, qty) {
        try {
            const item = this.getItemById(itemId);
            if (!item) throw new Error('Item not found');

            const allocations = Array.isArray(item.allocations) ? item.allocations.slice() : [];
            const idx = allocations.findIndex(a => a.companyId === companyId);
            if (idx === -1) {
                allocations.push({ companyId, companyName, qty: Number(qty) });
            } else {
                allocations[idx].qty = Number(qty);
                allocations[idx].companyName = companyName;
            }

            const newData = { ...item, allocations };
            newData.quantity = allocations.reduce((s, a) => s + (Number(a.qty) || 0), 0);
            newData.updatedAt = new Date();

            await firebase.firestore().collection('inventory').doc(itemId).update({
                allocations: newData.allocations,
                quantity: newData.quantity,
                updatedAt: newData.updatedAt
            });

            // update local cache
            const i = this.items.findIndex(x => x.id === itemId);
            if (i !== -1) this.items[i] = { id: itemId, ...newData };

            return this.items[i];
        } catch (error) {
            console.error('InventoryData: Error updating allocation:', error);
            throw error;
        }
    }

    // New: remove a company's allocation
    async removeAllocation(itemId, companyId) {
        try {
            const item = this.getItemById(itemId);
            if (!item) throw new Error('Item not found');

            const allocations = (item.allocations || []).filter(a => a.companyId !== companyId);
            const newQty = allocations.reduce((s, a) => s + (Number(a.qty) || 0), 0);

            await firebase.firestore().collection('inventory').doc(itemId).update({
                allocations,
                quantity: newQty,
                updatedAt: new Date()
            });

            const i = this.items.findIndex(x => x.id === itemId);
            if (i !== -1) this.items[i] = { id: itemId, ...item, allocations, quantity: newQty, updatedAt: new Date() };

            return this.items[i];
        } catch (error) {
            console.error('InventoryData: Error removing allocation:', error);
            throw error;
        }
    }
}