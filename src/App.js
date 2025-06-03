import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import AgreementForm from './components/AgreementForm';
import AgreementTable from './components/AgreementTable';
import Sidebar from './components/Sidebar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { addMOARecord, updateMOARecord, deleteMOARecord } from './utils/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import FinishedAgreement from './components/FinishedAgreement';
import DuplicateEntries from './components/DuplicateEntries';
import DuplicateNotification from './components/DuplicateNotification';

function App() {
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('form');
  const [editingRecord, setEditingRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [user, setUser] = useState(null);

  // Helper function to safely convert Firestore timestamp to Date
  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return timestamp;
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRecords([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listener for records when user is authenticated
  useEffect(() => {
    let unsubscribe = () => {};

    if (user) {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const q = query(
          collection(db, 'moa_records'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            try {
              const recordsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  dateProcessedNLO: convertTimestamp(data.dateProcessedNLO),
                  dateForwardedLCAO: convertTimestamp(data.dateForwardedLCAO),
                  dateReceivedLCAO: convertTimestamp(data.dateReceivedLCAO),
                  dateForwardedAttorneys: convertTimestamp(data.dateForwardedAttorneys),
                  dateReceivedLCAOWithCover: convertTimestamp(data.dateReceivedLCAOWithCover),
                  dateForwardedHost: convertTimestamp(data.dateForwardedHost),
                  dateForwardedNEXUSS: convertTimestamp(data.dateForwardedNEXUSS),
                  dateReceivedNEXUSS: convertTimestamp(data.dateReceivedNEXUSS),
                  dateForwardedEO: convertTimestamp(data.dateForwardedEO),
                  dateReceivedEO: convertTimestamp(data.dateReceivedEO),
                  createdAt: convertTimestamp(data.createdAt),
                  updatedAt: convertTimestamp(data.updatedAt)
                };
              });
              setRecords(recordsData);
              setIsLoading(false);
            } catch (error) {
              console.error("Error processing records:", error);
              setHasError(true);
              setIsLoading(false);
              toast.error('Error processing records');
            }
          },
          (error) => {
            console.error("Error fetching records:", error);
            toast.error('Error loading records');
            setHasError(true);
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error("Error setting up listener:", error);
        setHasError(true);
        setIsLoading(false);
        toast.error('Error connecting to database');
      }
    }

    return () => unsubscribe();
  }, [user]); // Only re-run when user auth state changes

  const handleFormSubmit = async (formData) => {
    try {
      if (editingRecord) {
        await updateMOARecord(editingRecord.id, formData);
        toast.success('Record updated successfully!');
        setEditingRecord(null);
      } else {
        await addMOARecord(formData);
        toast.success('New record added successfully!');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Error saving record');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setActiveTab('form');
  };

  const handleDelete = async (recordToDelete) => {
    try {
      await deleteMOARecord(recordToDelete.id);
      toast.success('Record deleted successfully');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    }
  };

  // Calculate duplicate count
  const duplicateCount = useMemo(() => {
    if (!records) return 0;
    
    const seen = new Map();
    let duplicates = 0;

    records.forEach(record => {
      const key = record.companyName?.toLowerCase().trim();
      if (!key) return;
      
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.set(key, record);
      }
    });

    return duplicates;
  }, [records]);

  // Render the appropriate component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'form':
        return <AgreementForm 
          onSubmit={handleFormSubmit} 
          initialData={editingRecord} 
          existingData={records} 
        />;
      case 'records':
        return <AgreementTable 
          records={records} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          isLoading={isLoading}
          hasError={hasError}
        />;
      case 'completed':
        return <FinishedAgreement />;
      case 'duplicates':
        return <DuplicateEntries records={records} />;
      default:
        return <AgreementForm 
          onSubmit={handleFormSubmit} 
          initialData={editingRecord} 
          existingData={records} 
        />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div className="App">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="main-content">
                  {renderContent()}
                </div>
                <ToastContainer 
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
                <DuplicateNotification count={duplicateCount} />
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
