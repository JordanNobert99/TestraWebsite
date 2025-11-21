// Context menu management
class ContextMenu {
    constructor() {
        this.eventId = null;
        this.onDeleteCallback = null;
        this.setupContextMenuListener();
    }

    setupContextMenuListener() {
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hide();
            }
        });

        // Handle delete button click
        document.getElementById('deleteEventBtn')?.addEventListener('click', () => {
            if (this.onDeleteCallback && this.eventId) {
                this.onDeleteCallback(this.eventId);
            }
        });
    }

    show(x, y, eventId, onDeleteCallback) {
        const contextMenu = document.getElementById('contextMenu');
        
        this.eventId = eventId;
        this.onDeleteCallback = onDeleteCallback;
        
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';
    }

    hide() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
        this.eventId = null;
        this.onDeleteCallback = null;
    }

    getEventId() {
        return this.eventId;
    }
}