// src/components/workspace/DocumentEditor.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw, Copy, Check, FileText } from "lucide-react"; // <--- Added FileText
import { jsPDF } from "jspdf";

export function DocumentEditor({ draftText, onEdit, isLoading, onRegenerate }) {
  const [copied, setCopied] = React.useState(false);

  // --- 1. DOWNLOAD PDF FUNCTION ---
  const handleDownloadPDF = () => {
    if (!draftText) return;

    const doc = new jsPDF();
    const lineHeight = 7; 
    const pageHeight = 290; 
    const margin = 15;
    const startY = 20;
    
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    const splitText = doc.splitTextToSize(draftText, 180);
    let cursorY = startY;

    splitText.forEach(line => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage(); 
        cursorY = margin; 
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    doc.save("Gen-Vidhik_Legal_Draft.pdf");
  };

  // --- 2. DOWNLOAD WORD FUNCTION (New) ---
  const handleDownloadWord = () => {
    if (!draftText) return;

    // We wrap the text in a basic HTML structure that Word recognizes.
    // We replace newlines (\n) with <br> tags so paragraphs are preserved.
    const fileContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Legal Draft</title></head>
      <body>
        <div style="font-family: 'Times New Roman', serif; font-size: 12pt;">
          ${draftText.replace(/\n/g, "<br/>")}
        </div>
      </body>
      </html>
    `;

    // Create a Blob with the specific MIME type for Word Documents
    const blob = new Blob(['\ufeff', fileContent], {
      type: 'application/msword'
    });

    // Create a temporary link to trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Gen-Vidhik_Legal_Draft.doc'; // .doc is widely compatible
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- 3. COPY TO CLIPBOARD FUNCTION ---
  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm overflow-hidden">
      
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
           <h3 className="font-semibold text-slate-700">Draft Editor</h3>
           {isLoading && <span className="text-xs text-blue-500 animate-pulse">(Generating...)</span>}
        </div>

        <div className="flex gap-2">
          {/* Regenerate Button */}
          <Button 
            variant="outline" size="sm" onClick={onRegenerate} disabled={isLoading}
            className="text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
          
          {/* Copy Button */}
          <Button 
            variant="outline" size="sm" onClick={handleCopy}
            className="text-slate-600"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-green-600"/> : <Copy className="w-4 h-4 mr-2"/>}
            {copied ? "Copied" : "Copy"}
          </Button>

          {/* Word Download (NEW) */}
          <Button 
            size="sm" onClick={handleDownloadWord} disabled={!draftText}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Word
          </Button>

          {/* PDF Download */}
          <Button 
            size="sm" onClick={handleDownloadPDF} disabled={!draftText}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* TEXT AREA CONTAINER */}
      <div className="flex-1 relative overflow-hidden">
        <Textarea 
          value={draftText}
          onChange={(e) => onEdit(e.target.value)}
          className="w-full h-full resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed font-serif text-slate-800 overflow-y-auto"
          placeholder="Your legal draft will appear here..."
        />
      </div>
      
      {/* FOOTER STATUS */}
      <div className="bg-slate-50 border-t px-4 py-2 text-xs text-slate-400 flex justify-between shrink-0">
          <span>Format: Indian Legal Standard</span>
          <span>Words: {draftText ? draftText.split(/\s+/).length : 0}</span>
      </div>
    </div>
  );
}