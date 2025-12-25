import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Upload, FileText, File as FileIcon, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import api from "@/services/api";
import { useParams } from "react-router-dom";

export function EvidencePanel({ originalText }) {
  const { id } = useParams(); 
  const [evidenceList, setEvidenceList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Track which ID is deleting
  
  // Modal State
  const [viewFile, setViewFile] = useState(null); 
  const fileInputRef = useRef(null);

  // 1. FETCH EVIDENCE ON LOAD
  useEffect(() => {
    if (id) {
        const fetchEvidence = async () => {
            try {
                const response = await api.get(`/cases/${id}/evidence`);
                const formattedList = response.data.map(doc => ({
                    id: doc.id,
                    title: doc.filename,
                    type: doc.content_type,
                    content: doc.extracted_text
                }));
                setEvidenceList(formattedList);
            } catch (error) {
                console.error("Failed to load evidence:", error);
            }
        };
        fetchEvidence();
    }
  }, [id]);

  // 2. HANDLE UPLOAD
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await api.post(`/cases/${id}/evidence`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const newDoc = response.data.evidence;
        setEvidenceList(prev => [...prev, {
            id: newDoc.id,
            title: newDoc.filename,
            type: newDoc.content_type,
            content: newDoc.extracted_text
        }]);

    } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload evidence.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ 3. HANDLE DELETE (NEW)
  const handleDelete = async (evidenceId) => {
    if (!window.confirm("Are you sure you want to delete this evidence? This cannot be undone.")) return;

    setIsDeleting(evidenceId);
    try {
        await api.delete(`/cases/${id}/evidence/${evidenceId}`);
        // Remove from UI immediately
        setEvidenceList(prev => prev.filter(item => item.id !== evidenceId));
    } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete evidence.");
    } finally {
        setIsDeleting(null);
    }
  };

  return (
    <Card className="h-full border-slate-200 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b bg-slate-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            📂 Evidence & Files
          </CardTitle>
          <div className="flex gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".pdf,.txt,.json,.png,.jpg,.jpeg"
            />
            <Button 
                size="sm" 
                variant="outline" 
                className="h-8 gap-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
            >
                {isUploading ? <Loader2 className="animate-spin w-4 h-4"/> : <Upload size={14}/>}
                {isUploading ? "Reading..." : "Upload New"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-y-auto flex-1 bg-white">
        <div className="divide-y divide-slate-100">
          
          {/* A. INITIAL INPUT (Cannot be deleted, only viewed) */}
          <div className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText size={20} />
               </div>
               <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">Initial_Case_Input.txt</p>
                  <p className="text-xs text-slate-500">Source: Client Statement</p>
               </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-400 hover:text-indigo-600"
                onClick={() => setViewFile({ title: "Initial Case Input", content: originalText })}
            >
               <Eye size={18} />
            </Button>
          </div>

          {/* B. UPLOADED EVIDENCE (Viewable & Deletable) */}
          {evidenceList.map((file) => (
             <div key={file.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                     <FileIcon size={20} />
                  </div>
                  <div className="min-w-0">
                     <p className="font-semibold text-slate-800 truncate" title={file.title}>
                        {file.title.length > 18 ? file.title.substring(0, 18) + "..." : file.title}
                     </p>
                     <p className="text-xs text-slate-500">
                        {file.content?.startsWith("[") ? "⚠️ Scan/Binary" : "Text Extracted"}
                     </p>
                  </div>
               </div>
               
               {/* Action Buttons */}
               <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                   <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 text-slate-400 hover:text-purple-600"
                       title="View Content"
                       onClick={() => setViewFile({ title: file.title, content: file.content })}
                   >
                      <Eye size={16} />
                   </Button>
                   <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                       title="Delete Evidence"
                       disabled={isDeleting === file.id}
                       onClick={() => handleDelete(file.id)}
                   >
                      {isDeleting === file.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 size={16} />}
                   </Button>
               </div>
             </div>
          ))}

          {evidenceList.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm italic">
                  No additional evidence uploaded yet.
              </div>
          )}

        </div>
      </CardContent>

      {/* VIEW MODAL */}
      <Dialog open={!!viewFile} onOpenChange={(open) => !open && setViewFile(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{viewFile?.title}</DialogTitle>
            <DialogDescription>Content extracted by Gen-Vidhik AI</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-md border text-sm font-mono whitespace-pre-wrap leading-relaxed">
             {viewFile?.content || "No text content available."}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}