// src/pages/Landing.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, X, Briefcase, DollarSign, Home, Users, MoreHorizontal, ShieldAlert } from "lucide-react"; 
import api from "@/services/api"; 

// ✅ 1. Import App Context
import { useApp } from "@/context/AppContext";

export default function Landing() {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate();

  // ✅ 2. Get createNewCase AND jurisdiction from Context
  const { createNewCase, jurisdiction } = useApp();

  // 1. Define Categories (6 Items total)
  const categories = [
    { 
      id: "money", 
      label: "Money / Debt", 
      icon: <DollarSign className="w-6 h-6 text-green-600"/>,
      template: "I gave a loan of ₹_____ to _____ on [Date] and they are refusing to pay it back."
    },
    { 
      id: "property", 
      label: "Property Dispute", 
      icon: <Home className="w-6 h-6 text-blue-600"/>,
      template: "My neighbor is encroaching on my property boundary at [Address]. The issue started when..."
    },
    { 
      id: "theft", 
      label: "Theft / Cybercrime", 
      icon: <ShieldAlert className="w-6 h-6 text-red-600"/>,
      template: "My [Item/Money] was stolen/scammed on [Date] at [Location]. The approximate value is ₹_____."
    },
    { 
      id: "family", 
      label: "Family / Matrimonial", 
      icon: <Users className="w-6 h-6 text-pink-600"/>,
      template: "I am facing a domestic dispute regarding..."
    },
    { 
      id: "work", 
      label: "Work / Labor", 
      icon: <Briefcase className="w-6 h-6 text-purple-600"/>,
      template: "My employer has not paid my salary for the last _____ months."
    },
    { 
      id: "others", 
      label: "Other Legal Issues", 
      icon: <MoreHorizontal className="w-6 h-6 text-orange-600"/>,
      template: "I need legal help regarding..."
    }
  ];

  // 2. Handle Category Click
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.id);
    if (!description.trim()) {
      setDescription(cat.template);
      return;
    }
    const isGenericTemplate = categories.some((c) => c.template === description);
    if (isGenericTemplate) {
      setDescription(cat.template);
    }
  };

  // --- UPDATED ANALYZE FUNCTION ---
  const handleAnalyze = async () => {
    if (!description.trim()) {
      alert("Please describe the situation first.");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ 3. INJECT JURISDICTION CONTEXT
      let finalDescription = description;
      if (jurisdiction && jurisdiction.state) {
          finalDescription = `[JURISDICTION CONTEXT: ${jurisdiction.district || "Unknown District"}, ${jurisdiction.state}, India] \n\n SITUATION: ${description}`;
      }

      // 1. Prepare Form Data
      const formData = new FormData();
      formData.append("situation", finalDescription); 
      
      if (file) {
        formData.append("file", file);
      }

      // 2. Send Request to AI
      const response = await api.post("/analyze", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
      });

      console.log("✅ Analysis Success:", response.data);

      // 3. Generate a Title for the Case
      const categoryObj = categories.find(c => c.id === selectedCategory);
      const catLabel = categoryObj ? categoryObj.label : "Legal Case";
      
      const shortDesc = description.substring(0, 25) + (description.length > 25 ? "..." : "");
      const caseTitle = `${catLabel}: ${shortDesc}`;

      // 4. Create Case in Database
      const newCase = await createNewCase(caseTitle, selectedCategory || "General");

      if (newCase && newCase.id) {
        // 5. Navigate
        navigate(`/case/${newCase.id}`, { 
          state: { 
            analysis: response.data, 
            originalText: description 
          } 
        });
      } else {
        alert("Analysis complete, but could not save case to database.");
      }

    } catch (error) {
      console.error("❌ Analysis Error:", error);
      
      if (error.response && error.response.data && error.response.data.detail) {
        const details = error.response.data.detail;
        const firstError = Array.isArray(details) ? details[0] : details;
        const msg = firstError.msg || "Invalid Data";
        alert(`Server Error: ${msg}`);
      } else {
        alert("Analysis failed. Check console for details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pt-8 pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">What brings you here today?</h1>
        <p className="text-slate-500">Choose a category to get started, or describe your situation directly.</p>
      </div>

      {/* Categories Grid - UPDATED for Single Row on Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Card 
            key={cat.id} 
            className={`cursor-pointer transition-all hover:shadow-md border-2
              ${selectedCategory === cat.id ? "border-blue-500 bg-blue-50/50" : "border-transparent hover:border-slate-200"}
            `}
            onClick={() => handleCategorySelect(cat)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-sm">
                {cat.icon}
              </div>
              <span className="font-semibold text-xs md:text-sm text-slate-700 whitespace-nowrap lg:whitespace-normal">
                {cat.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input Area */}
      <Card className="shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Describe the Situation
            {selectedCategory && <span className="text-xs font-normal text-slate-400 px-2 py-1 bg-slate-100 rounded-full">Category: {selectedCategory}</span>}
          </CardTitle>
          <CardDescription>Be specific about dates, names, and amounts. You can also upload evidence.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Textarea 
            placeholder="Type details here..." 
            className="min-h-[180px] text-lg p-4 bg-slate-50 border-slate-200 focus:border-blue-500 transition-colors"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/30 hover:bg-slate-50 transition-colors">
            {!file ? (
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="h-10 w-10 text-blue-400 mb-3" />
                <p className="text-sm font-medium text-slate-700">Upload Evidence (FIR, Notice, Letter)</p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 5MB)</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.jpg,.png,.jpeg"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-blue-200 shadow-lg w-full md:w-auto"
              onClick={handleAnalyze}
              disabled={isLoading || (!description && !file)}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Case...
                </span>
              ) : (
                "Analyze Case & Draft"
              )}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* --- LEGAL DISCLAIMER FOOTER --- */}
      <div className="text-center pt-8 pb-4 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
          <strong>Disclaimer:</strong> Gen-Vidhik Sahayak is an AI-powered educational and informational tool. 
          It does not provide binding legal advice. Results should be verified by a qualified Advocate practicing in India. 
          <br/>By using this tool, you agree to our Terms of Service.
        </p>
      </div>

    </div>
  </div>
  );
}