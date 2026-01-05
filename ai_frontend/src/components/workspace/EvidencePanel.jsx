import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Upload,
  FileText,
  File as FileIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import api from "@/services/api";
import { useParams } from "react-router-dom";

export function EvidencePanel({ originalText }) {
  const { id } = useParams();
  const [evidenceList, setEvidenceList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [viewFile, setViewFile] = useState(null);

  const fileInputRef = useRef(null);

  /* ---------------- FETCH EVIDENCE ---------------- */
  useEffect(() => {
    if (!id) return;

    const fetchEvidence = async () => {
      try {
        const response = await api.get(`/cases/${id}/evidence`);
        setEvidenceList(
          response.data.map((doc) => ({
            id: doc.id,
            title: doc.filename,
            type: doc.content_type,
            content: doc.extracted_text,
          }))
        );
      } catch (error) {
        console.error("Failed to load evidence:", error);
      }
    };

    fetchEvidence();
  }, [id]);

  /* ---------------- UPLOAD ---------------- */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/cases/${id}/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const doc = res.data.evidence;
      setEvidenceList((p) => [
        ...p,
        {
          id: doc.id,
          title: doc.filename,
          type: doc.content_type,
          content: doc.extracted_text,
        },
      ]);
    } catch {
      alert("Failed to upload evidence.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (evidenceId) => {
    if (!window.confirm("Delete this evidence permanently?")) return;

    setIsDeleting(evidenceId);
    try {
      await api.delete(`/cases/${id}/evidence/${evidenceId}`);
      setEvidenceList((p) => p.filter((e) => e.id !== evidenceId));
    } catch {
      alert("Failed to delete evidence.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className="h-full flex flex-col border-slate-200 shadow-sm">
      {/* HEADER */}
      <CardHeader className="pb-3 border-b bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            📂 Evidence & Files
          </CardTitle>

          <div>
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
              disabled={isUploading}
              onClick={() => fileInputRef.current.click()}
              className="h-8 gap-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50 w-full sm:w-auto"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {isUploading ? "Reading..." : "Upload New"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="p-0 flex-1 overflow-y-auto bg-white">
        <div className="divide-y divide-slate-100">
          {/* INITIAL INPUT */}
          <div className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
            <div className="flex gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  Initial_Case_Input.txt
                </p>
                <p className="text-xs text-slate-500">
                  Source: Client Statement
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-indigo-600"
              onClick={() =>
                setViewFile({
                  title: "Initial Case Input",
                  content: originalText,
                })
              }
            >
              <Eye size={18} />
            </Button>
          </div>

          {/* UPLOADED FILES */}
          {evidenceList.map((file) => (
            <div
              key={file.id}
              className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50"
            >
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileIcon size={20} />
                </div>
                <div className="min-w-0">
                  <p
                    className="font-semibold text-slate-800 truncate"
                    title={file.title}
                  >
                    {file.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {file.content?.startsWith("[")
                      ? "⚠️ Scan/Binary"
                      : "Text Extracted"}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-purple-600"
                  onClick={() =>
                    setViewFile({ title: file.title, content: file.content })
                  }
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting === file.id}
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(file.id)}
                >
                  {isDeleting === file.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
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
      <Dialog open={!!viewFile} onOpenChange={(o) => !o && setViewFile(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {viewFile?.title}
            </DialogTitle>
            <DialogDescription>
              Content extracted by Gen-Vidhik AI
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-md border text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {viewFile?.content || "No text content available."}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
