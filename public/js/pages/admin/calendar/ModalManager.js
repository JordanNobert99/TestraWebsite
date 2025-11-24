// Modal and event form management
class ModalManager {
    constructor() {
        this.editingId = null;
    }

    populateTimeDropdowns() {
        const { hours, minutes } = CalendarUtils.generateTimeOptions();
        const hourSelect = document.getElementById('timeHour');
        const minuteSelect = document.getElementById('timeMinute');

        hourSelect.innerHTML = '<option value=""></option>';
        hours.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = h;
            hourSelect.appendChild(option);
        });

        minuteSelect.innerHTML = '<option value=""></option>';
        minutes.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m;
            minuteSelect.appendChild(option);
        });
    }

    handleEventTypeChange(eventType) {
        const testTypeContainer = document.getElementById('testTypeContainer');
        const timeInputs = document.querySelectorAll('.time-input-group select');

        if (eventType === 'drug-testing') {
            testTypeContainer.style.display = 'grid';
            timeInputs.forEach(input => input.setAttribute('required', 'required'));
        } else {
            testTypeContainer.style.display = 'none';
            timeInputs.forEach(input => input.removeAttribute('required'));
        }
    }

    showModal(event = null) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
        this.populateTimeDropdowns();

        if (event) {
            this.editingId = event.id;
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('clientName').value = event.clientName;
            document.getElementById('companyName').value = event.companyName || '';
            document.getElementById('date').value = event.date;
            document.getElementById('eventType').value = event.eventType || 'drug-testing';
            
            const [hours, minutes] = (event.time || '00:00').split(':');
            document.getElementById('timeHour').value = hours;
            document.getElementById('timeMinute').value = minutes;
            
            if (event.eventType === 'drug-testing') {
                // support both array and string stored test types -> prefer first value if array
                const storedTestType = Array.isArray(event.testType) ? event.testType[0] : event.testType;
                const testTypeEl = document.getElementById('testType');
                if (testTypeEl) testTypeEl.value = storedTestType || '';

                // testMethod may be stored as string
                const testMethodEl = document.getElementById('testMethod');
                if (testMethodEl) testMethodEl.value = event.testMethod || '';
            }

            // status is global: populate regardless of event type
            const statusEl = document.getElementById('status');
            if (statusEl) statusEl.value = event.status || '';
            
            this.handleEventTypeChange(event.eventType || 'drug-testing');
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Event';
            document.getElementById('eventFormElement').reset();
            this.editingId = null;
        }
    }

    showModalForDate(dateStr) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById('eventModal').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Add New Event';
        document.getElementById('eventFormElement').reset();
        document.getElementById('date').value = dateStr;

        this.populateTimeDropdowns();
        
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        let minuteVal = Math.ceil(now.getMinutes() / 15) * 15;
        if (minuteVal === 60) {
            minuteVal = 0;
        }
        const minutes = String(minuteVal).padStart(2, '0');
        
        document.getElementById('timeHour').value = hours;
        document.getElementById('timeMinute').value = minutes;
        document.getElementById('eventType').value = 'drug-testing';
        
        // keep testMethod default to placeholder (do not force 'express')
        const methodEl = document.getElementById('testMethod');
        if (methodEl) methodEl.value = '';

        // clear status by default
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.value = '';

        this.handleEventTypeChange('drug-testing');
        this.editingId = null;
    }

    hideModal() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
        document.getElementById('eventFormElement').reset();
    }

    getFormData() {
        const eventType = document.getElementById('eventType').value;
        const hour = document.getElementById('timeHour').value;
        const minute = document.getElementById('timeMinute').value;
        
        if (eventType === 'drug-testing' && (!hour || !minute)) {
            throw new Error('Please select a time for drug testing events');
        }
        
        const time = (hour && minute) ? `${hour}:${minute}` : '';

        const eventData = {
            clientName: document.getElementById('clientName').value,
            companyName: document.getElementById('companyName').value || null,
            date: document.getElementById('date').value,
            time: time,
            eventType: eventType,
            updatedAt: new Date()
        };

        if (eventType === 'drug-testing') {
            const supportedTests = ['urine', 'breath', 'oral'];
            const select = document.getElementById('testType');
            const selected = select ? select.value : '';

            if (!selected) {
                throw new Error('Please select a test type (Urine, Oral or Breath).');
            }

            // ensure only supported tests are chosen
            if (!supportedTests.includes(selected.toLowerCase())) {
                throw new Error(`Unsupported test type selected: ${selected}`);
            }

            // test method validation
            const methodSelect = document.getElementById('testMethod');
            const methodVal = methodSelect ? methodSelect.value : '';
            const supportedMethods = ['express', 'express-to-lab', 'lab'];
            if (!methodVal || !supportedMethods.includes(methodVal)) {
                throw new Error('Please select a test method (Express, Express-to-Lab, or Lab Test).');
            }

            // store test-specific fields
            eventData.testType = selected;
            eventData.testMethod = methodVal;
        } else {
            eventData.testType = null;
            eventData.testMethod = null;
        }

        // status is global for all event types
        eventData.status = document.getElementById('status').value || null;

        return eventData;
    }
}