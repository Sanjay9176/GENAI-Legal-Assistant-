// src/components/workspace/ChatPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  Minimize2,
  Send,
  Bot,
  User,
  Trash2,
  Paperclip,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";

export function ChatPanel({ caseId, analysisSummary }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [messages, setMessages] = useState([]);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    const loadHistory = async () => {
      setErrorMsg(null);

      if (caseId) {
        try {
          const response = await api.get(`/cases/${caseId}`);
          const savedHistory = response.data.chat_history || [];

          if (savedHistory.length) {
            setMessages(
              savedHistory.map((msg, i) => ({
                id: i,
                role: msg.role === "model" ? "ai" : msg.role,
                text: msg.content || msg.text || "",
              }))
            );
          } else if (analysisSummary) {
            setMessages([
              {
                id: "sys",
                role: "ai",
                text: `I have analyzed the case:\n${analysisSummary.substring(
                  0,
                  150
                )}...\n\nHow can I help?`,
              },
            ]);
          } else {
            setMessages([]);
          }
        } catch {
          setErrorMsg("Could not load chat history.");
        }
      } else {
        const local = localStorage.getItem("dashboard_chat_history");
        setMessages(
          local
            ? JSON.parse(local)
            : [
                {
                  id: "intro",
                  role: "ai",
                  text: "Hello! I am your General Legal Assistant. Ask me anything about Indian Law.",
                },
              ]
        );
      }
    };

    loadHistory();
  }, [caseId, analysisSummary]);

  /* ---------------- SAVE DASHBOARD CHAT ---------------- */
  useEffect(() => {
    if (!caseId && messages.length) {
      localStorage.setItem("dashboard_chat_history", JSON.stringify(messages));
    }
  }, [messages, caseId]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* ---------------- HANDLERS ---------------- */
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setIsLoading(true);
    setErrorMsg(null);

    setMessages((p) => [...p, { id: Date.now(), role: "user", text: userText }]);

    try {
      const history = messages.map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        content: m.text,
      }));

      const res = await api.post(`/ask?case_id=${caseId || ""}`, {
        question: userText,
        chat_history: history,
      });

      setMessages((p) => [
        ...p,
        { id: Date.now() + 1, role: "ai", text: res.data.answer },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { id: Date.now(), role: "ai", text: "⚠️ Connection error. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    if (!caseId) localStorage.removeItem("dashboard_chat_history");
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className={cn(
        "flex flex-col bg-white border-l shadow-xl transition-all duration-300",
        isExpanded
          ? "fixed inset-0 z-50 h-screen w-screen"
          : "relative h-full w-full rounded-tl-xl"
      )}
    >
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-indigo-700 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          <div>
            <h3 className="text-xs sm:text-sm font-semibold">
              {caseId ? "Case Assistant" : "General Legal Assistant"}
            </h3>
            <p className="text-[10px] opacity-80">Gen-Vidhik Sahayak</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="p-1 hover:bg-indigo-600 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-indigo-600 rounded"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={cn(
              "flex gap-2 sm:gap-3 text-sm max-w-[95%] sm:max-w-[85%]",
              msg.role === "user" && "ml-auto flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "ai"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {msg.role === "ai" ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                "p-2 sm:p-3 rounded-xl shadow-sm whitespace-pre-wrap leading-relaxed",
                msg.role === "ai"
                  ? "bg-white border rounded-tl-none"
                  : "bg-indigo-600 text-white rounded-tr-none"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-slate-400 italic ml-10">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking...
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-red-500 text-center bg-red-50 p-2 rounded">
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t bg-white shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 border rounded-xl p-2 focus-within:ring-2 ring-indigo-500">
          <input type="file" ref={fileInputRef} className="hidden" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400"
            onClick={() => fileInputRef.current.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <textarea
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), handleSend())
            }
            placeholder="Ask your query..."
            className="w-full resize-none bg-transparent outline-none text-sm max-h-32 py-2"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
