// src/components/workspace/ChatPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Send, Bot, User, Trash2, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api"; 

export function ChatPanel({ caseId, analysisSummary }) { 
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);

  // --- 1. LOAD HISTORY (The Persistence Logic) ---
  useEffect(() => {
    const loadHistory = async () => {
      // Clear errors when switching context
      setErrorMsg(null);

      // MODE A: CASE WORKSPACE (MongoDB Persistence)
      if (caseId) {
        try {
          console.log(`📥 Loading history for Case: ${caseId}`); 
          const response = await api.get(`/cases/${caseId}`);
          
          // Debug what the server actually returned
          console.log("📥 Server Response (Chat History):", response.data.chat_history);

          const savedHistory = response.data.chat_history || [];

          if (savedHistory.length > 0) {
             // ✅ THE FIX: Map backend format to frontend format
             // Backend saves: { role: "model"|"user", content: "..." }
             // Frontend expects: { role: "ai"|"user", text: "..." }
             const formattedHistory = savedHistory.map((msg, index) => ({
                id: index, // Assign a temporary unique ID
                // Map 'model' (Google Gemini) back to 'ai' (Frontend UI)
                role: msg.role === "model" ? "ai" : msg.role, 
                // Handle 'content' vs 'text' key mismatch safely
                text: msg.content || msg.text || "" 
             }));
             
             setMessages(formattedHistory);
          } else if (analysisSummary) {
             // If no history yet, Add System Context
             setMessages([{ 
                id: "sys-1", 
                role: "ai", 
                text: `I have analyzed the case details based on:\n${analysisSummary.substring(0, 150)}...\n\nHow can I assist you further?` 
             }]);
          } else {
             // Fallback for empty new case
             setMessages([]);
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
          setErrorMsg("Could not load chat history.");
        }
      } 
      // MODE B: DASHBOARD (LocalStorage Persistence)
      else {
        const localSaved = localStorage.getItem("dashboard_chat_history");
        if (localSaved) {
            setMessages(JSON.parse(localSaved));
        } else {
            setMessages([{ id: "intro", role: "ai", text: "Hello! I am your General Legal Assistant. Ask me anything about Indian Law." }]);
        }
      }
    };

    loadHistory();
  }, [caseId, analysisSummary]);

  // --- 2. SAVE DASHBOARD CHAT ---
  useEffect(() => {
    if (!caseId && messages.length > 0) {
        localStorage.setItem("dashboard_chat_history", JSON.stringify(messages));
    }
  }, [messages, caseId]);

  // --- 3. AUTO-SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // --- HANDLERS ---
  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto-grow textarea
    e.target.style.height = 'auto'; 
    e.target.style.height = `${e.target.scrollHeight}px`; 
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input;
    setInput("");
    setErrorMsg(null);
    
    // 1. Optimistic UI Update
    const userMsg = { id: Date.now(), role: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
        // --- 2. DATA SANITIZATION ---
        // Clean the history before sending to API
        const historyToSend = messages.map(m => ({ 
            role: m.role === 'ai' ? 'model' : 'user', 
            content: m.text || "" 
        }));

        console.log("📤 Sending Payload:", { question: userText });

        const response = await api.post(`/ask?case_id=${caseId || ""}`, {
            question: userText,
            chat_history: historyToSend 
        });

        const botText = response.data.answer || "I'm sorry, I couldn't process that.";
        const aiMsg = { id: Date.now() + 1, role: "ai", text: botText };
        
        setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
        console.error("Chat Error:", error);
        setMessages((prev) => [...prev, { id: Date.now(), role: "ai", text: "⚠️ Connection error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  // Helper to clear Dashboard chat
  const handleClear = () => {
      setMessages([]);
      if(!caseId) localStorage.removeItem("dashboard_chat_history");
  };

  return (
    <div className={cn(
        "flex flex-col bg-white transition-all duration-300 ease-in-out shadow-xl border-l",
        isExpanded ? "fixed inset-0 z-50 h-screen w-screen" : "relative h-full w-full rounded-tl-xl"
    )}>
      {/* Header */}
      <div className="p-4 bg-indigo-700 text-white flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">
                {caseId ? "Case Assistant" : "General Legal Assistant"}
            </h3>
            <p className="text-[10px] opacity-80">Gen-Vidhik Sahayak</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleClear} className="p-1 hover:bg-indigo-600 rounded" title="Clear Chat">
             <Trash2 className="w-4 h-4" />
           </button>
           <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-indigo-600 rounded">
             {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={cn("flex gap-3 text-sm max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === "ai" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600")}>
              {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={cn("p-3 rounded-xl shadow-sm leading-relaxed whitespace-pre-wrap", 
              msg.role === "ai" ? "bg-white border text-slate-800 rounded-tl-none" : "bg-indigo-600 text-white rounded-tr-none")}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-2 items-center text-xs text-slate-400 italic ml-12">
                <Loader2 className="w-3 h-3 animate-spin"/> Thinking...
            </div>
        )}
        {errorMsg && (
            <div className="text-xs text-red-500 text-center p-2 bg-red-50 rounded">
                {errorMsg}
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t shrink-0">
        <div className="flex items-end gap-2 border rounded-xl p-2 bg-slate-50 focus-within:ring-2 ring-indigo-500 transition-all">
          <input type="file" ref={fileInputRef} className="hidden" />
          <Button onClick={() => fileInputRef.current.click()} variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 h-8 w-8 mb-1">
            <Paperclip className="w-4 h-4" />
          </Button>
          <textarea 
            placeholder="Ask your query..." 
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            rows={1}
            className="w-full bg-transparent resize-none outline-none text-sm max-h-32 py-2"
            style={{ minHeight: '24px' }}
          />
          <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0 h-8 w-8 mb-1">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}