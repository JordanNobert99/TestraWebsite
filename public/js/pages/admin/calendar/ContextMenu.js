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

        // Hide context menu when scrolling
        document.addEventListener('scroll', () => {
            this.hide();
        }, true);

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
        
        // Adjust if menu goes off-screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (y - rect.height) + 'px';
        }
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