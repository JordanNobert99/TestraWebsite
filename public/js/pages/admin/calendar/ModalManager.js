// Modal and event form management
class ModalManager {
    constructor() {
        this.editingId = null;
        // setup multi-select control handlers
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTestTypeControl();
        });
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

    setupTestTypeControl() {
        const toggle = document.getElementById('testTypeToggle');
        const options = document.getElementById('testTypeOptions');
        if (!toggle || !options) return;

        const updateLabel = () => {
            const checked = Array.from(options.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
            if (!checked.length) {
                toggle.textContent = 'Select Test Type';
                toggle.classList.add('placeholder');
            } else {
                toggle.classList.remove('placeholder');
                // friendly labels (use short names)
                const labels = checked.map(v => {
                    if (v === 'urine') return 'Urine';
                    if (v === 'oral') return 'Oral';
                    if (v === 'breath') return 'Breath';
                    return v;
                });
                toggle.textContent = labels.join(', ');
            }
        };

        // open/close dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const visible = options.style.display === 'block';
            // close any other open multi-selects
            document.querySelectorAll('.ms-options').forEach(el => el.style.display = 'none');
            if (!visible) {
                options.style.display = 'block';
                options.setAttribute('aria-hidden', 'false');
            } else {
                options.style.display = 'none';
                options.setAttribute('aria-hidden', 'true');
            }
        });

        // toggle option checkboxes
        Array.from(options.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
            cb.addEventListener('change', () => {
                updateLabel();
            });
            // allow clicking label to check/uncheck (labels wrap input)
        });

        // close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.multi-select')) {
                options.style.display = 'none';
                options.setAttribute('aria-hidden', 'true');
            }
        });

        // keyboard: close on Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                options.style.display = 'none';
                options.setAttribute('aria-hidden', 'true');
            }
        });

        // ensure label initial
        updateLabel();
    }

    getSelectedTestTypesFromControl() {
        const options = document.getElementById('testTypeOptions');
        if (!options) return [];
        return Array.from(options.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
    }

    setSelectedTestTypesInControl(values = []) {
        const options = document.getElementById('testTypeOptions');
        if (!options) return;
        Array.from(options.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
            cb.checked = values.includes(cb.value);
        });
        // update toggle label
        const toggle = document.getElementById('testTypeToggle');
        if (toggle) {
            const checked = Array.from(options.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
            if (!checked.length) {
                toggle.textContent = 'Select Test Type';
                toggle.classList.add('placeholder');
            } else {
                toggle.classList.remove('placeholder');
                const labels = checked.map(v => {
                    if (v === 'urine') return 'Urine';
                    if (v === 'oral') return 'Oral';
                    if (v === 'breath') return 'Breath';
                    return v;
                });
                toggle.textContent = labels.join(', ');
            }
        }
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
                this.setSelectedTestTypesInControl(selValues);

                // testMethod may be stored as string
                const testMethodEl = document.getElementById('testMethod');
                if (testMethodEl) testMethodEl.value = event.testMethod || '';
            } else {
                // clear test-specific fields when not drug-testing
                this.setSelectedTestTypesInControl([]);
                const testMethodEl = document.getElementById('testMethod');
                if (testMethodEl) testMethodEl.value = '';
                document.getElementById('companyName').value = '';
            }

            // status is global: populate regardless of event type
            const statusEl = document.getElementById('status');
            if (statusEl) statusEl.value = event.status || 'scheduled';
            
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
            if (statusEl) statusEl.value = 'scheduled';
            this.setSelectedTestTypesInControl([]);
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

        // default status to scheduled and clear company
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.value = 'scheduled';
        const companyEl = document.getElementById('companyName');
        if (companyEl) companyEl.value = '';

        this.setSelectedTestTypesInControl([]);

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
            const selected = this.getSelectedTestTypesFromControl();

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