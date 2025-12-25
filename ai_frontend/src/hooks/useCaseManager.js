import { useState, useCallback } from 'react';
import api from '../services/api'; // Your Axios instance
import { useNavigate } from 'react-router-dom';

export const useCaseManager = () => {
  const navigate = useNavigate();
  
  // STATE
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 1. ANALYZE CASE (Unchanged)
  const analyzeCase = useCallback(async (situationText, file = null) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('situation', situationText);
      if (file) {
        formData.append('file', file);
      }

      const response = await api.post('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/case/new`, { 
        state: { 
          analysis: response.data, 
          originalText: situationText 
        } 
      });

    } catch (error) {
      console.error("Analysis Failed:", error);
      alert("Error connecting to AI Backend.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [navigate]);

  // 2. CHAT WITH BOT (FIXED: SENDS JSON NOW)
  const sendMessage = useCallback(async (query, context = "") => {
    try {
      // FIX: We now send a clean JSON object, matching the Python 'ChatRequest' model.
      const payload = {
        query: query,
        case_context: context || "" 
      };

      const response = await api.post('/chat', payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Return the text response
      return response.data.response; 

    } catch (error) {
      console.error("Chat Error:", error);
      return "Sorry, I am having trouble connecting to the server. (Check console for 422/500 errors)";
    }
  }, []);

  return {
    isAnalyzing,
    analyzeCase,
    sendMessage
  };
};