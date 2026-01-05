// src/pages/Workspace.jsx
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

// Components
import { DocumentEditor } from "@/components/workspace/DocumentEditor";
import { FactSheet } from "@/components/workspace/FactSheet";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { Timeline } from "@/components/workspace/Timeline";
import { EvidencePanel } from "@/components/workspace/EvidencePanel";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, ArrowRight, FileText, ShieldAlert, Map, LayoutDashboard, MessageSquare } from "lucide-react";
import api from "@/services/api";

export default function Workspace() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { saveCaseProgress, userCases } = useApp(); 

  // -- STATE --
  const [activeTab, setActiveTab] = useState("mission");
  const [facts, setFacts] = useState({});
  const [draft, setDraft] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  
  // -- RESPONSIVE STATE (NEW) --
  // 'mission' | 'roadmap' | 'chat'
  const [mobileView, setMobileView] = useState("mission");

  // QUEST LOGIC
  const [steps, setSteps] = useState([]); 
  const [currentStepIndex, setCurrentStepIndex] = useState(0); 
  const [originalSituation, setOriginalSituation] = useState("");
  const [currentCaseContext, setCurrentCaseContext] = useState(""); 

  // -- HELPER: PARSE STRATEGY --
  const parseStrategyIntoSteps = (strategyText) => {
    if (!strategyText || typeof strategyText !== 'string') {
      return [{ id: 0, title: "Case Initialization", fullText: "Reviewing facts...", status: "active" }];
    }
    const parts = strategyText.split(/\d+\.\s+/).filter(Boolean);
    if (parts.length === 0) return [{ id: 0, title: "Analysis", fullText: strategyText, status: "active" }];

    return parts.map((text, index) => ({
      id: index,
      title: text.split(":")[0].substring(0, 30) + "...", 
      fullText: text,
      status: index === 0 ? "active" : "locked", 
      isCompleted: false
    }));
  };

  // -- 1. STATE RESET ON ID CHANGE --
  useEffect(() => {
    setCurrentStepIndex(0); 
    setActiveTab("mission"); 
    setMobileView("mission"); // Reset mobile view on new case
  }, [id]);

  // -- 2. INITIALIZATION --
  useEffect(() => {
    const saved = localStorage.getItem("gen_vidhik_autosave");
    let restored = false;

    if (saved && id) {
      try {
        const data = JSON.parse(saved);
        if (!location.state) {
            setOriginalSituation(data.originalSituation || "");
            setFacts(data.facts || {});
            setDraft(data.draft || "");
            setSteps(data.steps || []);
            if (data.currentStepIndex) setCurrentStepIndex(data.currentStepIndex);
            restored = true;
        }
      } catch (e) {
        localStorage.removeItem("gen_vidhik_autosave");
      }
    }

    if (!restored && location.state) {
      const { analysis, originalText } = location.state;
      setOriginalSituation(originalText || "Case details not provided.");
      if (analysis) {
        setFacts(analysis.facts || {});
        const strategyText = analysis.strategy || "1. Review Case Details. 2. Consult Lawyer.";
        setSteps(parseStrategyIntoSteps(strategyText));
        setCurrentStepIndex(0); 
      }
    }
  }, [location.state, id]);

  // -- 3. DB SYNC --
  useEffect(() => {
    if (steps.length > 0 && id && userCases.length > 0) {
      const activeCase = userCases.find(c => c.id === id);

      if (activeCase && activeCase.step) {
        const dbStepIndex = activeCase.step - 1; 
        if (dbStepIndex !== currentStepIndex) {
          setCurrentStepIndex(dbStepIndex);
          setSteps(prev => prev.map((s, i) => ({
            ...s,
            status: i === dbStepIndex ? "active" : (i < dbStepIndex ? "done" : "locked"),
            isCompleted: i < dbStepIndex
          })));
        }
      }
    }
  }, [id, userCases, steps.length]);

  // -- 4. AUTO-SAVE CONTEXT --
  useEffect(() => {
    const saveContextToDB = async () => {
      if (id && (originalSituation || (facts && Object.keys(facts).length > 0))) {
        try {
          await api.put(`/cases/${id}/context`, {
            description: originalSituation,
            facts: facts
          });
        } catch (error) {
          console.error("Failed to auto-save context:", error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
        saveContextToDB();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [id, originalSituation, facts]);

  // -- 5. AUTO-SAVE LOCAL --
  useEffect(() => {
    const currentStepTitle = steps[currentStepIndex]?.title || "Case Analysis";
    const contextString = `
    [CASE SITUATION]: ${originalSituation}
    [FACTS]: ${JSON.stringify(facts)}
    [STEP]: ${currentStepTitle}
    `;
    setCurrentCaseContext(contextString);

    if (steps.length > 0) {
      const sessionData = {
        originalSituation,
        facts,
        draft,
        steps,
        currentStepIndex,
        timestamp: Date.now()
      };
      localStorage.setItem("gen_vidhik_autosave", JSON.stringify(sessionData));
    }
  }, [facts, draft, steps, currentStepIndex, originalSituation]);


  // -- ACTIONS --
  const handleCompleteStep = (index) => {
    const nextIndex = index + 1;
    const isFinished = nextIndex >= steps.length;
    const newStatus = isFinished ? "Closed" : "Active";

    setSteps(prev => prev.map((s, i) => {
      if (i === index) return { ...s, status: "done", isCompleted: true };
      if (!isFinished && i === nextIndex) return { ...s, status: "active" }; 
      return s;
    }));
    
    if (!isFinished) {
      setCurrentStepIndex(nextIndex);
    }

    if (id) {
       saveCaseProgress(id, nextIndex + 1, newStatus);
    }

    if (isFinished) {
      setTimeout(() => {
        alert("🎉 Case Completed! The case has been marked as Closed.");
        navigate("/dashboard");
      }, 500);
    }
  };

  const generateDraft = async (type = "auto") => {
    setIsDrafting(true);
    setActiveTab("draft"); 
    try {
      setDraft(`⏳ Generating ${type} template...`);
      const response = await api.post("/draft-document", {
        scenario: originalSituation, 
        template_type: type 
      });
      setDraft(response.data.drafted_document);
    } catch (error) {
      setDraft("Error generating draft.");
    } finally {
      setIsDrafting(false);
    }
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // --- RENDER ---
  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative">
        
        {/* ⬅️ COL 1: QUEST LOG (Mobile: Toggled, Tablet: Toggled, Laptop: Always visible) */}
        {/* Logic: Hidden by default, Visible on LG, OR Visible if mobileView is 'roadmap' */}
        <div className={`
            absolute inset-0 z-20 bg-white lg:static lg:block lg:col-span-3 lg:z-auto border-r border-slate-200
            ${mobileView === 'roadmap' ? 'block' : 'hidden'}
            overflow-y-auto p-4 transition-transform duration-200
        `}>
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 sticky top-0 bg-white z-10 py-2">
            <ShieldAlert className="w-5 h-5 text-blue-600"/> Case Roadmap
          </h3>
          
          <div className="space-y-4 relative pb-20 lg:pb-0">
             <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 z-0" />
             {steps.map((step, index) => (
               <div 
                 key={step.id} 
                 onClick={() => {
                     if (step.status !== "locked") {
                         setCurrentStepIndex(index);
                         setActiveTab("mission");
                         // On mobile, auto-switch back to mission after selecting a step
                         if (window.innerWidth < 1024) setMobileView("mission");
                     }
                 }}
                 className={`relative z-10 flex gap-3 items-start p-3 rounded-lg cursor-pointer transition-all border
                   ${currentStepIndex === index ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-transparent hover:bg-slate-50"}
                   ${step.status === "locked" ? "opacity-50 cursor-not-allowed" : ""}
                 `}
               >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 bg-white
                    ${step.isCompleted ? "border-green-500 text-green-500" : 
                      step.status === "active" ? "border-blue-500 text-blue-500 animate-pulse" : "border-slate-300 text-slate-300"}
                  `}>
                     {step.isCompleted ? <CheckCircle2 size={16}/> : 
                      step.status === "locked" ? <Lock size={14}/> : <span className="font-bold text-sm">{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${currentStepIndex === index ? "text-blue-700" : "text-slate-700"}`}>
                      Step {index + 1}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{step.title}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* ⏺️ COL 2: MISSION CONTROL (Mobile: Toggled, Tablet: Visible, Laptop: Visible) */}
        <div className={`
            col-span-12 md:col-span-7 lg:col-span-6 flex flex-col min-h-0 h-full bg-white
            ${mobileView === 'mission' ? 'block' : 'hidden md:block'}
        `}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b px-4 md:px-6 py-3 flex items-center justify-between bg-white shrink-0">
               <h1 className="font-bold text-lg text-slate-800 truncate mr-2">Mission Control</h1>
               <TabsList className="shrink-0">
                  <TabsTrigger value="mission" className="text-xs md:text-sm px-2 md:px-3">Step</TabsTrigger>
                  <TabsTrigger value="draft" className="text-xs md:text-sm px-2 md:px-3">Doc</TabsTrigger>
                  <TabsTrigger value="details" className="text-xs md:text-sm px-2 md:px-3">Files</TabsTrigger> 
               </TabsList>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-50/30 relative">
              
              {/* TAB 1: MISSION */}
              <TabsContent value="mission" className="mt-0 h-full overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                 {currentStep ? (
                   <div className="max-w-xl mx-auto space-y-6">
                     <Card className="border-blue-100 shadow-sm md:shadow-lg">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                           <CardTitle className="text-lg md:text-xl text-blue-900 flex items-center gap-2">
                              Step {currentStepIndex + 1}: Action Required
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                           <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium">
                             {currentStep.fullText}
                           </p>
                           {(currentStep.fullText.toLowerCase().includes("notice") || 
                             currentStep.fullText.toLowerCase().includes("draft") || 
                             currentStep.fullText.toLowerCase().includes("write")) && (
                             <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                <p className="text-sm text-orange-800 mb-3 font-semibold">⚡ Power Up Available: AI Drafting</p>
                                <Button onClick={() => generateDraft("auto")} className="w-full bg-orange-600 hover:bg-orange-700 gap-2">
                                   <FileText size={16}/> Generate Legal Draft
                                </Button>
                             </div>
                           )}
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex justify-end">
                           {currentStep.isCompleted ? (
                             <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 w-full md:w-auto" disabled>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
                             </Button>
                           ) : (
                             <Button onClick={() => handleCompleteStep(currentStepIndex)} className="bg-blue-600 hover:bg-blue-700 gap-2 w-full md:w-auto">
                                {isLastStep ? (
                                  <>Finish Case <CheckCircle2 size={16}/></>
                                ) : (
                                  <>Complete & Next <ArrowRight size={16}/></>
                                )}
                             </Button>
                           )}
                        </CardFooter>
                     </Card>
                   </div>
                 ) : (
                   <div className="p-10 text-center text-slate-500">Loading your mission roadmap...</div>
                 )}
              </TabsContent>

              {/* TAB 2: DRAFT */}
              <TabsContent value="draft" className="mt-0 h-full flex flex-col p-4 md:p-6 pb-24 md:pb-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b gap-3">
                    <h3 className="font-semibold text-slate-700">Legal Documents</h3>
                    <select className="w-full md:w-auto bg-white border rounded-md text-sm p-2" onChange={(e) => {if(e.target.value) generateDraft(e.target.value);}} defaultValue="">
                       <option value="" disabled>+ Create New...</option>
                       <option value="vakalatnama">Vakalatnama</option>
                       <option value="affidavit">Affidavit</option>
                       <option value="legal_notice">Legal Notice</option>
                       <option value="plaint">Plaint (Civil)</option>
                       <option value="bail">Bail Application</option>
                    </select>
                 </div>
                 {!draft ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <FileText size={48} className="opacity-20"/>
                      <p className="text-center px-4">No document selected. Choose an option above.</p>
                   </div>
                 ) : (
                   <DocumentEditor draftText={draft} onEdit={setDraft} isLoading={isDrafting} onRegenerate={() => generateDraft("auto")} />
                 )}
              </TabsContent>

              {/* TAB 3: DETAILS */}
              <TabsContent value="details" className="mt-0 h-full overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
                 <FactSheet facts={facts} onUpdate={setFacts} />
                 <div className="grid grid-cols-1 gap-6">
                    <Timeline facts={facts} /> 
                    <EvidencePanel originalText={originalSituation} />
                 </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* ➡️ COL 3: CHAT (Mobile: Toggled, Tablet: Visible, Laptop: Visible) */}
        <div className={`
            col-span-12 md:col-span-5 lg:col-span-3 border-l bg-slate-50 h-full flex flex-col overflow-hidden
            ${mobileView === 'chat' ? 'block' : 'hidden md:block'}
        `}>
          <ChatPanel caseId={id} analysisSummary={currentCaseContext} />
        </div>

      </div>

      {/* 📱 MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-safe shadow-lg z-50">
          <button 
            onClick={() => setMobileView("roadmap")}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileView === "roadmap" ? "text-blue-600 bg-blue-50" : "text-slate-500"}`}
          >
            <Map size={20} />
            <span className="text-[10px] font-medium mt-1">Roadmap</span>
          </button>

          <button 
            onClick={() => setMobileView("mission")}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileView === "mission" ? "text-blue-600 bg-blue-50" : "text-slate-500"}`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium mt-1">Mission</span>
          </button>

          <button 
            onClick={() => setMobileView("chat")}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${mobileView === "chat" ? "text-blue-600 bg-blue-50" : "text-slate-500"}`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium mt-1">Chat AI</span>
          </button>
      </div>

    </div>
  );
}