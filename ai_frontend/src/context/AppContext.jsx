// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; 

const AppContext = createContext();

export function AppProvider({ children }) {
  const { user } = useAuth();
  
  // ✅ FIX: Initialize State directly from LocalStorage
  // This ensures that even if you refresh or navigate away, the data is loaded instantly.
  const [jurisdiction, setJurisdiction] = useState(() => {
    const saved = localStorage.getItem("jurisdiction");
    return saved ? JSON.parse(saved) : { state: "", district: "" };
  });

  const [userCases, setUserCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // --- 1. Load Cases from Database on Login ---
  useEffect(() => {
    if (user && user.email) {
      fetchCases();
    } else {
      setUserCases([]);
    }
  }, [user]);

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/cases?email=${user.email}`);
      const data = await response.json();
      setUserCases(data);
    } catch (error) {
      console.error("Failed to fetch cases", error);
    }
    setLoadingCases(false);
  };

  // --- 2. Create Case ---
  const createNewCase = async (title, type) => {
    if (!user) return null;
    try {
      const response = await fetch(`http://127.0.0.1:8000/cases?email=${user.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type }),
      });
      if (response.ok) {
        const newCase = await response.json();
        setUserCases([newCase, ...userCases]);
        return newCase; 
      }
    } catch (error) {
      console.error("Error creating case:", error);
    }
    return null;
  };

  // --- 3. Delete Case ---
  const deleteCase = async (caseId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/cases/${caseId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUserCases(userCases.filter((c) => c.id !== caseId));
      }
    } catch (error) {
      console.error("Error deleting case:", error);
    }
  };

  // --- 4. Save Progress ---
  const saveCaseProgress = async (caseId, step, status) => {
    setUserCases(prev => prev.map(c => 
      c.id === caseId ? { ...c, step, status } : c
    ));
    try {
      await fetch(`http://127.0.0.1:8000/cases/${caseId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, status }),
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // ✅ FIX: Update Function
  const updateJurisdiction = (state, district) => {
    setJurisdiction({ state, district });
    // Force save to local storage immediately
    localStorage.setItem("jurisdiction", JSON.stringify({ state, district }));
  };

  return (
    <AppContext.Provider value={{ 
      jurisdiction, 
      updateJurisdiction,
      userCases,       
      createNewCase,   
      deleteCase,
      saveCaseProgress,
      loadingCases
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);