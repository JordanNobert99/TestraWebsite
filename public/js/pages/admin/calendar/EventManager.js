// Firebase event CRUD operations
class EventManager {
    constructor(userId, notificationService = null) {
        this.userId = userId;
        this.events = [];
        this.notificationService = notificationService;
    }

    async loadEvents() {
        try {
            console.log('EventManager: Loading events for user:', this.userId);
            const snapshot = await firebase.firestore()
                .collection('calendar_events')
                .where('userId', '==', this.userId)
                .get();

            this.events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('EventManager: Loaded', this.events.length, 'events');
            return this.events;
        } catch (error) {
            console.error('EventManager: Error loading events:', error);
            throw error;
        }
    }

    async saveEvent(eventData) {
        try {
            if (eventData.id) {
                // Update existing
                await firebase.firestore()
                    .collection('calendar_events')
                    .doc(eventData.id)
                    .update(eventData);

                const index = this.events.findIndex(e => e.id === eventData.id);
                if (index !== -1) {
                    this.events[index] = eventData;
                }
            } else {
                // Create new
                eventData.createdAt = new Date();
                const docRef = await firebase.firestore()
                    .collection('calendar_events')
                    .add(eventData);

                this.events.push({ id: docRef.id, ...eventData });
                return docRef.id;
            }
        } catch (error) {
            console.error('EventManager: Error saving event:', error);
            throw error;
        }
    }

    async deleteEvent(eventId) {
        try {
            await firebase.firestore()
                .collection('calendar_events')
                .doc(eventId)
                .delete();

            this.events = this.events.filter(e => e.id !== eventId);
        } catch (error) {
            console.error('EventManager: Error deleting event:', error);
            throw error;
        }
    }

    async moveEventToDate(eventId, newDate) {
        try {
            await firebase.firestore()
                .collection('calendar_events')
                .doc(eventId)
                .update({
                    date: newDate,
                    updatedAt: new Date()
                });

            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index].date = newDate;
                this.events[index].updatedAt = new Date();
            }
        } catch (error) {
            console.error('EventManager: Error moving event:', error);
            throw error;
        }
    }

    async updateInventory(eventData) {
        try {
            // Only support inventory updates for tests we actually do
            const supportedTests = ['urine', 'breath'];
            const testTypes = Array.isArray(eventData.testType) ? eventData.testType : (eventData.testType ? [eventData.testType] : []);
            if (!testTypes.length) {
                console.warn('EventManager: No test types provided for inventory update.');
                return;
            }

            const testSupplies = {
                'urine': [{ name: 'Urine Test Cups', quantity: 1 }],
                'breath': [{ name: 'Breathalyzer Cartridges', quantity: 1 }]
            };

            const updatedItems = [];

            // iterate each selected test type and deduct supplies sequentially
            for (const rawTest of testTypes) {
                const testKey = (rawTest || '').toLowerCase();
                if (!supportedTests.includes(testKey)) {
                    console.warn(`EventManager: Skipping unsupported test type "${rawTest}"`);
                    continue;
                }

                const supplies = testSupplies[testKey] || [];

                for (const supply of supplies) {
                    const inventorySnapshot = await firebase.firestore()
                        .collection('inventory')
                        .where('userId', '==', this.userId)
                        .where('itemName', '==', supply.name)
                        .get();

                    if (!inventorySnapshot.empty) {
                        const docId = inventorySnapshot.docs[0].id;
                        const currentQuantity = inventorySnapshot.docs[0].data().quantity;
                        const newQuantity = Math.max(0, currentQuantity - supply.quantity);

                        await firebase.firestore()
                            .collection('inventory')
                            .doc(docId)
                            .update({
                                quantity: newQuantity,
                                updatedAt: new Date()
                            });

                        updatedItems.push({
                            name: supply.name,
                            deducted: supply.quantity,
                            newQuantity: newQuantity
                        });
                    }
                }
            }

            // Send notification
            if (this.notificationService && updatedItems.length > 0) {
                const itemsList = updatedItems.map(item => 
                    `${item.name} (-${item.deducted}, now ${item.newQuantity})`
                ).join(', ');

                await this.notificationService.createNotification(
                    'inventory',
                    'Inventory Updated',
                    `Supplies deducted for ${testTypes.join(', ')}: ${itemsList}`,
                    {
                        eventId: eventData.id,
                        eventType: eventData.eventType,
                        testTypes: testTypes,
                        clientName: eventData.clientName,
                        updatedItems: updatedItems
                    }
                );
            }

            console.log('EventManager: Inventory updated successfully');
        } catch (error) {
            console.error('EventManager: Error updating inventory:', error);
            throw error;
        }
    }

    getEventsByDate(dateStr) {
        return this.events
            .filter(e => e.date === dateStr)
            .sort((a, b) => {
                const timeA = a.time || '00:00';
                const timeB = b.time || '00:00';
                return timeA.localeCompare(timeB);
            });
    }
}