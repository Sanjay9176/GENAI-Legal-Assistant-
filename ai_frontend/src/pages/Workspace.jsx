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
import { CheckCircle2, Lock, ArrowRight, FileText, ShieldAlert } from "lucide-react";
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

  // -- 1. STATE RESET ON ID CHANGE (✅ THE FIX) --
  // This ensures that whenever the Case ID changes (e.g. New Case), we reset everything.
  useEffect(() => {
    setCurrentStepIndex(0); // Force reset to Step 1
    setActiveTab("mission"); // Reset tab
    // We don't reset 'steps' here immediately to avoid flickering, 
    // but the next effect will overwrite them anyway.
  }, [id]);

  // -- 2. INITIALIZATION --
  useEffect(() => {
    const saved = localStorage.getItem("gen_vidhik_autosave");
    let restored = false;

    // A. Check Auto-Save (Only if IDs match, otherwise ignore)
    // We add a check to ensure we don't load Old Case data into a New Case ID
    if (saved && id) {
      try {
        const data = JSON.parse(saved);
        // Basic check: if the autosave looks like it belongs to a different flow, ignore it.
        // For now, we trust 'location.state' more than autosave for new cases.
        if (!location.state) {
            setOriginalSituation(data.originalSituation || "");
            setFacts(data.facts || {});
            setDraft(data.draft || "");
            setSteps(data.steps || []);
            // Restore index only if it's a resume
            if (data.currentStepIndex) setCurrentStepIndex(data.currentStepIndex);
            restored = true;
        }
      } catch (e) {
        localStorage.removeItem("gen_vidhik_autosave");
      }
    }

    // B. New Case Initialization (From Wizard)
    if (!restored && location.state) {
      const { analysis, originalText } = location.state;
      setOriginalSituation(originalText || "Case details not provided.");
      if (analysis) {
        setFacts(analysis.facts || {});
        const strategyText = analysis.strategy || "1. Review Case Details. 2. Consult Lawyer.";
        setSteps(parseStrategyIntoSteps(strategyText));
        
        // ✅ CRITICAL FIX: Explicitly force Step 0 for new cases
        setCurrentStepIndex(0); 
      }
    }
  }, [location.state, id]); // Added 'id' to ensure it runs on navigation

  // -- 3. DB SYNC (RESUME LOGIC) --
  useEffect(() => {
    if (steps.length > 0 && id && userCases.length > 0) {
      const activeCase = userCases.find(c => c.id === id);

      if (activeCase && activeCase.step) {
        const dbStepIndex = activeCase.step - 1; 

        // Sync local state to DB state
        if (dbStepIndex !== currentStepIndex) {
          console.log(`🔄 Syncing Case ${id}: Jumping to Step ${activeCase.step}`);
          setCurrentStepIndex(dbStepIndex);

          setSteps(prev => prev.map((s, i) => ({
            ...s,
            status: i === dbStepIndex ? "active" : (i < dbStepIndex ? "done" : "locked"),
            isCompleted: i < dbStepIndex
          })));
        }
      }
    }
  }, [id, userCases, steps.length]); // Removed currentStepIndex to avoid loops

  // -- 4. AUTO-SAVE CONTEXT (LAZY PERSISTENCE) --
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

  return (
    <div className="h-full grid grid-cols-12 gap-0 bg-white shadow-sm border rounded-lg overflow-hidden">
      
      {/* ⬅️ COL 1: QUEST LOG */}
      <div className="hidden lg:block lg:col-span-3 border-r bg-slate-50/50 overflow-y-auto p-4">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600"/> Case Roadmap
        </h3>
        
        <div className="space-y-4 relative">
           <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-200 z-0" />
           {steps.map((step, index) => (
             <div 
               key={step.id} 
               onClick={() => {
                   if (step.status !== "locked") {
                       setCurrentStepIndex(index);
                       setActiveTab("mission");
                   }
               }}
               className={`relative z-10 flex gap-3 items-start p-3 rounded-lg cursor-pointer transition-all border
                 ${currentStepIndex === index ? "bg-white border-blue-500 shadow-md" : "border-transparent hover:bg-slate-100"}
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

      {/* ⏺️ COL 2: MISSION CONTROL */}
      <div className="col-span-12 md:col-span-7 lg:col-span-6 bg-white flex flex-col min-h-0 h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="border-b px-6 py-3 flex items-center justify-between bg-white shrink-0">
             <h1 className="font-bold text-lg text-slate-800">Mission Control</h1>
             <TabsList>
                <TabsTrigger value="mission">Current Step</TabsTrigger>
                <TabsTrigger value="draft">Document</TabsTrigger>
                <TabsTrigger value="details">Details & Files</TabsTrigger> 
             </TabsList>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50/30 relative">
            
            {/* TAB 1: MISSION */}
            <TabsContent value="mission" className="mt-0 h-full overflow-y-auto p-8 pb-20">
               {currentStep ? (
                 <div className="max-w-xl mx-auto space-y-6">
                    <Card className="border-blue-100 shadow-lg">
                       <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                          <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                             Step {currentStepIndex + 1}: Action Required
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="pt-6">
                          <p className="text-lg text-slate-700 leading-relaxed font-medium">
                            {currentStep.fullText}
                          </p>
                          {(currentStep.fullText.toLowerCase().includes("notice") || 
                            currentStep.fullText.toLowerCase().includes("draft") || 
                            currentStep.fullText.toLowerCase().includes("write")) && (
                             <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                <p className="text-sm text-orange-800 mb-3 font-semibold">⚡ Power Up Available: AI Drafting</p>
                                <Button onClick={() => generateDraft("auto")} className="w-full bg-orange-600 hover:bg-orange-700 gap-2">
                                   <FileText size={16}/> Generate Legal Draft Now
                                </Button>
                             </div>
                          )}
                       </CardContent>
                       <CardFooter className="border-t pt-6 flex justify-end">
                          {currentStep.isCompleted ? (
                            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50" disabled>
                               <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
                            </Button>
                          ) : (
                            <Button onClick={() => handleCompleteStep(currentStepIndex)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                               {isLastStep ? (
                                 <>Finish & Close Case <CheckCircle2 size={16}/></>
                               ) : (
                                 <>Mark as Done & Unlock Next <ArrowRight size={16}/></>
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
            <TabsContent value="draft" className="mt-0 h-full flex flex-col p-6">
               <div className="flex justify-between items-center mb-4 pb-4 border-b">
                  <h3 className="font-semibold text-slate-700">Legal Documents</h3>
                  <div className="flex gap-2">
                     <select className="bg-white border rounded-md text-sm p-2" onChange={(e) => {if(e.target.value) generateDraft(e.target.value);}} defaultValue="">
                        <option value="" disabled>+ Create New...</option>
                        <option value="vakalatnama">Vakalatnama</option>
                        <option value="affidavit">Affidavit</option>
                        <option value="legal_notice">Legal Notice</option>
                        <option value="plaint">Plaint (Civil)</option>
                        <option value="bail">Bail Application</option>
                     </select>
                  </div>
               </div>
               {!draft ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <FileText size={48} className="opacity-20"/>
                    <p>No document selected. Choose an option above or ask the AI to create one.</p>
                 </div>
               ) : (
                 <DocumentEditor draftText={draft} onEdit={setDraft} isLoading={isDrafting} onRegenerate={() => generateDraft("auto")} />
               )}
            </TabsContent>

            {/* TAB 3: DETAILS */}
            <TabsContent value="details" className="mt-0 h-full overflow-y-auto p-6 space-y-6">
               <FactSheet facts={facts} onUpdate={setFacts} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Timeline facts={facts} /> 
                  <EvidencePanel originalText={originalSituation} />
               </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>

      {/* ➡️ COL 3: CHAT */}
      <div className="hidden md:block md:col-span-5 lg:col-span-3 border-l bg-slate-50 h-full flex flex-col overflow-hidden">
        <ChatPanel caseId={id} analysisSummary={currentCaseContext} />
      </div>
    </div>
  );
}