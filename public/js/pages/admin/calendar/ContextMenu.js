// Context menu management
class ContextMenu {
    constructor() {
        this.eventId = null;
    }

    show(eventElement) {
        const contextMenu = document.getElementById('contextMenu');
        const rect = eventElement.getBoundingClientRect();
        
        contextMenu.style.position = 'fixed';
        contextMenu.style.left = rect.left + 'px';
        contextMenu.style.top = rect.bottom + 'px';
        contextMenu.style.display = 'block';
        
        this.eventId = eventElement.dataset.eventId;
    }

    hide() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
        this.eventId = null;
    }

    getEventId() {
        return this.eventId;
    }
}