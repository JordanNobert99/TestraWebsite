// Inventory helper utilities
class InventoryUtils {
    static getStatus(item) {
        const qty = Number(item.quantity || 0);
        if (qty === 0) {
            return '<span class="status-out">Out of Stock</span>';
        } else if (qty <= (item.reorderLevel || 0)) {
            return '<span class="status-low">Low Stock</span>';
        }
        return '<span class="status-ok">In Stock</span>';
    }

    static sortByDate(items) {
        return items.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return timeB - timeA;
        });
    }

    static formatAllocations(item) {
        const allocations = Array.isArray(item.allocations) ? item.allocations : [];
        if (allocations.length === 0) return '-';
        return allocations.map(a => `${a.companyName}: ${a.qty}`).join('<br>');
    }

    static createItemRow(item) {
        return `
            <tr>
                <td>${item.itemName}</td>
                <td>${item.companyName || '-'}</td>
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
        `;
    }
}