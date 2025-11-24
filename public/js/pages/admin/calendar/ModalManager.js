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
        const companyContainer = document.getElementById('companyContainer');
        const companyInput = document.getElementById('companyName');
        const timeInputs = document.querySelectorAll('.time-input-group select');

        if (eventType === 'drug-testing') {
            // show test-specific fields and require time/company
            testTypeContainer.style.display = 'grid';
            if (companyContainer) companyContainer.style.display = '';
            if (companyInput) companyInput.setAttribute('required', 'required');
            timeInputs.forEach(input => input.setAttribute('required', 'required'));
        } else {
            // hide test-specific fields and make company non-required/hidden
            testTypeContainer.style.display = 'none';
            if (companyContainer) companyContainer.style.display = 'none';
            if (companyInput) companyInput.removeAttribute('required');
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
            // populate company even if hidden; visibility controlled in handleEventTypeChange
            document.getElementById('companyName').value = event.companyName || '';
            document.getElementById('date').value = event.date;
            document.getElementById('eventType').value = event.eventType || 'drug-testing';
            
            const [hours, minutes] = (event.time || '00:00').split(':');
            document.getElementById('timeHour').value = hours;
            document.getElementById('timeMinute').value = minutes;
            
            if (event.eventType === 'drug-testing') {
                // handle multiple testType values (array) or string
                const selValues = Array.isArray(event.testType) ? event.testType.map(t => String(t)) : (event.testType ? [String(event.testType)] : []);
                const selectEl = document.getElementById('testType');
                if (selectEl) {
                    Array.from(selectEl.options).forEach(opt => {
                        opt.selected = selValues.includes(opt.value);
                    });
                }

                // testMethod may be stored as string
                const testMethodEl = document.getElementById('testMethod');
                if (testMethodEl) testMethodEl.value = event.testMethod || '';
            } else {
                // clear test-specific fields when not drug-testing
                const selectEl = document.getElementById('testType');
                if (selectEl) Array.from(selectEl.options).forEach(opt => opt.selected = false);
                const testMethodEl = document.getElementById('testMethod');
                if (testMethodEl) testMethodEl.value = '';
                document.getElementById('companyName').value = '';
            }

            // status is global: populate regardless of event type
            const statusEl = document.getElementById('status');
            if (statusEl) statusEl.value = event.status || '';
            
            this.handleEventTypeChange(event.eventType || 'drug-testing');
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Event';
            document.getElementById('eventFormElement').reset();
            this.editingId = null;

            // sensible defaults
            document.getElementById('eventType').value = 'drug-testing';
            const methodEl = document.getElementById('testMethod');
            if (methodEl) methodEl.value = ''; // placeholder
            const statusEl = document.getElementById('status');
            if (statusEl) statusEl.value = '';
            const selectEl = document.getElementById('testType');
            if (selectEl) Array.from(selectEl.options).forEach(opt => opt.selected = false);
            this.handleEventTypeChange('drug-testing');
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
        
        // keep testMethod default to placeholder
        const methodEl = document.getElementById('testMethod');
        if (methodEl) methodEl.value = '';

        // clear status and company by default
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.value = '';
        const companyEl = document.getElementById('companyName');
        if (companyEl) companyEl.value = '';

        const selectEl = document.getElementById('testType');
        if (selectEl) Array.from(selectEl.options).forEach(opt => opt.selected = false);

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
            companyName: null,
            date: document.getElementById('date').value,
            time: time,
            eventType: eventType,
            updatedAt: new Date()
        };

        if (eventType === 'drug-testing') {
            const supportedTests = ['urine', 'breath', 'oral'];
            const select = document.getElementById('testType');
            const selected = select ? Array.from(select.selectedOptions).map(o => o.value) : [];

            if (!selected.length) {
                throw new Error('Please select at least one test type (Urine, Oral or Breath).');
            }

            // ensure only supported tests are chosen
            const invalid = selected.filter(s => !supportedTests.includes(s.toLowerCase()));
            if (invalid.length) {
                throw new Error(`Unsupported test type selected: ${invalid.join(', ')}`);
            }

            // test method validation
            const methodSelect = document.getElementById('testMethod');
            const methodVal = methodSelect ? methodSelect.value : '';
            const supportedMethods = ['express', 'express-to-lab', 'lab'];
            if (!methodVal || !supportedMethods.includes(methodVal)) {
                throw new Error('Please select a test method (Express, Express-to-Lab, or Lab Test).');
            }

            // company is required for drug-testing
            const companyVal = document.getElementById('companyName') ? document.getElementById('companyName').value.trim() : '';
            if (!companyVal) {
                throw new Error('Company name is required for drug testing events.');
            }

            // store test-specific fields
            eventData.testType = selected; // store as array
            eventData.testMethod = methodVal;
            eventData.companyName = companyVal;
        } else {
            // non-drug events should not include company or test data
            eventData.testType = null;
            eventData.testMethod = null;
            eventData.companyName = null;
        }

        // status is global for all event types
        eventData.status = document.getElementById('status').value || null;

        return eventData;
    }
}