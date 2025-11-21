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
        const noShowContainer = document.getElementById('noShowContainer');
        const timeInputs = document.querySelectorAll('.time-input-group select');

        if (eventType === 'drug-testing') {
            testTypeContainer.style.display = 'grid';
            noShowContainer.style.display = 'block';
            timeInputs.forEach(input => input.setAttribute('required', 'required'));
        } else {
            testTypeContainer.style.display = 'none';
            noShowContainer.style.display = 'none';
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
            document.getElementById('date').value = event.date;
            document.getElementById('eventType').value = event.eventType || 'drug-testing';
            
            const [hours, minutes] = (event.time || '00:00').split(':');
            document.getElementById('timeHour').value = hours;
            document.getElementById('timeMinute').value = minutes;
            
            if (event.eventType === 'drug-testing') {
                document.getElementById('testType').value = event.testType;
                document.getElementById('status').value = event.status;
                document.getElementById('noShow').checked = event.noShow || false;
            }
            
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
            date: document.getElementById('date').value,
            time: time,
            eventType: eventType,
            updatedAt: new Date()
        };

        if (eventType === 'drug-testing') {
            eventData.testType = document.getElementById('testType').value;
            eventData.status = document.getElementById('status').value;
            eventData.noShow = document.getElementById('noShow').checked;
        } else {
            eventData.testType = null;
            eventData.status = null;
            eventData.noShow = false;
        }

        return eventData;
    }
}