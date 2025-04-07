import React, { useState, useEffect } from 'react';
import './AgreementForm.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Make sure this import path is correct for your project

function AgreementForm({ onSubmit, initialData, existingData = [] }) {
  // State to store fetched data from Firestore
  const [fetchedData, setFetchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all company names from Firestore directly
  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        setIsLoading(true);
        const moaCollectionRef = collection(db, 'moa_records');
        const querySnapshot = await getDocs(moaCollectionRef);
        
        const companies = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.companyName) {
            companies.push({
              id: doc.id,
              companyName: data.companyName
            });
          }
        });
        
        console.log("Fetched company names directly from Firestore:", companies);
        setFetchedData(companies);
      } catch (error) {
        console.error("Error fetching company names:", error);
        // Continue without validation if we can't fetch data
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyNames();
  }, []);

  // Debug existingData
  useEffect(() => {
    console.log("Existing data received from props:", existingData);
    console.log("Fetched data from Firestore:", fetchedData);
  }, [existingData, fetchedData]);

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

  // Add validation state
  const [errors, setErrors] = useState({
    companyName: ''
  });

  // Add state to track if form is valid for submission
  const [isFormValid, setIsFormValid] = useState(true);

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

  // Check for duplicates whenever companyName changes - using our directly fetched data
  useEffect(() => {
    if (!formData.companyName || isLoading) return;
    
    console.log("Checking for duplicates for:", formData.companyName);
    
    // Skip validation if we're editing an existing record with the same name
    if (initialData && initialData.companyName === formData.companyName) {
      console.log("Editing existing record, skipping validation");
      setIsFormValid(true);
      setErrors(prev => ({...prev, companyName: ''}));
      return;
    }
    
    // Use our directly fetched data for validation
    const allCompanies = [...fetchedData];
    
    // Check for duplicate - use trim() and case insensitive comparison
    const isDuplicate = allCompanies.some(item => {
      if (!item || !item.companyName) return false;
      const match = item.companyName.toLowerCase().trim() === formData.companyName.toLowerCase().trim();
      if (match) {
        console.log("Found duplicate:", item.companyName);
      }
      return match;
    });
    
    if (isDuplicate) {
      console.log("Duplicate detected, setting error");
      setErrors(prev => ({
        ...prev, 
        companyName: 'This company name already exists in the records'
      }));
      setIsFormValid(false);
    } else {
      console.log("No duplicate found, clearing error");
      setErrors(prev => ({...prev, companyName: ''}));
      setIsFormValid(true);
    }
  }, [formData.companyName, fetchedData, initialData, isLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
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

  // Simplify the handleDateTimeChange function
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    const timeValue = e.target.getAttribute('data-time');
    
    if (value) {
      const dateTime = timeValue ? 
        new Date(`${value}T${timeValue}`) : 
        new Date(`${value}T${currentTime}`);

      setFormData(prevState => ({
        ...prevState,
        [name]: dateTime.toISOString()
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted, checking validation...");
    console.log("Current form data:", formData);
    console.log("Fetched data for validation:", fetchedData);
    
    // Don't submit while still loading data
    if (isLoading) {
      alert("Please wait, loading company data...");
      return false;
    }
    
    // Check for duplicate company name one more time before submission
    let canSubmit = true;
    
    // Skip validation if we're editing an existing record with the same name
    if (!(initialData && initialData.companyName === formData.companyName)) {
      // Use our directly fetched data for final validation
      const allCompanies = [...fetchedData];
      
      // Check for duplicate
      const duplicate = allCompanies.find(item => {
        if (!item || !item.companyName) return false;
        const match = item.companyName.toLowerCase() === formData.companyName.toLowerCase();
        console.log(`Comparing: "${item.companyName.toLowerCase()}" with "${formData.companyName.toLowerCase()}" - Match: ${match}`);
        return match;
      });
        
      if (duplicate) {
        console.error("Duplicate found:", duplicate);
        setErrors(prev => ({
          ...prev, 
          companyName: 'This company name already exists in the records'
        }));
        canSubmit = false;
        alert("Cannot submit: Company name already exists in the records");
        return false; // Stop execution here
      }
    }
    
    // Only submit if validation passes
    if (canSubmit && isFormValid) {
      console.log("Form is valid, submitting data");
      
      // Add status field if it's not present (required by Firestore rules)
      const finalData = {
        ...formData,
        status: formData.status || 'Pending' // Default status if not provided
      };
      
      // Add any other required fields that might be missing
      if (!finalData.address) finalData.address = '';
      if (!finalData.contactPerson) finalData.contactPerson = '';
      if (!finalData.designation) finalData.designation = '';
      if (!finalData.emailAddress) finalData.emailAddress = '';
      if (!finalData.contactNumber) finalData.contactNumber = '';
      if (!finalData.remarks) finalData.remarks = '';
      
      console.log("Submitting final data:", finalData);
      onSubmit(finalData);
      
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
        // Also clear any errors
        setErrors({
          companyName: ''
        });
      }
    } else {
      console.log("Form validation failed, submission prevented");
      e.stopPropagation(); // Stop event propagation
      return false; // Explicitly return false to prevent default form submission
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
              className={errors.companyName ? 'input-error' : ''}
              required
            />
            {errors.companyName && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i> {errors.companyName}
              </div>
            )}
            {!errors.companyName && formData.companyName && !isLoading && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i> Company name is available
              </div>
            )}
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
            <label htmlFor="dateForwardedNEXUSS">Date Forwarded to Director External Affairs & MIS</label>
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
            <label htmlFor="dateReceivedNEXUSS">Date Received from Director External Affairs & MIS</label>
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