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
        // Use only the native number input (no left/right buttons).
        return `
            <tr>
                <td>${item.itemName}</td>
                <td>${item.companyName || '-'}</td>
                <td>${item.category || '-'}</td>
                <td>
                    <div class="qty-inline" data-id="${item.id}">
                        <input type="number" class="qty-input" data-id="${item.id}" value="${item.quantity}" min="0" />
                    </div>
                </td>
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

    /**
     * Sort an array of inventory items by a field.
     * field: string key to sort by (e.g. 'itemName', 'companyName', 'category', 'quantity', 'reorderLevel')
     * dir: 'asc'|'desc'
     */
    static sortByField(items, field, dir = 'asc') {
        if (!field) return items;
        const direction = dir === 'desc' ? -1 : 1;

        const cmp = (a, b) => {
            const va = (a && a[field] != null) ? a[field] : '';
            const vb = (b && b[field] != null) ? b[field] : '';

            // numeric comparison if both are numbers
            const na = Number(va);
            const nb = Number(vb);
            if (!Number.isNaN(na) && !Number.isNaN(nb)) {
                if (na < nb) return -1 * direction;
                if (na > nb) return 1 * direction;
                return 0;
            }

            // string comparison
            const sa = String(va).toLowerCase();
            const sb = String(vb).toLowerCase();
            if (sa < sb) return -1 * direction;
            if (sa > sb) return 1 * direction;
            return 0;
        };

        // return a new sorted array (non-mutating)
        return items.slice().sort(cmp);
    }
}