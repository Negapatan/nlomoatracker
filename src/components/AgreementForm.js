import React, { useState, useEffect } from 'react';
import './AgreementForm.css';

function AgreementForm({ onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    companyName: '',
    agreementType: '',
    dateProcessedNLO: '',
    dateForwardedLCAO: '',
    dateReceivedLCAO: '',
    dateForwardedAttorneys: '',
    dateReceivedLCAOWithCover: '',
    dateForwardedHost: '',
    dateForwardedNEXUSS: '',
    dateReceivedNEXUSS: '',
    dateForwardedEO: '',
    dateReceivedEO: '',
    remarks: ''
  });

  // Add new state for timestamps
  const [currentTime, setCurrentTime] = useState('');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Update the formatInputDate function
  const formatInputDate = (value) => {
    // Allow manual typing with automatic formatting
    if (value) {
      // Remove any non-numeric characters
      const numbers = value.replace(/\D/g, '');
      
      if (numbers.length >= 8) {
        // Format as MM-DD-YYYY
        const month = numbers.slice(0, 2);
        const day = numbers.slice(2, 4);
        const year = numbers.slice(4, 8);
        
        // Validate the date
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === Number(year) && 
            date.getMonth() === Number(month) - 1 && 
            date.getDate() === Number(day)) {
          // Return in HTML5 date input format (YYYY-MM-DD)
          return `${year}-${month}-${day}`;
        }
      }
    }
    return value;
  };

  // Update the handleDateTimeChange function
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    const timeValue = e.target.getAttribute('data-time');
    
    if (value) {
      let dateValue = value;
      
      // If it's a date input, format the value
      if (!timeValue) {
        dateValue = formatInputDate(value);
      }
      
      // Only create DateTime if we have a valid date format
      if (dateValue && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const dateTime = timeValue ? 
          new Date(`${dateValue}T${timeValue}`) : 
          new Date(`${dateValue}T${currentTime}`);

        setFormData(prevState => ({
          ...prevState,
          [name]: dateTime.toISOString()
        }));
      }
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: ''
      }));
    }
  };

  // Update the formatDateForInput function
  const formatDateForInput = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    
    // Format date as YYYY-MM-DD for the HTML5 date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: date.toTimeString().split(' ')[0]
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    // Clear form if not editing
    if (!initialData) {
      setFormData({
        companyName: '',
        agreementType: '',
        dateProcessedNLO: '',
        dateForwardedLCAO: '',
        dateReceivedLCAO: '',
        dateForwardedAttorneys: '',
        dateReceivedLCAOWithCover: '',
        dateForwardedHost: '',
        dateForwardedNEXUSS: '',
        dateReceivedNEXUSS: '',
        dateForwardedEO: '',
        dateReceivedEO: '',
        remarks: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="agreement-form">
      <h2>Agreement Tracking Form</h2>
      
      {/* Company Information Section - Simplified */}
      <div className="form-section">
        <h3><i className="fas fa-building"></i> Basic Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="agreementType">Agreement Type</label>
            <select
              id="agreementType"
              name="agreementType"
              value={formData.agreementType}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="OJT MOA">OJT MOA</option>
              <option value="MOU/MOA">MOU/MOA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Processing Timeline Section */}
      <div className="form-section">
        <h3><i className="fas fa-clock"></i> Processing Timeline</h3>
        <div className="timeline-grid">
          {/* NLO Process */}
          <div className="date-group">
            <label htmlFor="dateProcessedNLO">Date Processed by NLO</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateProcessedNLO"
                name="dateProcessedNLO"
                value={formatDateForInput(formData.dateProcessedNLO).date}
                onChange={handleDateTimeChange}
                onKeyDown={(e) => {
                  // Allow numeric input, backspace, delete, and arrow keys
                  if (!/[\d\b]/.test(e.key) && 
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="MM-DD-YYYY"
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateProcessedNLO).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateProcessedNLO',
                    value: formatDateForInput(formData.dateProcessedNLO).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          {/* LCAO Process */}
          <div className="date-group">
            <label htmlFor="dateForwardedLCAO">Date Forwarded to LCAO (via Email)</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateForwardedLCAO"
                name="dateForwardedLCAO"
                value={formatDateForInput(formData.dateForwardedLCAO).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateForwardedLCAO).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateForwardedLCAO',
                    value: formatDateForInput(formData.dateForwardedLCAO).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          <div className="date-group">
            <label htmlFor="dateReceivedLCAO">Date Received from LCAO (via Email)</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateReceivedLCAO"
                name="dateReceivedLCAO"
                value={formatDateForInput(formData.dateReceivedLCAO).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateReceivedLCAO).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateReceivedLCAO',
                    value: formatDateForInput(formData.dateReceivedLCAO).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          {/* Attorney Process */}
          <div className="date-group">
            <label htmlFor="dateForwardedAttorneys">Date Forwarded to Attorneys (printed)</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateForwardedAttorneys"
                name="dateForwardedAttorneys"
                value={formatDateForInput(formData.dateForwardedAttorneys).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateForwardedAttorneys).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateForwardedAttorneys',
                    value: formatDateForInput(formData.dateForwardedAttorneys).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          <div className="date-group">
            <label htmlFor="dateReceivedLCAOWithCover">Date Received from LCAO with Cover Page</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateReceivedLCAOWithCover"
                name="dateReceivedLCAOWithCover"
                value={formatDateForInput(formData.dateReceivedLCAOWithCover).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateReceivedLCAOWithCover).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateReceivedLCAOWithCover',
                    value: formatDateForInput(formData.dateReceivedLCAOWithCover).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          {/* Host/NEXUSS Process */}
          <div className="date-group">
            <label htmlFor="dateForwardedHost">Date Forwarded to Host Office/Dept/HTE</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateForwardedHost"
                name="dateForwardedHost"
                value={formatDateForInput(formData.dateForwardedHost).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateForwardedHost).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateForwardedHost',
                    value: formatDateForInput(formData.dateForwardedHost).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          <div className="date-group">
            <label htmlFor="dateForwardedNEXUSS">Date Forwarded to NEXUSS Director</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateForwardedNEXUSS"
                name="dateForwardedNEXUSS"
                value={formatDateForInput(formData.dateForwardedNEXUSS).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateForwardedNEXUSS).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateForwardedNEXUSS',
                    value: formatDateForInput(formData.dateForwardedNEXUSS).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          <div className="date-group">
            <label htmlFor="dateReceivedNEXUSS">Date Received from NEXUSS Director</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateReceivedNEXUSS"
                name="dateReceivedNEXUSS"
                value={formatDateForInput(formData.dateReceivedNEXUSS).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateReceivedNEXUSS).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateReceivedNEXUSS',
                    value: formatDateForInput(formData.dateReceivedNEXUSS).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          {/* Executive Office Process */}
          <div className="date-group">
            <label htmlFor="dateForwardedEO">Date Forwarded to E.O (VP Signature)</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateForwardedEO"
                name="dateForwardedEO"
                value={formatDateForInput(formData.dateForwardedEO).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateForwardedEO).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateForwardedEO',
                    value: formatDateForInput(formData.dateForwardedEO).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
          
          <div className="date-group">
            <label htmlFor="dateReceivedEO">Date Received from E.O (Signed)</label>
            <div className="datetime-input">
              <input
                type="date"
                id="dateReceivedEO"
                name="dateReceivedEO"
                value={formatDateForInput(formData.dateReceivedEO).date}
                onChange={handleDateTimeChange}
              />
              <input
                type="time"
                data-time
                value={formatDateForInput(formData.dateReceivedEO).time || currentTime}
                onChange={(e) => handleDateTimeChange({
                  target: {
                    name: 'dateReceivedEO',
                    value: formatDateForInput(formData.dateReceivedEO).date,
                    getAttribute: () => e.target.value
                  }
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="form-section">
        <h3><i className="fas fa-comment"></i> Additional Information</h3>
        <div className="form-grid full-width">
          <div className="form-group">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Add any additional notes or remarks here..."
            />
          </div>
        </div>
      </div>

      <div className="submit-button-container">
        <button type="submit" className="submit-button">
          <i className="fas fa-save"></i> 
          {initialData ? 'Update Record' : 'Save Record'}
        </button>
      </div>
    </form>
  );
}

export default AgreementForm; 