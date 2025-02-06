import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import AgreementForm from './components/AgreementForm';
import AgreementTable from './components/AgreementTable';
import Sidebar from './components/Sidebar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { addMOARecord, updateMOARecord, deleteMOARecord } from './utils/firestore';

function App() {
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('form');
  const [editingRecord, setEditingRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up real-time listener for records
  useEffect(() => {
    setIsLoading(true);
    
    const q = query(
      collection(db, 'moa_records'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamps to JavaScript Dates
          dateProcessedNLO: doc.data().dateProcessedNLO?.toDate() || null,
          dateForwardedLCAO: doc.data().dateForwardedLCAO?.toDate() || null,
          dateReceivedLCAO: doc.data().dateReceivedLCAO?.toDate() || null,
          dateForwardedAttorneys: doc.data().dateForwardedAttorneys?.toDate() || null,
          dateReceivedLCAOWithCover: doc.data().dateReceivedLCAOWithCover?.toDate() || null,
          dateForwardedHost: doc.data().dateForwardedHost?.toDate() || null,
          dateForwardedNEXUSS: doc.data().dateForwardedNEXUSS?.toDate() || null,
          dateReceivedNEXUSS: doc.data().dateReceivedNEXUSS?.toDate() || null,
          dateForwardedEO: doc.data().dateForwardedEO?.toDate() || null,
          dateReceivedEO: doc.data().dateReceivedEO?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || null,
          updatedAt: doc.data().updatedAt?.toDate() || null
        }));
        setRecords(updatedRecords);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching records:", error);
        toast.error('Error loading records');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingRecord) {
        // Update existing record
        await updateMOARecord(editingRecord.id, formData);
        setRecords(records.map(record => 
          record.id === editingRecord.id ? { ...formData, id: editingRecord.id } : record
        ));
        setEditingRecord(null);
        toast.success('Record updated successfully!');
      } else {
        // Add new record
        const newRecordId = await addMOARecord(formData);
        setRecords([{ ...formData, id: newRecordId }, ...records]);
        toast.success('New record added successfully!');
      }
    } catch (error) {
      toast.error('Error saving record');
    }
  };

  const handleEdit = (record) => {
    if (activeTab === 'records') {
      setEditingRecord(record);
    }
  };

  const handleDelete = async (recordToDelete) => {
    try {
      await deleteMOARecord(recordToDelete.id);
      setRecords(records.filter(record => record.id !== recordToDelete.id));
    } catch (error) {
      console.error('Error deleting record:', error);
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
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading records...</p>
                    </div>
                  ) : (
                    activeTab === 'form' ? (
                      <AgreementForm 
                        onSubmit={handleFormSubmit}
                        initialData={editingRecord}
                      />
                    ) : (
                      <AgreementTable 
                        records={records}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )
                  )}
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
